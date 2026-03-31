import React from 'react';
import { Home, Search, Library, PlusSquare, Heart, Music2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayer } from '../context/PlayerContext';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-4 py-3 w-full text-sm font-medium transition-all duration-200 rounded-lg group",
      active 
        ? "text-tunehub-accent bg-white/5" 
        : "text-white/60 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={22} className={cn("transition-transform group-hover:scale-110", active && "text-tunehub-accent")} />
    <span>{label}</span>
  </button>
);

export const Sidebar = () => {
  const { playlists, createPlaylist } = usePlayer();

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) createPlaylist(name);
  };

  return (
    <aside className="w-64 h-full flex flex-col glass-dark border-r border-white/5 p-4 gap-8">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tunehub-accent to-tunehub-secondary flex items-center justify-center shadow-lg shadow-tunehub-accent/20">
          <Music2 size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          TuneHub
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        <SidebarItem icon={Home} label="Home" active />
        <SidebarItem icon={Search} label="Search" />
        <SidebarItem icon={Library} label="Your Library" />
      </nav>

      <div className="flex flex-col gap-1 overflow-y-auto">
        <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center justify-between">
          Playlists
          <button onClick={handleCreatePlaylist} className="hover:text-tunehub-accent transition-colors">
            <PlusSquare size={14} />
          </button>
        </h3>
        <SidebarItem icon={Heart} label="Liked Songs" />
        {playlists.filter(p => p.id !== 'liked').map(playlist => (
          <button
            key={playlist.id}
            className="flex items-center gap-4 px-4 py-2 w-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
              <img 
                src={playlist.cover} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="truncate">{playlist.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto px-4 py-4 border-t border-white/5">
        <div className="text-[10px] text-white/30 uppercase tracking-tighter">
          Atmospheric Audio v1.0
        </div>
      </div>
    </aside>
  );
};
