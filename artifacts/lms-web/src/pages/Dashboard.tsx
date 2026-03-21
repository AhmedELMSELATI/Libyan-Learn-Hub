import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMyEnrollments, useGetLiveSessions } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { BookOpen, PlayCircle, Trophy, Calendar, Radio, Clock, DollarSign, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/useApi';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const api = useApi();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation('/login');
    if (user?.role === 'teacher') setLocation('/teacher/dashboard');
  }, [isAuthenticated, authLoading, user, setLocation]);

  const { data: enrollments, isLoading } = useGetMyEnrollments({
    query: { enabled: !!user && user.role === 'student' }
  });

  const { data: allSessions } = useGetLiveSessions({
    query: { enabled: !!user }
  });

  const upcomingSessions = allSessions?.filter((s: any) =>
    new Date(s.scheduledAt) >= new Date() && s.status !== 'ended' && s.status !== 'cancelled'
  ).slice(0, 4) || [];

  const handleEnrollFree = async (courseId: number) => {
    try {
      await api.post(`/courses/${courseId}/enroll`, {});
      window.location.reload();
    } catch {}
  };

  const handleJoinSession = async (sessionId: number) => {
    try {
      const data = await api.post(`/live-sessions/${sessionId}/join`, {});
      if (data.meetingUrl) window.open(data.meetingUrl, '_blank');
    } catch {}
  };

  if (authLoading || isLoading) {
    return <PageContainer><div className="p-20 text-center">Loading dashboard...</div></PageContainer>;
  }
  if (!user) return null;

  const inProgress = enrollments?.filter((e: any) => e.progress > 0 && e.progress < 100).length || 0;
  const completed = enrollments?.filter((e: any) => e.progress >= 100).length || 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-10 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-display font-bold shadow-lg">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Student Dashboard</p>
              <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, {user.fullName}!</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: BookOpen, label: 'Enrolled', value: enrollments?.length || 0, color: 'text-primary', bg: 'bg-primary/10' },
              { icon: PlayCircle, label: 'In Progress', value: inProgress, color: 'text-blue-600', bg: 'bg-blue-100' },
              { icon: Trophy, label: 'Completed', value: completed, color: 'text-green-600', bg: 'bg-green-100' },
              { icon: Radio, label: 'Live Sessions', value: upcomingSessions.length, color: 'text-red-500', bg: 'bg-red-100' },
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* My Courses */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-bold">My Courses</h2>
            <Link href="/courses">
              <Button variant="outline" size="sm">Browse More Courses →</Button>
            </Link>
          </div>

          {!enrollments || enrollments.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold">No courses yet</h3>
              <p className="text-muted-foreground mt-2 mb-6">Explore our catalog and start learning today.</p>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {enrollment.course?.thumbnailUrl ? (
                      <img src={enrollment.course.thumbnailUrl} alt={enrollment.course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <PlayCircle className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                    {enrollment.progress >= 100 && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-base mb-1 line-clamp-2">{enrollment.course?.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{enrollment.course?.teacherName}</p>
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(enrollment.progress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-4">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                        />
                      </div>
                      <Link href={`/courses/${enrollment.courseId}/learn`}>
                        <Button className="w-full" variant={enrollment.progress > 0 ? 'default' : 'outline'}>
                          {enrollment.progress >= 100 ? 'Review Course' : enrollment.progress > 0 ? 'Continue Learning →' : 'Start Course →'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Live Sessions */}
        {upcomingSessions.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold">Upcoming Live Sessions</h2>
              <Link href="/live-sessions">
                <Button variant="outline" size="sm">View All Sessions →</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSessions.map((session: any) => (
                <div key={session.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">{session.teacherName}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ml-3 ${
                      session.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status === 'live' ? '🔴 LIVE NOW' : '📅 Scheduled'}
                    </span>
                  </div>
                  {session.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(session.scheduledAt).toLocaleDateString('en-LY', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(session.scheduledAt).toLocaleTimeString('en-LY', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {parseFloat(session.price) === 0 ? 'Free' : `${parseFloat(session.price)} LYD`}
                    </span>
                  </div>
                  <Button
                    className="mt-auto gap-2 bg-primary hover:bg-primary/90"
                    size="sm"
                    onClick={() => handleJoinSession(session.id)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {session.status === 'live' ? 'Join Live Session' : 'Get Session Link'}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Browse Live Sessions if none enrolled */}
        {upcomingSessions.length === 0 && (
          <section className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
            <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <h3 className="font-bold text-lg">No upcoming live sessions</h3>
            <p className="text-muted-foreground text-sm mt-2 mb-4">Check the live sessions page for scheduled classes from teachers.</p>
            <Link href="/live-sessions">
              <Button variant="outline">View Live Sessions →</Button>
            </Link>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
