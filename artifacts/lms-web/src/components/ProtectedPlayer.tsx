import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProtectedPlayerProps {
  url: string;
  courseId?: number;
  lessonId?: number;
  onEnded?: () => void;
  onProgress?: (progress: { playedSeconds: number }) => void;
}

export function ProtectedPlayer({ url, courseId, lessonId, onEnded, onProgress }: ProtectedPlayerProps) {
  const { user, token, apiBase } = useAuth();
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [isHls, setIsHls] = useState(false);

  useEffect(() => {
    if (courseId && lessonId && token && apiBase) {
      fetch(`${apiBase}/video/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId, lessonId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          const host = apiBase.replace('/api', '');
          setSecureUrl(`${host}${data.url}`);
          setIsHls(!!data.isHls);
        }
      })
      .catch(console.error);
    } else {
      setSecureUrl(url);
    }
  }, [courseId, lessonId, url, token, apiBase]);

  // Randomize watermark position slightly every 10 seconds to prevent easy removal
  const [watermarkPos, setWatermarkPos] = useState({ top: 10, left: 10 });

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: 10 + Math.random() * 80,
        left: 10 + Math.random() * 80,
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut protection (screenshot prevention attempt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        showWarning("Screenshots are strictly prohibited and monitored.");
        // Attempt to clear clipboard by focusing an input and copying nothing (hacky, but sometimes works)
        navigator.clipboard.writeText('');
      }
      // Mac Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey && [ '3', '4', '5' ].includes(e.key)) {
        showWarning("Screen recording/capture is strictly prohibited.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(null), 5000);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showWarning("Right-click is disabled for content protection.");
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl protection-overlay"
      onContextMenu={handleContextMenu}
    >
      {secureUrl ? (
        <ReactPlayer
          ref={playerRef}
          url={secureUrl}
        width="100%"
        height="100%"
        controls={true}
        config={{
          file: {
            forceHLS: isHls,
            attributes: {
              controlsList: 'nodownload', // Disable download button in native player
              disablePictureInPicture: true,
            }
          }
        }}
        onEnded={onEnded}
        onProgress={onProgress}
          progressInterval={5000}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-black">
          Generating secure stream...
        </div>
      )}

      {/* Floating Watermark */}
      <div 
        className="absolute text-white/30 font-mono text-sm pointer-events-none transition-all duration-1000 ease-in-out select-none mix-blend-overlay"
        style={{ top: `${watermarkPos.top}%`, left: `${watermarkPos.left}%` }}
      >
        {user?.email || 'Guest'} - {user?.id || ''}
      </div>

      {/* Warning Overlay */}
      <AnimatePresence>
        {warning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-destructive text-destructive-foreground p-6 rounded-2xl max-w-md text-center shadow-2xl border border-white/10">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <h3 className="font-display font-bold text-xl mb-2">Security Warning</h3>
              <p className="text-white/90">{warning}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transparent overlay to catch right clicks specifically on the video area if controls don't catch it */}
      <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"></div>
    </div>
  );
}
