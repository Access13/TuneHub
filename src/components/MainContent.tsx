import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, Coffee, Target, Zap, Heart, Moon, History, Clock, Play, Music2, User, PlusSquare, ChevronRight } from 'lucide-react';
import { searchMusic, getTopTracks } from '../services/musicService';
import { getMoodRecommendations, getPersonalizedRecommendations } from '../services/aiService';
import { Track } from '../types';
import { TrackCard } from './TrackCard';
import { usePlayer } from '../context/PlayerContext';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const MainContent = () => {
  const { 
    selectedPlaylistId, setSelectedPlaylistId, playlists, history, 
    updatePlaylistCover, toggleCollaborative,
    reorderTracks,
    playTrack 
  } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [draggedTrackIndex, setDraggedTrackIndex] = useState<number | null>(null);
  const [personalizedMixes, setPersonalizedMixes] = useState<{ name: string, tracks: Track[] }[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [artistData, setArtistData] = useState<any>(null);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (selectedArtistId) {
      loadArtistData(selectedArtistId);
    }
  }, [selectedArtistId]);

  const loadArtistData = async (artistId: string) => {
    setLoading(true);
    try {
      const { getArtistData, getArtistTracks } = await import('../services/musicService');
      const [data, tracks] = await Promise.all([
        getArtistData(artistId),
        getArtistTracks(artistId)
      ]);
      setArtistData(data);
      setArtistTracks(tracks);
    } catch (error) {
      console.error('Error loading artist data:', error);
    }
    setLoading(false);
  };
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('searchHistory');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  });

  const [searchType, setSearchType] = useState<'all' | 'tracks' | 'artists' | 'albums'>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  useEffect(() => {
    if (debouncedSearch) {
      handleSearch(debouncedSearch, searchType);
      addToSearchHistory(debouncedSearch);
      fetchSuggestions(debouncedSearch);
    } else {
      setSuggestions([]);
      if (!selectedPlaylistId) {
        loadInitialTracks();
      }
    }
  }, [debouncedSearch, searchType]);

  useEffect(() => {
    if (history.length > 0 && personalizedMixes.length === 0) {
      loadPersonalizedMixes();
    }
  }, [history]);

  const loadPersonalizedMixes = async () => {
    const historyTitles = history.map(t => t.title);
    const recommendations = await getPersonalizedRecommendations(historyTitles);
    const mixes = await Promise.all(recommendations.slice(0, 3).map(async (rec) => {
      const results = await searchMusic(rec);
      return { name: rec, tracks: results.slice(0, 6) };
    }));
    setPersonalizedMixes(mixes);
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) return;
    try {
      const results = await searchMusic(query);
      const uniqueArtists = Array.from(new Set(results.map(t => t.artist))).slice(0, 5);
      setSuggestions(uniqueArtists);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  useEffect(() => {
    if (selectedPlaylistId === 'history') {
      setTracks(history);
      setLoading(false);
    } else if (selectedPlaylistId) {
      const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);
      setTracks(currentPlaylist?.tracks || []);
      setLoading(false);
    }
  }, [selectedPlaylistId, playlists, history]);

  useEffect(() => {
    if (!selectedPlaylistId && !searchQuery) {
      loadInitialTracks();
    }
  }, [selectedPlaylistId, searchQuery]);

  const loadInitialTracks = async () => {
    if (tracks.length === 0) setLoading(true);
    const results = await getTopTracks();
    setTracks(results);
    setLoading(false);
  };

  const handleSearch = async (query: string, type: string = 'all') => {
    if (!query.trim()) return;
    setLoading(true);
    const results = await searchMusic(query);
    setTracks(results);
    setLoading(false);
  };

  const addToSearchHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAiMood = async (specificMood?: string) => {
    const targetMood = specificMood || mood;
    if (!targetMood.trim()) return;
    setAiLoading(true);
    setMood(targetMood);
    const recommendations = await getMoodRecommendations(targetMood);
    const results = await searchMusic(recommendations[0]);
    setTracks(results);
    setAiLoading(false);
  };

  const onTrackDragStart = (e: React.DragEvent, index: number) => {
    if (!selectedPlaylistId || selectedPlaylistId === 'liked' || selectedPlaylistId === 'history') return;
    setDraggedTrackIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onTrackDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTrackIndex === null || draggedTrackIndex === index) return;
  };

  const onTrackDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTrackIndex === null || draggedTrackIndex === index || !selectedPlaylistId) return;
    reorderTracks(selectedPlaylistId, draggedTrackIndex, index);
    setDraggedTrackIndex(null);
  };

  const moods = [
    { label: 'Chill', icon: Coffee },
    { label: 'Focus', icon: Target },
    { label: 'Energy', icon: Zap },
    { label: 'Romantic', icon: Heart },
    { label: 'Melancholy', icon: Moon },
  ];

  if (selectedArtistId && artistData) {
    return (
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-tunehub-bg to-black pb-48 md:pb-8">
        <header className="mb-12">
          <button 
            onClick={() => setSelectedArtistId(null)}
            className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest mb-8 flex items-center gap-2"
          >
            <ChevronRight size={14} className="rotate-180" /> Back
          </button>

          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl flex-shrink-0 border-4 border-white/5">
              <img src={artistData.profile_pictures?.['480x480'] || `https://picsum.photos/seed/${artistData.id}/400/400`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-500 text-white p-1 rounded-full">
                  <User size={12} fill="currentColor" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Verified Artist</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none">{artistData.name}</h1>
              <div className="flex items-center gap-6 text-sm font-medium text-white/60">
                <p><span className="text-white font-bold">{artistData.follower_count.toLocaleString()}</span> followers</p>
                <span>•</span>
                <p><span className="text-white font-bold">{artistTracks.length}</span> tracks</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => artistTracks.length > 0 && playTrack(artistTracks[0])}
              className="w-14 h-14 rounded-full bg-tunehub-accent text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
            <button className="px-6 py-2 rounded-full border border-white/20 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">Follow</button>
          </div>

          <h2 className="text-2xl font-black mb-6 tracking-tight">Popular Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artistTracks.slice(0, 10).map((track, i) => (
              <div key={track.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group">
                <span className="w-4 text-xs text-white/20 font-bold text-center">{i + 1}</span>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={track.cover} alt="" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => playTrack(track)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.album}</p>
                </div>
                <div className="text-xs text-white/20 font-medium">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {artistData.bio && (
          <section className="mb-12">
            <h2 className="text-2xl font-black mb-6 tracking-tight">About</h2>
            <div className="glass p-8 rounded-[2rem] border border-white/5 max-w-3xl">
              <p className="text-white/60 leading-relaxed whitespace-pre-wrap">{artistData.bio}</p>
            </div>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-tunehub-bg to-black pb-48 md:pb-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Search for artists, songs, or albums..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-tunehub-accent/50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <AnimatePresence>
            {suggestions.length > 0 && searchQuery && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-2xl p-2 z-[60] border border-white/10 shadow-2xl"
              >
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSuggestions([]);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <Search size={14} className="text-tunehub-accent" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {searchQuery && (
            <div className="flex gap-2 mt-3 px-2">
              {(['all', 'tracks', 'artists', 'albums'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    searchType === type ? "bg-tunehub-accent text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
          {searchHistory.length > 0 && !searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-dark rounded-2xl p-4 z-50 opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto transition-opacity shadow-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
                <History size={12} /> Recent Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => setSearchQuery(q)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 flex-nowrap">
            {moods.map((m) => (
              <button
                key={m.label}
                onClick={() => handleAiMood(m.label)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[10px] font-bold uppercase tracking-wider hover:border-tunehub-accent/50 transition-all whitespace-nowrap group"
              >
                <m.icon size={12} className="text-tunehub-accent group-hover:scale-110 transition-transform" />
                {m.label}
              </button>
            ))}
          </div>
          <div className="relative flex-shrink-0">
            <input 
              type="text"
              placeholder="Vibe?"
              className="bg-tunehub-secondary/10 border border-tunehub-secondary/20 rounded-full py-2 px-4 pr-10 text-xs focus:outline-none focus:border-tunehub-secondary/50 transition-colors w-32 md:w-48"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiMood()}
            />
            <button 
              onClick={() => handleAiMood()}
              disabled={aiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-tunehub-accent hover:scale-110 transition-transform disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section for Playlists */}
      {selectedPlaylistId && (selectedPlaylist || selectedPlaylistId === 'history') && (
        <div className="flex flex-col md:flex-row items-end gap-6 mb-12 p-8 rounded-[2rem] bg-gradient-to-t from-white/5 to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-tunehub-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative group w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-shrink-0">
            <img 
              src={selectedPlaylistId === 'history' ? "https://picsum.photos/seed/history/400/400" : selectedPlaylist?.cover} 
              alt="" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            {selectedPlaylistId !== 'liked' && selectedPlaylistId !== 'history' && (
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
                <PlusSquare size={32} className="mb-2 text-tunehub-accent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Change Cover</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        updatePlaylistCover(selectedPlaylistId, base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex-1 relative z-10">
            <span className="text-tunehub-accent font-bold tracking-[0.3em] text-[10px] md:text-xs mb-3 block uppercase">
              {selectedPlaylistId === 'history' ? 'Your History' : 'Playlist'}
            </span>
            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
              {selectedPlaylistId === 'history' ? 'Recently Played' : selectedPlaylist?.name}
            </h1>
            
            <div className="flex items-center gap-6 text-white/40 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-tunehub-accent/20 flex items-center justify-center">
                  <User size={12} className="text-tunehub-accent" />
                </div>
                <span className="text-white font-bold">You</span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Music2 size={14} />
                {selectedPlaylistId === 'history' ? history.length : selectedPlaylist?.tracks.length} tracks
              </span>
              
              {selectedPlaylistId !== 'liked' && selectedPlaylistId !== 'history' && (
                <>
                  <span>•</span>
                  <button 
                    onClick={() => toggleCollaborative(selectedPlaylistId)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all backdrop-blur-md",
                      selectedPlaylist?.isCollaborative 
                        ? "border-tunehub-accent text-tunehub-accent bg-tunehub-accent/10" 
                        : "border-white/10 text-white/40 hover:border-white/20"
                    )}
                  >
                    <User size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {selectedPlaylist?.isCollaborative ? 'Collaborative' : 'Make Collaborative'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={() => tracks.length > 0 && playTrack(tracks[0])}
            className="absolute right-8 bottom-8 w-16 h-16 rounded-full bg-tunehub-accent text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
          >
            <Play size={32} fill="currentColor" className="ml-1" />
          </button>
        </div>
      )}

      {/* Home View Sections */}
      {!selectedPlaylistId && !searchQuery && (
        <>
          <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden mb-12 group cursor-pointer">
            <img 
              src="https://picsum.photos/seed/music-banner/1600/600" 
              alt="Banner" 
              className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-[1.5s]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={20} className="text-tunehub-accent animate-pulse" />
                <span className="text-tunehub-accent font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase">New Release</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter leading-none max-w-2xl">Discover the Sound of Audius</h1>
              <h1 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter leading-none max-w-2xl">Discover the Sound of Audius</h1>
              <p className="text-white/60 max-w-lg text-sm md:text-lg font-medium">Explore millions of tracks from independent artists worldwide.</p>
            </div>
          </div>

          {history.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black tracking-tight">Recently Played</h2>
                <button 
                  onClick={() => setSelectedPlaylistId('history')}
                  className="text-xs font-bold text-white/40 hover:text-tunehub-accent uppercase tracking-widest transition-colors"
                >
                  See all
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {history.slice(0, 6).map((track, i) => (
                  <motion.div
                    key={`history-${track.id}-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <TrackCard track={track} onArtistClick={setSelectedArtistId} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {personalizedMixes.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-black tracking-tight mb-8">Made For You</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {personalizedMixes.map((mix, i) => (
                  <div key={i} className="glass p-6 rounded-[2rem] border border-white/5 hover:border-tunehub-accent/20 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight">{mix.name} Mix</h3>
                        <p className="text-xs text-white/40 font-medium">Personalized for you</p>
                      </div>
                      <button 
                        onClick={() => playTrack(mix.tracks[0])}
                        className="w-10 h-10 rounded-full bg-tunehub-accent text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                      >
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {mix.tracks.slice(0, 6).map((track, j) => (
                        <div key={j} className="aspect-square rounded-lg overflow-hidden bg-white/5 relative group/track">
                          <img src={track.cover} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => playTrack(track)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/track:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Play size={16} fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Main Grid Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight">
            {selectedPlaylistId === 'history' 
              ? "Your Listening History"
              : selectedPlaylistId 
                ? selectedPlaylist?.name 
                : searchQuery 
                  ? `Results for "${searchQuery}"` 
                  : mood 
                    ? `Vibes for "${mood}"` 
                    : "Recommended for you"}
          </h2>
          {!selectedPlaylistId && !searchQuery && (
            <button className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Show all</button>
          )}
        </div>

        {tracks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-96 text-white/40 glass rounded-[2rem] border-dashed border-2 border-white/5">
            {selectedPlaylistId ? (
              <>
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Music2 size={40} className="opacity-20" />
                </div>
                <p className="text-lg font-bold">This playlist is empty</p>
                <p className="text-sm">Add some tracks to get started!</p>
              </>
            ) : (
              <>
                <Search size={48} className="mb-6 opacity-20" />
                <p className="text-lg font-bold">No results found</p>
                <p className="text-sm">Try searching for something else.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            <AnimatePresence mode="popLayout">
              {tracks.map((track, index) => (
                <motion.div
                  key={`${selectedPlaylistId || 'main'}-${track.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  draggable={!!selectedPlaylistId && selectedPlaylistId !== 'liked' && selectedPlaylistId !== 'history'}
                  onDragStart={(e) => onTrackDragStart(e, index)}
                  onDragOver={(e) => onTrackDragOver(e, index)}
                  onDrop={(e) => onTrackDrop(e, index)}
                  className={cn(
                    "transition-all",
                    draggedTrackIndex === index && "opacity-50 scale-95"
                  )}
                >
                  <TrackCard 
                    track={track} 
                    selectedPlaylistId={selectedPlaylistId} 
                    onArtistClick={setSelectedArtistId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
};
