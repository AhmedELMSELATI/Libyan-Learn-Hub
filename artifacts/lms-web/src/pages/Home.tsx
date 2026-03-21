import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetCourses, useGetCategories } from '@workspace/api-client-react';
import { BookOpen, Star, Users, ArrowRight, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';

export default function Home() {
  const { t, language } = useLanguage();
  
  // Fetch a few featured courses
  const { data: coursesData, isLoading: loadingCourses } = useGetCourses({ limit: 6 });
  const { data: categories, isLoading: loadingCategories } = useGetCategories();

  useSEO({
    title: t('home.hero.title'),
    description: t('home.hero.subtitle'),
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Libyan Learn Hub",
      "url": "https://libyan-learn-hub.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://libyan-learn-hub.com/courses?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  });

  return (
    <PageContainer>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-20 pb-32 lg:pt-32 lg:pb-40">
        {/* Abstract background image */}
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 mix-blend-multiply">
           <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Abstract background" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 mb-6 text-sm font-medium"
            >
              <Star className="w-4 h-4 fill-secondary" />
              <span>The #1 E-Learning Platform in Libya</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-display font-extrabold text-foreground leading-tight mb-6"
            >
              {t('home.hero.title')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
            >
              {t('home.hero.subtitle')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/courses">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 shadow-xl shadow-primary/20 rounded-2xl">
                  {t('home.hero.cta')}
                  <ArrowRight className="ms-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl border-2 hover:bg-muted">
                  Join as Teacher
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Browse by Subject</h2>
              <p className="text-muted-foreground">Find what you need to succeed</p>
            </div>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories?.map((cat) => (
                <Link key={cat.id} href={`/courses?categoryId=${cat.id}`}>
                  <div className="bg-card hover:bg-primary hover:text-white group border border-border/50 p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer text-center flex flex-col items-center justify-center gap-4 h-full">
                    <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <BookOpen className="w-6 h-6 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{language === 'ar' ? cat.nameAr : cat.name}</h3>
                      <p className="text-sm text-muted-foreground group-hover:text-white/80 mt-1">{cat.courseCount} Courses</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">{t('home.featured')}</h2>
              <p className="text-muted-foreground">Highly rated courses by top instructors</p>
            </div>
            <Link href="/courses" className="hidden sm:flex items-center gap-2 text-primary font-medium hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingCourses ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1,2,3].map(i => <div key={i} className="h-80 bg-card rounded-2xl animate-pulse" />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {coursesData?.courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 group flex flex-col h-full">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <PlayCircle className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-3 start-3 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-foreground shadow-sm">
                        {course.level}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> {course.lessonCount} Lessons</span>
                        <span>•</span>
                        <span>{Math.round(course.totalDuration / 60)}h</span>
                      </div>
                      <h3 className="font-display font-bold text-xl mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {language === 'ar' ? course.titleAr : course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {language === 'ar' ? course.descriptionAr : course.description}
                      </p>
                      <div className="pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                            {course.teacherName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{course.teacherName}</span>
                        </div>
                        <div className="font-bold text-lg text-primary">
                          {course.price === 0 ? t('course.free') : t('course.price', { price: course.price.toString() })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
