import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { ScreenProtection } from './ScreenProtection';
import { WatermarkOverlay } from './WatermarkOverlay';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ProtectedPlayerProps {
  url: string;
  courseId?: number;
  lessonId?: number;
  startAt?: number;
  onEnded?: () => void;
  onProgress?: (progress: { playedSeconds: number }) => void;
}

export function ProtectedPlayer({ url, courseId, lessonId, startAt = 0, onEnded, onProgress }: ProtectedPlayerProps) {
  const playerRef = useRef<typeof ReactPlayer>(null);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [isHls, setIsHls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateToken = () => {
    const token = localStorage.getItem('lms_token');
    const apiBase = '/api';
    setError(null);
    if (courseId && lessonId && token) {
      fetch(`${apiBase}/video/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId, lessonId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setSecureUrl(`${data.url}`);
          setIsHls(!!data.isHls);
        } else if (data.error) {
          setError(data.error);
        } else {
          // Fallback: try playing the raw URL directly
          setSecureUrl(url);
        }
      })
      .catch(() => {
        // Network error: fall back to direct URL
        setSecureUrl(url);
      });
    } else {
      setSecureUrl(url);
    }
  };

  useEffect(() => {
    generateToken();
  }, [courseId, lessonId, url]);

  const Player = ReactPlayer as any;

  return (
    <ScreenProtection className="aspect-video bg-black rounded-2xl shadow-2xl">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/90 gap-3 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-red-300 font-medium">{error}</p>
          <button
            onClick={generateToken}
            className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : secureUrl ? (
        <Player
          ref={playerRef as any}
          url={secureUrl}
          width="100%"
          height="100%"
          controls={true}
          config={{
            file: {
              forceHLS: isHls,
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: true,
              }
            }
          } as any}
          onReady={() => {
            if (startAt > 0 && playerRef.current) {
              (playerRef.current as any).seekTo(startAt, 'seconds');
            }
          }}
          onEnded={onEnded}
          onProgress={onProgress as any}
          progressInterval={10000}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-white/60">Generating secure stream...</span>
          </div>
        </div>
      )}

      <WatermarkOverlay />
    </ScreenProtection>
  );
}

