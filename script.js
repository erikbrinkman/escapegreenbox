"use strict";
(async function () {
    /** Get a url with given queries, but does not escape them. */
    function getUrl(base, options) {
        return base + "?" + Object.entries(options).map(([key, val]) => `${key}=${val}`).join("&");
    }
    /** Convert playlist to PLS blob */
    function toPLS(plist) {
        const parts = ["[playlist]\n\n"];
        plist.tracks.forEach(({ name, album, artists, duration_ms, href }, i) => {
            parts.push(`File${i + 1}=${href}\n`);
            parts.push(`Artist${i + 1}=${artists[0].name}\n`);
            parts.push(`Album${i + 1}=${album.name}\n`);
            parts.push(`Title${i + 1}=${name}\n`);
            parts.push(`Length${i + 1}=${Math.ceil(duration_ms / 1000)}\n`);
            parts.push("\n");
        });
        parts.push(`NumberOfEntries=${plist.tracks.length}\nVersion=2\n`);
        return new Blob(parts, { type: "text/plain;charset=utf-8" });
    }
    const button = document.getElementById("button");
    const toast = document.getElementById("toast");
    function earlyAuthentication() {
        console.error("other page attempted authentication");
    }
    window.spotifyAuthenticate = earlyAuthentication;
    async function download() {
        button.removeEventListener("click", download);
        button.setAttribute("disabled", "");
        try {
            const randArray = new Uint8Array(8);
            crypto.getRandomValues(randArray);
            const state = btoa(String.fromCharCode(...randArray));
            const redirect = [location.protocol, "//", location.host,
                location.pathname, "spotify_authenticate"].join("");
            const authUrl = getUrl("https://accounts.spotify.com/authorize", {
                client_id: "5150fd17a09a41ea93baca02a1fbbe53",
                response_type: "token",
                redirect_uri: encodeURIComponent(redirect),
                state: encodeURIComponent(state),
                scope: "playlist-read-private playlist-read-collaborative",
            });
            let oauthTimeout = undefined;
            const accessToken = await new Promise((resolve, reject) => {
                window.spotifyAuthenticate = (access, respState, err) => {
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
                    oauth.focus();
                    oauthTimeout = setTimeout(() => {
                        reject("Failed to authenticate within 5 minutes");
                    }, 300000); // 5 minutes
                }
            });
            if (oauthTimeout !== undefined) {
                clearTimeout(oauthTimeout);
            }
            async function fetchPlaylist(url) {
                const resp = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
                const jresp = await resp.json();
                const name = jresp.name;
                const tracks = jresp.tracks.items.map(({ track }) => track);
                let next = jresp.tracks.next;
                while (next !== null) {
                    const trackResp = await fetch(next, { headers: { Authorization: "Bearer " + accessToken } });
                    const jtrackRes = await trackResp.json();
                    next = jtrackRes.next;
                    jtrackRes.items.forEach(({ track }) => tracks.push(track));
                }
                return {
                    name: name,
                    tracks: tracks,
                };
            }
            let url = getUrl("https://api.spotify.com/v1/me/playlists", { limit: "50" });
            const promises = [];
            while (url !== null) {
                const resp = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
                const jresp = await resp.json();
                url = jresp.next;
                jresp.items.forEach(({ href }) => promises.push(fetchPlaylist(href)));
            }
            const playlists = await Promise.all(promises);
            console.log(playlists);
            const zip = new JSZip();
            playlists.forEach(plist => zip.file(`${plist.name}.pls`, toPLS(plist)));
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "spotify_playlist.zip");
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
