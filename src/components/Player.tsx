import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, 
  Volume2, Maximize2, Heart, ListMusic, Minimize2, 
  ChevronDown, X, Mic2, Music2
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getLyrics } from '../services/lyricsService';

interface LyricLine {
  time: number;
  text: string;
}

export const Player = () => {
  const { 
    currentTrack, isPlaying, togglePlay, progress, seek, 
    volume, setVolume, duration, toggleLike, isLiked,
    nextTrack, prevTrack, queue
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTrack) {
      getLyrics(currentTrack).then(setLyrics);
    }
  }, [currentTrack]);

  const currentLyricIndex = lyrics.findIndex((l, i) => {
    const next = lyrics[i + 1];
    const currentTime = (progress / 100) * duration;
    return currentTime >= l.time && (!next || currentTime < next.time);
  });

  useEffect(() => {
    if (showLyrics && lyricsContainerRef.current && currentLyricIndex !== -1) {
      const activeLine = lyricsContainerRef.current.children[currentLyricIndex] as HTMLElement;
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricIndex, showLyrics]);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) nextTrack();
        else seek(Math.min(100, progress + 5));
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) prevTrack();
        else seek(Math.max(0, progress - 5));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.1));
        break;
      case 'KeyL':
        toggleLike(currentTrack);
        break;
      case 'KeyF':
        setIsFullScreen(prev => !prev);
        break;
    }
  }, [togglePlay, nextTrack, prevTrack, seek, progress, setVolume, volume, currentTrack, toggleLike]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-tunehub-bg/40 to-black" />
              <div 
                className="absolute inset-0 blur-[120px] opacity-30 animate-pulse"
                style={{ 
                  background: `radial-gradient(circle at 50% 50%, ${liked ? '#ef4444' : '#00ffcc'}, transparent)` 
                }}
              />
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 flex items-center justify-between">
              <button onClick={() => setIsFullScreen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronDown size={32} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Playing from</p>
                <p className="text-sm font-bold">Audius Discovery</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowLyrics(!showLyrics)} 
                  className={cn("p-2 rounded-full transition-colors", showLyrics ? "bg-tunehub-accent text-black" : "hover:bg-white/10")}
                >
                  <Mic2 size={24} />
                </button>
                <button 
                  onClick={() => setShowQueue(!showQueue)} 
                  className={cn("p-2 rounded-full transition-colors", showQueue ? "bg-tunehub-accent text-black" : "hover:bg-white/10")}
                >
                  <ListMusic size={24} />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-8 max-w-screen-xl mx-auto w-full overflow-hidden">
              {/* Cover Art */}
              <motion.div 
                layoutId="cover"
                className={cn(
                  "w-full max-w-md aspect-square rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 flex-shrink-0",
                  isPlaying ? "scale-100" : "scale-90 opacity-50",
                  showLyrics && "hidden md:block md:w-64 md:h-64"
                )}
              >
                <img src={currentTrack.cover} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>

              {/* Lyrics or Info */}
              <div className="flex-1 w-full flex flex-col gap-8 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 truncate">{currentTrack.title}</h1>
                    <p className="text-xl md:text-2xl text-white/60 font-medium truncate">{currentTrack.artist}</p>
                  </div>
                  <button 
                    onClick={() => toggleLike(currentTrack)}
                    className={cn("p-4 rounded-full glass transition-all", liked ? "text-red-500 scale-110" : "text-white/20")}
                  >
                    <Heart size={32} fill={liked ? "currentColor" : "none"} />
                  </button>
                </div>

                {showLyrics ? (
                  <div className="relative h-full overflow-hidden">
                    <div 
                      ref={lyricsContainerRef}
                      className="h-full overflow-y-auto custom-scrollbar pr-4 mask-fade-y pb-24"
                    >
                      {lyrics.map((line, i) => (
                        <p 
                          key={i}
                          className={cn(
                            "text-2xl md:text-4xl font-bold mb-6 transition-all duration-500 cursor-pointer hover:text-white",
                            i === currentLyricIndex ? "text-white scale-105 origin-left" : "text-white/20"
                          )}
                          onClick={() => seek((line.time / duration) * 100)}
                        >
                          {line.text}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center text-white/10">
                    <Music2 size={120} />
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-col gap-6 mt-auto pb-12">
                  <div 
                    className="h-2 bg-white/10 rounded-full cursor-pointer relative group"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      seek((x / rect.width) * 100);
                    }}
                  >
                    <div 
                      className="h-full bg-white rounded-full relative group-hover:bg-tunehub-accent transition-colors"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm font-mono text-white/40">
                    <span>{formatTime((progress / 100) * duration)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <button className="text-white/20 hover:text-white transition-colors"><Shuffle size={28} /></button>
                    <div className="flex items-center gap-12">
                      <button onClick={prevTrack} className="text-white hover:scale-110 transition-transform"><SkipBack size={48} fill="currentColor" /></button>
                      <button 
                        onClick={togglePlay}
                        className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
                      >
                        {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                      </button>
                      <button onClick={nextTrack} className="text-white hover:scale-110 transition-transform"><SkipForward size={48} fill="currentColor" /></button>
                    </div>
                    <button className="text-white/20 hover:text-white transition-colors"><Repeat size={28} /></button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-24 md:h-24 glass-dark border-t border-white/10 px-4 flex items-center justify-between z-50 fixed bottom-0 left-0 right-0 md:relative">
        {/* Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/3">
          <div 
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden shadow-lg border border-white/10 flex-shrink-0 cursor-pointer group relative"
            onClick={() => setIsFullScreen(true)}
          >
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 size={16} />
            </div>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-white truncate pr-2 hover:underline cursor-pointer">
              {currentTrack.title}
            </span>
            <span className="text-xs text-white/60 truncate pr-2 hover:underline cursor-pointer">
              {currentTrack.artist}
            </span>
          </div>
          
          <button 
            onClick={() => toggleLike(currentTrack)}
            className={cn(
              "transition-colors hover:scale-110",
              liked ? "text-tunehub-accent" : "text-white/40 hover:text-white"
            )}
          >
            <Heart size={20} fill={liked ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={togglePlay}
            className="md:hidden w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>

        {/* Controls - Desktop Only */}
        <div className="hidden md:flex flex-col items-center gap-2 w-1/3">
          <div className="flex items-center gap-6">
            <button className="text-white/40 hover:text-white transition-colors">
              <Shuffle size={18} />
            </button>
            <button onClick={prevTrack} className="text-white/60 hover:text-white transition-colors">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-white/60 hover:text-white transition-colors">
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button className="text-white/40 hover:text-white transition-colors">
              <Repeat size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-[10px] text-white/40 w-8 text-right">
              {formatTime((progress / 100) * duration)}
            </span>
            <div 
              className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                seek((x / rect.width) * 100);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-tunehub-accent rounded-full group-hover:bg-tunehub-accent/80"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-white/40 w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Extra - Desktop Only */}
        <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            className={cn(
              "transition-colors",
              showLyrics ? "text-tunehub-accent" : "text-white/40 hover:text-white"
            )}
          >
            <Mic2 size={20} />
          </button>
          <button 
            onClick={() => setShowQueue(!showQueue)}
            className={cn(
              "transition-colors",
              showQueue ? "text-tunehub-accent" : "text-white/40 hover:text-white"
            )}
          >
            <ListMusic size={20} />
          </button>
          <div className="flex items-center gap-2 w-32 group">
            <Volume2 size={18} className="text-white/60 group-hover:text-white transition-colors" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-tunehub-accent"
            />
          </div>
          <button 
            onClick={() => setIsFullScreen(true)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Maximize2 size={18} />
          </button>
        </div>
        
        {/* Mobile Progress Bar (Top of player) */}
        <div 
          className="md:hidden absolute top-0 left-0 right-0 h-0.5 bg-white/5"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            seek((x / rect.width) * 100);
          }}
        >
          <div 
            className="h-full bg-tunehub-accent"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Queue Overlay */}
        <AnimatePresence>
          {showQueue && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full right-4 mb-4 w-80 glass-dark rounded-2xl p-4 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest">Next in Queue</h3>
                <button onClick={() => setShowQueue(false)} className="text-white/40 hover:text-white"><ChevronDown size={18} /></button>
              </div>
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {queue.length > 0 ? queue.map((track, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <img src={track.cover} alt="" className="w-10 h-10 rounded-md object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{track.title}</p>
                      <p className="text-[10px] text-white/40 truncate">{track.artist}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-white/40 text-center py-8 italic">Queue is empty</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
