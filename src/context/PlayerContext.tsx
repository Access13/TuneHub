import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { Track, Playlist } from '../types';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seek: (percent: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  playlists: Playlist[];
  createPlaylist: (name: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'liked', name: 'Liked Songs', description: 'Your favorite tracks', cover: 'https://picsum.photos/seed/liked/300/300', tracks: [] }
  ]);
  
  const howlRef = useRef<Howl | null>(null);
  const progressInterval = useRef<number | null>(null);

  const playTrack = (track: Track) => {
    if (howlRef.current) {
      howlRef.current.unload();
    }

    const newHowl = new Howl({
      src: [track.preview],
      html5: true,
      volume: volume,
      onplay: () => {
        setIsPlaying(true);
        setDuration(newHowl.duration());
      },
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        nextTrack();
      },
      onload: () => {
        setDuration(newHowl.duration());
      }
    });

    howlRef.current = newHowl;
    setCurrentTrack(track);
    newHowl.play();
  };

  const togglePlay = () => {
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  };

  const seek = (percent: number) => {
    if (!howlRef.current) return;
    const time = (percent / 100) * howlRef.current.duration();
    howlRef.current.seek(time);
    setProgress(percent);
  };

  const nextTrack = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(next);
    }
  };

  const prevTrack = () => {
    if (howlRef.current) {
      howlRef.current.seek(0);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const createPlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: 'Custom playlist',
      cover: `https://picsum.photos/seed/${name}/300/300`,
      tracks: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        // Avoid duplicates
        if (p.tracks.find(t => t.id === track.id)) return p;
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    }));
  };

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        if (howlRef.current) {
          const current = howlRef.current.seek() as number;
          const dur = howlRef.current.duration();
          if (dur > 0) {
            setProgress((current / dur) * 100);
          }
        }
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, volume, progress, duration,
      playTrack, togglePlay, setVolume, seek, nextTrack, prevTrack,
      queue, addToQueue, playlists, createPlaylist, addToPlaylist
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
