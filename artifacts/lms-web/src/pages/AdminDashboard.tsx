import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import {
  Users, BookOpen, CreditCard, CheckCircle, XCircle, Trash2,
  TrendingUp, GraduationCap, Presentation, Shield, Globe, Lock,
  DollarSign, BarChart2, Clock, Plus, RefreshCw, Eye, Radio,
  AlertCircle, BadgeCheck, Flag, Filter, PlusCircle, Tag, Edit2, ShieldAlert, School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const api = useApi();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation('/login');
    if (user && user.role !== 'admin') setLocation('/dashboard');
  }, [isAuthenticated, authLoading, user]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: () => api.get('/admin/stats'),
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000,
  });

  if (authLoading || statsLoading) {
    return <PageContainer><div className="p-20 text-center">Loading admin panel...</div></PageContainer>;
  }
  if (!user || user.role !== 'admin') return null;

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm uppercase tracking-widest font-medium">Admin Control Panel</p>
              <h1 className="text-2xl font-display font-bold">EduLibya Administration</h1>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
              { label: 'Teachers', value: stats?.totalTeachers || 0, icon: Presentation, color: 'text-purple-400' },
              { label: 'Students', value: stats?.totalStudents || 0, icon: GraduationCap, color: 'text-teal-400' },
              { label: 'Published Courses', value: `${stats?.publishedCourses || 0} / ${stats?.totalCourses || 0}`, icon: BookOpen, color: 'text-green-400' },
              { label: 'Enrollments', value: stats?.totalEnrollments || 0, icon: TrendingUp, color: 'text-amber-400' },
              { label: 'Revenue (LYD)', value: (stats?.totalRevenue || 0).toFixed(0), icon: DollarSign, color: 'text-emerald-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Finance Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: 'Platform Fees Earned', value: `${(stats?.platformFees || 0).toFixed(2)} LYD`, icon: BarChart2, color: 'text-green-400' },
              { label: 'Pending Payments', value: stats?.pendingPayments || 0, icon: Clock, color: 'text-yellow-400' },
              { label: 'Pending Payouts to Teachers', value: `${(stats?.pendingEarnings || 0).toFixed(2)} LYD`, icon: CreditCard, color: 'text-red-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <div>
                  <div className="text-sm font-bold text-white">{value}</div>
                  <div className="text-xs text-white/50">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users">
          <TabsList className="mb-8 bg-muted/60 flex-wrap h-auto gap-1">
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2"><Presentation className="w-4 h-4" /> Teachers</TabsTrigger>
            <TabsTrigger value="courses" className="gap-2"><BookOpen className="w-4 h-4" /> Courses</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><Tag className="w-4 h-4" /> Categories</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><CreditCard className="w-4 h-4" /> Payments</TabsTrigger>
            <TabsTrigger value="finance" className="gap-2"><DollarSign className="w-4 h-4" /> Finance</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2"><Flag className="w-4 h-4" /> Reports</TabsTrigger>
            <TabsTrigger value="dmca" className="gap-2"><ShieldAlert className="w-4 h-4" /> DMCA</TabsTrigger>
            <TabsTrigger value="academy" className="gap-2 text-amber-600"><School className="w-4 h-4 text-amber-500" /> Academy</TabsTrigger>
          </TabsList>

          <TabsContent value="users"><UsersTab api={api} queryClient={queryClient} toast={toast} stats={stats} /></TabsContent>
          <TabsContent value="teachers"><TeachersManagementTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="courses"><CoursesTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="categories"><CategoriesTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="payments"><PaymentsTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="finance"><FinanceTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="reports"><ReportsTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="dmca"><DMCAComplaintsTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
          <TabsContent value="academy"><AcademyAdminTab api={api} queryClient={queryClient} toast={toast} /></TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab({ api, queryClient, toast, stats }: any) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { email: '', password: '', fullName: '', role: 'student' } });

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: () => api.get('/admin/users'),
  });

  const changeRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast({ title: 'Role updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/admin/users/${userId}`);
      toast({ title: 'User deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const createUser = async (data: any) => {
    try {
      await api.post('/admin/users/create', data);
      toast({ title: 'User created!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsCreateOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = (users || []).filter((u: any) => {
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    teacher: 'bg-blue-100 text-blue-700 border-blue-200',
    student: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3 flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Create User
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-bold">All Users <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span></h2>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {u.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{u.fullName}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer bg-transparent ${roleColors[u.role] || ''}`}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{u.phoneNumber || <span className="text-muted-foreground text-xs">–</span>}</div>
                      {u.phoneNumber && (
                        <div className={`text-xs flex items-center gap-1 mt-0.5 ${u.phoneVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {u.phoneVerified ? <><BadgeCheck className="w-3 h-3" /> Verified</> : <><AlertCircle className="w-3 h-3" /> Unverified</>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.role === 'teacher' && <span>{u.courseCount ?? 0} courses · {u.studentCount ?? 0} students</span>}
                      {u.role === 'student' && <span>{u.enrollmentCount ?? 0} enrollments</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteUser(u.id, u.fullName)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(createUser)} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input {...register('fullName', { required: true })} placeholder="Full name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input {...register('email', { required: true })} type="email" placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password *</label>
              <Input {...register('password', { required: true })} type="password" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <select {...register('role')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Create User</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── COURSES TAB ──────────────────────────────────────────────────────────────

function CoursesTab({ api, queryClient, toast }: any) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: () => api.get('/admin/courses'),
  });

  const togglePublish = async (courseId: number, current: boolean) => {
    try {
      await api.put(`/admin/courses/${courseId}/publish`, { isPublished: !current });
      toast({ title: current ? 'Course unpublished' : 'Course published!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteCourse = async (courseId: number, title: string) => {
    if (!confirm(`Delete course "${title}"? This will remove all lessons and enrollments.`)) return;
    try {
      await api.del(`/admin/courses/${courseId}`);
      toast({ title: 'Course deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = (courses || []).filter((c: any) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.teacherName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'published' ? c.isPublished : !c.isPublished);
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.reduce((s: number, c: any) => s + (c.revenue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap justify-between">
        <div className="flex gap-3">
          <Input
            placeholder="Search by title or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Courses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          Total revenue shown: <span className="font-bold text-foreground ml-1">{totalRevenue.toFixed(2)} LYD</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold">All Courses <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span></h2>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading courses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No courses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm max-w-[200px] line-clamp-1">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.lessonCount} lessons · {c.language?.toUpperCase()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{c.teacherName}</div>
                      <div className="text-xs text-muted-foreground">{c.teacherEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.categoryName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${parseFloat(c.price) === 0 ? 'text-green-600' : 'text-primary'}`}>
                        {parseFloat(c.price) === 0 ? 'Free' : `${parseFloat(c.price)} LYD`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.enrollmentCount}</td>
                    <td className="px-4 py-3 text-sm font-medium">{(c.revenue || 0).toFixed(2)} LYD</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.isPublished ? '✓ Published' : '⏸ Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 text-xs gap-1 ${c.isPublished ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                          onClick={() => togglePublish(c.id, c.isPublished)}
                        >
                          {c.isPublished ? <><Lock className="w-3 h-3" /> Unpublish</> : <><Globe className="w-3 h-3" /> Publish</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteCourse(c.id, c.title)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAYMENTS TAB ─────────────────────────────────────────────────────────────

function PaymentsTab({ api, queryClient, toast }: any) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState<number | null>(null);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/payments', statusFilter],
    queryFn: () => api.get(`/admin/payments?status=${statusFilter}`),
    refetchInterval: 15000,
  });

  const handleAction = async (paymentId: number, action: 'approve' | 'reject') => {
    setProcessing(paymentId);
    try {
      await api.post(`/admin/payments/${paymentId}/${action}`, {});
      toast({ title: action === 'approve' ? '✓ Payment approved — student enrolled' : '✗ Payment rejected' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  };

  const methodLabel: Record<string, string> = {
    gateway: 'Gateway',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
  };

  const totalRevenue = (payments || []).filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + p.amount, 0);
  const pendingTotal = (payments || []).filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap justify-between items-center">
        <div className="flex gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed / Rejected</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle className="w-3.5 h-3.5" /> Completed: <span className="font-bold">{totalRevenue.toFixed(2)} LYD</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-700">
            <Clock className="w-3.5 h-3.5" /> Pending: <span className="font-bold">{pendingTotal.toFixed(2)} LYD</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Loading payments...</div>
      ) : (payments || []).length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <h3 className="font-bold">No payments found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(payments || []).map((p: any) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}>
                  {p.status === 'pending' ? '⏳ Pending' : p.status === 'completed' ? '✓ Completed' : '✗ Failed'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">#{p.id}</span>
              </div>
              <div className="mb-4">
                <div className="text-2xl font-bold text-primary">{p.amount} <span className="text-sm font-normal text-muted-foreground">{p.currency}</span></div>
                <div className="text-xs text-muted-foreground mt-1">Method: {methodLabel[p.method] || p.method}</div>
              </div>
              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{p.studentName}</span>
                </div>
                <div className="text-xs text-muted-foreground ml-5">{p.studentEmail}</div>
                <div className="flex items-center gap-2 mt-2">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{p.itemName}</span>
                </div>
                {p.reference && (
                  <div className="text-xs text-muted-foreground font-mono ml-5">Ref: {p.reference}</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {new Date(p.createdAt).toLocaleString()}
              </div>
              {p.status === 'pending' && (
                <div className="flex gap-2 mt-auto">
                  <Button
                    className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white text-xs h-9"
                    disabled={processing === p.id}
                    onClick={() => handleAction(p.id, 'approve')}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {processing === p.id ? 'Processing...' : 'Approve & Enroll'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1 text-destructive border-destructive/30 hover:bg-destructive/5 text-xs h-9"
                    disabled={processing === p.id}
                    onClick={() => handleAction(p.id, 'reject')}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FINANCE TAB ──────────────────────────────────────────────────────────────

function FinanceTab({ api, queryClient, toast }: any) {
  const [paying, setPaying] = useState<number | null>(null);
  const [teacherFilter, setTeacherFilter] = useState('all');

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['/api/admin/earnings'],
    queryFn: () => api.get('/admin/earnings'),
  });

  const handlePay = async (earningId: number, teacherId: number) => {
    setPaying(earningId);
    try {
      await api.post(`/admin/earnings/${earningId}/pay`, {});
      toast({ title: '✓ Payout marked — teacher has been paid' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/earnings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPaying(null);
    }
  };

  const handlePayAll = async (teacherId: number, teacherName: string) => {
    if (!confirm(`Pay all available earnings to ${teacherName}?`)) return;
    try {
      await api.post(`/admin/earnings/pay-all/${teacherId}`, {});
      toast({ title: `All earnings paid to ${teacherName}` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/earnings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const earningList = earnings || [];
  const uniqueTeachers = [...new Set(earningList.map((e: any) => e.teacherName))] as string[];

  const filtered = earningList.filter((e: any) =>
    teacherFilter === 'all' || e.teacherName === teacherFilter
  );

  const available = filtered.filter((e: any) => e.status === 'available').reduce((s: number, e: any) => s + e.net, 0);
  const totalPaid = filtered.filter((e: any) => e.status === 'paid').reduce((s: number, e: any) => s + e.net, 0);
  const platformFees = filtered.reduce((s: number, e: any) => s + e.platformFee, 0);

  // Group by teacher for pay-all
  const teacherGroups = earningList.reduce((acc: any, e: any) => {
    if (!acc[e.teacherId]) acc[e.teacherId] = { id: e.teacherId, name: e.teacherName, email: e.teacherEmail, available: 0, paid: 0 };
    if (e.status === 'available') acc[e.teacherId].available += e.net;
    if (e.status === 'paid') acc[e.teacherId].paid += e.net;
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    paid: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-6">
      {/* Teacher payouts summary */}
      {Object.values(teacherGroups).length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-3">Teacher Payout Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(teacherGroups).map((t: any) => (
              <div key={t.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {t.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-green-700">{t.available.toFixed(2)}</div>
                    <div className="text-xs text-green-600">LYD Available</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-blue-700">{t.paid.toFixed(2)}</div>
                    <div className="text-xs text-blue-600">LYD Paid</div>
                  </div>
                </div>
                {t.available > 0 && (
                  <Button
                    className="w-full gap-2 bg-primary hover:bg-primary/90 text-xs h-9"
                    onClick={() => handlePayAll(t.id, t.name)}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Pay All {t.available.toFixed(2)} LYD
                  </Button>
                )}
                {t.available === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-2">No pending payouts</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finance Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available for Payout', value: `${available.toFixed(2)} LYD`, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Total Paid to Teachers', value: `${totalPaid.toFixed(2)} LYD`, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Platform Fees (20%)', value: `${platformFees.toFixed(2)} LYD`, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Earnings Table */}
      <div className="space-y-3">
        <div className="flex gap-3 justify-between items-center">
          <h3 className="font-bold text-base">Earnings Ledger</h3>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Teachers</option>
            {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Loading earnings...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No earnings records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course / Session</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net (Teacher)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((e: any) => (
                    <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{e.teacherName}</div>
                        <div className="text-xs text-muted-foreground">{e.teacherEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[180px]">
                        <span className="line-clamp-1">{e.itemName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{e.gross} {e.currency}</td>
                      <td className="px-4 py-3 text-sm text-red-600">-{e.platformFee} {e.currency}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-700">{e.net} {e.currency}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[e.status] || 'bg-gray-100 text-gray-700'}`}>
                          {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {e.status === 'available' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 text-green-600 border-green-300 hover:bg-green-50"
                            disabled={paying === e.id}
                            onClick={() => handlePay(e.id, e.teacherId)}
                          >
                            <DollarSign className="w-3 h-3" />
                            {paying === e.id ? '...' : 'Pay Out'}
                          </Button>
                        )}
                        {e.status === 'paid' && <span className="text-xs text-muted-foreground">✓ Paid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Expenses P&L Section */}
      <ExpensesPL api={api} queryClient={queryClient} toast={toast} platformFees={platformFees} />
    </div>
  );
}

// ─── EXPENSES P&L ─────────────────────────────────────────────────────────────

function ExpensesPL({ api, queryClient, toast, platformFees }: any) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: '', amount: '', category: 'hosting', notes: '', expenseDate: '' }
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['/api/expenses'],
    queryFn: () => api.get('/expenses'),
  });

  const addExpense = async (data: any) => {
    try {
      await api.post('/expenses', { ...data, amount: parseFloat(data.amount) });
      toast({ title: 'Expense added' });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setIsAddOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await api.del(`/expenses/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const netProfit = platformFees - totalExpenses;

  const categoryColors: Record<string, string> = {
    hosting: 'bg-blue-100 text-blue-700',
    domain: 'bg-purple-100 text-purple-700',
    marketing: 'bg-orange-100 text-orange-700',
    salary: 'bg-green-100 text-green-700',
    tools: 'bg-gray-100 text-gray-700',
    other: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-4 mt-8 border-t border-border pt-8">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base">Platform P&L (Profit & Loss)</h3>
        <Button size="sm" className="gap-2" onClick={() => setIsAddOpen(true)}>
          <PlusCircle className="w-3.5 h-3.5" /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="text-xs text-green-700 font-medium mb-1">Platform Revenue (20% fees)</div>
          <div className="text-xl font-bold text-green-700">+{(platformFees || 0).toFixed(2)} LYD</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="text-xs text-red-700 font-medium mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-red-700">-{totalExpenses.toFixed(2)} LYD</div>
        </div>
        <div className={`border rounded-2xl p-4 ${netProfit >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-xs font-medium mb-1 ${netProfit >= 0 ? 'text-primary' : 'text-red-700'}`}>Net Profit</div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-red-700'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} LYD
          </div>
        </div>
      </div>

      {(expenses || []).length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(expenses || []).map((e: any) => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{e.title}</div>
                      {e.notes && <div className="text-xs text-muted-foreground">{e.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[e.category] || 'bg-gray-100 text-gray-700'}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{e.amount} {e.currency}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.expenseDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteExpense(e.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(addExpense)} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input {...register('title', { required: true })} placeholder="e.g. Replit Hosting" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Amount (LYD) *</label>
                <Input {...register('amount', { required: true })} type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select {...register('category')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="hosting">Hosting</option>
                  <option value="domain">Domain</option>
                  <option value="marketing">Marketing</option>
                  <option value="salary">Salary</option>
                  <option value="tools">Tools / Software</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input {...register('expenseDate')} type="date" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Input {...register('notes')} placeholder="Additional details..." />
            </div>
            <Button type="submit" className="w-full">Add Expense</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── TEACHER MANAGEMENT TAB ───────────────────────────────────────────────────

function TeachersManagementTab({ api, queryClient, toast }: any) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: () => api.get('/teachers'),
  });

  const { data: earnings } = useQuery({
    queryKey: ['/api/admin/earnings'],
    queryFn: () => api.get('/admin/earnings'),
  });

  const toggleVerify = async (teacherId: number, current: boolean) => {
    try {
      await api.put(`/admin/users/${teacherId}/role`, { role: 'teacher' });
      await api.post(`/admin/users/${teacherId}/verify`, { isVerified: !current });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({ title: current ? 'Verification removed' : 'Teacher verified!' });
    } catch {}
  };

  const payAllTeacher = async (teacherId: number, name: string) => {
    if (!confirm(`Pay all available earnings to ${name}?`)) return;
    try {
      await api.post(`/admin/earnings/pay-all/${teacherId}`, {});
      toast({ title: `All earnings paid to ${name}` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/earnings'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getTeacherEarnings = (teacherId: number) => {
    const list = (earnings || []).filter((e: any) => e.teacherId === teacherId);
    const available = list.filter((e: any) => e.status === 'available').reduce((s: number, e: any) => s + e.net, 0);
    const paid = list.filter((e: any) => e.status === 'paid').reduce((s: number, e: any) => s + e.net, 0);
    return { available, paid, total: available + paid };
  };

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading teachers...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Teacher Management <span className="text-muted-foreground font-normal text-sm">({(teachers || []).length})</span></h2>
      </div>
      <div className="space-y-3">
        {(teachers || []).length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
            <Presentation className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground">No teachers yet</p>
          </div>
        )}
        {(teachers || []).map((teacher: any) => {
          const erng = getTeacherEarnings(teacher.id);
          const isOpen = expanded === teacher.id;
          return (
            <div key={teacher.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {teacher.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{teacher.fullName}</h3>
                      {teacher.isVerified && <BadgeCheck className="w-4 h-4 text-primary" />}
                      {teacher.isTutoringEnabled && <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">Tutoring</span>}
                    </div>
                    {teacher.expertise && <p className="text-xs text-muted-foreground">{teacher.expertise}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Courses', value: teacher.courseCount },
                    { label: 'Students', value: teacher.studentCount },
                    { label: 'Available', value: `${erng.available.toFixed(0)} LYD` },
                    { label: 'Paid Out', value: `${erng.paid.toFixed(0)} LYD` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/40 rounded-xl px-3 py-2">
                      <div className="font-bold text-sm">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 shrink-0">
                  {erng.available > 0 && (
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={() => payAllTeacher(teacher.id, teacher.fullName)}
                    >
                      <DollarSign className="w-3 h-3" /> Pay {erng.available.toFixed(0)} LYD
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={teacher.isVerified ? 'outline' : 'default'}
                    className={`gap-1 text-xs ${teacher.isVerified ? 'border-primary text-primary' : ''}`}
                    onClick={() => toggleVerify(teacher.id, teacher.isVerified)}
                  >
                    <BadgeCheck className="w-3 h-3" />
                    {teacher.isVerified ? 'Verified' : 'Verify'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs"
                    onClick={() => setExpanded(isOpen ? null : teacher.id)}
                  >
                    <Eye className="w-3 h-3" /> {isOpen ? 'Hide' : 'Details'}
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border p-5 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Earnings Breakdown</p>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Total Gross</span><span className="font-bold">{(erng.total / 0.8 * 1).toFixed(2)} LYD</span></div>
                        <div className="flex justify-between"><span>Platform (20%)</span><span className="text-red-600">-{(erng.total / 0.8 * 0.2).toFixed(2)} LYD</span></div>
                        <div className="flex justify-between"><span>Teacher Net</span><span className="font-bold text-green-600">{erng.total.toFixed(2)} LYD</span></div>
                        <div className="flex justify-between"><span>Available</span><span className="font-bold text-amber-600">{erng.available.toFixed(2)} LYD</span></div>
                        <div className="flex justify-between"><span>Already Paid</span><span className="font-bold text-blue-600">{erng.paid.toFixed(2)} LYD</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Activity</p>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Published Courses</span><span className="font-bold">{teacher.courseCount}</span></div>
                        <div className="flex justify-between"><span>Total Students</span><span className="font-bold">{teacher.studentCount}</span></div>
                        <div className="flex justify-between"><span>Reviews</span><span className="font-bold">{teacher.reviewCount}</span></div>
                        <div className="flex justify-between"><span>Avg Rating</span><span className="font-bold">{teacher.rating?.toFixed(1) || '–'} ★</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Account</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Tutoring: {teacher.isTutoringEnabled ? `${teacher.tutoringHourlyRate} LYD/hr` : 'Disabled'}</div>
                        <div>Verified: {teacher.isVerified ? '✓ Yes' : '✗ No'}</div>
                        <div>Expertise: {teacher.expertise || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REPORTS TAB ──────────────────────────────────────────────────────────────

function ReportsTab({ api, queryClient, toast }: any) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resolveNote, setResolveNote] = useState('');
  const [activeReport, setActiveReport] = useState<any>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: () => api.get('/reports'),
    refetchInterval: 30000,
  });

  const updateStatus = async (reportId: number, status: string) => {
    try {
      await api.put(`/reports/${reportId}/status`, { status, adminNote: resolveNote });
      toast({ title: `Report marked as ${status}` });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setActiveReport(null);
      setResolveNote('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = (reports || []).filter((r: any) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    return matchStatus && matchType;
  });

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    under_review: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  };

  const reasonLabels: Record<string, string> = {
    wrong_content: 'Wrong Content',
    offensive: 'Offensive',
    technical_issue: 'Technical Issue',
    no_show: 'No-show',
    inappropriate_behavior: 'Inappropriate Behavior',
    copyright: 'Copyright',
    spam: 'Spam',
    other: 'Other',
  };

  const openCount = (reports || []).filter((r: any) => r.status === 'open').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg">Reports</h2>
          {openCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{openCount} open</span>
          )}
        </div>
        <div className="flex gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
            <option value="all">All Types</option>
            <option value="lesson">Lesson</option>
            <option value="session">Session</option>
            <option value="teacher">Teacher</option>
            <option value="course">Course</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <h3 className="font-bold">No reports found</h3>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{r.reporterName}</div>
                      <div className="text-xs text-muted-foreground">{r.reporterEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium capitalize">{r.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{reasonLabels[r.reason] || r.reason}</td>
                    <td className="px-4 py-3">
                      {r.reportedName ? (
                        <div>
                          <div className="text-sm font-medium">{r.reportedName}</div>
                          <div className="text-xs text-muted-foreground">{r.reportedEmail}</div>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">–</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveReport(r)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!activeReport} onOpenChange={(o) => { if (!o) { setActiveReport(null); setResolveNote(''); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Review Report #{activeReport?.id}</DialogTitle></DialogHeader>
          {activeReport && (
            <div className="space-y-4 mt-2">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div><span className="font-medium">Reporter:</span> {activeReport.reporterName} ({activeReport.reporterEmail})</div>
                <div><span className="font-medium">Type:</span> {activeReport.type}</div>
                <div><span className="font-medium">Reason:</span> {reasonLabels[activeReport.reason] || activeReport.reason}</div>
                {activeReport.reportedName && <div><span className="font-medium">Reported:</span> {activeReport.reportedName}</div>}
                {activeReport.description && <div><span className="font-medium">Description:</span> {activeReport.description}</div>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Admin Note (optional)</label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  rows={3}
                  placeholder="Add a resolution note..."
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs" onClick={() => updateStatus(activeReport.id, 'under_review')}>
                  Under Review
                </Button>
                <Button className="gap-1 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => updateStatus(activeReport.id, 'resolved')}>
                  <CheckCircle className="w-3.5 h-3.5" /> Resolved
                </Button>
                <Button variant="outline" className="gap-1 text-muted-foreground text-xs" onClick={() => updateStatus(activeReport.id, 'dismissed')}>
                  Dismiss
                </Button>
                <Button variant="outline" className="gap-1 text-destructive text-xs border-destructive/30" onClick={() => setActiveReport(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CATEGORIES TAB ───────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['📐','🔬','📖','🇬🇧','🏛️','⚛️','🧪','🧬','💻','🌙','🎨','🎵','⚽','🌍','📊','🧮','🔭','🏥','⚖️','🏗️'];

function CategoriesTab({ api, queryClient, toast }: any) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { name: '', nameAr: '', icon: '📚' },
  });
  const icon = watch('icon');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => api.get('/categories'),
  });

  const openCreate = () => {
    reset({ name: '', nameAr: '', icon: '📚' });
    setEditCat(null);
    setIsCreateOpen(true);
  };

  const openEdit = (cat: any) => {
    reset({ name: cat.name, nameAr: cat.nameAr, icon: cat.icon || '📚' });
    setEditCat(cat);
    setIsCreateOpen(true);
  };

  const saveCategory = async (data: any) => {
    try {
      if (editCat) {
        await api.put(`/categories/${editCat.id}`, data);
        toast({ title: 'Category updated!' });
      } else {
        await api.post('/categories', data);
        toast({ title: 'Category created!' });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsCreateOpen(false);
      reset();
      setEditCat(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteCategory = async (cat: any) => {
    if (cat.courseCount > 0) {
      toast({ title: 'Cannot delete', description: `This category has ${cat.courseCount} courses. Move them first.`, variant: 'destructive' });
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.del(`/categories/${cat.id}`);
      toast({ title: 'Category deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Course Categories <span className="text-muted-foreground font-normal text-sm">({(categories as any[]).length})</span></h2>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(categories as any[]).map((cat: any) => (
            <div key={cat.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{cat.icon || '📚'}</div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteCategory(cat)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="font-bold text-base">{cat.nameAr}</div>
              <div className="text-sm text-muted-foreground">{cat.name}</div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />{cat.courseCount} course{cat.courseCount !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={v => { if (!v) { setIsCreateOpen(false); setEditCat(null); reset(); } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editCat ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(saveCategory)} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Category Name (Arabic) *</label>
              <Input {...register('nameAr', { required: true })} placeholder="مثال: الرياضيات" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category Name (English) *</label>
              <Input {...register('name', { required: true })} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setValue('icon', e)}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all ${icon === e ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                {editCat ? 'Save Changes' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditCat(null); reset(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DMCA COMPLAINTS TAB ──────────────────────────────────────────────────────

function DMCAComplaintsTab({ api, queryClient, toast }: any) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeComplaint, setActiveComplaint] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['/api/copyright-complaints'],
    queryFn: () => api.get('/copyright-complaints'),
    refetchInterval: 30000,
  });

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/copyright-complaints/${id}`, { status, adminNotes });
      toast({ title: `Complaint marked as ${status}` });
      queryClient.invalidateQueries({ queryKey: ['/api/copyright-complaints'] });
      setActiveComplaint(null);
      setAdminNotes('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = (complaints || []).filter((c: any) => {
    return statusFilter === 'all' || c.status === statusFilter;
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  const pendingCount = (complaints || []).filter((c: any) => c.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg">DMCA Complaints</h2>
          {pendingCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Under Review</option>
          <option value="resolved">Resolved / Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground">Loading complaints...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <h3 className="font-bold">No DMCA complaints</h3>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{c.reporterName}</div>
                      <div className="text-xs text-muted-foreground">{c.reporterEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-primary">ID: {c.reportedTeacherId}</div>
                      <div className="text-xs text-muted-foreground">{c.reportedTeacherName || 'Unknown Teacher'}</div>
                      {c.reportedLessonId && <div className="text-[10px] text-muted-foreground bg-muted inline-block px-1 mt-0.5 rounded">Lesson: {c.reportedLessonId}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[200px] truncate" title={c.description}>
                      {c.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusColors[c.status] || 'bg-gray-100 text-gray-700'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setActiveComplaint(c); setAdminNotes(c.adminNotes || ''); }}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!activeComplaint} onOpenChange={(o) => { if (!o) { setActiveComplaint(null); setAdminNotes(''); } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review DMCA Complaint #{activeComplaint?.id}</DialogTitle></DialogHeader>
          {activeComplaint && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-2 text-sm">
                  <h4 className="font-bold text-amber-900 border-b border-amber-200 pb-1 mb-2">Reporter Details</h4>
                  <div><span className="font-semibold">Name:</span> {activeComplaint.reporterName}</div>
                  <div><span className="font-semibold">Email:</span> {activeComplaint.reporterEmail}</div>
                  {activeComplaint.proofUrl && (
                    <div><span className="font-semibold">Proof Link:</span> <a href={activeComplaint.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{activeComplaint.proofUrl}</a></div>
                  )}
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 space-y-2 text-sm">
                  <h4 className="font-bold text-red-900 border-b border-red-200 pb-1 mb-2">Reported Target</h4>
                  <div><span className="font-semibold">Teacher ID:</span> {activeComplaint.reportedTeacherId} ({activeComplaint.reportedTeacherName})</div>
                  {activeComplaint.reportedLessonId && <div><span className="font-semibold">Lesson ID:</span> {activeComplaint.reportedLessonId}</div>}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <h4 className="font-bold">Infringement Description</h4>
                <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border">
                  {activeComplaint.description}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold mb-1 block">Internal Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Record your investigation results here..."
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                />
              </div>

              <div className="bg-card border rounded-xl p-4">
                <h4 className="font-bold text-sm mb-3">Resolution Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateStatus(activeComplaint.id, 'reviewing')}>
                    ⏳ Mark as Under Review
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(activeComplaint.id, 'resolved')}>
                    ✓ Approve (Take Down Content)
                  </Button>
                  <Button variant="outline" className="text-destructive border-destructive" onClick={() => updateStatus(activeComplaint.id, 'rejected')}>
                    ✗ Reject (Baseless)
                  </Button>
                  <Button variant="ghost" onClick={() => setActiveComplaint(null)}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Note: Taking down content currently requires you to manually navigate to the Courses tab and unpublish the reported course or delete the lesson.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ACADEMY ADMIN TAB ────────────────────────────────────────────────────────

function AcademyAdminTab({ api, queryClient, toast }: any) {
  const [activeSubTab, setActiveSubTab] = useState('applications');

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-academy-applications'],
    queryFn: () => api.get('/academy/admin/applications'),
  });

  const { data: programs, isLoading: progsLoading } = useQuery({
    queryKey: ['admin-academy-programs'],
    queryFn: () => api.get('/academy/programs'),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status, notes }: any) => api.put(`/academy/admin/applications/${id}`, { status, reviewNotes: notes }),
    onSuccess: () => {
      toast({ title: 'Application updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-academy-applications'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error updating application', description: err.message, variant: 'destructive' });
    }
  });

  const handleApprove = (appId: number, currentStatus: string) => {
    const isApproved = currentStatus === 'approved';
    const notes = window.prompt(`Admin notes for ${isApproved ? 'rejecting' : 'approving'} application:`);
    if (notes !== null) {
      approveMutation.mutate({ id: appId, status: isApproved ? 'rejected' : 'approved', notes });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-border pb-4">
        <button
          onClick={() => setActiveSubTab('applications')}
          className={`font-semibold text-sm pb-1 border-b-2 ${activeSubTab === 'applications' ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground'}`}
        >
          Applications
        </button>
        <button
          onClick={() => setActiveSubTab('programs')}
          className={`font-semibold text-sm pb-1 border-b-2 ${activeSubTab === 'programs' ? 'border-amber-500 text-amber-600' : 'border-transparent text-muted-foreground'}`}
        >
          Programs
        </button>
      </div>

      {activeSubTab === 'applications' && (
        <div className="bg-card border border-border rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Program / Grade</th>
                  <th className="px-6 py-4">Parent Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appsLoading ? (
                  <tr><td colSpan={5} className="py-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500" /></td></tr>
                ) : applications?.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No applications found</td></tr>
                ) : applications?.map((app: any) => (
                  <tr key={app.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-bold">{app.studentName}</div>
                      <div className="text-muted-foreground text-xs">{app.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{app.programName}</div>
                      <div className="text-muted-foreground text-xs">Grade {app.gradeLevel} • {app.programType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{app.parentName}</div>
                      <div className="text-muted-foreground text-xs">{app.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={app.status === 'approved' ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}
                        onClick={() => handleApprove(app.id, app.status)}
                        disabled={approveMutation.isPending}
                      >
                        {app.status === 'approved' ? 'Reject' : 'Approve'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-6 border border-border rounded-xl">
            <div>
              <h3 className="text-xl font-bold">Programs Matrix</h3>
              <p className="text-muted-foreground">Active Academy programs available for enrollment.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progsLoading ? (
               <div className="col-span-full py-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500" /></div>
            ) : programs?.length === 0 ? (
               <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">No active programs found. Create one directly via DB for now.</div>
            ) : programs?.map((prog: any) => (
              <div key={prog.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full">Active</Badge>
                </div>
                <h4 className="font-bold text-lg mb-1">{prog.name}</h4>
                <div className="text-sm font-medium text-amber-600 mb-4">{prog.type}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Grade</span> <span className="text-foreground font-semibold">{prog.gradeLevel}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Duration</span> <span className="text-foreground font-semibold">{prog.durationYears} Years</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Tuition</span> <span className="text-foreground font-semibold">{prog.tuitionPerSemester} {prog.currency} / sem</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Subjects</span> <span className="text-foreground font-semibold">{prog.subjectCount || 0}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
