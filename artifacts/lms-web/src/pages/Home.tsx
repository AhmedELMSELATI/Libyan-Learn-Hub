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
        {/* Abstract Glowing Orbs for Premium Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
           <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-secondary/20 blur-[100px] rounded-full mix-blend-screen" />
           <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-accent/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>
        <div className="absolute inset-0 z-0 bg-background/40 backdrop-blur-[2px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-medium border-primary/20"
            >
              <Star className="w-4 h-4 text-secondary drop-shadow-[0_0_8px_rgba(191,247,64,0.8)]" />
              <span className="text-foreground/90">The #1 E-Learning Platform in Libya</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-display font-extrabold leading-tight mb-6"
            >
              <span className="text-foreground">{t('home.hero.title')}</span>
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
              {categories?.map((cat, i) => (
                <Link key={cat.id} href={`/courses?categoryId=${cat.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card hover:bg-primary/10 hover:border-primary/40 group p-6 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer text-center flex flex-col items-center justify-center gap-4 h-full hover:-translate-y-1"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary group-hover:to-secondary flex items-center justify-center transition-all duration-300 shadow-inner">
                      <BookOpen className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{language === 'ar' ? cat.nameAr : cat.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{cat.courseCount} Courses</p>
                    </div>
                  </motion.div>
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
              {coursesData?.courses.map((course, i) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 transition-all duration-500 group flex flex-col h-full hover:-translate-y-2"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors duration-500">
                          <PlayCircle className="w-14 h-14 text-primary/40 group-hover:text-primary pl-1 transition-colors" />
                        </div>
                      )}
                      <div className="absolute top-4 start-4 glass-panel px-3 py-1.5 rounded-full text-xs font-bold text-foreground">
                        {course.level}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1 relative">
                      <div className="absolute -top-6 right-6 w-12 h-12 rounded-full border-4 border-card bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {course.teacherName.charAt(0)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 font-medium">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary/70"/> {course.lessonCount} Lessons</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{Math.round(course.totalDuration / 60)}h</span>
                      </div>
                      <h3 className="font-display font-bold text-xl mb-2 line-clamp-2 text-foreground group-hover:text-gradient transition-all">
                        {language === 'ar' ? course.titleAr : course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1 leading-relaxed">
                        {language === 'ar' ? course.descriptionAr : course.description}
                      </p>
                      <div className="pt-4 border-t border-border/50 flex flex-wrap gap-2 items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Instructor</span>
                          <span className="text-sm font-bold text-foreground">{course.teacherName}</span>
                        </div>
                        <div className="glass-panel px-4 py-2 rounded-xl font-bold text-lg text-primary">
                          {course.price === 0 ? t('course.free') : t('course.price', { price: course.price.toString() })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
