import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { Player } from './components/Player';
import { MobileNav } from './components/MobileNav';

export default function App() {
  return (
    <PlayerProvider>
      <div className="flex h-screen w-full overflow-hidden bg-tunehub-bg flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <MainContent />
          <MobileNav />
          <Player />
        </div>
      </div>
    </PlayerProvider>
  );
}
