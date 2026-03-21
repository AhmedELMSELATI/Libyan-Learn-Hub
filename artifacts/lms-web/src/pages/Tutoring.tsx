import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, Star, Clock, DollarSign, BookOpen, CheckCircle, XCircle,
  Video, MessageSquare, Calendar, ExternalLink, BadgeCheck
} from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Tutoring() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [proposeTimeFor, setProposeTimeFor] = useState<number | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subject: '', topic: '', preferredAt: '', durationMinutes: 60, message: '' }
  });

  const { data: tutors, isLoading: tutorsLoading } = useQuery({
    queryKey: ['/api/tutoring/tutors'],
    queryFn: () => api.get('/tutoring/tutors'),
  });

  const { data: myRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/tutoring/requests'],
    queryFn: () => api.get('/tutoring/requests'),
    enabled: !!user,
  });

  const handleRequest = async (data: any) => {
    if (!isAuthenticated) { setLocation('/login'); return; }
    try {
      await api.post('/tutoring/requests', {
        teacherId: selectedTutor.id,
        ...data,
        durationMinutes: parseInt(data.durationMinutes),
        hourlyRate: selectedTutor.tutoringHourlyRate,
      });
      toast({ title: 'Request sent!', description: 'The teacher will respond soon.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
      setRequestOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      const data = await api.post(`/tutoring/requests/${requestId}/accept`, {});
      toast({ title: 'Request accepted!', description: 'Meeting link generated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDecline = async (requestId: number) => {
    try {
      await api.post(`/tutoring/requests/${requestId}/decline`, {});
      toast({ title: 'Request declined.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleProposeTime = async () => {
    if (!proposeTimeFor || !proposedDate) return;
    try {
      await api.post(`/tutoring/requests/${proposeTimeFor}/propose-time`, { proposedAt: proposedDate });
      toast({ title: 'New time proposed to student.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
      setProposeTimeFor(null);
      setProposedDate("");
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAcceptProposed = async (requestId: number) => {
    try {
      const data = await api.post(`/tutoring/requests/${requestId}/accept-proposed-time`, {});
      toast({ title: 'New time accepted!', description: 'Meeting link generated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancel = async (requestId: number) => {
    try {
      await api.post(`/tutoring/requests/${requestId}/cancel`, {});
      toast({ title: 'Request cancelled.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring/requests'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-700',
    rescheduled_by_teacher: 'bg-amber-100 text-amber-800 border border-amber-200',
  };

  const totalAmount = (durationMinutes: number, rate: number) => ((durationMinutes / 60) * rate).toFixed(2);

  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-violet-600/10 via-primary/5 to-transparent py-12 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
              <User className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Private Tutoring</h1>
              <p className="text-muted-foreground">1-on-1 sessions with expert teachers — completely private, focused learning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs defaultValue="tutors">
          <TabsList className="mb-8">
            <TabsTrigger value="tutors">Browse Tutors</TabsTrigger>
            {user && <TabsTrigger value="requests">My Requests {myRequests?.length > 0 ? `(${myRequests.length})` : ''}</TabsTrigger>}
          </TabsList>

          <TabsContent value="tutors">
            {tutorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
              </div>
            ) : (tutors || []).length === 0 ? (
              <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-bold">No tutors available yet</h3>
                <p className="text-muted-foreground mt-2">Teachers can enable private tutoring from their dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(tutors || []).map((tutor: any) => (
                  <div key={tutor.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                        {tutor.fullName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base truncate">{tutor.fullName}</h3>
                          {tutor.isVerified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                        </div>
                        {tutor.expertise && <p className="text-sm text-muted-foreground truncate">{tutor.expertise}</p>}
                      </div>
                    </div>
                    {tutor.bio && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tutor.bio}</p>}
                    {tutor.tutoringSubjects && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tutor.tutoringSubjects.split(',').map((s: string) => (
                          <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                      <div>
                        <div className="text-lg font-bold text-primary">{tutor.tutoringHourlyRate} LYD</div>
                        <div className="text-xs text-muted-foreground">per hour</div>
                      </div>
                      <Button
                        className="bg-primary hover:bg-primary/90 gap-2"
                        onClick={() => { setSelectedTutor(tutor); setRequestOpen(true); }}
                      >
                        <Calendar className="w-4 h-4" /> Book Session
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {user && (
            <TabsContent value="requests">
              {requestsLoading ? (
                <div className="space-y-4">
                  {[1,2].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border" />)}
                </div>
              ) : (myRequests || []).length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-xl font-bold">No tutoring requests yet</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {(myRequests || []).map((req: any) => (
                    <div key={req.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                            <span className="text-sm font-bold">{req.subject}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{req.topic}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              {user.role === 'student' ? <><User className="w-3 h-3" /> Teacher: {req.teacherName}</> : <><User className="w-3 h-3" /> Student: {req.studentName}</>}
                            </span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {req.durationMinutes} min</span>
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {req.totalAmount} LYD</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(req.preferredAt).toLocaleString()}</span>
                          </div>
                          
                          {req.status === 'rescheduled_by_teacher' && req.proposedAt && (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                              <strong className="text-amber-800 block mb-1">Teacher proposed a new time:</strong>
                              <span className="font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4 text-amber-600" /> {new Date(req.proposedAt).toLocaleString()}</span>
                            </div>
                          )}

                          {req.meetingUrl && req.status === 'accepted' && (
                            <a
                              href={req.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-3 text-sm text-primary font-semibold hover:underline"
                            >
                              <Video className="w-4 h-4" /> Join Meeting <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                          {user.role === 'teacher' && req.status === 'pending' && (
                            <>
                              <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAccept(req.id)}>
                                <CheckCircle className="w-3.5 h-3.5" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100" onClick={() => setProposeTimeFor(req.id)}>
                                <Calendar className="w-3.5 h-3.5" /> Propose Different Time
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30" onClick={() => handleDecline(req.id)}>
                                <XCircle className="w-3.5 h-3.5" /> Decline
                              </Button>
                            </>
                          )}
                          {user.role === 'student' && req.status === 'rescheduled_by_teacher' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => handleAcceptProposed(req.id)}>
                                <CheckCircle className="w-3.5 h-3.5" /> Accept New Time
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 gap-1" onClick={() => handleCancel(req.id)}>
                                <XCircle className="w-3.5 h-3.5" /> Decline & Cancel
                              </Button>
                            </>
                          )}
                          {user.role === 'student' && req.status === 'pending' && (
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleCancel(req.id)}>
                              Cancel Request
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Request Modal */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book a Session with {selectedTutor?.fullName}</DialogTitle>
          </DialogHeader>
          {selectedTutor && (
            <form onSubmit={handleSubmit(handleRequest)} className="space-y-4 mt-2">
              <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-medium">Rate: {selectedTutor.tutoringHourlyRate} LYD/hour</span>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Subject *</label>
                <Input {...register('subject', { required: true })} placeholder="e.g. Mathematics, Physics..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Topic / What you need help with *</label>
                <Input {...register('topic', { required: true })} placeholder="Describe what you need help with..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Preferred Date & Time *</label>
                  <Input {...register('preferredAt', { required: true })} type="datetime-local" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Duration</label>
                  <select {...register('durationMinutes')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value={30}>30 minutes — {((30/60)*selectedTutor.tutoringHourlyRate).toFixed(2)} LYD</option>
                    <option value={60}>60 minutes — {selectedTutor.tutoringHourlyRate.toFixed(2)} LYD</option>
                    <option value={90}>90 minutes — {((90/60)*selectedTutor.tutoringHourlyRate).toFixed(2)} LYD</option>
                    <option value={120}>120 minutes — {((120/60)*selectedTutor.tutoringHourlyRate).toFixed(2)} LYD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message to Teacher (optional)</label>
                <Input {...register('message')} placeholder="Anything specific you want the teacher to prepare?" />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Send Request
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Teacher Propose Time Modal */}
      <Dialog open={!!proposeTimeFor} onOpenChange={(o) => !o && setProposeTimeFor(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Propose Alternative Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Suggest a different date and time for this session. The student will be able to accept or decline your proposal.</p>
            <div>
              <label className="text-sm font-medium mb-1 block">New Date & Time</label>
              <Input type="datetime-local" value={proposedDate} onChange={e => setProposedDate(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
               <Button variant="outline" className="flex-1" onClick={() => setProposeTimeFor(null)}>Cancel</Button>
               <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={!proposedDate} onClick={handleProposeTime}>Send Proposal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
