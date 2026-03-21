import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link, useParams } from 'wouter';
import {
  Plus, Edit, Trash2, ArrowLeft, Video, FileText,
  GripVertical, Eye, EyeOff, Clock, Save, ChevronUp, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';

export default function ManageCourse() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const api = useApi();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { setLocation('/login'); return; }
    if (user && user.role !== 'teacher') { setLocation('/dashboard'); return; }
  }, [isAuthenticated, authLoading, user]);

  const loadData = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [courseData, lessonsData] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/lessons`),
      ]);
      setCourse(courseData);
      setLessons(lessonsData.sort((a: any, b: any) => a.order - b.order));
    } catch (err: any) {
      toast({ title: 'Error loading course', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && courseId) loadData();
  }, [user, courseId]);

  const lessonForm = useForm({
    defaultValues: {
      title: '', titleAr: '', videoUrl: '', content: '', contentAr: '',
      duration: 0, order: 0, isFree: false, type: 'video'
    }
  });

  const handleAddLesson = async (data: any) => {
    try {
      await api.post(`/courses/${courseId}/lessons`, {
        ...data,
        duration: parseInt(data.duration) || 0,
        order: lessons.length,
        isFree: data.isFree === true || data.isFree === 'true',
      });
      toast({ title: 'Lesson added!' });
      setIsAddOpen(false);
      lessonForm.reset();
      loadData();
    } catch (err: any) {
      toast({ title: 'Error adding lesson', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateLesson = async (data: any) => {
    if (!editingLesson) return;
    try {
      await api.put(`/courses/${courseId}/lessons/${editingLesson.id}`, {
        ...data,
        duration: parseInt(data.duration) || 0,
        isFree: data.isFree === true || data.isFree === 'true',
      });
      toast({ title: 'Lesson updated!' });
      setEditingLesson(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error updating lesson', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      await api.del(`/courses/${courseId}/lessons/${lessonId}`);
      toast({ title: 'Lesson deleted' });
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error deleting lesson', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleFree = async (lesson: any) => {
    try {
      await api.put(`/courses/${courseId}/lessons/${lesson.id}`, {
        title: lesson.title, titleAr: lesson.titleAr,
        videoUrl: lesson.videoUrl, content: lesson.content, contentAr: lesson.contentAr,
        duration: lesson.duration, order: lesson.order, isFree: !lesson.isFree,
      });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleMoveLesson = async (lesson: any, direction: 'up' | 'down') => {
    const idx = lessons.findIndex(l => l.id === lesson.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === lessons.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const other = lessons[swapIdx];

    try {
      await Promise.all([
        api.put(`/courses/${courseId}/lessons/${lesson.id}`, { ...lesson, order: other.order }),
        api.put(`/courses/${courseId}/lessons/${other.id}`, { ...other, order: lesson.order }),
      ]);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error reordering', description: err.message, variant: 'destructive' });
    }
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    lessonForm.reset({
      title: lesson.title, titleAr: lesson.titleAr,
      videoUrl: lesson.videoUrl || '', content: lesson.content || '',
      contentAr: lesson.contentAr || '', duration: lesson.duration,
      order: lesson.order, isFree: lesson.isFree, type: lesson.type || 'video',
    });
  };

  if (authLoading || loading) {
    return <PageContainer><div className="p-20 text-center">Loading...</div></PageContainer>;
  }
  if (!user || user.role !== 'teacher') return null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const LessonForm = ({ onSubmit, submitLabel }: { onSubmit: (d: any) => void, submitLabel: string }) => (
    <form onSubmit={lessonForm.handleSubmit(onSubmit)} className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Lesson Title (English) *</label>
          <Input {...lessonForm.register('title', { required: true })} placeholder="e.g. Introduction to Algebra" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">عنوان الدرس (عربي) *</label>
          <Input {...lessonForm.register('titleAr', { required: true })} dir="rtl" placeholder="مقدمة في الجبر" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Lesson Type</label>
        <select {...lessonForm.register('type')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="video">🎬 Video</option>
          <option value="text">📄 Text / Article</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">
          Video URL {lessonForm.watch('type') === 'video' && <span className="text-primary">*</span>}
        </label>
        <Input
          {...lessonForm.register('videoUrl')}
          type="url"
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
        />
        <p className="text-xs text-muted-foreground mt-1">Supports YouTube, Vimeo, or any direct video URL.</p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Content / Notes (English)</label>
        <Textarea {...lessonForm.register('content')} placeholder="Additional notes, text content..." rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">المحتوى / الملاحظات (عربي)</label>
        <Textarea {...lessonForm.register('contentAr')} dir="rtl" placeholder="ملاحظات إضافية..." rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">Duration (seconds)</label>
          <Input type="number" min="0" {...lessonForm.register('duration', { valueAsNumber: true })} placeholder="e.g. 600 = 10 minutes" />
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...lessonForm.register('isFree')} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium">Free Preview</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">Students can watch this without enrolling</p>
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">{submitLabel}</Button>
    </form>
  );

  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

  return (
    <PageContainer>
      <div className="bg-primary/5 py-8 border-b border-primary/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/teacher/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">{course?.title}</h1>
              <p className="text-muted-foreground text-sm mt-1" dir="rtl">{course?.titleAr}</p>
              <div className="flex gap-3 mt-3 flex-wrap">
                <Badge variant="outline" className="gap-1"><Video className="w-3 h-3" /> {lessons.length} lessons</Badge>
                <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> {formatDuration(totalDuration)}</Badge>
                <Badge className={course?.isPublished ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}>
                  {course?.isPublished ? '✓ Published' : '⏸ Draft'}
                </Badge>
                <Badge variant="secondary">
                  {parseFloat(course?.price) === 0 ? 'Free' : `${parseFloat(course?.price)} LYD`}
                </Badge>
              </div>
            </div>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
              onClick={() => {
                setIsAddOpen(true);
                lessonForm.reset({ title: '', titleAr: '', videoUrl: '', content: '', contentAr: '', duration: 0, order: lessons.length, isFree: false, type: 'video' });
              }}
            >
              <Plus className="w-4 h-4" /> Add Lesson
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {lessons.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No lessons yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Add your first lesson to start building your course content.</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Lesson
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => handleMoveLesson(lesson, 'up')} disabled={idx === 0}>
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground text-center font-mono">{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => handleMoveLesson(lesson, 'down')} disabled={idx === lessons.length - 1}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>

                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {lesson.type === 'video' ? (
                    <Video className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{lesson.title}</h3>
                    {lesson.isFree && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Free Preview</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{lesson.titleAr}</p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {lesson.videoUrl && (
                      <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Video className="w-3 h-3" /> View Video
                      </a>
                    )}
                    {lesson.duration > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(lesson.duration)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                    title={lesson.isFree ? "Remove free preview" : "Mark as free preview"}
                    onClick={() => handleToggleFree(lesson)}
                  >
                    {lesson.isFree ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => openEditLesson(lesson)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingId(lesson.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Lesson Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Add New Lesson</DialogTitle>
          </DialogHeader>
          <LessonForm onSubmit={handleAddLesson} submitLabel="Add Lesson" />
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Modal */}
      <Dialog open={!!editingLesson} onOpenChange={(o) => !o && setEditingLesson(null)}>
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Edit Lesson</DialogTitle>
          </DialogHeader>
          <LessonForm onSubmit={handleUpdateLesson} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Lesson?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">This lesson will be permanently removed from the course.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deletingId && handleDeleteLesson(deletingId)}>
              Delete Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
