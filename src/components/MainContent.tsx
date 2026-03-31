import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2, Coffee, Target, Zap, Heart, Moon } from 'lucide-react';
import { searchMusic, getTopTracks } from '../services/musicService';
import { getMoodRecommendations } from '../services/aiService';
import { Track } from '../types';
import { TrackCard } from './TrackCard';
import { motion, AnimatePresence } from 'motion/react';

export const MainContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadInitialTracks();
  }, []);

  const loadInitialTracks = async () => {
    setLoading(true);
    const results = await getTopTracks();
    setTracks(results);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    const results = await searchMusic(searchQuery);
    setTracks(results);
    setLoading(false);
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

  const moods = [
    { label: 'Chill', icon: Coffee },
    { label: 'Focus', icon: Target },
    { label: 'Energy', icon: Zap },
    { label: 'Romantic', icon: Heart },
    { label: 'Melancholy', icon: Moon },
  ];

  return (
    <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-tunehub-bg to-black pb-48 md:pb-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Search for artists, songs, or albums..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-tunehub-accent/50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

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

      <section className="mb-12">
        <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-8 group">
          <img 
            src="https://picsum.photos/seed/music-banner/1200/400" 
            alt="Banner" 
            className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
            <span className="text-tunehub-accent font-bold tracking-[0.2em] text-[10px] md:text-xs mb-2 uppercase">Featured Artist</span>
            <h1 className="text-3xl md:text-5xl font-black mb-2 md:mb-4 tracking-tighter">Audius Discovery</h1>
            <p className="text-white/60 max-w-lg text-xs md:text-sm line-clamp-2 md:line-clamp-none">Streaming full-length tracks from the world's largest decentralized music protocol.</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {searchQuery ? `Results for "${searchQuery}"` : mood ? `Vibes for "${mood}"` : "Recommended for you"}
          </h2>
          <button className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest">Show all</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="text-tunehub-accent animate-spin" size={48} />
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/40">
            <Search size={48} className="mb-4 opacity-20" />
            <p>No tracks found. Try searching for something else.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TrackCard track={track} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
};
