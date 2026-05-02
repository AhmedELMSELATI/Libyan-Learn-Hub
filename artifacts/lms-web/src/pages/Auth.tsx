import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin, useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, GraduationCap, Presentation, CheckCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApi } from '@/hooks/useApi';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(9, 'Enter a valid phone number').regex(/^[0-9+\s\-()]+$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher']),
});

export default function Auth() {
  const [location, setLocation] = useLocation();
  const isLogin = location.startsWith('/login');

  // Extract redirect param from query string (e.g. /login?redirect=/academy/apply)
  const redirectTo = (() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    return params.get('redirect') || null;
  })();
  const { login: setAuthContext } = useAuth();
  const api = useApi();
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpInfo, setOtpInfo] = useState<{ message: string; code: string } | null>(null);
  const [pendingToken, setPendingToken] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<string>('student');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phoneNumber: '', password: '', role: 'student' as 'student' | 'teacher' }
  });

  const { mutate: loginMutate, isPending: isLoggingIn } = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuthContext(data.token);
        // Honor redirect param, otherwise go to role-based default
        if (redirectTo) {
          setLocation(redirectTo);
        } else {
          setLocation(data.user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard');
        }
      },
      onError: (err) => setErrorMsg(err.message || 'Login failed')
    }
  });

  const { mutate: registerMutate, isPending: isRegistering } = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        setPendingToken(data.token);
        setPendingRole(data.user.role);
        setOtpInfo({ message: data.otpMessage, code: data.otpCode });
        setStep('otp');
      },
      onError: (err) => setErrorMsg(err.message || 'Registration failed')
    }
  });

  const onSubmitLogin = (data: z.infer<typeof loginSchema>) => {
    setErrorMsg('');
    loginMutate({ data });
  };

  const onSubmitRegister = (data: z.infer<typeof registerSchema>) => {
    setErrorMsg('');
    registerMutate({ data: data as any });
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit code');
      return;
    }
    setVerifying(true);
    setErrorMsg('');
    try {
      localStorage.setItem('lms_token', pendingToken);
      await api.post('/auth/verify-otp', { code: otpCode, type: 'phone' });
      setAuthContext(pendingToken);
      setLocation(pendingRole === 'teacher' ? '/teacher/dashboard' : '/dashboard');
    } catch (err: any) {
      localStorage.removeItem('lms_token');
      setErrorMsg(err.message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleSkipVerification = () => {
    setAuthContext(pendingToken);
    setLocation(pendingRole === 'teacher' ? '/teacher/dashboard' : '/dashboard');
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl border border-border shadow-xl p-10 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold">Verify Your Account</h2>
            <p className="text-muted-foreground mt-2 text-sm">Enter the 6-digit verification code</p>
          </div>

          {otpInfo && (
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary/80">
              <p className="font-medium mb-1">Development Mode:</p>
              <p>{otpInfo.message}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <Input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-muted/50"
              maxLength={6}
            />
            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-semibold"
              onClick={handleVerifyOtp}
              disabled={verifying || otpCode.length !== 6}
            >
              {verifying ? 'Verifying...' : 'Verify & Continue'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={handleSkipVerification}
            >
              Skip for now →
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[620px] xl:w-[700px] bg-card z-10 relative shadow-2xl">
        <div className="absolute top-8 start-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md pt-20 sm:pt-0">
          <div className="mb-8 text-center lg:text-start">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white shadow-lg mx-auto lg:mx-0 mb-5">
              <span className="font-display font-bold text-2xl">L</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link href={isLogin ? '/register' : '/login'} className="font-semibold text-primary hover:underline transition-colors">
                {isLogin ? 'Sign up' : 'Log in'}
              </Link>
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onSubmitLogin)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                  <Input {...loginForm.register('email')} type="email" placeholder="you@example.com" className="h-12 bg-muted/50 border-transparent focus:bg-background" />
                  {loginForm.formState.errors.email && <p className="mt-1 text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <Input {...loginForm.register('password')} type="password" placeholder="••••••••" className="h-12 bg-muted/50 border-transparent focus:bg-background" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Logging in...' : 'Log in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-4">
                {/* Role picker */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <label className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${registerForm.watch('role') === 'student' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                    <input type="radio" value="student" {...registerForm.register('role')} className="hidden" />
                    <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                    <span className="font-semibold text-sm block">I'm a Student</span>
                    <span className="text-xs opacity-70">Browse & enroll in courses</span>
                  </label>
                  <label className={`cursor-pointer border-2 rounded-xl p-4 text-center transition-all ${registerForm.watch('role') === 'teacher' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                    <input type="radio" value="teacher" {...registerForm.register('role')} className="hidden" />
                    <Presentation className="w-6 h-6 mx-auto mb-2" />
                    <span className="font-semibold text-sm block">I'm a Teacher</span>
                    <span className="text-xs opacity-70">Create & sell courses</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <Input {...registerForm.register('fullName')} placeholder="Ali Mohamed" className="h-12 bg-muted/50 border-transparent focus:bg-background" />
                  {registerForm.formState.errors.fullName && <p className="mt-1 text-sm text-destructive">{registerForm.formState.errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                  <Input {...registerForm.register('email')} type="email" placeholder="you@example.com" className="h-12 bg-muted/50 border-transparent focus:bg-background" />
                  {registerForm.formState.errors.email && <p className="mt-1 text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Phone Number <span className="text-xs text-muted-foreground">(for SMS verification)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center h-12 px-3 bg-muted/50 border border-transparent rounded-md text-sm font-medium text-muted-foreground whitespace-nowrap">
                      🇱🇾 +218
                    </div>
                    <Input
                      {...registerForm.register('phoneNumber')}
                      type="tel"
                      placeholder="91 234 5678"
                      className="h-12 bg-muted/50 border-transparent focus:bg-background flex-1"
                    />
                  </div>
                  {registerForm.formState.errors.phoneNumber && <p className="mt-1 text-sm text-destructive">{registerForm.formState.errors.phoneNumber.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <Input {...registerForm.register('password')} type="password" placeholder="Create a strong password (min 6 chars)" className="h-12 bg-muted/50 border-transparent focus:bg-background" />
                  {registerForm.formState.errors.password && <p className="mt-1 text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isRegistering}>
                  {isRegistering ? 'Creating account...' : 'Create Account →'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  A verification code will be sent to your phone to confirm your account.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Image Side */}
      <div className="hidden lg:block relative flex-1 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=1600&fit=crop"
          alt="Students learning"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-16 text-white">
          <h3 className="font-display text-4xl font-bold mb-4">Empower your future.</h3>
          <p className="text-xl text-white/80 max-w-lg">Join the premier platform for Libyan education. High-quality content, dedicated teachers, and a thriving community.</p>

        </div>
      </div>
    </div>
  );
}
