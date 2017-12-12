"use strict";
(async function () {
    /** Get a url with given queries, but does not escape them. */
    function queryurl(base, options) {
        return base + "?" + Object.entries(options).map(([key, val]) => `${key}=${val}`).join("&");
    }
    const button = document.getElementById("button");
    const toast = document.getElementById("toast");
    function earlyAuthentication() {
        console.error("other page attempted authentication");
    }
    window.authenticate = earlyAuthentication;
    async function download() {
        button.removeEventListener("click", download);
        button.setAttribute("disabled", "");
        try {
            const randArray = new Uint8Array(8);
            crypto.getRandomValues(randArray);
            const state = btoa(String.fromCharCode(...randArray));
            const redirect = [location.protocol, "//", location.host,
                location.pathname, "authenticate"].join("");
            const authUrl = queryurl("https://accounts.spotify.com/authorize", {
                client_id: "5150fd17a09a41ea93baca02a1fbbe53",
                response_type: "token",
                redirect_uri: encodeURIComponent(redirect),
                state: encodeURIComponent(state),
                scope: "playlist-read-private playlist-read-collaborative user-library-read",
            });
            const accessToken = await new Promise((resolve, reject) => {
                window.authenticate = (access, respState, err) => {
                    if (respState !== state) {
                        reject("Authentication failed with improper state");
                    }
                    else if (err !== undefined) {
                        reject(err);
                    }
                    else if (access === undefined) {
                        reject("Missing authentication information");
                    }
                    else {
                        resolve(access);
                    }
                };
                const oauth = open(authUrl, "Spotify Authentication", "toolbar=0,menubar=0");
                if (oauth === null) {
                    reject("Failed to open authentication popup. Disable your popup blocker.");
                }
                else {
                    oauth.addEventListener("beforeunload", () => reject("Closed window before authenticating"));
                    oauth.focus();
                }
            });
            /** Make request */
            async function request(url) {
                const resp = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
                return await resp.json();
            }
            /** Convert a spotify track a track */
            function toTrack({ artists, duration_ms, id, name, track_number, explicit }) {
                return {
                    artists: artists.map(({ name }) => ({ name: name })),
                    duration_ms: duration_ms,
                    ids: { spotify: id },
                    title: name,
                    track: track_number,
                    explicit: explicit,
                    type: "track",
                };
            }
            /** Convery a spotify playlist to a playlist */
            async function toPlaylist(play) {
                const playlist = await request(play.href);
                const tracks = playlist.tracks.items.map(({ track }) => toTrack(track));
                let url = playlist.tracks.next;
                while (url !== null) {
                    const pager = await request(url);
                    pager.items.forEach(({ track }) => tracks.push(toTrack(track)));
                    url = pager.next;
                }
                return {
                    name: play.name,
                    tracks: tracks,
                    description: playlist.description || "",
                    type: "playlist",
                };
            }
            async function toAlbum({ name, artists, tracks, id, images, release_date }) {
                const tks = tracks.items.map(toTrack);
                let url = tracks.next;
                while (url !== null) {
                    const pager = await request(url);
                    pager.items.forEach(track => tks.push(toTrack(track)));
                    url = pager.next;
                }
                let art;
                if (images.length > 0) {
                    const minSize = Math.min(...images.map(({ height, width }) => height * width));
                    art = images.filter(({ height, width }) => minSize === height * width)[0].url;
                }
                else {
                    // tslint:disable-next-line:no-null-keyword
                    art = null;
                }
                return {
                    art: art,
                    artists: artists.map(({ name }) => ({ name: name })),
                    ids: { spotify: id },
                    name: name,
                    num_tracks: tks.length,
                    tracks: tks,
                    year: new Date(release_date).getFullYear(),
                    type: "album",
                };
            }
            async function getPlaylists() {
                let url = "https://api.spotify.com/v1/me/playlists?limit=50";
                const promises = [];
                while (url !== null) {
                    const pager = await request(url);
                    pager.items.forEach(p => promises.push(toPlaylist(p)));
                    url = pager.next;
                }
                return await Promise.all(promises);
            }
            async function getAlbums() {
                const promises = [];
                let url = "https://api.spotify.com/v1/me/albums?limit=50";
                while (url !== null) {
                    const pager = await request(url);
                    pager.items.forEach(({ album }) => promises.push(toAlbum(album)));
                    url = pager.next;
                }
                return await Promise.all(promises);
            }
            const [playlists, albums] = await Promise.all([getPlaylists(), getAlbums()]);
            const blob = new Blob([JSON.stringify({ playlists: playlists, albums: albums })], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "spotify_library.json");
        }
        catch (err) {
            toast.MaterialSnackbar.showSnackbar({ message: err });
        }
        finally {
            button.addEventListener("click", download);
            button.removeAttribute("disabled");
        }
    }
    button.addEventListener("click", download);
    button.removeAttribute("disabled");
})();
