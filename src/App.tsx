import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { Player } from './components/Player';
import { MobileNav } from './components/MobileNav';
import { Login } from './components/Login';
import { FriendActivity } from './components/FriendActivity';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-tunehub-bg">
        <Loader2 className="text-tunehub-accent animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <PlayerProvider>
      <div className="flex h-screen w-full overflow-hidden bg-tunehub-bg flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <MainContent />
            <FriendActivity />
          </div>
          <MobileNav />
          <Player />
        </div>
      </div>
    </PlayerProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
