import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, TrendingUp } from 'lucide-react';
import { roomApi, authApi } from '@/api/client';
import { Room, UserStats } from '@/types';

export default function Home() {
  const navigate = useNavigate();

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['public-rooms'],
    queryFn: () => roomApi.getPublicRooms(20),
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authApi.getUserStats(),
  });

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = () => {
    navigate('/create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 WatchParty</h1>
          <p className="text-blue-200">Watch videos together with friends</p>
        </div>

        {/* User Stats */}
        {stats?.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users className="text-blue-400" />}
              label="Rooms Joined"
              value={stats.data.rooms_joined}
            />
            <StatCard
              icon={<TrendingUp className="text-green-400" />}
              label="Rooms Created"
              value={stats.data.rooms_created}
            />
            <StatCard
              icon={<Clock className="text-purple-400" />}
              label="Watch Time"
              value={`${Math.floor(stats.data.total_watch_time / 3600)}h`}
            />
            <StatCard
              icon={<Users className="text-pink-400" />}
              label="Messages"
              value={stats.data.messages_sent}
            />
          </div>
        )}

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          className="w-full mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Plus size={24} />
          Create New Room
        </button>

        {/* Public Rooms */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Public Rooms</h2>
          
          {roomsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          ) : rooms?.data && rooms.data.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {rooms.data.map((room: Room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinRoom(room.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/60">
              <p className="text-lg">No public rooms available</p>
              <p className="text-sm mt-2">Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function RoomCard({ room, onJoin }: { room: Room; onJoin: () => void }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all cursor-pointer"
         onClick={onJoin}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{room.name}</h3>
          <p className="text-blue-200 text-sm">
            {room.participant_count || 0} / {room.max_participants} participants
          </p>
        </div>
        {room.video_url && (
          <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
            Watching
          </div>
        )}
      </div>

      {room.video_platform && (
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <span className="capitalize">{room.video_platform}</span>
          {room.is_playing && <span>• Playing</span>}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onJoin();
        }}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Join Room
      </button>
    </div>
  );
}
