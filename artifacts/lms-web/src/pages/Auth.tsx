import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin, useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, GraduationCap, Presentation, CheckCircle, Phone, HardDrive, Clock, Star, Zap, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/hooks/useApi';
import { Blob } from '@/components/ui/Blob';

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
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const api = useApi();
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState<'form' | 'plan' | 'otp'>('form');
  const [selectedTier, setSelectedTier] = useState<'free' | 'bronze' | 'golden'>('free');
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [otpInfo, setOtpInfo] = useState<{ message: string; code: string } | null>(null);
  const [pendingToken, setPendingToken] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<string>('student');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'otp') {
      otpInputRef.current?.focus();
      setResendTimer(60); // 60 seconds countdown
    }
  }, [step]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setErrorMsg('');
    try {
      const data = await api.post('/auth/resend-otp', { email: registerForm.getValues('email'), type: 'phone' });
      setOtpInfo({ message: data.otpMessage, code: data.otpCode });
      setResendTimer(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Resend failed');
    }
  };

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

  // For teachers: show plan picker first, then register
  const onSubmitRegister = (data: z.infer<typeof registerSchema>) => {
    setErrorMsg('');
    if (data.role === 'teacher') {
      setPendingFormData(data);
      setStep('plan');
    } else {
      registerMutate({ data: data as any });
    }
  };

  const onConfirmPlan = () => {
    if (!pendingFormData) return;
    registerMutate({ data: { ...pendingFormData, tier: selectedTier } as any });
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
      // Allow auth state to settle before navigating
      await new Promise(r => setTimeout(r, 100));
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
    // Allow auth state to settle before navigating
    setTimeout(() => {
      setLocation(pendingRole === 'teacher' ? '/teacher/dashboard' : '/dashboard');
    }, 100);
  };

  // ── Plan Selection Step (teachers only) ────────────────────────────────
  const PLAN_CARDS = [
    {
      id: 'free' as const,
      label: isRtl ? 'باقة مجانية' : 'Free Plan',
      price: isRtl ? 'مجاني' : 'Free',
      priceNote: isRtl ? 'للأبد' : 'forever',
      storage: '5 GB',
      session: isRtl ? '30 دقيقة' : '30 mins',
      icon: <Zap className="w-6 h-6" />,
      color: 'border-border hover:border-primary/50',
      activeColor: 'border-primary bg-primary/5',
      badge: null,
      features: isRtl 
        ? ['5GB مساحة تخزين', 'جلسات مباشرة 30 دقيقة', '+10GB عند 100 طالب']
        : ['5GB Storage', '30 min Live Sessions', '+10GB at 100 students'],
    },
    {
      id: 'bronze' as const,
      label: isRtl ? 'الباقة البرونزية' : 'Bronze Plan',
      price: isRtl ? '30 د.ل' : '30 LYD',
      priceNote: isRtl ? 'شهرياً' : '/ month',
      storage: '25 GB',
      session: isRtl ? '45 دقيقة' : '45 mins',
      icon: <Star className="w-6 h-6" />,
      color: 'border-border hover:border-amber-500/50',
      activeColor: 'border-amber-500 bg-amber-500/5',
      badge: isRtl ? 'الأكثر شيوعاً' : 'Most Popular',
      features: isRtl
        ? ['25GB مساحة تخزين', 'جلسات مباشرة 45 دقيقة', '+10GB عند 100 طالب', 'دعم عبر البريد الإلكتروني']
        : ['25GB Storage', '45 min Live Sessions', '+10GB at 100 students', 'Email Support'],
    },
    {
      id: 'golden' as const,
      label: isRtl ? 'الباقة الذهبية' : 'Golden Plan',
      price: isRtl ? '50 د.ل' : '50 LYD',
      priceNote: isRtl ? 'شهرياً' : '/ month',
      storage: '50 GB',
      session: isRtl ? '90 دقيقة' : '90 mins',
      icon: <Trophy className="w-6 h-6" />,
      color: 'border-border hover:border-yellow-400/50',
      activeColor: 'border-yellow-400 bg-yellow-400/5',
      badge: isRtl ? 'الأفضل للمحترفين' : 'Best for Pros',
      features: isRtl
        ? ['50GB مساحة تخزين', 'جلسات مباشرة 90 دقيقة', '+10GB عند 100 طالب', 'دعم أولوي']
        : ['50GB Storage', '90 min Live Sessions', '+10GB at 100 students', 'Priority Support'],
    },
    {
      id: 'diamond' as const,
      label: isRtl ? 'الباقة الماسية' : 'Diamond Plan',
      price: isRtl ? '100 د.ل' : '100 LYD',
      priceNote: isRtl ? 'شهرياً' : '/ month',
      storage: '100 GB',
      session: isRtl ? 'غير محدود' : 'Unlimited',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'border-border hover:border-blue-500/50',
      activeColor: 'border-blue-500 bg-blue-500/5',
      badge: isRtl ? 'VIP' : 'VIP',
      features: isRtl
        ? ['100GB مساحة تخزين', 'بث مباشر غير محدود', '+150GB عند 100 طالب', 'دعم فوري']
        : ['100GB Storage', 'Unlimited Live Streams', '+150GB at 100 students', 'Instant Support'],
    },
  ];

  if (step === 'plan') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-display font-bold">{isRtl ? 'اختر خطتك' : 'Choose Your Plan'}</h2>
            <p className="text-muted-foreground mt-2">{isRtl ? 'يمكنك الترقية أو التغيير في أي وقت' : 'You can upgrade or downgrade at any time'}</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium text-center">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {PLAN_CARDS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedTier(plan.id)}
                className={`relative text-start rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer ${
                  selectedTier === plan.id ? plan.activeColor : plan.color
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.id === 'free' ? 'bg-primary/10 text-primary' :
                    plan.id === 'bronze' ? 'bg-amber-500/10 text-amber-500' :
                    plan.id === 'golden' ? 'bg-yellow-400/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {plan.icon}
                  </div>
                  {selectedTier === plan.id && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.priceNote}</span>
                </div>
                <p className="font-semibold text-lg mb-3">{plan.label}</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full px-4 py-1.5 font-medium">
              <Star className="w-4 h-4" />
              {isRtl ? '🎁 بونص: احصل على سعة تخزين إضافية مجاناً عند وصولك لـ 100 طالب!' : '🎁 Bonus: Get free extra storage when you reach 100 students!'}
            </span>
          </div>

          <div className="flex gap-3 max-w-sm mx-auto">
            <Button
              variant="outline"
              className="flex-1 h-12 gap-2"
              onClick={() => { setStep('form'); setErrorMsg(''); }}
            >
              <BackArrow className="w-4 h-4" /> {isRtl ? 'رجوع' : 'Back'}
            </Button>
            <Button
              className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90 gap-2"
              onClick={onConfirmPlan}
              disabled={isRegistering}
            >
              {isRegistering ? (isRtl ? 'جاري الإنشاء...' : 'Creating...') : (isRtl ? 'تأكيد وإنشاء الحساب' : 'Confirm & Create Account')}
              {!isRegistering && <Arrow className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── OTP Step ────────────────────────────────────────────────────────────
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
              ref={otpInputRef}
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
            <div className="text-center">
              <button
                type="button"
                disabled={resendTimer > 0}
                onClick={handleResend}
                className={`text-sm font-medium ${resendTimer > 0 ? 'text-muted-foreground' : 'text-primary hover:underline'}`}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </button>
            </div>
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
        <Blob color="bg-primary/40" size="w-[600px] h-[600px]" className="-top-32 -start-32" duration={20} />
        <Blob color="bg-cyan-500/30" size="w-[500px] h-[500px]" className="bottom-0 -end-32" delay={3} duration={25} />
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
