import React, { useState } from 'react';
import { Play, Plus, Check, Heart } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';

interface TrackCardProps {
  track: Track;
  selectedPlaylistId?: string | null;
  onArtistClick?: (artistId: string) => void;
}

export const TrackCard = ({ track, selectedPlaylistId, onArtistClick }: TrackCardProps) => {
  const { playTrack, currentTrack, isPlaying, playlists, addToPlaylist, removeFromPlaylist, toggleLike, isLiked } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const [added, setAdded] = useState(false);
  
  const isCurrent = currentTrack?.id === track.id;
  const liked = isLiked(track.id);

  const handleAddToPlaylist = (playlistId: string) => {
    addToPlaylist(playlistId, track);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    setShowMenu(false);
  };

  const handleRemoveFromPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPlaylistId && selectedPlaylistId !== 'liked') {
      removeFromPlaylist(selectedPlaylistId, track.id);
      setShowMenu(false);
    }
  };

  return (
    <div 
      className="group p-4 rounded-xl glass hover:bg-white/10 transition-all duration-300 cursor-pointer relative"
      onClick={() => playTrack(track)}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-2xl">
        <img 
          src={track.cover} 
          alt={track.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-tunehub-accent text-black flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
            <Play size={24} fill="currentColor" className="ml-1" />
          </div>
        </div>
        
        {/* Actions Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(track);
            }}
            className={cn(
              "w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors",
              liked && "text-red-500"
            )}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {added ? <Check size={16} className="text-tunehub-accent" /> : <Plus size={16} />}
          </button>
        </div>

        {showMenu && (
          <div className="absolute top-12 right-2 w-48 glass-dark rounded-lg p-2 z-50 shadow-2xl border border-white/10">
            {selectedPlaylistId && selectedPlaylistId !== 'liked' && (
              <>
                <button
                  onClick={handleRemoveFromPlaylist}
                  className="w-full text-left px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors truncate mb-2 border-b border-white/5 pb-2"
                >
                  Remove from this playlist
                </button>
              </>
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-2 mb-2">Add to Playlist</p>
            {playlists.filter(p => p.id !== 'liked').map(p => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToPlaylist(p.id);
                }}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-white/10 rounded transition-colors truncate"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 right-2 flex gap-1 items-end h-4">
            <div className="w-1 bg-tunehub-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 bg-tunehub-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 bg-tunehub-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate text-white mb-1">{track.title}</h3>
          <p 
            className={cn(
              "text-xs text-white/40 truncate",
              onArtistClick && track.artistId && "hover:text-white hover:underline cursor-pointer"
            )}
            onClick={(e) => {
              if (onArtistClick && track.artistId) {
                e.stopPropagation();
                onArtistClick(track.artistId);
              }
            }}
          >
            {track.artist}
          </p>
        </div>
      </div>
    </div>
  );
};
