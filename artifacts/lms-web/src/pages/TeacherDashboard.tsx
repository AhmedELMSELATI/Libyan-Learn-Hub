import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import {
  useGetTeacherCourses, useGetCategories,
  useGetLiveSessions
} from '@workspace/api-client-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation } from 'wouter';
import {
  Plus, Edit, Users, Video, BookOpen, Calendar,
  Globe, Lock, Trash2, Eye, Radio, Clock, DollarSign, GraduationCap,
  PlayCircle, Star, TrendingUp, Megaphone, CheckCircle, XCircle, HardDrive, Trophy, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton, StatCardSkeleton, CourseCardSkeleton } from '@/components/ui/skeleton';

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const api = useApi();
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [sessionToCancel, setSessionToCancel] = React.useState<any>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [notifyStudents, setNotifyStudents] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("courses");

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation('/login');
    if (user && user.role !== 'teacher') setLocation('/dashboard');
  }, [isAuthenticated, authLoading, user, setLocation]);

  const { data: courses, isLoading } = useGetTeacherCourses({
    query: { queryKey: ['/api/teacher/courses'], enabled: !!user && user.role === 'teacher' }
  });
  const { data: categories } = useGetCategories();
  const { data: liveSessions } = useGetLiveSessions(undefined, {
    query: { queryKey: ['/api/live-sessions'], enabled: !!user && user.role === 'teacher' }
  });

  const mySessions = liveSessions?.filter((s: any) => s.teacherId === user?.id) || [];

  const handleTogglePublish = async (course: any) => {
    try {
      await api.put(`/courses/${course.id}`, {
        title: course.title, titleAr: course.titleAr,
        description: course.description, descriptionAr: course.descriptionAr,
        price: parseFloat(course.price), categoryId: course.categoryId,
        level: course.level, language: course.language,
        thumbnailUrl: course.thumbnailUrl,
        isPublished: !course.isPublished
      });
      toast({ title: course.isPublished ? 'Course unpublished' : 'Course published!' });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/courses'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Delete this course? This will permanently delete all its lessons. Students will lose access.')) return;
    try {
      await api.del(`/courses/${courseId}`);
      toast({ title: 'Course deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/courses'] });
    } catch (err: any) {
      toast({ title: 'Error deleting course', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteLiveSession = async (sessionId: number) => {
    if (!window.confirm('Delete this live session? This action cannot be undone.')) return;
    try {
      await api.del(`/live-sessions/${sessionId}`);
      toast({ title: 'Live session deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/live-sessions'] });
    } catch (err: any) {
      toast({ title: 'Error deleting session', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancelSession = async () => {
    if (!sessionToCancel) return;
    setIsCancelling(true);
    try {
      const isLive = sessionToCancel.status === 'live';
      const endpoint = isLive ? `/live-sessions/${sessionToCancel.id}/end` : `/live-sessions/${sessionToCancel.id}/cancel`;
      
      await api.post(endpoint, {
        reason: cancelReason,
        notifyStudents
      });
      toast({ title: isLive ? 'Session ended successfully' : 'Session cancelled successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/live-sessions'] });
      setCancelModalOpen(false);
      setSessionToCancel(null);
      setCancelReason('');
      setNotifyStudents(true);
    } catch (err: any) {
      toast({ title: 'Error processing request', description: err.message, variant: 'destructive' });
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancelModal = (session: any) => {
    setSessionToCancel(session);
    setCancelReason('');
    setNotifyStudents(true);
    setCancelModalOpen(true);
  };

  if (authLoading || isLoading) {
    return <PageContainer><div className="p-20 text-center">Loading...</div></PageContainer>;
  }
  if (!user || user.role !== 'teacher') return null;

  const totalStudents = courses?.reduce((sum: number, c: any) => sum + (c.enrollmentCount || 0), 0) || 0;
  const totalRevenue = courses?.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0) || 0;
  const publishedCount = courses?.filter((c: any) => c.isPublished).length || 0;


  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-10 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {authLoading ? (
               <div className="flex items-center gap-4">
                 <Skeleton className="w-16 h-16 rounded-2xl" />
                 <div className="space-y-2">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-8 w-48" />
                 </div>
               </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-display font-bold shadow-lg">
                  {user?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{t('teacher_dashboard.portal')}</p>
                  <h1 className="text-3xl font-display font-bold text-foreground">{user?.fullName}</h1>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap w-full sm:w-auto gap-3 mt-4 md:mt-0">
              <Link href="/teacher/sessions/new" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <Radio className="w-4 h-4" /> {t('teacher_dashboard.schedule_session')}
                </Button>
              </Link>
              <Link href="/teacher/courses/new" className="flex-1 sm:flex-none">
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4" /> {t('teacher_dashboard.new_course')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats row */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { icon: BookOpen, label: t('teacher_dashboard.total_courses'), value: courses?.length || 0, color: 'text-primary', bg: 'bg-primary/10' },
                { icon: Globe, label: t('teacher_dashboard.published'), value: publishedCount, color: 'text-green-600', bg: 'bg-green-100' },
                { icon: Users, label: t('teacher_dashboard.total_students'), value: totalStudents, color: 'text-blue-600', bg: 'bg-blue-100' },
                { icon: DollarSign, label: t('teacher_dashboard.revenue'), value: totalRevenue.toFixed(0), color: 'text-amber-600', bg: 'bg-amber-100' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Storage Usage Bar */}
          {user && (() => {
            const storageUsed = (user as any).storageUsed ?? 0;
            const storageLimit = (user as any).storageLimitBytes ?? (5 * 1024 ** 3);
            const isBonusUnlocked = (user as any).isBonusUnlocked ?? false;
            const tier = (user as any).tier ?? 'free';
            const bonusSize = tier === 'diamond' ? 150 * 1024 ** 3 : 10 * 1024 ** 3;
            const effectiveLimit = storageLimit + (isBonusUnlocked ? bonusSize : 0);
            const pct = Math.min((storageUsed / effectiveLimit) * 100, 100);
            const usedGB = (storageUsed / 1024 ** 3).toFixed(2);
            const totalGB = (effectiveLimit / 1024 ** 3).toFixed(0);
            const tierColor = tier === 'golden' ? 'text-yellow-500' : tier === 'bronze' ? 'text-amber-500' : 'text-primary';
            const tierIcon = tier === 'golden' ? <Trophy className="w-4 h-4" /> : tier === 'bronze' ? <Star className="w-4 h-4" /> : <Zap className="w-4 h-4" />;
            const barColor = pct > 90 ? 'bg-destructive' : pct > 70 ? 'bg-amber-500' : 'bg-primary';
            return (
              <div className="mt-6 bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-muted ${tierColor} flex-shrink-0`}>
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Storage</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${
                        tier === 'golden' ? 'bg-yellow-100 text-yellow-600' :
                        tier === 'bronze' ? 'bg-amber-100 text-amber-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {tierIcon} {tier}
                      </span>
                      {isBonusUnlocked && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                          🎁 +{tier === 'diamond' ? '150GB' : '10GB'} Bonus
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {pct > 80 && tier !== 'diamond' && (
                        <button 
                          onClick={() => setActiveTab('promote')}
                          className="text-xs text-primary font-bold hover:underline transition-colors"
                        >
                          Upgrade Plan
                        </button>
                      )}
                      <span className="text-xs text-muted-foreground font-medium">{usedGB} GB / {totalGB} GB</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  {pct > 90 && (
                    <p className="text-xs text-destructive font-medium mt-1">⚠️ Storage almost full — consider upgrading your plan.</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-muted/60 flex flex-wrap h-auto">
            <TabsTrigger value="courses" className="gap-2"><BookOpen className="w-4 h-4" /> {t('teacher_dashboard.my_courses')}</TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2"><Radio className="w-4 h-4" /> {t('teacher_dashboard.live_sessions')}</TabsTrigger>
            <TabsTrigger value="students" className="gap-2"><GraduationCap className="w-4 h-4" /> {t('teacher_dashboard.students')}</TabsTrigger>
            <TabsTrigger value="promote" className="gap-2"><Star className="w-4 h-4" /> {t('teacher_dashboard.promote')}</TabsTrigger>
          </TabsList>

          {/* COURSES TAB */}
          <TabsContent value="courses">
            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {[1, 2, 3].map(i => <CourseCardSkeleton key={i} />)}
               </div>
            ) : !courses || courses.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No courses yet</h3>
                <p className="text-muted-foreground mt-2 mb-6">Create your first course to start teaching students.</p>
                <Link href="/teacher/courses/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" /> Create First Course
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course: any) => (
                  <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <PlayCircle className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-3 start-3 flex gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${course.isPublished ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                          {course.isPublished ? '✓ Published' : '⏸ Draft'}
                        </span>
                        {parseFloat(course.price) === 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500 text-white">Free</span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-base mb-1 line-clamp-2">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{course.titleAr}</p>
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="text-sm font-bold">{course.lessonCount}</div>
                          <div className="text-xs text-muted-foreground">Lessons</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="text-sm font-bold">{course.enrollmentCount}</div>
                          <div className="text-xs text-muted-foreground">Students</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <div className="text-sm font-bold text-primary">{parseFloat(course.price) === 0 ? 'Free' : `${parseFloat(course.price)} LYD`}</div>
                          <div className="text-xs text-muted-foreground">Price</div>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        <Link href={`/teacher/courses/${course.id}/lessons`}>
                          <Button className="w-full gap-2 bg-primary hover:bg-primary/90" size="sm">
                            <Video className="w-3.5 h-3.5" /> Manage Lessons
                          </Button>
                        </Link>
                        <div className="grid grid-cols-3 gap-2">
                          <Link href={`/teacher/courses/${course.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-1 text-xs"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`gap-1 text-xs ${course.isPublished ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50' : 'text-green-600 border-green-300 hover:bg-green-50'}`}
                            onClick={() => handleTogglePublish(course)}
                          >
                            {course.isPublished ? <><Lock className="w-3 h-3" /> Unpublish</> : <><Globe className="w-3 h-3" /> Publish</>}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* LIVE SESSIONS TAB */}
          <TabsContent value="sessions">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-display font-bold">My Live Sessions</h2>
                <Link href="/teacher/sessions/new">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" /> Schedule Session
                  </Button>
                </Link>
              </div>
              {mySessions.length === 0 ? (
                <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                  <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-bold">No live sessions scheduled</h3>
                  <p className="text-muted-foreground mt-2 mb-6">Schedule a live session to interact with your students in real-time.</p>
                  <Link href="/teacher/sessions/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" /> Schedule First Session
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mySessions.map((session: any) => (
                    <div key={session.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-base">{session.title}</h3>
                          <p className="text-sm text-muted-foreground">{session.titleAr}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ml-3 ${
                          session.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'ended' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {session.status === 'live' ? '🔴 LIVE' : session.status}
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <Calendar className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                          <div className="text-xs font-medium">{new Date(session.scheduledAt).toLocaleDateString('ar-LY')}</div>
                          <div className="text-xs text-muted-foreground">{new Date(session.scheduledAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <Clock className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                          <div className="text-xs font-medium">{session.durationMinutes} min</div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <DollarSign className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                          <div className="text-xs font-medium">{parseFloat(session.price) === 0 ? 'Free' : `${parseFloat(session.price)} LYD`}</div>
                          <div className="text-xs text-muted-foreground">Price</div>
                        </div>
                      </div>
                      {session.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          <Link href={`/session/${session.id}`} className="flex-1">
                            <Button className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white" size="sm">
                              <Radio className="w-3.5 h-3.5" /> Join Session
                            </Button>
                          </Link>
                          {session.status === 'live' && (
                            <Button 
                              variant="outline" 
                              className="text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0 px-3" 
                              size="sm" 
                              onClick={() => openCancelModal(session)}
                              title="End Session"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                      {session.status === 'scheduled' && (
                        <Button 
                          variant="outline" 
                          className="w-full gap-2 mt-2 text-destructive border-destructive/30 hover:bg-destructive/5" 
                          size="sm" 
                          onClick={() => openCancelModal(session)}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Session
                        </Button>
                      )}
                      {(session.status === 'ended' || session.status === 'cancelled') && (
                        <Button 
                          variant="outline" 
                          className="w-full gap-2 mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5" 
                          size="sm" 
                          onClick={() => handleDeleteLiveSession(session.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Session
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent value="students">
            <TeacherStudentsList api={api} />
          </TabsContent>

          {/* PROMOTE TAB */}
          <TabsContent value="promote">
            <TeacherPromoteTab api={api} user={user} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sessionToCancel?.status === 'live' ? 'End Live Session' : 'Cancel Live Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to {sessionToCancel?.status === 'live' ? 'end' : 'cancel'} the session <strong>{sessionToCancel?.title}</strong>? 
              This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cancellation Reason (Optional)</label>
              <Textarea 
                placeholder="Briefly explain why this session is being cancelled..." 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="notify-students" 
                checked={notifyStudents}
                onCheckedChange={(checked) => setNotifyStudents(checked as boolean)}
              />
              <label htmlFor="notify-students" className="text-sm font-medium cursor-pointer">
                Notify enrolled students about this cancellation
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
              Keep Session
            </Button>
            <Button variant="destructive" onClick={handleCancelSession} disabled={isCancelling}>
              {isCancelling ? 'Processing...' : (sessionToCancel?.status === 'live' ? 'Confirm End Session' : 'Confirm Cancellation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function TeacherStudentsList({ api }: { api: any }) {
  const [students, setStudents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/teacher/students').then((data: any) => {
      setStudents(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10">Loading students...</div>;

  if (students.length === 0) {
    return (
      <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold">No students yet</h3>
        <p className="text-muted-foreground mt-2">Students will appear here once they enroll in your courses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-bold">My Students ({students.length})</h2>
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {s.studentName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{s.studentName}</div>
                        <div className="text-xs text-muted-foreground">{s.studentEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">{s.courseTitle}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(s.progress, 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round(s.progress)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {new Date(s.enrolledAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TeacherPromoteTab({ api, user }: { api: any; user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingPro, setLoadingPro] = React.useState(false);
  const [loadingAd, setLoadingAd] = React.useState(false);
  const [ads, setAds] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);

  const fetchData = React.useCallback(async () => {
    try {
      const [adsData, statsData] = await Promise.all([
        api.get('/advertisements/my').catch(() => []),
        api.get('/teacher-profile/analytics/summary').catch(() => [])
      ]);
      setAds(adsData || []);
      setStats(statsData || []);
    } catch (err) {}
  }, [api]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpgradePlan = async (targetTier: string) => {
    setLoadingPro(true);
    try {
      const data = await api.post('/payments/upgrade-plan', { targetTier });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Upgrade Failed", description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPro(false);
    }
  };

  const handleBuyAd = async (adType: 'banner' | 'featured_search') => {
    setLoadingAd(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7 day ad

      await api.post('/advertisements', {
        adType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        budgetPaid: '50' // Placeholder 50 LYD
      });
      toast({ title: "Ad Campaign Started!", description: "Your ad is now active for 7 days." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: 'destructive' });
    } finally {
      setLoadingAd(false);
    }
  };

  const profileViews = stats.find(s => s.eventType === 'profile_view')?.count || 0;

  return (
    <div className="space-y-8">
      {/* Overview Analytics */}
      <div>
        <h2 className="text-xl font-display font-bold mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{profileViews}</div>
              <div className="text-sm text-muted-foreground">Profile Views</div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold capitalize">{user.tier ?? 'free'}</div>
              <div className="text-sm text-muted-foreground">Plan Status</div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{ads.filter(a => a.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Active Ad Campaigns</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Upgrade Block */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border bg-gradient-to-br from-blue-50 to-transparent">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold font-display">Upgrade Plan</h3>
              <Badge className="bg-blue-500 hover:bg-blue-600 capitalize">{user.tier ?? 'free'} PLAN</Badge>
            </div>
            <p className="text-muted-foreground text-sm">Pay only the difference when you upgrade to a higher tier.</p>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="space-y-3 mb-6 flex-1">
              {['bronze', 'golden', 'diamond'].map((t) => {
                const currentTier = user.tier || 'free';
                const prices: Record<string, number> = { free: 0, bronze: 30, golden: 50, diamond: 100 };
                const currentPrice = prices[currentTier];
                const targetPrice = prices[t];
                const diff = targetPrice - currentPrice;
                const isCurrent = currentTier === t;
                const isLower = diff < 0;
                
                if (isLower) return null; // Don't show lower tiers
                
                return (
                  <div key={t} className="flex items-center justify-between p-3 border rounded-xl bg-muted/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${isCurrent ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className="capitalize font-medium">{t}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-sm font-bold text-green-600">Current</span>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleUpgradePlan(t)}
                        disabled={loadingPro}
                        className="bg-primary hover:bg-primary/90 text-xs"
                      >
                        Upgrade (Pay {diff} LYD)
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Upgrading instantly unlocks higher storage and streaming limits.
            </p>
          </div>
        </div>

        {/* Advertisements Block */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-bold font-display tracking-tight mb-2">Promote & Advertise</h3>
            <p className="text-muted-foreground text-sm">Boost your visibility to thousands of students across the platform.</p>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border rounded-xl p-4 flex flex-col items-center text-center">
                <Globe className="w-8 h-8 text-primary mb-2 opacity-80" />
                <h4 className="font-bold text-sm">Homepage Banner</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4 flex-1">Features your profile on the main landing page.</p>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleBuyAd('banner')} disabled={loadingAd}>
                  Buy (50 LYD / wk)
                </Button>
              </div>
              <div className="border border-border rounded-xl p-4 flex flex-col items-center text-center">
                <TrendingUp className="w-8 h-8 text-blue-500 mb-2 opacity-80" />
                <h4 className="font-bold text-sm">Search Featured</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-4 flex-1">Always appear at the top of category searches.</p>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleBuyAd('featured_search')} disabled={loadingAd}>
                  Buy (30 LYD / wk)
                </Button>
              </div>
            </div>

            {ads.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-sm mb-3">Your Campaigns</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {ads.map((ad, i) => (
                    <div key={i} className="flex justify-between items-center bg-muted/50 p-3 rounded-xl border border-border/50 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={ad.isActive ? "bg-green-100 text-green-700" : ""}>
                          {ad.isActive ? 'Active' : 'Ended'}
                        </Badge>
                        <span className="font-medium capitalize">{ad.adType.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Until {new Date(ad.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {sessionToCancel?.status === 'live' ? 'End Live Session' : 'Cancel Live Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {sessionToCancel?.status === 'live' ? (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to end this live session? All participants will be disconnected.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel <strong>{sessionToCancel?.title}</strong>? Students will no longer be able to join.
              </p>
            )}
            
            {sessionToCancel?.status !== 'live' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason (Optional)</label>
                  <Textarea
                    placeholder="Brief reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="notify" 
                    checked={notifyStudents}
                    onCheckedChange={(c) => setNotifyStudents(!!c)}
                  />
                  <label htmlFor="notify" className="text-sm font-medium leading-none cursor-pointer">
                    Notify registered students
                  </label>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Session
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSession}
              disabled={isCancelling}
            >
              {isCancelling ? 'Processing...' : (sessionToCancel?.status === 'live' ? 'End Session' : 'Cancel Session')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

