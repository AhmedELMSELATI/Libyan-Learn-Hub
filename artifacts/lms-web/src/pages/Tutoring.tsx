import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BookOpen, Clock, DollarSign, Users, Star, Plus, Filter,
  Send, CheckCircle, XCircle, MessageSquare, Calendar, Search, Edit2, Trash2, Eye, ExternalLink, Settings
} from 'lucide-react';
import { useForm } from 'react-hook-form';

const GRADE_LEVELS = [
  { value: 'grade_10', label: 'Grade 10 / الصف العاشر' },
  { value: 'grade_11', label: 'Grade 11 / الصف الحادي عشر' },
  { value: 'grade_12', label: 'Grade 12 / الصف الثاني عشر' },
  { value: 'university', label: 'University / الجامعة' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rescheduled_by_teacher: 'bg-blue-100 text-blue-800 border-blue-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  completed: 'bg-purple-100 text-purple-800 border-purple-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending / قيد الانتظار',
  accepted: 'Accepted / مقبول',
  rescheduled_by_teacher: 'New Time Proposed / وقت مقترح',
  declined: 'Declined / مرفوض',
  cancelled: 'Cancelled / ملغي',
  completed: 'Completed / مكتمل',
};

function gradeLevelLabel(value: string) {
  return GRADE_LEVELS.find(g => g.value === value)?.label || value || '—';
}

// ─── Settings Modal (Teacher) ────────────────────────────────────────────────
function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const api = useApi();
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      isTutoringEnabled: (user as any)?.isTutoringEnabled || false,
      tutoringHourlyRate: (user as any)?.tutoringHourlyRate || '0',
      tutoringSubjects: (user as any)?.tutoringSubjects || '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await api.put('/tutoring/settings', {
        isTutoringEnabled: data.isTutoringEnabled,
        tutoringHourlyRate: parseFloat(data.tutoringHourlyRate),
        tutoringSubjects: data.tutoringSubjects,
      });
      refetchUser();
      toast({ title: 'Settings updated successfully' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tutoring Settings / إعدادات الخصوصي</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="isTutoringEnabled" {...register('isTutoringEnabled')} />
            <label htmlFor="isTutoringEnabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable 1-to-1 Tutoring
            </label>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Hourly Rate (LYD)</label>
            <Input {...register('tutoringHourlyRate')} type="number" min="0" step="0.01" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Subjects Taught</label>
            <Input {...register('tutoringSubjects')} placeholder="e.g., Math, Physics" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>Save</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Propose Time Modal (Teacher) ────────────────────────────────────────────
function ProposeTimeModal({ request, open, onClose }: { request: any; open: boolean; onClose: () => void }) {
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposedAt, setProposedAt] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!proposedAt) return;
    setLoading(true);
    try {
      await api.post(`/tutoring/requests/${request.id}/propose-time`, { proposedAt });
      toast({ title: 'New time proposed' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Propose New Time</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm font-medium block mb-1">New Date & Time</label>
          <Input type="datetime-local" value={proposedAt} onChange={e => setProposedAt(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={loading || !proposedAt} className="flex-1">Send Proposal</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Session Form (Student) ──────────────────────────────────────────
function RequestSessionForm() {
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: tutors = [] } = useQuery<any[]>({
    queryKey: ['/api/tutoring/tutors'],
    queryFn: () => api.get('/tutoring/tutors'),
  });

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      isUrgent: false,
      teacherId: '',
      subject: '',
      lecturerLevel: 'grade_10',
      topic: '',
      preferredAt: '',
      durationMinutes: '60',
      message: '',
    }
  });

  const isUrgent = watch('isUrgent');

  const onSubmit = async (data: any) => {
    try {
      await api.post('/tutoring/requests', {
        ...data,
        teacherId: data.isUrgent ? null : (data.teacherId ? parseInt(data.teacherId) : null),
        durationMinutes: parseInt(data.durationMinutes),
      });
      toast({ title: 'Request submitted successfully! 100 LYD held from balance.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
      reset();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit request', variant: 'destructive' });
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Request a 1-to-1 Session</h2>
      <p className="text-sm text-muted-foreground mb-6">Note: Reserving a session will hold 100 dinars from your wallet balance. If cancelled or declined, it will be refunded instantly.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Lecturer Level</label>
            <select {...register('lecturerLevel')} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm">
              {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Subject</label>
            <Input {...register('subject', { required: true })} placeholder="e.g. Mathematics" />
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-border">
          <Checkbox id="isUrgent" {...register('isUrgent')} />
          <label htmlFor="isUrgent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Mark as Urgent (Any available teacher can accept)
          </label>
        </div>

        {!isUrgent && (
          <div>
            <label className="text-sm font-medium block mb-1">Select Teacher (Optional)</label>
            <select {...register('teacherId')} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm">
              <option value="">Any Teacher / أي معلم</option>
              {tutors.map(t => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Preferred Date & Time</label>
            <Input {...register('preferredAt', { required: true })} type="datetime-local" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Duration (Minutes)</label>
            <select {...register('durationMinutes')} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm">
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Specific Topic</label>
          <Input {...register('topic')} placeholder="What do you want to focus on?" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Message to Teacher</label>
          <textarea {...register('message')} rows={3} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none" placeholder="Any extra details..." />
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          <Send className="w-4 h-4" /> {isSubmitting ? 'Reserving...' : 'Submit Request (100 LYD)'}
        </Button>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tutoring() {
  const { user } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [tab, setTab] = useState<'request' | 'requests'>('request');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [proposeFor, setProposeFor] = useState<any>(null);

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/tutoring/requests'],
    queryFn: () => api.get('/tutoring/requests'),
    refetchInterval: 10000, // Poll for updates every 10s
  });

  const handleTeacherAction = async (id: number, action: 'accept' | 'decline') => {
    try {
      await api.post(`/tutoring/requests/${id}/${action}`, {});
      toast({ title: `Request ${action}ed successfully!` });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleStudentAction = async (id: number, action: 'accept-proposed-time' | 'cancel' | 'complete') => {
    try {
      await api.post(`/tutoring/requests/${id}/${action}`, {});
      toast({ title: `Action ${action} successful!` });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-1">1-to-1 Tutoring</p>
              <h1 className="text-3xl font-display font-bold">
                {isTeacher ? 'Manage Tutoring Sessions' : 'Personal Tutoring Sessions'}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                {isTeacher
                  ? 'Accept student requests, propose new times, and conduct private video sessions.'
                  : 'Request private tutoring with expert teachers. Secure your slot directly through the platform.'}
              </p>
            </div>
            {isTeacher && (
              <Button variant="outline" className="gap-2 shrink-0 bg-background" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4" /> Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b border-border">
          {!isTeacher && (
            <button
              onClick={() => setTab('request')}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${tab === 'request' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              ➕ Request Session
            </button>
          )}
          <button
            onClick={() => setTab('requests')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${tab === 'requests' || isTeacher ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {isTeacher ? '📥 Incoming & Scheduled Sessions' : '📋 My Sessions'}
          </button>
        </div>

        {/* Student Request Form */}
        {tab === 'request' && !isTeacher && (
          <div className="max-w-2xl">
            <RequestSessionForm />
          </div>
        )}

        {/* List of Requests */}
        {(tab === 'requests' || isTeacher) && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold">No sessions found</h3>
                <p className="text-muted-foreground text-sm mt-1">You have no tutoring sessions requested yet.</p>
              </div>
            ) : (
              requests.map((r: any) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                        {r.isUrgent && <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>}
                        <span className="text-xs text-muted-foreground font-medium">#{r.id}</span>
                      </div>
                      <h3 className="font-bold text-lg">{r.subject} {r.topic && <span className="text-muted-foreground font-normal">— {r.topic}</span>}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isTeacher ? `Student: ${r.studentName}` : `Teacher: ${r.teacherName || 'Any Teacher'}`}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Prefers: {new Date(r.preferredAt).toLocaleString()}</span>
                        </div>
                        {r.proposedAt && (
                          <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                            <Clock className="w-4 h-4" />
                            <span>Proposed: {new Date(r.proposedAt).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{r.durationMinutes} min</span>
                        </div>
                      </div>

                      {r.message && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-xl text-sm border border-border/50">
                          <MessageSquare className="w-4 h-4 inline mr-2 text-muted-foreground" />
                          {r.message}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <div className="text-xl font-bold text-primary">{r.totalAmount} LYD</div>
                      
                      {/* Meeting Link */}
                      {r.status === 'accepted' && r.meetingUrl && (
                        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                          <a href={r.meetingUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" /> Join Meeting
                          </a>
                        </Button>
                      )}

                      {/* Teacher Actions */}
                      {isTeacher && r.status === 'pending' && (
                        <div className="flex flex-col gap-2 w-full mt-2">
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleTeacherAction(r.id, 'accept')}>Accept</Button>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => setProposeFor(r)}>Propose Time</Button>
                          <Button size="sm" variant="ghost" className="w-full text-red-600 hover:text-red-700" onClick={() => handleTeacherAction(r.id, 'decline')}>Decline</Button>
                        </div>
                      )}

                      {/* Student Actions */}
                      {!isTeacher && r.status === 'rescheduled_by_teacher' && (
                        <div className="flex flex-col gap-2 w-full mt-2">
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleStudentAction(r.id, 'accept-proposed-time')}>Accept New Time</Button>
                          <Button size="sm" variant="ghost" className="w-full text-red-600 hover:text-red-700" onClick={() => handleStudentAction(r.id, 'cancel')}>Decline & Refund</Button>
                        </div>
                      )}
                      
                      {!isTeacher && r.status === 'pending' && (
                        <Button size="sm" variant="outline" className="w-full text-red-600 border-red-200 mt-2 hover:bg-red-50" onClick={() => handleStudentAction(r.id, 'cancel')}>
                          Cancel Request
                        </Button>
                      )}

                      {!isTeacher && r.status === 'accepted' && (
                        <Button size="sm" variant="outline" className="w-full border-purple-200 text-purple-700 mt-2 hover:bg-purple-50" onClick={() => handleStudentAction(r.id, 'complete')}>
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ProposeTimeModal request={proposeFor} open={!!proposeFor} onClose={() => setProposeFor(null)} />
    </PageContainer>
  );
}
