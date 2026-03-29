import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Learn from "@/pages/Learn";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ManageCourse from "@/pages/ManageCourse";
import AdminDashboard from "@/pages/AdminDashboard";
import LiveSessions from "@/pages/LiveSessions";
import SessionRoom from "@/pages/SessionRoom";
import Tutoring from "@/pages/Tutoring";
import Teachers from "@/pages/Teachers";
import TeacherProfile from "@/pages/TeacherProfile";
import SearchPage from "@/pages/Search";
import DMCAComplaint from "@/pages/DMCAComplaint";
import Academy from "@/pages/Academy";
import AcademyDashboard from "@/pages/AcademyDashboard";
import AcademyApply from "@/pages/AcademyApply";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/courses/:id/learn" component={Learn} />
      <Route path="/academy" component={Academy} />
      <Route path="/academy/dashboard" component={AcademyDashboard} />
      <Route path="/academy/apply" component={AcademyApply} />
      <Route path="/live-sessions" component={LiveSessions} />
      <Route path="/session/:id" component={SessionRoom} />
      <Route path="/tutoring" component={Tutoring} />
      <Route path="/teachers" component={Teachers} />
      <Route path="/teachers/:slug" component={TeacherProfile} />
      <Route path="/search" component={SearchPage} />
      <Route path="/dmca" component={DMCAComplaint} />
      <Route path="/login" component={Auth} />
      <Route path="/register" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/teacher/dashboard" component={TeacherDashboard} />
      <Route path="/teacher/courses/:id/lessons" component={ManageCourse} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
