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
import { Badge } from '@/components/ui/badge';
import {
  User, Star, Clock, DollarSign, BookOpen, CheckCircle, XCircle,
  Video, MessageSquare, Calendar, Plus, Edit, Trash2, Users, GraduationCap,
  Search, ChevronDown, ExternalLink
} from 'lucide-react';
import { useForm } from 'react-hook-form';

const GRADE_LEVELS = [
  { value: 'grade_1', label: 'الصف الأول', labelEn: 'Grade 1' },
  { value: 'grade_2', label: 'الصف الثاني', labelEn: 'Grade 2' },
  { value: 'grade_3', label: 'الصف الثالث', labelEn: 'Grade 3' },
  { value: 'grade_4', label: 'الصف الرابع', labelEn: 'Grade 4' },
  { value: 'grade_5', label: 'الصف الخامس', labelEn: 'Grade 5' },
  { value: 'grade_6', label: 'الصف السادس', labelEn: 'Grade 6' },
  { value: 'grade_7', label: 'الصف السابع', labelEn: 'Grade 7' },
  { value: 'grade_8', label: 'الصف الثامن', labelEn: 'Grade 8' },
  { value: 'grade_9', label: 'الصف التاسع', labelEn: 'Grade 9' },
  { value: 'grade_10', label: 'الصف العاشر', labelEn: 'Grade 10' },
  { value: 'grade_11', label: 'الصف الحادي عشر', labelEn: 'Grade 11' },
  { value: 'grade_12', label: 'الصف الثاني عشر', labelEn: 'Grade 12' },
  { value: 'university', label: 'الجامعة', labelEn: 'University' },
  { value: 'all', label: 'جميع المستويات', labelEn: 'All Levels' },
];

