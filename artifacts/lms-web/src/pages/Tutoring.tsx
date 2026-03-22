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
import {
  BookOpen, Clock, DollarSign, Users, Star, Plus, Filter,
  Send, CheckCircle, XCircle, MessageSquare, Calendar, Search, Edit2, Trash2, Eye
} from 'lucide-react';
import { useForm } from 'react-hook-form';

const GRADE_LEVELS = [
  { value: '', label: 'All Levels / جميع المستويات' },
  { value: 'grade_10', label: 'Grade 10 / الصف العاشر' },
  { value: 'grade_11', label: 'Grade 11 / الصف الحادي عشر' },
  { value: 'grade_12', label: 'Grade 12 / الصف الثاني عشر' },
  { value: 'university', label: 'University / الجامعة' },
  { value: 'all', label: 'All Levels / جميع المستويات' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending / قيد الانتظار',
  accepted: 'Accepted / مقبول',
  declined: 'Declined / مرفوض',
  cancelled: 'Cancelled / ملغي',
};

function gradeLevelLabel(value: string) {
  return GRADE_LEVELS.find(g => g.value === value)?.label || value || '—';
}

// ─── Listing Card (for students browsing) ──────────────────────────────────────
function ListingCard({ listing, onApply }: { listing: any; onApply: (l: any) => void }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const [, setLocation] = useLocation();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all hover:border-primary/30 group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
            {listing.titleAr || listing.title}
          </h3>
          {listing.title && listing.titleAr && (
            <p className="text-sm text-muted-foreground">{listing.title}</p>
          )}
          <p className="text-sm text-primary font-semibold mt-1">{listing.teacherNameAr || listing.teacherName}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-primary">{listing.hourlyRate}</div>
          <div className="text-xs text-muted-foreground">LYD/hour</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="gap-1">
          <BookOpen className="w-3 h-3" />{listing.subjectAr || listing.subject}
        </Badge>
        {listing.gradeLevel && (
          <Badge variant="secondary" className="gap-1">
            <Star className="w-3 h-3" />{gradeLevelLabel(listing.gradeLevel)}
          </Badge>
        )}
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />{listing.sessionDurationMinutes} min/session
        </Badge>
      </div>

      {listing.descriptionAr && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{listing.descriptionAr}</p>
      )}

      {listing.availableTimeFrom && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="w-4 h-4" />
          <span>Available: {listing.availableTimeFrom} – {listing.availableTimeTo}</span>
          {listing.availableDays && <span>· {listing.availableDays}</span>}
        </div>
      )}

      {!isTeacher && (
        <Button
          className="w-full gap-2"
          onClick={() => {
            if (!user) { setLocation('/login'); return; }
            onApply(listing);
          }}
        >
          <Send className="w-4 h-4" /> Apply for Session / تقديم طلب
        </Button>
      )}
    </div>
  );
}

