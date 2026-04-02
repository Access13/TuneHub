import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
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
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  shuffleQueue: () => void;
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
  const { user, setError, setMessage } = useAuth();
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
  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>(() => {
    return (localStorage.getItem('audioQuality') as 'low' | 'medium' | 'high') || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('audioQuality', audioQuality);
  }, [audioQuality]);
  const [isMono, setIsMono] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [eqGains, setEqGains] = useState({ low: 0, mid: 0, high: 0 });
  
  const howlRef = useRef<Howl | null>(null);
  const isInitialMount = useRef(true);
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'playlists');
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'folders');
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for Liked Songs
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'likedSongs'), (snapshot) => {
      const songs = snapshot.docs.map(doc => doc.data() as Track);
      setLikedSongs(songs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/likedSongs`);
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/history`);
    });

    return () => unsubscribe();
  }, [user]);

  const playTrack = useCallback(async (track: Track, startTime?: number) => {
    try {
      if (howlRef.current) {
        howlRef.current.unload();
      }

      const streamUrl = track.preview.includes('?') 
        ? `${track.preview}&quality=${audioQuality}`
        : `${track.preview}?quality=${audioQuality}`;

      const newHowl = new Howl({
        src: [streamUrl],
        html5: true, // Set to true for better streaming reliability
        volume: volume,
        onplay: () => {
          setIsPlaying(true);
          setDuration(newHowl.duration());
          if (startTime !== undefined) {
            newHowl.seek(startTime);
          }
          // setupEQ(newHowl); // EQ requires Web Audio (html5: false)
        },
        onpause: () => setIsPlaying(false),
        onstop: () => setIsPlaying(false),
        onend: () => {
          setIsPlaying(false);
          if (isAutoplay) nextTrack();
        },
        onload: () => {
          console.log('Howler loaded successfully:', track.title);
          setDuration(newHowl.duration());
        },
        onloaderror: (id, error) => {
          console.error('Howler load error for track:', track.title, 'Error:', error);
          setIsPlaying(false);
        },
        onplayerror: (id, error) => {
          console.error('Howler play error for track:', track.title, 'Error:', error);
          setIsPlaying(false);
        }
      });

      howlRef.current = newHowl;
      setCurrentTrack(track);
      newHowl.play();

      // Record History
      if (user) {
        addDoc(collection(db, 'users', user.uid, 'history'), {
          userId: user.uid,
          track,
          playedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/history`));
      }
    } catch (error) {
      console.error('playTrack error:', error);
    }
  }, [audioQuality, volume, isAutoplay, user]);

  const setupEQ = (howl: Howl) => {
    try {
      // @ts-ignore - Howler internal access
      const audioCtx = (Howler as any).ctx;
      if (!audioCtx) return;

      // @ts-ignore - Howler internal access
      const sounds = (howl as any)._sounds;
      if (!sounds || !sounds[0] || !sounds[0]._node) return;

      const source = sounds[0]._node;

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
    } catch (error) {
      console.error('setupEQ error:', error);
    }
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
    if (!howlRef.current || isNaN(percent)) return;
    const dur = howlRef.current.duration();
    if (dur > 0) {
      const time = (percent / 100) * dur;
      howlRef.current.seek(time);
      setProgress(percent);
    }
  };

  const toggleShuffle = () => {
    const newVal = !isShuffle;
    setIsShuffle(newVal);
    if (newVal) shuffleQueue();
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const shuffleQueue = () => {
    if (queue.length === 0) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
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
    if (!howlRef.current) return;
    const current = howlRef.current.seek() as number;
    if (current > 3) {
      howlRef.current.seek(0);
    } else if (history.length > 1) {
      // history[0] is current, history[1] is previous
      playTrack(history[1]);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const createPlaylist = async (name: string, folderId: string | null = null) => {
    if (!user) {
      setError('Please sign in to create playlists');
      return;
    }
    try {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'playlists');
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!user) {
      setError('Please sign in to delete playlists');
      return;
    }
    if (id === 'liked') return;
    try {
      await deleteDoc(doc(db, 'playlists', id));
      if (selectedPlaylistId === id) setSelectedPlaylistId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `playlists/${id}`);
    }
  };

  const addToPlaylist = async (playlistId: string, track: Track) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (playlist.tracks.find(t => t.id === track.id)) return;

    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        tracks: [...playlist.tracks, track],
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `playlists/${playlistId}`);
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);
    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        tracks: updatedTracks,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `playlists/${playlistId}`);
    }
  };

  const updatePlaylistCover = async (playlistId: string, coverUrl: string) => {
    if (playlistId === 'liked') return;
    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        cover: coverUrl,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `playlists/${playlistId}`);
    }
  };

  const toggleCollaborative = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        isCollaborative: !playlist.isCollaborative,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `playlists/${playlistId}`);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) return;
    try {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'folders');
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'folders', id));
      // Reset folderId for playlists in this folder
      const folderPlaylists = playlists.filter(p => p.folderId === id);
      for (const p of folderPlaylists) {
        await setDoc(doc(db, 'playlists', p.id), { folderId: null }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `folders/${id}`);
    }
  };

  const movePlaylistToFolder = async (playlistId: string, folderId: string | null) => {
    try {
      await setDoc(doc(db, 'playlists', playlistId), { folderId }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `playlists/${playlistId}`);
    }
  };

  const reorderTracks = async (playlistId: string, startIndex: number, endIndex: number) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedTracks = Array.from(playlist.tracks);
    const [removed] = updatedTracks.splice(startIndex, 1);
    updatedTracks.splice(endIndex, 0, removed);

    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        tracks: updatedTracks,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `playlists/${playlistId}`);
    }
  };

  const toggleLike = async (track: Track) => {
    if (!user) {
      setError('Please sign in to like songs');
      return;
    }
    const trackRef = doc(db, 'users', user.uid, 'likedSongs', track.id);
    const exists = likedSongs.find(t => t.id === track.id);

    try {
      if (exists) {
        await deleteDoc(trackRef);
      } else {
        await setDoc(trackRef, track);
      }
    } catch (error) {
      handleFirestoreError(error, exists ? OperationType.DELETE : OperationType.WRITE, `users/${user.uid}/likedSongs/${track.id}`);
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

  // Handle Quality Change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (currentTrack && howlRef.current && isPlaying) {
      const currentTime = howlRef.current.seek() as number;
      playTrack(currentTrack, currentTime);
      setMessage(`Audio quality set to ${audioQuality.toUpperCase()}`);
    }
  }, [audioQuality, playTrack, setMessage]);

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
      history, isShuffle, toggleShuffle, shuffleQueue, repeatMode, setRepeatMode, toggleRepeat,
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
