import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Maximize2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';

export const Player = () => {
  const { 
    currentTrack, isPlaying, togglePlay, progress, seek, 
    volume, setVolume, duration 
  } = usePlayer();

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-24 md:h-24 glass-dark border-t border-white/10 px-4 flex items-center justify-between z-50 fixed bottom-0 left-0 right-0 md:relative">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-full md:w-1/3">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
          <img 
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-white truncate pr-2">
            {currentTrack.title}
          </span>
          <span className="text-xs text-white/60 truncate pr-2">
            {currentTrack.artist}
          </span>
        </div>
        {/* Mobile Play Button */}
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
          <button className="text-white/60 hover:text-white transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
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
        <div className="flex items-center gap-2 w-32">
          <Volume2 size={18} className="text-white/60" />
          <div 
            className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setVolume(Math.max(0, Math.min(1, x / rect.width)));
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-white/60 rounded-full"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
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
    </div>
  );
};
