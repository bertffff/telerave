import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { VideoPlatform } from '@/types';

interface VideoPlayerProps {
  url: string | null;
  platform: VideoPlatform;
  playing: boolean;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onProgress: (state: { playedSeconds: number }) => void;
  isHost: boolean;
}

export function VideoPlayer({
  url,
  platform,
  playing,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onProgress,
  isHost,
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const lastSeekRef = useRef<number>(0);

  // Синхронизация времени
  useEffect(() => {
    if (playerRef.current && !isHost) {
      const player = playerRef.current;
      const internalTime = player.getCurrentTime();
      const diff = Math.abs(internalTime - currentTime);

      // Синхронизируем только если разница больше 2 секунд
      if (diff > 2) {
        player.seekTo(currentTime, 'seconds');
      }
    }
  }, [currentTime, isHost]);

  const handleProgress = (state: { playedSeconds: number }) => {
    // Только хост отправляет обновления времени
    if (isHost) {
      const now = Date.now();
      // Throttle обновлений до 1 раза в 2 секунды
      if (now - lastSeekRef.current > 2000) {
        lastSeekRef.current = now;
        onProgress(state);
      }
    }
  };

  const handleSeek = (seconds: number) => {
    if (isHost) {
      onSeek(seconds);
    }
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl">No video loaded</p>
          <p className="text-gray-400 mt-2">Host will select a video soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={isHost}
        width="100%"
        height="100%"
        onPlay={isHost ? onPlay : undefined}
        onPause={isHost ? onPause : undefined}
        onSeek={isHost ? handleSeek : undefined}
        onProgress={handleProgress}
        config={{
          youtube: {
            playerVars: {
              autoplay: 0,
              controls: isHost ? 1 : 0,
              modestbranding: 1,
            },
          },
          twitch: {
            options: {
              width: '100%',
              height: '100%',
            },
          },
        }}
      />
      {!isHost && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
          🎯 Host controls the playback
        </div>
      )}
    </div>
  );
}
