interface Window {
  authenticate(access: string, state: string, err: undefined): void;
  authenticate(access: undefined, state: string, err: string): void;
}

interface ToastElement extends HTMLElement {
  MaterialSnackbar: {
    showSnackbar: (struct: {message: string}) => void;
  };
}

interface Artist {
  name: string;
}

interface PlatformIds {
  google?: string | null;
  spotify?: string | null;
}

interface Track {
  artists: Artist[];
  duration_ms: number;
  ids: PlatformIds;
  title: string;
  track: number;
  explicit: boolean;
  type: "track";
}

interface Album {
  art: string | null;
  artists: Artist[];
  ids: PlatformIds;
  name: string;
  num_tracks: number;
  tracks: Track[];
  year: number;
  type: "album";
}

interface Playlist {
  name: string;
  description: string;
  tracks: Track[];
  type: "playlist";
}

interface SpotifyPager<T> {
  href: string;
  items: T[];
  limit: number;
  offset: number;
  total: number;
  next: string | null;
}

interface SpotifyUser {
  href: string;
  id: string;
  type: "user";
}

interface SpotifyUserFull extends SpotifyUser {
  display_name: string | null;
  images: SpotifyImage[];
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  external_urls: {spotify: string};
  href: string;
  id: string;
  name: string;
  type: "artist";
}

interface SpotifyTrack {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: {spotify: string};
  href: string;
  id: string;
  name: string;
  track_number: number;
  type: "track";
}

interface SpotifyPlaylist {
  collaborative: false;
  external_urls: {spotify: string};
  href: string;
  id:  string;
  images: SpotifyImage[];
  name: string;
  owner: SpotifyUser;
  tracks: {href: string, total: number};
  type: "playlist";
}

interface SpotifyPlaylistFull extends SpotifyPlaylist {
  description: string;
  tracks: SpotifyPager<SpotifyPlaylistTrack>;
}

interface SpotifyPlaylistTrack {
  added_at: string;
  added_by: SpotifyUser;
  is_local: false;
  track: SpotifyTrack;
}

interface SpotifyAlbum {
  external_urls: {spotify: string};
  album_type: "album";
  artists: SpotifyArtist[];
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: "day";
  type: "album";
}

interface SpotifyPlaylistAlbum {
  added_at: string;
  album: SpotifyAlbumTracks;
}

interface SpotifyAlbumTracks extends SpotifyAlbum {
  release_date: string;
  release_date_precision: "day"; // TODO others
  tracks: SpotifyPager<SpotifyTrack>;
}
