import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useApi } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, BadgeCheck, Search, User, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function Teachers() {
  const api = useApi();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [tutorOnly, setTutorOnly] = useState(false);
  const [reportTeacher, setReportTeacher] = useState<any>(null);

  const { register: registerReport, handleSubmit: handleReportSubmit, reset: resetReport } = useForm();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: () => api.get('/teachers'),
  });

  const submitReport = async (data: any) => {
    try {
      await api.post('/reports', {
        type: 'teacher',
        reason: data.reason,
        description: data.description,
        reportedUserId: reportTeacher.id,
      });
      toast({ title: 'Report submitted. Thank you for your feedback.' });
      setReportTeacher(null);
      resetReport();
    } catch (err: any) {
      toast({ title: 'Error submitting report', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = (teachers || []).filter((t: any) =>
    (!search || t.fullName.toLowerCase().includes(search.toLowerCase()) || t.expertise?.toLowerCase().includes(search.toLowerCase())) &&
    (!tutorOnly || t.isTutoringEnabled)
  );

  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-12 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold mb-3">Our Teachers</h1>
          <p className="text-muted-foreground text-lg max-w-xl">Qualified Libyan educators ready to teach you</p>
          <div className="flex gap-3 mt-6 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or subject..."
                className="pl-9"
              />
            </div>
            <Button 
              variant={tutorOnly ? "default" : "outline"}
              onClick={() => setTutorOnly(!tutorOnly)}
              className={`gap-2 ${tutorOnly ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'border-violet-200 text-violet-700 hover:bg-violet-50'}`}
            >
              1-on-1 Tutors Only
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-xl font-bold">No teachers found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((teacher: any) => (
              <div key={teacher.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0 group hover:bg-primary/20 transition-colors cursor-pointer relative"
                       onClick={(e) => { e.stopPropagation(); setReportTeacher(teacher); }}
                       title="Report Teacher">
                    {teacher.fullName?.charAt(0)}
                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm border border-border">
                      <Flag className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-lg truncate">{teacher.fullName}</h3>
                      {teacher.isVerified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" title="Verified Teacher" />}
                      {teacher.isTutoringEnabled && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                          Tutoring Available
                        </span>
                      )}
                    </div>
                    {teacher.expertise && (
                      <p className="text-sm text-muted-foreground truncate">{teacher.expertise}</p>
                    )}
                  </div>
                </div>
                {teacher.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{teacher.bio}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    {teacher.courseCount || 0} courses
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {teacher.studentCount || 0} students
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/courses?teacher=${teacher.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                      <BookOpen className="w-3.5 h-3.5" /> View Courses
                    </Button>
                  </Link>
                  {teacher.isTutoringEnabled && (
                    <Link href="/tutoring" className="flex-1">
                      <Button size="sm" className="w-full gap-1 text-xs bg-primary hover:bg-primary/90">
                        Book 1-on-1
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Teacher Modal */}
      <Dialog open={!!reportTeacher} onOpenChange={(o) => !o && setReportTeacher(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Teacher</DialogTitle>
          </DialogHeader>
          {reportTeacher && (
            <form onSubmit={handleReportSubmit(submitReport)} className="space-y-4 mt-4">
              <div className="text-sm mb-4">You are reporting <span className="font-bold">{reportTeacher.fullName}</span>. Please select a reason below.</div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason *</label>
                <select {...registerReport('reason', { required: true })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">Select a reason</option>
                  <option value="inappropriate_behavior">Inappropriate Behavior</option>
                  <option value="spam">Spam / Advertising</option>
                  <option value="offensive">Offensive Content</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                <Textarea {...registerReport('description')} placeholder="Please provide more details..." rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setReportTeacher(null)}>Cancel</Button>
                <Button type="submit" variant="destructive" className="flex-1">Submit Report</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