// ─── Teacher Listing Card ────────────────────────────────────────────────────
function TeacherListingCard({ listing, onViewApps, onDelete }: { listing: any; onViewApps: (l: any) => void; onDelete: (l: any) => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-base">{listing.titleAr || listing.title}</h3>
          <p className="text-sm text-muted-foreground">{listing.subjectAr || listing.subject}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-primary">{listing.hourlyRate} LYD/hr</div>
          <Badge className={listing.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700'}>
            {listing.status}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        <Badge variant="secondary">{gradeLevelLabel(listing.gradeLevel)}</Badge>
        <Badge variant="secondary">{listing.sessionDurationMinutes} min</Badge>
        {listing.maxStudents && <Badge variant="secondary">Max {listing.maxStudents} students</Badge>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => onViewApps(listing)}>
          <Users className="w-3.5 h-3.5" /> Applications ({listing.totalApplications || 0})
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(listing)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Apply Modal ─────────────────────────────────────────────────────────────
function ApplyModal({ listing, open, onClose }: { listing: any; open: boolean; onClose: () => void }) {
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!listing) return;
    setLoading(true);
    try {
      await api.post(`/tutoring-listings/${listing.id}/apply`, { message });
      toast({ title: 'Application submitted!', description: 'The teacher will contact you shortly.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings/my-applications'] });
      onClose();
      setMessage('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Apply for Tutoring Session</DialogTitle>
        </DialogHeader>
        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <div className="font-bold mb-1">{listing.titleAr}</div>
          <div className="text-sm text-muted-foreground">{listing.subjectAr} · {gradeLevelLabel(listing.gradeLevel)}</div>
          <div className="text-primary font-bold mt-1">{listing.hourlyRate} LYD/hour</div>
          <div className="text-sm text-muted-foreground">Teacher: {listing.teacherNameAr || listing.teacherName}</div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Message to Teacher (optional)</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Write a brief intro or any questions..."
            className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <Button className="flex-1 gap-2" onClick={handleApply} disabled={loading}>
            <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Applications Modal (Teacher) ─────────────────────────────────────────────
function ApplicationsModal({ listing, open, onClose }: { listing: any; open: boolean; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: apps = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/tutoring-listings/${listing?.id}/apps`],
    queryFn: () => api.get(`/tutoring-listings/${listing?.id}/applications`),
    enabled: !!listing,
  });

  const handleDecision = async (appId: number, action: 'accept' | 'decline', note?: string) => {
    try {
      await api.post(`/tutoring-listings/applications/${appId}/${action}`, { teacherNote: note });
      toast({ title: action === 'accept' ? 'Application accepted!' : 'Application declined.' });
      queryClient.invalidateQueries({ queryKey: [`/api/tutoring-listings/${listing?.id}/apps`] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (!listing) return null;
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Applications — {listing.titleAr}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading applications...</div>
        ) : (apps as any[]).length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No applications yet</div>
        ) : (
          <div className="space-y-4">
            {(apps as any[]).map((app: any) => (
              <div key={app.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{app.studentNameAr || app.studentName}</div>
                    <div className="text-xs text-muted-foreground">{app.studentEmail}</div>
                  </div>
                  <Badge className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                </div>
                {app.message && <p className="text-sm text-muted-foreground mb-3 bg-muted/50 p-2 rounded-lg">{app.message}</p>}
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleDecision(app.id, 'accept')}>
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDecision(app.id, 'decline')}>
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </div>
                )}
                {app.meetingUrl && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-1">Meeting Link:</p>
                    <a href={app.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">{app.meetingUrl}</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Listing Modal (Teacher) ──────────────────────────────────────────
function CreateListingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      titleAr: '', title: '', subjectAr: '', subject: '',
      gradeLevel: '', hourlyRate: '',
      availableDays: '', availableTimeFrom: '', availableTimeTo: '',
      sessionDurationMinutes: '60', maxStudents: '1',
      descriptionAr: '', description: '',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await api.post('/tutoring-listings', {
        ...data,
        hourlyRate: parseFloat(data.hourlyRate),
        sessionDurationMinutes: parseInt(data.sessionDurationMinutes),
        maxStudents: parseInt(data.maxStudents),
      });
      toast({ title: 'Listing created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings'] });
      onClose();
      reset();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tutoring Listing / إنشاء إعلان خصوصي</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Title (Arabic) *</label>
              <Input {...register('titleAr', { required: true })} placeholder="عنوان الإعلان بالعربية" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Title (English)</label>
              <Input {...register('title')} placeholder="Listing title in English" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Subject (Arabic) *</label>
              <Input {...register('subjectAr', { required: true })} placeholder="المادة الدراسية" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Subject (English)</label>
              <Input {...register('subject')} placeholder="Subject name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Grade Level</label>
              <select {...register('gradeLevel')} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm">
                {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Hourly Rate (LYD) *</label>
              <Input {...register('hourlyRate', { required: true })} type="number" min="0" placeholder="50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Session Duration (min)</label>
              <Input {...register('sessionDurationMinutes')} type="number" placeholder="60" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Max Students</label>
              <Input {...register('maxStudents')} type="number" min="1" placeholder="1" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Available Days</label>
              <Input {...register('availableDays')} placeholder="Mon,Tue,Wed" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Time From</label>
              <Input {...register('availableTimeFrom')} placeholder="16:00" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Time To</label>
              <Input {...register('availableTimeTo')} placeholder="21:00" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Description (Arabic)</label>
            <textarea {...register('descriptionAr')} rows={3} placeholder="وصف الدرس والمحتوى..." className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              <Plus className="w-4 h-4" /> {isSubmitting ? 'Creating...' : 'Create Listing'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { onClose(); reset(); }}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tutoring() {
  const { user } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [applyFor, setApplyFor] = useState<any>(null);
  const [appsFor, setAppsFor] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // All active listings
  const { data: listings = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/tutoring-listings'],
    queryFn: () => api.get('/tutoring-listings'),
  });

  // Teacher's own listings
  const { data: myListings = [] } = useQuery<any[]>({
    queryKey: ['/api/tutoring-listings/my'],
    queryFn: () => api.get('/tutoring-listings/my'),
    enabled: isTeacher,
  });

  // Student's applications
  const { data: myApps = [] } = useQuery<any[]>({
    queryKey: ['/api/tutoring-listings/my-applications'],
    queryFn: () => api.get('/tutoring-listings/my-applications/list'),
    enabled: !!user && !isTeacher,
  });

  const handleDelete = async (listing: any) => {
    if (!confirm(`Delete listing "${listing.titleAr}"?`)) return;
    try {
      await api.del(`/tutoring-listings/${listing.id}`);
      toast({ title: 'Listing deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filteredListings = (listings as any[]).filter((l: any) => {
    const matchSearch = !search || (l.titleAr || '').includes(search) || (l.subjectAr || '').includes(search) || (l.teacherNameAr || '').includes(search) || (l.title || '').toLowerCase().includes(search.toLowerCase());
    const matchGrade = !gradeFilter || l.gradeLevel === gradeFilter;
    return matchSearch && matchGrade;
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-1">Private Tutoring</p>
              <h1 className="text-3xl font-display font-bold">
                {isTeacher ? 'Manage Your Tutoring Listings' : 'Find a Private Tutor'}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                {isTeacher
                  ? 'Post listings, set your rate and availability. Students will apply and you review.'
                  : 'Browse available teachers, check their subjects, rates and availability, then apply.'}
              </p>
            </div>
            {isTeacher && (
              <Button className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" /> New Listing
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b border-border">
          <button
            onClick={() => setTab('browse')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${tab === 'browse' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {isTeacher ? '📋 All Listings' : '🔍 Browse Tutors'}
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${tab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {isTeacher ? '📌 My Listings' : '📩 My Applications'}
          </button>
        </div>

        {/* Browse / Filter */}
        {tab === 'browse' && (
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subjects, teachers..."
                className="pl-9"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-input bg-background text-sm min-w-[160px]"
            >
              {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        )}

        {/* Browse listing cards */}
        {tab === 'browse' && (
          isLoading ? (
            <div className="p-20 text-center text-muted-foreground">Loading listings...</div>
          ) : filteredListings.length === 0 ? (
            <div className="p-20 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No listings found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} onApply={setApplyFor} />
              ))}
            </div>
          )
        )}

        {/* My listings (teacher) */}
        {tab === 'mine' && isTeacher && (
          (myListings as any[]).length === 0 ? (
            <div className="p-20 text-center">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No listings yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Create your first tutoring listing to start accepting students.</p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Listing</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(myListings as any[]).map((l: any) => (
                <TeacherListingCard key={l.id} listing={l} onViewApps={setAppsFor} onDelete={handleDelete} />
              ))}
            </div>
          )
        )}

        {/* My applications (student) */}
        {tab === 'mine' && !isTeacher && (
          (myApps as any[]).length === 0 ? (
            <div className="p-20 text-center">
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
              <p className="text-muted-foreground text-sm">Browse listings and apply to a tutor to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(myApps as any[]).map((app: any) => (
                <div key={app.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold">{app.listing?.titleAr || '—'}</h3>
                      <p className="text-sm text-primary">{app.teacherNameAr || app.teacherName}</p>
                    </div>
                    <Badge className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                  </div>
                  {app.message && (
                    <p className="text-sm text-muted-foreground mb-2 bg-muted/50 p-2 rounded-lg">
                      <MessageSquare className="inline w-3.5 h-3.5 mr-1" />{app.message}
                    </p>
                  )}
                  {app.teacherNote && (
                    <div className="text-sm text-primary bg-primary/10 p-2 rounded-lg">
                      <strong>Teacher Note:</strong> {app.teacherNote}
                    </div>
                  )}
                  {app.meetingUrl && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">🎥 Meeting Link:</p>
                      <a href={app.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">{app.meetingUrl}</a>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <ApplyModal listing={applyFor} open={!!applyFor} onClose={() => setApplyFor(null)} />
      <ApplicationsModal listing={appsFor} open={!!appsFor} onClose={() => setAppsFor(null)} />
      <CreateListingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageContainer>
  );
}