function gradeLabelAr(value: string) {
  return GRADE_LEVELS.find(g => g.value === value)?.label || value;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    accepted: { label: 'مقبول', className: 'bg-green-100 text-green-700 border-green-200' },
    declined: { label: 'مرفوض', className: 'bg-red-100 text-red-700 border-red-200' },
    cancelled: { label: 'ملغي', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const b = map[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${b.className}`}>{b.label}</span>;
}

// ─── TEACHER: Create / Edit Listing Form ─────────────────────────────────────
function ListingForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: initial || {
      title: '', titleAr: '', subject: '', subjectAr: '',
      gradeLevel: 'grade_10', gradeLevelAr: '',
      description: '', descriptionAr: '',
      hourlyRate: '', currency: 'LYD',
      maxStudents: 1, sessionDurationMinutes: 60,
      availableDays: 'السبت - الخميس', availableTimeFrom: '16:00', availableTimeTo: '22:00',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">عنوان الإعلان (عربي) *</label>
          <Input {...register('titleAr', { required: true })} placeholder="مثال: دروس خصوصية في الرياضيات" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Title (English)</label>
          <Input {...register('title', { required: true })} placeholder="e.g. Private Math Tutoring" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">المادة (عربي) *</label>
          <Input {...register('subjectAr', { required: true })} placeholder="مثال: الرياضيات" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Subject *</label>
          <Input {...register('subject', { required: true })} placeholder="e.g. Mathematics" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">المرحلة الدراسية</label>
          <select {...register('gradeLevel')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">السعر بالساعة (LYD) *</label>
          <Input {...register('hourlyRate', { required: true })} type="number" min="0" step="0.5" placeholder="50" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">مدة الجلسة (دقيقة)</label>
          <Input {...register('sessionDurationMinutes')} type="number" min="30" step="15" placeholder="60" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">أقصى عدد طلاب</label>
          <Input {...register('maxStudents')} type="number" min="1" max="10" placeholder="1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">وقت البداية</label>
          <Input {...register('availableTimeFrom')} type="time" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">وقت النهاية</label>
          <Input {...register('availableTimeTo')} type="time" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">الأيام المتاحة</label>
        <Input {...register('availableDays')} placeholder="مثال: السبت - الخميس" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">وصف الإعلان (عربي)</label>
        <textarea {...register('descriptionAr')} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" placeholder="صف خدماتك، خبرتك، أسلوب التدريس..." />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Description (English)</label>
        <textarea {...register('description')} rows={2} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" placeholder="Describe your tutoring approach..." />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
          {initial ? 'حفظ التعديلات' : 'نشر الإعلان'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}

// ─── STUDENT: Apply Form ─────────────────────────────────────────────────────
function ApplyForm({ listing, onApply, onCancel }: { listing: any; onApply: (d: any) => void; onCancel: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { message: '', preferredAt: '' } });
  return (
    <form onSubmit={handleSubmit(onApply)} className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="font-semibold text-lg">{listing.titleAr}</div>
        <div className="text-sm text-muted-foreground mt-1">المعلم: {listing.teacherNameAr || listing.teacherName}</div>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-primary" />{listing.hourlyRate} {listing.currency}/ساعة</span>
          <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-primary" />{gradeLabelAr(listing.gradeLevel)}</span>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">الوقت المفضل للجلسة</label>
        <Input {...register('preferredAt')} type="datetime-local" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">رسالة للمعلم (اختياري)</label>
        <textarea {...register('message')} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" placeholder="اكتب رسالة تعريفية أو أي تفاصيل إضافية..." />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">تقديم الطلب</Button>
        <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, onApply, onEdit, onDelete, onViewApps, isTeacher }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-right line-clamp-1">{listing.titleAr}</h3>
          <p className="text-sm text-muted-foreground text-right">{listing.title}</p>
        </div>
        {!isTeacher && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>

      {!isTeacher && (
        <p className="text-sm font-medium text-primary mb-3 text-right">{listing.teacherNameAr || listing.teacherName}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3 justify-end">
        <Badge variant="outline" className="text-xs gap-1"><BookOpen className="w-3 h-3" />{listing.subjectAr}</Badge>
        <Badge variant="outline" className="text-xs gap-1"><GraduationCap className="w-3 h-3" />{gradeLabelAr(listing.gradeLevel)}</Badge>
        <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />{listing.sessionDurationMinutes} دقيقة</Badge>
      </div>

      {listing.descriptionAr && (
        <p className="text-sm text-muted-foreground text-right line-clamp-2 mb-3">{listing.descriptionAr}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {listing.availableTimeFrom && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{listing.availableTimeFrom} - {listing.availableTimeTo}</span>}
          {listing.totalApplications > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{listing.totalApplications} طالب</span>}
        </div>
        <div className="flex items-center gap-1 font-bold text-primary text-base">
          <DollarSign className="w-4 h-4" />{listing.hourlyRate} {listing.currency}/ساعة
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {isTeacher ? (
          <>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onViewApps(listing)}>
              <Users className="w-3.5 h-3.5" />الطلبات ({listing.totalApplications})
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 px-3" onClick={() => onEdit(listing)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 px-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(listing.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <Button className="flex-1 bg-primary hover:bg-primary/90 gap-2" onClick={() => onApply(listing)}>
            <MessageSquare className="w-4 h-4" />تقديم طلب
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tutoring() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const api = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [createOpen, setCreateOpen] = useState(false);
  const [editListing, setEditListing] = useState<any>(null);
  const [applyListing, setApplyListing] = useState<any>(null);
  const [appsFor, setAppsFor] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['/api/tutoring-listings'],
    queryFn: () => api.get('/tutoring-listings'),
  });

  const { data: myListings = [], isLoading: myListingsLoading } = useQuery({
    queryKey: ['/api/tutoring-listings/my'],
    queryFn: () => api.get('/tutoring-listings/my'),
    enabled: isTeacher,
  });

  const { data: myApplications = [], isLoading: myAppsLoading } = useQuery({
    queryKey: ['/api/tutoring-listings/my-applications/list'],
    queryFn: () => api.get('/tutoring-listings/my-applications/list'),
    enabled: !!user && !isTeacher,
  });

  const { data: listingApps = [] } = useQuery({
    queryKey: ['/api/tutoring-listings', appsFor?.id, 'applications'],
    queryFn: () => api.get(`/tutoring-listings/${appsFor?.id}/applications`),
    enabled: !!appsFor,
  });

  const createListing = async (data: any) => {
    if (!isAuthenticated) { setLocation('/login'); return; }
    try {
      const gradeLevelData = GRADE_LEVELS.find(g => g.value === data.gradeLevel);
      await api.post('/tutoring-listings', { ...data, gradeLevelAr: gradeLevelData?.label || data.gradeLevel });
      toast({ title: 'تم نشر الإعلان بنجاح!', description: 'يمكن للطلاب الآن التقديم على إعلانك.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings'] });
      setCreateOpen(false);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const updateListing = async (data: any) => {
    try {
      const gradeLevelData = GRADE_LEVELS.find(g => g.value === data.gradeLevel);
      await api.put(`/tutoring-listings/${editListing.id}`, { ...data, gradeLevelAr: gradeLevelData?.label || data.gradeLevel });
      toast({ title: 'تم تحديث الإعلان!' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings/my'] });
      setEditListing(null);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const deleteListing = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await api.del(`/tutoring-listings/${id}`);
      toast({ title: 'تم حذف الإعلان.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings/my'] });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const applyToListing = async (data: any) => {
    if (!isAuthenticated) { setLocation('/login'); return; }
    try {
      await api.post(`/tutoring-listings/${applyListing.id}/apply`, data);
      toast({ title: 'تم تقديم طلبك!', description: 'سيتواصل معك المعلم قريباً.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings/my-applications/list'] });
      setApplyListing(null);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const acceptApplication = async (appId: number) => {
    try {
      const result = await api.post(`/tutoring-listings/applications/${appId}/accept`, {});
      toast({ title: 'تم قبول الطلب!', description: 'تم إنشاء رابط الجلسة.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings', appsFor?.id, 'applications'] });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const declineApplication = async (appId: number) => {
    try {
      await api.post(`/tutoring-listings/applications/${appId}/decline`, {});
      toast({ title: 'تم رفض الطلب.' });
      queryClient.invalidateQueries({ queryKey: ['/api/tutoring-listings', appsFor?.id, 'applications'] });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const filteredListings = (listings as any[]).filter((l: any) =>
    !search ||
    l.subjectAr?.includes(search) ||
    l.titleAr?.includes(search) ||
    l.teacherNameAr?.includes(search) ||
    l.subject?.toLowerCase().includes(search.toLowerCase()) ||
    l.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {isTeacher ? 'إدارة إعلانات التدريس الخاص' : 'الدروس الخصوصية'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isTeacher
              ? 'أنشئ إعلانات الدروس الخصوصية، حدد أسعارك وجداولك واستقبل طلبات الطلاب.'
              : 'تصفّح إعلانات المعلمين المتاحين وتقدّم للحصول على درس خصوصي.'}
          </p>
          {isTeacher && (
            <Button onClick={() => setCreateOpen(true)} className="mt-6 gap-2 bg-primary hover:bg-primary/90 px-6 py-2.5">
              <Plus className="w-4 h-4" />نشر إعلان جديد
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={isTeacher ? 'my-listings' : 'browse'}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <TabsList>
              {isTeacher ? (
                <>
                  <TabsTrigger value="my-listings">إعلاناتي</TabsTrigger>
                  <TabsTrigger value="browse">جميع الإعلانات</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="browse">تصفّح المعلمين</TabsTrigger>
                  <TabsTrigger value="my-applications">طلباتي</TabsTrigger>
                </>
              )}
            </TabsList>

            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن مادة أو معلم..."
                className="pr-9 w-56"
              />
            </div>
          </div>

          {/* Teacher: My Listings */}
          <TabsContent value="my-listings">
            {myListingsLoading ? (
              <div className="p-20 text-center text-muted-foreground">جار التحميل...</div>
            ) : (myListings as any[]).length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">لم تنشر أي إعلان بعد.</p>
                <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />انشر إعلانك الأول
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(myListings as any[]).map((l: any) => (
                  <ListingCard key={l.id} listing={l} isTeacher onEdit={setEditListing} onDelete={deleteListing} onViewApps={setAppsFor} onApply={() => {}} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Browse all listings (students + teachers) */}
          <TabsContent value="browse">
            {listingsLoading ? (
              <div className="p-20 text-center text-muted-foreground">جار التحميل...</div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">لا توجد إعلانات متاحة حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((l: any) => (
                  <ListingCard key={l.id} listing={l} isTeacher={false} onApply={setApplyListing} onEdit={() => {}} onDelete={() => {}} onViewApps={() => {}} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Student: My Applications */}
          <TabsContent value="my-applications">
            {myAppsLoading ? (
              <div className="p-20 text-center text-muted-foreground">جار التحميل...</div>
            ) : (myApplications as any[]).length === 0 ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">لم تتقدم لأي درس بعد.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(myApplications as any[]).map((app: any) => (
                  <div key={app.id} className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(app.status)}
                          <span className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleDateString('ar-LY')}</span>
                        </div>
                        <h3 className="font-bold text-right">{app.listing?.titleAr}</h3>
                        <p className="text-sm text-muted-foreground text-right">المعلم: {app.teacherNameAr}</p>
                        {app.listing && (
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground justify-end">
                            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{app.listing.hourlyRate} LYD/ساعة</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{app.listing.subjectAr}</span>
                          </div>
                        )}
                        {app.message && <p className="text-sm text-muted-foreground mt-2 text-right bg-muted/50 rounded-lg p-2">رسالتك: {app.message}</p>}
                        {app.teacherNote && <p className="text-sm text-primary mt-2 text-right bg-primary/5 rounded-lg p-2 border border-primary/20">ملاحظة المعلم: {app.teacherNote}</p>}
                      </div>
                      {app.status === 'accepted' && app.meetingUrl && (
                        <a href={app.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700">
                            <Video className="w-3.5 h-3.5" />انضم للجلسة
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Listing Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>نشر إعلان درس خصوصي جديد</DialogTitle>
          </DialogHeader>
          <ListingForm onSave={createListing} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Listing Dialog */}
      <Dialog open={!!editListing} onOpenChange={v => !v && setEditListing(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تعديل الإعلان</DialogTitle>
          </DialogHeader>
          {editListing && <ListingForm initial={editListing} onSave={updateListing} onCancel={() => setEditListing(null)} />}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={!!applyListing} onOpenChange={v => !v && setApplyListing(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>التقديم على الدرس الخصوصي</DialogTitle>
          </DialogHeader>
          {applyListing && <ApplyForm listing={applyListing} onApply={applyToListing} onCancel={() => setApplyListing(null)} />}
        </DialogContent>
      </Dialog>

      {/* Applications Dialog (Teacher) */}
      <Dialog open={!!appsFor} onOpenChange={v => !v && setAppsFor(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>طلبات الطلاب — {appsFor?.titleAr}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(listingApps as any[]).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد طلبات بعد.</p>
            ) : (
              (listingApps as any[]).map((app: any) => (
                <div key={app.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(app.status)}
                        <span className="font-medium text-sm">{app.studentNameAr || app.studentName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{app.studentEmail}</p>
                      {app.message && <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded p-2">{app.message}</p>}
                      {app.preferredAt && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />الوقت المفضل: {new Date(app.preferredAt).toLocaleString('ar-LY')}</p>}
                      {app.meetingUrl && (
                        <a href={app.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline">
                          <ExternalLink className="w-3 h-3" />رابط الجلسة
                        </a>
                      )}
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => acceptApplication(app.id)}>
                          <CheckCircle className="w-3.5 h-3.5" />قبول
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => declineApplication(app.id)}>
                          <XCircle className="w-3.5 h-3.5" />رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
