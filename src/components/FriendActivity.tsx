import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Track } from '../types';
import { Music2, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePlayer } from '../context/PlayerContext';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  track: Track;
  timestamp: any;
}

export const FriendActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { playTrack } = usePlayer();

  useEffect(() => {
    const q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const aList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Activity));
      setActivities(aList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-72 h-full glass-dark border-l border-white/5 flex flex-col p-6 overflow-hidden hidden xl:flex">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-bold tracking-tight text-white/80">Friend Activity</h3>
        <User size={16} className="text-white/40" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 group">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                {activity.userPhoto ? (
                  <img src={activity.userPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <User size={16} className="text-white/20" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tunehub-accent border-2 border-tunehub-bg flex items-center justify-center">
                <Music2 size={10} className="text-black" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold truncate text-white/80">{activity.userName}</p>
                <span className="text-[10px] text-white/40">
                  {activity.timestamp ? formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true }) : ''}
                </span>
              </div>
              
              <div 
                className="cursor-pointer group/track"
                onClick={() => playTrack(activity.track)}
              >
                <p className="text-[11px] font-medium text-white/60 truncate group-hover/track:text-tunehub-accent transition-colors">
                  {activity.track.title}
                </p>
                <p className="text-[10px] text-white/40 truncate">
                  {activity.track.artist}
                </p>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[10px] text-white/20">
                <Clock size={10} />
                <span>Listening now</span>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <User size={24} className="text-white/10" />
            </div>
            <p className="text-xs font-medium text-white/40">No recent activity</p>
            <p className="text-[10px] text-white/20 mt-1">Connect with friends to see what they're listening to.</p>
          </div>
        )}
      </div>
    </div>
  );
};
