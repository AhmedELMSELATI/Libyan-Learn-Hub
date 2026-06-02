import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { ScreenProtection } from './ScreenProtection';
import { WatermarkOverlay } from './WatermarkOverlay';

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

  useEffect(() => {
    const token = localStorage.getItem('lms_token');
    const apiBase = '/api';
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
        }
      })
      .catch(console.error);
    } else {
      setSecureUrl(url);
    }
  }, [courseId, lessonId, url]);

  const Player = ReactPlayer as any;

  return (
    <ScreenProtection className="aspect-video bg-black rounded-2xl shadow-2xl">
      {secureUrl ? (
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
          Generating secure stream...
        </div>
      )}

      <WatermarkOverlay />
    </ScreenProtection>
  );
}
