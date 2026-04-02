export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  cover: string;
  preview: string;
  streamUrl?: string;
  duration: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  tracks: Track[];
  ownerId: string;
  isPublic: boolean;
  isCollaborative: boolean;
  folderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}
