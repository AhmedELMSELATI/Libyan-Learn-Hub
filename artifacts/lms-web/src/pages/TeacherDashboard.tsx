import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import {
  useGetTeacherCourses, useCreateCourse, useGetCategories,
  useGetLiveSessions
} from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import {
  Plus, Edit, Users, Video, BarChart, BookOpen, Calendar,
  Globe, Lock, Trash2, Eye, Radio, Clock, DollarSign, GraduationCap,
  Settings, ChevronRight, PlayCircle, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TeacherDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const api = useApi();
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation('/login');
    if (user && user.role !== 'teacher') setLocation('/dashboard');
  }, [isAuthenticated, authLoading, user, setLocation]);

  const { data: courses, isLoading } = useGetTeacherCourses({
    query: { enabled: !!user && user.role === 'teacher' }
  });
  const { data: categories } = useGetCategories();
  const { data: liveSessions } = useGetLiveSessions({
    query: { enabled: !!user && user.role === 'teacher' }
  });

  const mySessions = liveSessions?.filter((s: any) => s.teacherId === user?.id) || [];

  const courseForm = useForm({
    defaultValues: {
      title: '', titleAr: '', description: '', descriptionAr: '',
      price: 0, categoryId: '', level: 'beginner', language: 'ar',
      thumbnailUrl: '', isPublished: false
    }
  });

  const sessionForm = useForm({
    defaultValues: {
      title: '', titleAr: '', description: '',
      scheduledAt: '', durationMinutes: 60,
      maxParticipants: 100, meetingUrl: '', price: 0,
      courseId: ''
    }
  });

  const handleCreateCourse = async (data: any) => {
    try {
      await api.post('/courses', {
        ...data,
        price: parseFloat(data.price) || 0,
        categoryId: parseInt(data.categoryId),
      });
      toast({ title: 'Course created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/courses'] });
      setIsCreateCourseOpen(false);
      courseForm.reset();
    } catch (err: any) {
      toast({ title: 'Error creating course', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateCourse = async (data: any) => {
    if (!editingCourse) return;
    try {
      await api.put(`/courses/${editingCourse.id}`, {
        ...data,
        price: parseFloat(data.price) || 0,
        categoryId: parseInt(data.categoryId),
      });
      toast({ title: 'Course updated!' });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/courses'] });
      setEditingCourse(null);
    } catch (err: any) {
      toast({ title: 'Error updating course', description: err.message, variant: 'destructive' });
    }
  };

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
    try {
      await api.del(`/courses/${courseId}`);
      toast({ title: 'Course deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/courses'] });
      setDeletingCourseId(null);
    } catch (err: any) {
      toast({ title: 'Error deleting course', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateSession = async (data: any) => {
    try {
      await api.post('/live-sessions', {
        ...data,
        durationMinutes: parseInt(data.durationMinutes),
        maxParticipants: parseInt(data.maxParticipants),
        price: parseFloat(data.price) || 0,
        courseId: data.courseId ? parseInt(data.courseId) : undefined,
      });
      toast({ title: 'Live session scheduled!' });
      queryClient.invalidateQueries({ queryKey: ['/api/live-sessions'] });
      setIsCreateSessionOpen(false);
      sessionForm.reset();
    } catch (err: any) {
      toast({ title: 'Error scheduling session', description: err.message, variant: 'destructive' });
    }
  };

  const openEditCourse = (course: any) => {
    setEditingCourse(course);
    courseForm.reset({
      title: course.title, titleAr: course.titleAr,
      description: course.description, descriptionAr: course.descriptionAr,
      price: course.price, categoryId: String(course.categoryId),
      level: course.level, language: course.language,
      thumbnailUrl: course.thumbnailUrl || '',
      isPublished: course.isPublished
    });
  };

  if (authLoading || isLoading) {
    return <PageContainer><div className="p-20 text-center">Loading...</div></PageContainer>;
  }
  if (!user || user.role !== 'teacher') return null;

  const totalStudents = courses?.reduce((sum: number, c: any) => sum + (c.enrollmentCount || 0), 0) || 0;
  const totalRevenue = courses?.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0) || 0;
  const publishedCount = courses?.filter((c: any) => c.isPublished).length || 0;

  const CourseForm = ({ onSubmit, submitLabel }: { onSubmit: (d: any) => void, submitLabel: string }) => (
    <form onSubmit={courseForm.handleSubmit(onSubmit)} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Title (English) *</label>
          <Input {...courseForm.register('title', { required: true })} placeholder="e.g. Mathematics Grade 12" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">العنوان (عربي) *</label>
          <Input {...courseForm.register('titleAr', { required: true })} dir="rtl" placeholder="مثال: رياضيات الصف الثاني عشر" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Description (English) *</label>
        <Textarea {...courseForm.register('description', { required: true })} placeholder="Describe your course..." rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">الوصف (عربي) *</label>
        <Textarea {...courseForm.register('descriptionAr', { required: true })} dir="rtl" placeholder="اوصف دورتك..." rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Thumbnail Image URL</label>
        <Input {...courseForm.register('thumbnailUrl')} placeholder="https://..." type="url" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Category *</label>
          <select
            {...courseForm.register('categoryId', { required: true })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Select category</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Price (LYD)</label>
          <Input type="number" min="0" step="0.5" {...courseForm.register('price', { valueAsNumber: true })} placeholder="0 = Free" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Level</label>
          <select {...courseForm.register('level')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Language</label>
          <select {...courseForm.register('language')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="ar">Arabic</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">{submitLabel}</Button>
    </form>
  );

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-10 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-display font-bold shadow-lg">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Teacher Portal</p>
                <h1 className="text-3xl font-display font-bold text-foreground">{user.fullName}</h1>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                    <Plus className="w-4 h-4" /> New Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display">Create New Course</DialogTitle>
                  </DialogHeader>
                  <CourseForm onSubmit={handleCreateCourse} submitLabel="Create Course" />
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                    <Radio className="w-4 h-4" /> Schedule Live Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[580px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display">Schedule Live Session</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={sessionForm.handleSubmit(handleCreateSession)} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Session Title (EN) *</label>
                        <Input {...sessionForm.register('title', { required: true })} placeholder="e.g. Live Q&A — Chapter 5" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">العنوان (AR) *</label>
                        <Input {...sessionForm.register('titleAr', { required: true })} dir="rtl" placeholder="مراجعة مباشرة" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea {...sessionForm.register('description')} placeholder="What will you cover in this session?" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Date & Time *</label>
                        <Input type="datetime-local" {...sessionForm.register('scheduledAt', { required: true })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Duration (minutes)</label>
                        <Input type="number" min="15" max="360" {...sessionForm.register('durationMinutes', { valueAsNumber: true })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Max Participants</label>
                        <Input type="number" min="1" {...sessionForm.register('maxParticipants', { valueAsNumber: true })} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Price (LYD, 0 = Free)</label>
                        <Input type="number" min="0" step="0.5" {...sessionForm.register('price', { valueAsNumber: true })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Meeting URL (Zoom / Jitsi / Google Meet)</label>
                      <Input type="url" {...sessionForm.register('meetingUrl')} placeholder="https://zoom.us/j/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Link to Course (optional)</label>
                      <select {...sessionForm.register('courseId')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <option value="">No course (standalone session)</option>
                        {courses?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Schedule Session</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: BookOpen, label: 'Total Courses', value: courses?.length || 0, color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Globe, label: 'Published', value: publishedCount, color: 'text-green-600', bg: 'bg-green-100' },
              { icon: Users, label: 'Total Students', value: totalStudents, color: 'text-blue-600', bg: 'bg-blue-100' },
              { icon: DollarSign, label: 'Revenue (LYD)', value: totalRevenue.toFixed(0), color: 'text-amber-600', bg: 'bg-amber-100' },
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs defaultValue="courses">
          <TabsList className="mb-8 bg-muted/60">
            <TabsTrigger value="courses" className="gap-2"><BookOpen className="w-4 h-4" /> My Courses</TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2"><Radio className="w-4 h-4" /> Live Sessions</TabsTrigger>
            <TabsTrigger value="students" className="gap-2"><GraduationCap className="w-4 h-4" /> Students</TabsTrigger>
          </TabsList>

          {/* COURSES TAB */}
          <TabsContent value="courses">
            {!courses || courses.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold">No courses yet</h3>
                <p className="text-muted-foreground mt-2 mb-6">Create your first course to start teaching students.</p>
                <Button onClick={() => setIsCreateCourseOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create First Course
                </Button>
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
                      <div className="absolute top-3 left-3 flex gap-2">
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => openEditCourse(course)}
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </Button>
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
                            onClick={() => setDeletingCourseId(course.id)}
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
                <Button onClick={() => setIsCreateSessionOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Schedule Session
                </Button>
              </div>
              {mySessions.length === 0 ? (
                <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
                  <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-bold">No live sessions scheduled</h3>
                  <p className="text-muted-foreground mt-2 mb-6">Schedule a live session to interact with your students in real-time.</p>
                  <Button onClick={() => setIsCreateSessionOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Schedule First Session
                  </Button>
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
                      {session.meetingUrl && (
                        <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full gap-2 bg-red-500 hover:bg-red-600 text-white" size="sm">
                            <Radio className="w-3.5 h-3.5" /> Open Meeting Link
                          </Button>
                        </a>
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
        </Tabs>
      </div>

      {/* Edit Course Modal */}
      <Dialog open={!!editingCourse} onOpenChange={(o) => !o && setEditingCourse(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Edit Course</DialogTitle>
          </DialogHeader>
          <CourseForm onSubmit={handleUpdateCourse} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingCourseId} onOpenChange={(o) => !o && setDeletingCourseId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Course?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">This will permanently delete the course and all its lessons. Students will lose access.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingCourseId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deletingCourseId && handleDeleteCourse(deletingCourseId)}>
              Delete Course
            </Button>
          </div>
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
