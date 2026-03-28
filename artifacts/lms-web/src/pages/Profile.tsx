import React, { useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { useLocation, Link } from 'wouter';
import { User, BookOpen, Clock, Trophy, Mail, Settings, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const api = useApi();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/progress/summary'),
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return <PageContainer><div className="p-20 text-center">Loading profile...</div></PageContainer>;
  }

  if (!user) return null;

  return (
    <PageContainer>
      {/* Profile Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-5xl font-display font-bold shadow-xl border-4 border-background shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 text-center md:text-start">
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">{user.fullName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
                <span className="flex items-center gap-1.5 capitalize"><User className="w-4 h-4" /> {user.role}</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button variant="outline" className="rounded-xl"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <div className="bg-muted/30 border border-border rounded-2xl p-4 min-w-[140px] flex-1 text-center">
                <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{summary?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Enrolled</div>
              </div>
              <div className="bg-muted/30 border border-border rounded-2xl p-4 min-w-[140px] flex-1 text-center">
                <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {summary?.filter((s: any) => s.overallProgress >= 100).length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-display font-bold mb-8">My Learning Progress</h2>
        
        {(!summary || summary.length === 0) ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No course progress yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Explore our catalog and start learning today.</p>
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {summary.map((course: any) => (
              <div key={course.courseId} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-full md:w-48 aspect-video rounded-xl bg-muted overflow-hidden shrink-0 relative">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <PlayCircle className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="text-xl font-bold mb-1 truncate">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Instructor: {course.teacherName}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Overall Progress</span>
                        <span className="text-primary">{Math.round(course.overallProgress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-500 ease-out" 
                          style={{ width: `${Math.min(course.overallProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    <Link href={`/courses/${course.courseId}/learn`}>
                      <Button className="w-full md:w-auto" variant={course.overallProgress >= 100 ? "outline" : "default"}>
                        {course.overallProgress >= 100 ? 'Review Course' : course.overallProgress > 0 ? 'Continue' : 'Start'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
