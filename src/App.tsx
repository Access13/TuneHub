import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { Player } from './components/Player';
import { MobileNav } from './components/MobileNav';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';

const AppContent = () => {
  const { loading, error, setError, message, setMessage } = useAuth();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test connection to Firestore
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log('Firestore connection successful');
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firestore connection failed: the client is offline. This usually means the configuration is incorrect or the database is not reachable.");
          setError("Database connection error: The client is offline. Please check your network or Firebase configuration.");
        }
      }
    }
    testConnection();
  }, [setError]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-tunehub-bg">
        <Loader2 className="text-tunehub-accent animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-tunehub-bg flex-col md:flex-row relative">
      {/* Global Auth Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] glass-dark px-6 py-3 rounded-full border border-red-500/50 text-red-400 text-sm font-medium flex items-center gap-3 shadow-2xl"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] glass-dark px-6 py-3 rounded-full border border-tunehub-accent/50 text-tunehub-accent text-sm font-medium flex items-center gap-3 shadow-2xl"
          >
            <div className="w-2 h-2 rounded-full bg-tunehub-accent animate-pulse" />
            {message}
            <button 
              onClick={() => setMessage(null)}
              className="ml-2 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <MainContent />
        </div>
        <MobileNav />
        <Player />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </AuthProvider>
  );
}
