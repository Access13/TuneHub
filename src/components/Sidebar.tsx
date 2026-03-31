import React, { useState } from 'react';
import { 
  Home, Search, Library, PlusSquare, Heart, Music2, 
  LogOut, User, Trash2, FolderPlus, Folder, ChevronRight,
  History, Clock, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

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
      "flex items-center gap-4 px-4 py-3 w-full text-sm font-medium transition-all duration-200 rounded-lg group text-left",
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
  const { 
    playlists, createPlaylist, deletePlaylist, 
    folders, createFolder, deleteFolder, movePlaylistToFolder,
    selectedPlaylistId, setSelectedPlaylistId,
    history 
  } = usePlayer();
  const { user, logout, loginWithGoogle } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [draggedPlaylistId, setDraggedPlaylistId] = useState<string | null>(null);

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) createPlaylist(name);
  };

  const handleCreateBlend = () => {
    const name = prompt('Enter Blend name:', 'Our Blend');
    if (name) createPlaylist(name, true);
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    if (name) createFolder(name);
  };

  const handleDeletePlaylist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylist(id);
    }
  };

  const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this folder? All playlists inside will be moved out.')) {
      deleteFolder(id);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPlaylistId(id);
    e.dataTransfer.setData('playlistId', id);
  };

  const onDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const playlistId = e.dataTransfer.getData('playlistId');
    if (playlistId) {
      movePlaylistToFolder(playlistId, folderId);
    }
    setDraggedPlaylistId(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderPlaylist = (playlist: any) => (
    <div 
      key={playlist.id} 
      className="group relative"
      draggable
      onDragStart={(e) => onDragStart(e, playlist.id)}
    >
      <button
        onClick={() => setSelectedPlaylistId(playlist.id)}
        className={cn(
          "flex items-center gap-4 px-4 py-2 w-full text-sm font-medium rounded-lg transition-all pr-10 text-left",
          selectedPlaylistId === playlist.id 
            ? "text-tunehub-accent bg-white/5" 
            : "text-white/60 hover:text-white hover:bg-white/5"
        )}
      >
        <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden">
          {playlist.cover ? (
            <img 
              src={playlist.cover} 
              alt="" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <Music2 size={12} className="text-white/20" />
          )}
        </div>
        <span className="truncate">{playlist.name}</span>
      </button>
      <button
        onClick={(e) => handleDeletePlaylist(e, playlist.id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/0 group-hover:text-white/40 hover:!text-red-500 transition-all rounded-md"
        title="Delete Playlist"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <aside className="w-64 h-full flex flex-col glass-dark border-r border-white/5 p-4 gap-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tunehub-accent to-tunehub-secondary flex items-center justify-center shadow-lg shadow-tunehub-accent/20">
          <Music2 size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          TuneHub
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-shrink-0">
        <SidebarItem 
          icon={Home} 
          label="Home" 
          active={selectedPlaylistId === null} 
          onClick={() => setSelectedPlaylistId(null)} 
        />
        <SidebarItem icon={Search} label="Search" />
        <SidebarItem 
          icon={History} 
          label="Recently Played" 
          active={selectedPlaylistId === 'history'}
          onClick={() => setSelectedPlaylistId('history')}
        />
      </nav>

      <div 
        className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-2"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, null)}
      >
        <div className="flex items-center justify-between px-4 mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Playlists
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={handleCreateFolder} className="text-white/40 hover:text-tunehub-accent transition-colors" title="New Folder">
              <FolderPlus size={14} />
            </button>
            <button onClick={handleCreateBlend} className="text-white/40 hover:text-tunehub-accent transition-colors" title="New Blend">
              <Users size={14} />
            </button>
            <button onClick={handleCreatePlaylist} className="text-white/40 hover:text-tunehub-accent transition-colors" title="New Playlist">
              <PlusSquare size={14} />
            </button>
          </div>
        </div>

        <SidebarItem 
          icon={Heart} 
          label="Liked Songs" 
          active={selectedPlaylistId === 'liked'} 
          onClick={() => setSelectedPlaylistId('liked')} 
        />

        {/* Folders */}
        {folders.map(folder => (
          <div key={folder.id} className="flex flex-col">
            <div 
              className={cn(
                "flex items-center justify-between px-4 py-2 group cursor-pointer hover:bg-white/5 rounded-lg transition-all",
                expandedFolders.includes(folder.id) && "bg-white/5"
              )}
              onClick={() => toggleFolder(folder.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, folder.id)}
            >
              <div className="flex items-center gap-3 text-white/60 group-hover:text-white transition-colors">
                <ChevronRight 
                  size={16} 
                  className={cn("transition-transform", expandedFolders.includes(folder.id) && "rotate-90")} 
                />
                <Folder size={18} className={cn(expandedFolders.includes(folder.id) && "text-tunehub-accent")} />
                <span className="text-sm font-medium truncate">{folder.name}</span>
              </div>
              <button
                onClick={(e) => handleDeleteFolder(e, folder.id)}
                className="p-1 text-white/0 group-hover:text-white/40 hover:!text-red-500 transition-all rounded-md"
              >
                <Trash2 size={12} />
              </button>
            </div>
            
            <AnimatePresence>
              {expandedFolders.includes(folder.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-4 border-l border-white/5"
                >
                  {playlists
                    .filter(p => p.id !== 'liked' && p.folderId === folder.id)
                    .map(playlist => renderPlaylist(playlist))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Root Playlists */}
        {playlists
          .filter(p => p.id !== 'liked' && !p.folderId)
          .map(playlist => renderPlaylist(playlist))}
      </div>

      {user ? (
        <div className="mt-auto pt-4 border-t border-white/5 flex-shrink-0">
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-tunehub-accent/20">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <User size={20} className="text-white/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user.displayName || 'User'}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-white/40 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-4 border-t border-white/5 flex-shrink-0">
          <button 
            onClick={loginWithGoogle}
            className="w-full py-3 bg-tunehub-accent/10 text-tunehub-accent rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-tunehub-accent/20 transition-all border border-tunehub-accent/20"
          >
            <User size={18} />
            Sign In
          </button>
        </div>
      )}
    </aside>
  );
};
