import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ShieldAlert, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Configure timeouts (in milliseconds)
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes of inactivity
const GRACE_PERIOD = 30 * 1000;          // 30 seconds countdown warning

export function InactivityTimer() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(GRACE_PERIOD / 1000);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto logout triggered when the grace countdown finishes
  const handleAutoLogout = useCallback(() => {
    setShowWarning(false);
    logout('/login?reason=inactivity');
  }, [logout]);

  // Reset the main inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Only run the timer if the user is authenticated
    if (isAuthenticated && !showWarning) {
      inactivityTimerRef.current = setTimeout(() => {
        setShowWarning(true);
      }, INACTIVITY_LIMIT);
    }
  }, [isAuthenticated, showWarning]);

  // Listen to interactive events to establish user activity
  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Attach listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetInactivityTimer();

    // Cleanup listeners
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Handle countdown interval when warning alert dialog is displayed
  useEffect(() => {
    if (showWarning) {
      setCountdown(GRACE_PERIOD / 1000);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            handleAutoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [showWarning, handleAutoLogout]);

  // Keep Session Action
  const handleKeepSession = () => {
    setShowWarning(false);
    resetInactivityTimer();
  };

  // Immediate Sign Out Action
  const handleManualLogout = () => {
    setShowWarning(false);
    logout('/login?reason=inactivity');
  };

  if (!isAuthenticated || !user) return null;

  // Determine dynamic message text based on role
  const isTeacher = user.role === 'teacher';
  const roleDescription = isTeacher 
    ? t('inactivity.teacher.message') 
    : t('inactivity.student.message');

  return (
    <AnimatePresence>
      {showWarning && (
        <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
          <AlertDialogContent className="max-w-md rounded-3xl border border-border shadow-2xl p-6 overflow-hidden">
            
            {/* Glassmorphic Background Glow */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 ${
              isTeacher ? 'bg-secondary' : 'bg-primary'
            }`} />

            <AlertDialogHeader className="flex flex-col items-center text-center">
              {/* Animated Icon Header */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  isTeacher ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                }`}
              >
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </motion.div>

              <AlertDialogTitle className="text-xl font-display font-bold">
                {t('inactivity.warning.title')}
              </AlertDialogTitle>

              {/* Custom Interactive Avatar & Banner */}
              <div className="flex items-center gap-3 bg-muted/50 py-2 px-4 rounded-full my-3 border border-border/30">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-sm font-semibold text-foreground/80">
                  {isTeacher ? `👨‍🏫 ${user.fullName} (Teacher)` : `🎓 ${user.fullName} (Student)`}
                </span>
              </div>

              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed text-center px-2">
                {roleDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Countdown Clock Display */}
            <div className="flex flex-col items-center justify-center my-5 py-4 bg-muted/40 rounded-2xl border border-border/20">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
                {t('inactivity.countdown').replace('{seconds}', countdown.toString()).split(' ')[0]} {/* Simple fallback, translation handles full text below */}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold tracking-tight text-destructive">
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('inactivity.countdown').replace('{seconds}', countdown.toString())}
              </p>
            </div>

            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
              <AlertDialogCancel 
                onClick={handleManualLogout} 
                className="flex-1 h-12 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors gap-2 m-0"
              >
                <LogOut className="w-4 h-4" />
                {t('inactivity.btn.logout')}
              </AlertDialogCancel>
              
              <AlertDialogAction 
                onClick={handleKeepSession} 
                className={`flex-1 h-12 rounded-xl text-white font-medium shadow-lg transition-all hover:scale-[1.02] gap-2 m-0 ${
                  isTeacher 
                    ? 'bg-secondary hover:bg-secondary/90 shadow-secondary/20' 
                    : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {t('inactivity.btn.stay')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AnimatePresence>
  );
}
