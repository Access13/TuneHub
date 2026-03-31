import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { Track, Playlist, Folder } from '../types';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

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
  folders: Folder[];
  createPlaylist: (name: string, folderId?: string | null) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylistCover: (playlistId: string, coverUrl: string) => void;
  toggleCollaborative: (playlistId: string) => void;
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  movePlaylistToFolder: (playlistId: string, folderId: string | null) => void;
  reorderTracks: (playlistId: string, startIndex: number, endIndex: number) => void;
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  history: Track[];
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;
  repeatMode: 'none' | 'all' | 'one';
  setRepeatMode: (mode: 'none' | 'all' | 'one') => void;
  sleepTimer: number | null;
  setSleepTimer: (minutes: number | null) => void;
  sleepTimerRemaining: number | null;
  audioQuality: 'low' | 'medium' | 'high';
  setAudioQuality: (quality: 'low' | 'medium' | 'high') => void;
  isMono: boolean;
  setIsMono: (mono: boolean) => void;
  isAutoplay: boolean;
  setIsAutoplay: (autoplay: boolean) => void;
  eqGains: { low: number; mid: number; high: number };
  setEqGain: (band: 'low' | 'mid' | 'high', gain: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [isMono, setIsMono] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [eqGains, setEqGains] = useState({ low: 0, mid: 0, high: 0 });
  
  const howlRef = useRef<Howl | null>(null);
  const eqNodesRef = useRef<{ low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode } | null>(null);
  const progressInterval = useRef<number | null>(null);
  const sleepTimerInterval = useRef<number | null>(null);

  useEffect(() => {
    if (sleepTimer !== null) {
      setSleepTimerRemaining(sleepTimer * 60);
      if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
      
      sleepTimerInterval.current = window.setInterval(() => {
        setSleepTimerRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
            if (howlRef.current) howlRef.current.pause();
            setIsPlaying(false);
            setSleepTimer(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
      setSleepTimerRemaining(null);
    }

    return () => {
      if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
    };
  }, [sleepTimer]);

  // Listen for Playlists
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'playlists'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as Playlist))
        .filter(p => p.ownerId === user.uid || p.isPublic);
      setPlaylists(pList);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for Folders
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'folders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fList = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as Folder))
        .filter(f => f.ownerId === user.uid);
      setFolders(fList);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for Liked Songs
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'likedSongs'), (snapshot) => {
      const songs = snapshot.docs.map(doc => doc.data() as Track);
      setLikedSongs(songs);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for History
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'history'), 
      orderBy('playedAt', 'desc'), 
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hList = snapshot.docs.map(doc => doc.data().track as Track);
      setHistory(hList);
    });

    return () => unsubscribe();
  }, [user]);

  const playTrack = async (track: Track) => {
    if (howlRef.current) {
      howlRef.current.unload();
    }

    const newHowl = new Howl({
      src: [track.preview],
      html5: false, // Set to false to use Web Audio API for EQ
      volume: volume,
      onplay: () => {
        setIsPlaying(true);
        setDuration(newHowl.duration());
        setupEQ(newHowl);
      },
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        if (isAutoplay) nextTrack();
      },
      onload: () => {
        setDuration(newHowl.duration());
      }
    });

    howlRef.current = newHowl;
    setCurrentTrack(track);
    newHowl.play();

    // Record History and Activity
    if (user) {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        userId: user.uid,
        track,
        playedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'activity'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        track,
        timestamp: serverTimestamp()
      });
    }
  };

  const setupEQ = (howl: Howl) => {
    // @ts-ignore - Howler internal access
    const audioCtx = (Howler as any).ctx;
    if (!audioCtx) return;

    // @ts-ignore - Howler internal access
    const source = (howl as any)._sounds[0]._node;
    if (!source) return;

    const low = audioCtx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 320;
    low.gain.value = eqGains.low;

    const mid = audioCtx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = eqGains.mid;

    const high = audioCtx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 3200;
    high.gain.value = eqGains.high;

    source.disconnect();
    source.connect(low);
    low.connect(mid);
    mid.connect(high);
    high.connect(audioCtx.destination);

    eqNodesRef.current = { low, mid, high };
  };

  const setEqGain = (band: 'low' | 'mid' | 'high', gain: number) => {
    setEqGains(prev => ({ ...prev, [band]: gain }));
    if (eqNodesRef.current) {
      eqNodesRef.current[band].gain.value = gain;
    }
  };

  useEffect(() => {
    if (howlRef.current) {
      // @ts-ignore - Howler internal access
      const audioCtx = (Howler as any).ctx;
      if (audioCtx) {
        // Mock mono by setting channel count
        audioCtx.destination.channelCount = isMono ? 1 : 2;
      }
    }
  }, [isMono]);

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
    if (repeatMode === 'one' && currentTrack) {
      playTrack(currentTrack);
      return;
    }

    if (queue.length > 0) {
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      const next = queue[nextIndex];
      const newQueue = [...queue];
      newQueue.splice(nextIndex, 1);
      setQueue(newQueue);
      playTrack(next);
    } else if (repeatMode === 'all' && history.length > 0) {
      // Very basic repeat all from history if queue is empty
      playTrack(history[history.length - 1]);
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

  const createPlaylist = async (name: string, folderId: string | null = null) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newPlaylist: Playlist = {
      id,
      name,
      description: 'Custom playlist',
      cover: `https://picsum.photos/seed/${name}/300/300`,
      ownerId: user.uid,
      isPublic: false,
      isCollaborative: false,
      folderId,
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'playlists', id), {
      ...newPlaylist,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const deletePlaylist = async (id: string) => {
    if (!user) return;
    if (id === 'liked') return;
    await deleteDoc(doc(db, 'playlists', id));
    if (selectedPlaylistId === id) setSelectedPlaylistId(null);
  };

  const addToPlaylist = async (playlistId: string, track: Track) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (playlist.tracks.find(t => t.id === track.id)) return;

    await setDoc(doc(db, 'playlists', playlistId), {
      tracks: [...playlist.tracks, track],
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);
    await setDoc(doc(db, 'playlists', playlistId), {
      tracks: updatedTracks,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const updatePlaylistCover = async (playlistId: string, coverUrl: string) => {
    if (playlistId === 'liked') return;
    await setDoc(doc(db, 'playlists', playlistId), {
      cover: coverUrl,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const toggleCollaborative = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    await setDoc(doc(db, 'playlists', playlistId), {
      isCollaborative: !playlist.isCollaborative,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const createFolder = async (name: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newFolder: Folder = {
      id,
      name,
      ownerId: user.uid,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'folders', id), {
      ...newFolder,
      createdAt: serverTimestamp()
    });
  };

  const deleteFolder = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'folders', id));
    // Reset folderId for playlists in this folder
    const folderPlaylists = playlists.filter(p => p.folderId === id);
    for (const p of folderPlaylists) {
      await setDoc(doc(db, 'playlists', p.id), { folderId: null }, { merge: true });
    }
  };

  const movePlaylistToFolder = async (playlistId: string, folderId: string | null) => {
    await setDoc(doc(db, 'playlists', playlistId), { folderId }, { merge: true });
  };

  const reorderTracks = async (playlistId: string, startIndex: number, endIndex: number) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedTracks = Array.from(playlist.tracks);
    const [removed] = updatedTracks.splice(startIndex, 1);
    updatedTracks.splice(endIndex, 0, removed);

    await setDoc(doc(db, 'playlists', playlistId), {
      tracks: updatedTracks,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const toggleLike = async (track: Track) => {
    if (!user) return;
    const trackRef = doc(db, 'users', user.uid, 'likedSongs', track.id);
    const exists = likedSongs.find(t => t.id === track.id);

    if (exists) {
      await deleteDoc(trackRef);
    } else {
      await setDoc(trackRef, track);
    }
  };

  const isLiked = (trackId: string) => {
    return !!likedSongs.find(t => t.id === trackId);
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

  // Combine Liked Songs into playlists for UI consistency
  const allPlaylists = [
    { id: 'liked', name: 'Liked Songs', description: 'Your favorite tracks', cover: 'https://picsum.photos/seed/liked/300/300', tracks: likedSongs },
    ...playlists
  ];

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, volume, progress, duration,
      playTrack, togglePlay, setVolume, seek, nextTrack, prevTrack,
      queue, addToQueue, playlists: allPlaylists as Playlist[], 
      folders, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, 
      updatePlaylistCover, toggleCollaborative, createFolder, deleteFolder, movePlaylistToFolder,
      reorderTracks,
      toggleLike, isLiked, selectedPlaylistId, setSelectedPlaylistId,
      history, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
      sleepTimer, setSleepTimer, sleepTimerRemaining,
      audioQuality, setAudioQuality, isMono, setIsMono, isAutoplay, setIsAutoplay,
      eqGains, setEqGain
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
