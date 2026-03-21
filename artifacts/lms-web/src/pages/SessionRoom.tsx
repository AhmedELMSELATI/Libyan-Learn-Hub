import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import {
  ThumbsUp, CheckCircle, Send, MessageSquare, Users, Clock,
  Video, ArrowLeft, Maximize2, Minimize2, Radio, Flag
} from 'lucide-react';

export default function SessionRoom() {
  const [, params] = useRoute('/session/:id');
  const sessionId = parseInt(params?.id || '0');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const jitsiRef = useRef<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  const [reportSession, setReportSession] = useState(false);
  const { register: registerReport, handleSubmit: handleReportSubmit, reset: resetReport } = useForm();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation('/login');
  }, [isAuthenticated, authLoading]);

  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/room/sessions', sessionId],
    queryFn: () => api.get(`/room/sessions/${sessionId}`),
    enabled: !!sessionId && !!user,
    refetchInterval: 30000,
  });

  const { data: questions, refetch: refetchQuestions } = useQuery({
    queryKey: ['/api/room/sessions', sessionId, 'questions'],
    queryFn: () => api.get(`/room/sessions/${sessionId}/questions`),
    enabled: !!sessionId && !!user,
    refetchInterval: 5000,
  });

  // Load Jitsi iframe API and start the call
  useEffect(() => {
    if (!session?.meetingUrl && !session?.isRegistered) return;
    if (jitsiLoaded) return;

    const roomName = session.meetingUrl
      ? session.meetingUrl.split('/').pop()
      : `edulibya-session-${sessionId}`;

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      if (!jitsiContainerRef.current) return;
      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI) return;
      jitsiRef.current = new JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName: user?.fullName || 'Student', email: user?.email || '' },
        configOverwrite: {
          startWithAudioMuted: !session.isTeacher,
          startWithVideoMuted: !session.isTeacher,
          disableDeepLinking: true,
          enableClosePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'raisehand', 'tileview', 'select-background',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Student',
        },
      });
      setJitsiLoaded(true);
    };
    document.head.appendChild(script);
    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose?.();
      }
    };
  }, [session?.meetingUrl, session?.isRegistered]);

  const joinSession = async () => {
    try {
      const data = await api.post(`/room/sessions/${sessionId}/join`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/room/sessions', sessionId] });
      toast({ title: 'Joined session!' });
    } catch (err: any) {
      toast({ title: 'Error joining', description: err.message, variant: 'destructive' });
    }
  };

  const submitQuestion = async () => {
    if (!question.trim()) return;
    try {
      await api.post(`/room/sessions/${sessionId}/questions`, { question });
      setQuestion('');
      refetchQuestions();
      toast({ title: 'Question submitted!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const upvoteQuestion = async (qId: number) => {
    await api.post(`/room/sessions/${sessionId}/questions/${qId}/upvote`, {});
    refetchQuestions();
  };

  const markAnswered = async (qId: number) => {
    await api.post(`/room/sessions/${sessionId}/questions/${qId}/answer`, {});
    refetchQuestions();
    toast({ title: 'Marked as answered' });
  };

  const submitReport = async (data: any) => {
    if (!session) return;
    try {
      await api.post('/reports', {
        type: 'session',
        targetId: session.id,
        reportedUserId: session.teacherId,
        reason: data.reason,
        description: data.description,
      });
      toast({ title: 'Report submitted. Thank you for your feedback.' });
      setReportSession(false);
      resetReport();
    } catch (err: any) {
      toast({ title: 'Error submitting report', description: err.message, variant: 'destructive' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <Radio className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading session room...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Session not found</p>
          <Button onClick={() => setLocation('/live-sessions')}>Back to Sessions</Button>
        </div>
      </div>
    );
  }

  const canJoin = session.isRegistered || session.isTeacher;
  const unanswered = (questions || []).filter((q: any) => !q.answered);
  const answered = (questions || []).filter((q: any) => q.answered);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={() => setLocation('/live-sessions')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                {session.status === 'live' ? 'Live' : session.status}
              </span>
            </div>
            <h1 className="font-bold text-sm">{session.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <Button variant="ghost" size="sm" className="hidden sm:flex px-2 text-white/50 hover:text-red-400 gap-1 h-7" onClick={() => setReportSession(true)}>
             <Flag className="w-3.5 h-3.5" /> <span className="sr-only sm:not-sr-only">Report</span>
          </Button>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{session.registeredCount} / {session.maxParticipants}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{session.durationMinutes} min</span>
          <span className="text-white/40">Teacher: {session.teacherName}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col">
          {canJoin ? (
            <div ref={jitsiContainerRef} className="flex-1 bg-black">
              {!jitsiLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-white/20 mx-auto mb-4 animate-pulse" />
                    <p className="text-white/60">Connecting to video call...</p>
                    <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={joinSession}>
                      Start Session
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-800">
              <div className="text-center max-w-md px-6">
                <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Ready to Join?</h2>
                <p className="text-white/60 mb-6">
                  {session.isFull
                    ? 'This session is full. No seats available.'
                    : `${session.seatsLeft} seats available. Register to join this session.`}
                </p>
                {!session.isFull && (
                  <Button className="bg-primary hover:bg-primary/90 px-8" onClick={joinSession}>
                    Join Session ({session.seatsLeft} seats left)
                  </Button>
                )}
                {session.isFull && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    Session is full — no seats available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Q&A Sidebar */}
        <div className="w-80 bg-slate-800 border-l border-white/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Live Q&A</h3>
              {unanswered.length > 0 && (
                <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full ml-auto">
                  {unanswered.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {unanswered.length === 0 && answered.length === 0 && (
              <div className="text-center py-8 text-white/30 text-sm">
                No questions yet. Be the first to ask!
              </div>
            )}
            {unanswered.map((q: any) => (
              <div key={q.id} className="bg-slate-700 rounded-xl p-3">
                <p className="text-sm text-white mb-2">{q.question}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>{q.userName}</span>
                    <button
                      onClick={() => upvoteQuestion(q.id)}
                      className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                    </button>
                  </div>
                  {session.isTeacher && (
                    <button
                      onClick={() => markAnswered(q.id)}
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Mark Answered
                    </button>
                  )}
                </div>
              </div>
            ))}
            {answered.length > 0 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-xs text-white/30 mb-2">Answered</p>
                {answered.map((q: any) => (
                  <div key={q.id} className="bg-slate-700/50 rounded-xl p-3 mb-2 opacity-60">
                    <div className="flex items-center gap-1 text-green-400 text-xs mb-1">
                      <CheckCircle className="w-3 h-3" /> Answered
                    </div>
                    <p className="text-sm text-white/70">{q.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit question */}
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitQuestion()}
                placeholder="Ask a question..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-white/30 text-sm h-9"
              />
              <Button size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 shrink-0" onClick={submitQuestion}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-white/30 mt-1">Press Enter to send</p>
          </div>
        </div>
      </div>

      {/* Report Session Modal */}
      <Dialog open={reportSession} onOpenChange={setReportSession}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Report Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReportSubmit(submitReport)} className="space-y-4 mt-4">
            <div className="text-sm text-white/70 mb-4">You are reporting this session. Please select a reason below.</div>
            <div>
              <label className="text-sm font-medium mb-1 block text-white/80">Reason *</label>
              <select {...registerReport('reason', { required: true })} className="w-full h-10 px-3 rounded-md border border-slate-700 bg-slate-800 text-sm text-white focus:outline-none focus:border-primary">
                <option value="">Select a reason</option>
                <option value="inappropriate_behavior">Inappropriate Behavior</option>
                <option value="offensive">Offensive Content</option>
                <option value="technical_issue">Technical Issues / Spam</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-white/80">Description (optional)</label>
              <Textarea {...registerReport('description')} placeholder="Please provide more details..." rows={3} className="bg-slate-800 border-slate-700 text-white placeholder:text-white/40 focus:border-primary" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 bg-transparent border-slate-700 text-white hover:bg-slate-800" onClick={() => setReportSession(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" className="flex-1">Submit Report</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
