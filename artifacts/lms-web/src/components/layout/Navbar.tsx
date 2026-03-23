import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, MonitorPlay, Users, Menu, X, Globe, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const navLinks = [
    { href: '/courses', label: t('nav.courses'), icon: BookOpen },
    { href: '/live-sessions', label: t('nav.live'), icon: MonitorPlay },
    { href: '/teachers', label: t('nav.teachers'), icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
              <span className="font-display font-bold text-lg">L</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Edu<span className="text-primary">Libya</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              const Icon = link.icon;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`relative flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-xl ${
                    isActive 
                      ? 'text-primary bg-primary/8' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="p-2 rounded-full hover:bg-secondary/20 text-muted-foreground hover:text-secondary transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href={user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'}>
                  <Button variant="ghost" className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Button variant="outline" size="icon" onClick={logout} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost">{t('nav.login')}</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25 rounded-xl">
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background border-t border-border"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted font-medium"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <link.icon className="w-5 h-5 text-primary" />
                  {link.label}
                </Link>
              ))}
              
              <div className="h-px w-full bg-border my-2" />
              
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted font-medium text-start"
              >
                <Globe className="w-5 h-5 text-secondary" />
                Switch to {language === 'ar' ? 'English' : 'العربية'}
              </button>

              {isAuthenticated ? (
                <>
                  <Link href={user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'} onClick={() => setIsMobileOpen(false)}>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <UserIcon className="w-4 h-4" /> {t('nav.dashboard')}
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={() => { logout(); setIsMobileOpen(false); }} className="w-full justify-start text-destructive">
                    <LogOut className="w-4 h-4 me-2" /> Logout
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                    <Button variant="outline" className="w-full">{t('nav.login')}</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-primary to-teal-500">{t('nav.register')}</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
