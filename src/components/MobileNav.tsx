import React from 'react';
import { Home, Search, Library, PlusSquare } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { cn } from '../lib/utils';

export const MobileNav = () => {
  const { createPlaylist } = usePlayer();

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) createPlaylist(name);
  };

  return (
    <nav className="md:hidden fixed bottom-24 left-4 right-4 h-16 glass-dark rounded-2xl border border-white/10 flex items-center justify-around px-4 z-50">
      <button className="flex flex-col items-center gap-1 text-tunehub-accent">
        <Home size={20} />
        <span className="text-[10px] font-medium uppercase tracking-tighter">Home</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
        <Search size={20} />
        <span className="text-[10px] font-medium uppercase tracking-tighter">Search</span>
      </button>
      <button 
        onClick={handleCreatePlaylist}
        className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors"
      >
        <PlusSquare size={20} />
        <span className="text-[10px] font-medium uppercase tracking-tighter">Create</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
        <Library size={20} />
        <span className="text-[10px] font-medium uppercase tracking-tighter">Library</span>
      </button>
    </nav>
  );
};
