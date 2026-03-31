export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  preview: string;
  duration: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  tracks: Track[];
}
