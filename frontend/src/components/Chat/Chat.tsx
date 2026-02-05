import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Message, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ChatProps {
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (content: string) => void;
}

export function Chat({ messages, currentUser, onSendMessage }: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const getMessageColor = (userId: string): string => {
    // Генерируем консистентный цвет на основе userId
    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-yellow-400',
      'text-purple-400',
      'text-pink-400',
      'text-indigo-400',
      'text-red-400',
      'text-orange-400',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isSystem = message.type === 'system';
          const isOwnMessage = message.user_id === currentUser?.id;

          if (isSystem) {
            return (
              <div key={message.id} className="text-center text-gray-400 text-sm py-1">
                {message.content}
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.user?.photo_url && (
                  <img
                    src={message.user.photo_url}
                    alt={message.user.first_name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className={`text-sm font-medium ${getMessageColor(message.user_id)}`}>
                  {message.user?.first_name || 'User'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
              </div>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
