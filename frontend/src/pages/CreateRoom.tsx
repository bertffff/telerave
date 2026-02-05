import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { roomApi } from '@/api/client';
import { CreateRoomData } from '@/types';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateRoomData>({
    name: '',
    isPublic: true,
    maxParticipants: 50,
    password: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoomData) => roomApi.createRoom(data),
    onSuccess: (response) => {
      navigate(`/room/${response.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...formData };
    if (!dataToSend.password) {
      delete dataToSend.password;
    }
    createMutation.mutate(dataToSend);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white mb-6 hover:opacity-80"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6">Create New Room</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Room Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My awesome room"
                required
                minLength={3}
                maxLength={50}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Max Participants</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                min={2}
                max={100}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-5 h-5"
                />
                Public Room
              </label>
              <p className="text-white/60 text-sm mt-1">
                Public rooms are visible to everyone
              </p>
            </div>

            {!formData.isPublic && (
              <div>
                <label className="block text-white mb-2">Password (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
