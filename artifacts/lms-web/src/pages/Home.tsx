import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetCourses, useGetCategories } from '@workspace/api-client-react';
import { BookOpen, Star, ArrowRight, ArrowLeft, PlayCircle, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const, delay },
});

export default function Home() {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  const { data: coursesData, isLoading: loadingCourses } = useGetCourses({ limit: 6 });
  const { data: categoriesData } = useGetCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  useSEO({
    title: t('home.hero.title'),
    description: t('home.hero.subtitle'),
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Libyan Learn Hub",
      "url": "https://libyan-learn-hub.com",
    }
  });

  const Arrow = isRtl ? ArrowLeft : ArrowRight;



  return (
    <div className="min-h-screen bg-background">

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">

        {/* Animated mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(124,58,237,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(6,182,212,0.10),transparent)]" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Text */}
            <div className={`${isRtl ? 'lg:order-2 text-right' : ''}`}>
              <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                <Zap className="w-3.5 h-3.5" />
                {isRtl ? 'منصة رقم ١ للتعلم في ليبيا' : 'The #1 E-Learning Platform in Libya'}
              </motion.div>

              <motion.h1 {...fadeUp(0.1)} className="text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold leading-[1.1] text-foreground mb-6">
                {isRtl ? (
                  <>
                    تعلّم من<br />
                    <span className="relative inline-block">
                      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-primary/70">أفضل الخبراء</span>
                      <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/10 rounded-sm" />
                    </span><br />في ليبيا
                  </>
                ) : (
                  <>
                    Learn From<br />
                    <span className="relative inline-block">
                      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-primary/70">Libya's Best</span>
                      <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/10 rounded-sm" />
                    </span><br />Instructors
                  </>
                )}
              </motion.h1>

              <motion.p {...fadeUp(0.2)} className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                {t('home.hero.subtitle')}
              </motion.p>

              <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-4">
                <Link href="/courses">
                  <Button size="lg" className="h-14 px-8 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 gap-2">
                    {isRtl ? 'استكشف الدورات' : 'Explore Courses'}
                    <Arrow className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base font-medium rounded-2xl border-2 gap-2 hover:bg-primary/5">
                    {isRtl ? 'سجّل كمعلم' : 'Teach With Us'}
                  </Button>
                </Link>
              </motion.div>


            </div>

            {/* Right — Floating card panel */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className={`relative hidden lg:block ${isRtl ? 'lg:order-1' : ''}`}
            >
              {/* Main card */}
              <div className="relative rounded-[2.5rem] overflow-hidden border border-border/60 bg-card shadow-2xl">
                <div className="h-64 bg-gradient-to-br from-primary via-violet-600 to-cyan-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-20 h-20 text-white/30" strokeWidth={1} />
                  </div>
                  <div className="absolute bottom-4 start-4 end-4 flex items-center gap-3 bg-black/30 backdrop-blur-md rounded-2xl p-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-white">
                      <div className="font-bold text-sm">{isRtl ? 'مقدمة في الرياضيات' : 'Introduction To Mathematics'}</div>
                      <div className="text-xs text-white/70">12 {isRtl ? 'درس' : 'lessons'} · 4h</div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-muted-foreground">{isRtl ? 'تقدمك' : 'Your Progress'}</div>
                    <div className="text-sm font-bold text-primary">62%</div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[62%] bg-gradient-to-r from-primary to-cyan-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating pill – top right */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -end-6 bg-card border border-border/60 rounded-2xl p-4 shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                </div>
                <div>
                  <div className="font-bold text-sm">4.9/5</div>
                  <div className="text-xs text-muted-foreground">Top Rated</div>
                </div>
              </motion.div>

              {/* Floating pill – bottom left */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-6 -start-6 bg-card border border-border/60 rounded-2xl p-4 shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="font-bold text-sm">{isRtl ? 'طالب جديد' : 'New Student'}</div>
                  <div className="text-xs text-muted-foreground">{isRtl ? 'انضم للتو!' : 'Just enrolled!'}</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className={`mb-12 ${isRtl ? 'text-right' : ''}`}>
            <p className="text-primary font-semibold mb-2 text-sm uppercase tracking-widest">{isRtl ? 'استكشف' : 'Explore'}</p>
            <h2 className="text-4xl font-display font-bold text-foreground">{isRtl ? 'تصفح حسب التخصص' : 'Browse by Subject'}</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories?.map((cat, i) => (
              <motion.div key={cat.id} {...fadeUp(i * 0.06)}>
                <Link href={`/courses?categoryId=${cat.id}`}>
                  <div className="group relative overflow-hidden border border-border/50 bg-card rounded-3xl p-6 cursor-pointer hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 group-hover:from-primary group-hover:to-secondary mx-auto mb-4 flex items-center justify-center transition-all duration-500">
                        <BookOpen className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h3 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                        {language === 'ar' ? cat.nameAr : cat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{cat.courseCount} {isRtl ? 'دورة' : 'Courses'}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED COURSES ───────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className={`flex justify-between items-end mb-12 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={isRtl ? 'text-right' : ''}>
              <p className="text-primary font-semibold mb-2 text-sm uppercase tracking-widest">{isRtl ? 'مميز' : 'Featured'}</p>
              <h2 className="text-4xl font-display font-bold text-foreground">{t('home.featured')}</h2>
            </div>
            <Link href="/courses" className="flex items-center gap-2 text-sm text-primary font-medium group hover:gap-3 transition-all">
              {isRtl ? 'عرض الكل' : 'View All'}
              <Arrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-96 bg-card rounded-3xl animate-pulse border border-border/50" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesData?.courses.map((course, i) => (
                <motion.div key={course.id} {...fadeUp(i * 0.1)}>
                  <Link href={`/courses/${course.id}`}>
                    <div className="group h-full flex flex-col border border-border/50 bg-card rounded-3xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
                      {/* Thumbnail */}
                      <div className="relative h-52 bg-muted overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-violet-500/10 to-secondary/20 flex items-center justify-center">
                            <PlayCircle className="w-16 h-16 text-primary/30 group-hover:text-primary/60 group-hover:scale-110 transition-all duration-500" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {/* Level badge */}
                        <div className="absolute top-4 start-4 px-3 py-1 rounded-full text-xs font-bold bg-background/80 backdrop-blur-sm text-foreground border border-border/50">
                          {course.level}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1 gap-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-medium">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                            {course.lessonCount} {isRtl ? 'درس' : 'Lessons'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>{Math.round(course.totalDuration / 60)}h</span>
                        </div>

                        <h3 className={`font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight flex-1 ${isRtl ? 'text-right' : ''}`}>
                          {language === 'ar' ? course.titleAr : course.title}
                        </h3>

                        <p className={`text-sm text-muted-foreground line-clamp-2 leading-relaxed ${isRtl ? 'text-right' : ''}`}>
                          {language === 'ar' ? course.descriptionAr : course.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {course.teacherName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate max-w-[100px]">{course.teacherName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-primary font-bold">
                            {course.price === 0 ? (
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-sm font-bold">{t('course.free')}</span>
                            ) : (
                              <span className="text-lg">{t('course.price', { price: course.price.toString() })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA BANNER ─────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp()}
            className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-violet-600 to-cyan-500 p-12 text-center text-white"
          >
            {/* Background noise texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
            <div className="absolute top-0 start-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 end-0 w-72 h-72 bg-cyan-400/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-display font-extrabold mb-4">
                {isRtl ? 'جاهز لتبدأ رحلتك؟' : 'Ready to Start Learning?'}
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                {isRtl ? 'انضم إلى آلاف الطلاب الليبيين الذين يتعلمون من أفضل المعلمين في البلاد.' : 'Join thousands of Libyan students learning from the best instructors in the country.'}
              </p>
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-base font-bold rounded-2xl bg-white text-primary hover:bg-white/90 shadow-2xl gap-2">
                  {isRtl ? 'ابدأ مجاناً الآن' : 'Get Started For Free'}
                  <Arrow className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
