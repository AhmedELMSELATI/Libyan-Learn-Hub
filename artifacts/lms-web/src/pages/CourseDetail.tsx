import React from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { PageContainer } from '@/components/layout/PageContainer';
import { useGetCourse, useEnrollCourse } from '@workspace/api-client-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle, FileText, CheckCircle2, ShieldAlert, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSEO } from '@/hooks/useSEO';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { useApi } from '@/hooks/useApi';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export default function CourseDetail() {
  const [, params] = useRoute('/courses/:id');
  const courseId = parseInt(params?.id || '0');
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const api = useApi();
  const [reportCourse, setReportCourse] = useState(false);
  const { register: registerReport, handleSubmit: handleReportSubmit, reset: resetReport } = useForm();

  const { data: course, isLoading, refetch } = useGetCourse(courseId, { query: { enabled: !!courseId } });
  const { mutate: enroll, isPending: enrolling } = useEnrollCourse({
    mutation: {
      onSuccess: () => {
        toast({ title: "Successfully enrolled!", description: "You can now start learning." });
        refetch();
      },
      onError: (err) => {
        toast({ title: "Failed to enroll", description: err.message, variant: "destructive" });
      }
    }
  });

  const submitReport = async (data: any) => {
    if (!course) return;
    try {
      await api.post('/reports', {
        type: 'course',
        targetId: course.id,
        reportedUserId: course.teacherId, // assuming populated or we can omit it if strictly course 
        reason: data.reason,
        description: data.description,
      });
      toast({ title: 'Report submitted. Thank you for your feedback.' });
      setReportCourse(false);
      resetReport();
    } catch (err: any) {
      toast({ title: 'Error submitting report', description: err.message, variant: 'destructive' });
    }
  };

  const title = course ? (language === 'ar' ? course.titleAr : course.title) : 'Loading Course...';
  const description = course ? (language === 'ar' ? course.descriptionAr : course.description) : 'Libyan Learn Hub Course';

  useSEO({
    title,
    description,
    schema: course ? {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": title,
      "description": description,
      "provider": {
        "@type": "Organization",
        "name": "Libyan Learn Hub",
        "sameAs": "https://libyan-learn-hub.com"
      },
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "online",
        "instructor": {
          "@type": "Person",
          "name": course.teacherName || 'Instructor'
        }
      },
      "offers": {
        "@type": "Offer",
        "category": "Paid",
        "price": course.price,
        "priceCurrency": course.currency || "LYD"
      }
    } : undefined
  });

  if (isLoading) return <PageContainer><div className="p-20 text-center">Loading...</div></PageContainer>;
  if (!course) return <PageContainer><div className="p-20 text-center">Course not found</div></PageContainer>;

  const handleEnroll = () => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }
    enroll({ courseId });
  };

  return (
    <PageContainer>
      {/* Header Banner */}
      <div className="bg-foreground text-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium">{course.category?.name}</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium capitalize">{course.level}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight">
              {language === 'ar' ? course.titleAr : course.title}
            </h1>
            <p className="text-lg text-background/80 mb-8 max-w-2xl leading-relaxed">
              {language === 'ar' ? course.descriptionAr : course.description}
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-background/70">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-lg">
                  {course.teacherName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs opacity-70">Instructor</div>
                  <div className="font-semibold text-background">{course.teacherName}</div>
                </div>
              </div>
              <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
              <div>
                <div className="text-xs opacity-70">Enrolled</div>
                <div className="font-semibold text-background">{course.enrollmentCount} students</div>
              </div>
              <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
              <div>
                <div className="text-xs opacity-70">Last Updated</div>
                <div className="font-semibold text-background">{new Date(course.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Floating Action Card */}
          <div className="w-full lg:w-96 shrink-0 lg:-mb-32 z-10">
            <div className="bg-card text-foreground rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <PlayCircle className="w-16 h-16 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="p-8">
                <div className="text-3xl font-bold mb-6">
                  {course.price === 0 ? 'Free' : `${course.price} LYD`}
                </div>
                
                {course.isEnrolled ? (
                  <Link href={`/courses/${course.id}/learn`}>
                    <Button className="w-full h-14 text-lg rounded-xl mb-4 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Go to Lessons
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={handleEnroll} 
                    disabled={enrolling}
                    className="w-full h-14 text-lg rounded-xl mb-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  >
                    {enrolling ? 'Processing...' : 'Enroll Now'}
                  </Button>
                )}
                
                <p className="text-center text-xs text-muted-foreground mb-4">30-Day Money-Back Guarantee</p>

                <div className="flex justify-center mb-6">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive gap-1" onClick={() => setReportCourse(true)}>
                    <Flag className="w-3 h-3" /> Report Course
                  </Button>
                </div>
                
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-primary" /> {course.lessonCount} video lessons
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" /> {Math.round(course.totalDuration / 60)} hours total length
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-secondary" /> Protected content (no downloads)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 max-w-3xl">
          <h2 className="text-2xl font-display font-bold mb-6">Course Curriculum</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {course.lessons.map((lesson, idx) => (
              <div key={lesson.id} className={`p-4 sm:p-5 flex items-start gap-4 ${idx !== 0 ? 'border-t border-border' : ''} hover:bg-muted/50 transition-colors`}>
                <div className="mt-1">
                  {lesson.type === 'video' ? <PlayCircle className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-secondary" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {idx + 1}. {language === 'ar' ? lesson.titleAr : lesson.title}
                  </h4>
                  {lesson.isFree && !course.isEnrolled && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">Free Preview</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {lesson.duration} min
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-display font-bold mb-6">About the Instructor</h2>
            {course.teacher && (
              <div className="flex items-start gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                 <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl shrink-0 overflow-hidden">
                  {course.teacher.avatarUrl ? <img src={course.teacher.avatarUrl} alt="Teacher" className="w-full h-full object-cover"/> : course.teacherName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground mb-1">{course.teacher.fullName}</h3>
                  <p className="text-primary font-medium mb-4">{course.teacher.expertise || 'Expert Instructor'}</p>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {course.teacher.bio || 'This instructor has not provided a biography yet. They are a valued member of the EduLibya community teaching high-quality courses.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Course Modal */}
      <Dialog open={reportCourse} onOpenChange={setReportCourse}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReportSubmit(submitReport)} className="space-y-4 mt-4">
            <div className="text-sm mb-4">You are reporting the course <span className="font-bold">{language === 'ar' ? course?.titleAr : course?.title}</span>.</div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason *</label>
              <select {...registerReport('reason', { required: true })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Select a reason</option>
                <option value="inappropriate_behavior">Inappropriate Content</option>
                <option value="spam">Spam / Low Quality</option>
                <option value="copyright">Copyright Violation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (optional)</label>
              <Textarea {...registerReport('description')} placeholder="Please provide more details..." rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setReportCourse(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" className="flex-1">Submit Report</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
