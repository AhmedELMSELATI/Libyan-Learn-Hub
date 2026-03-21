import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetCourses, useGetCategories, type GetCoursesLevel, type GetCoursesLanguage } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, PlayCircle, BookOpen } from 'lucide-react';

export default function Courses() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [level, setLevel] = useState<GetCoursesLevel | undefined>();
  const [courseLanguage, setCourseLanguage] = useState<GetCoursesLanguage | undefined>();

  const { data: categories } = useGetCategories();
  
  const { data: coursesData, isLoading } = useGetCourses({
    search: search || undefined,
    categoryId,
    level,
    language: courseLanguage,
    limit: 12
  });

  return (
    <PageContainer>
      <div className="bg-primary/5 py-12 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">Explore Courses</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Search courses, topics, or teachers..." 
                className="pl-12 h-14 bg-card rounded-2xl text-lg shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-8">
          <div className="flex items-center gap-2 font-display font-bold text-lg mb-4">
            <Filter className="w-5 h-5 text-primary" /> Filters
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Category</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setCategoryId(undefined)}
                className={`text-sm w-full text-start px-3 py-2 rounded-lg transition-colors ${!categoryId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
              >
                All Categories
              </button>
              {categories?.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`text-sm w-full text-start px-3 py-2 rounded-lg transition-colors ${categoryId === cat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                >
                  {language === 'ar' ? cat.nameAr : cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Level</h3>
            <div className="space-y-2">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <label key={lvl} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-muted rounded-lg">
                  <input 
                    type="radio" 
                    name="level" 
                    className="accent-primary w-4 h-4"
                    checked={level === lvl}
                    onChange={() => setLevel(lvl as GetCoursesLevel)}
                    onClick={(e) => {
                      // Allow unchecking by clicking checked radio
                      if (level === lvl) {
                        e.preventDefault();
                        setLevel(undefined);
                      }
                    }}
                  />
                  <span className="text-sm capitalize">{lvl}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-card rounded-2xl animate-pulse border border-border" />)}
            </div>
          ) : coursesData?.courses.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-foreground">No courses found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
              <Button variant="outline" className="mt-6" onClick={() => {setSearch(''); setCategoryId(undefined); setLevel(undefined);}}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-muted-foreground">
                Showing {coursesData?.courses.length} of {coursesData?.total} results
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-display font-bold text-lg mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {language === 'ar' ? course.titleAr : course.title}
                        </h3>
                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground truncate pe-2">{course.teacherName}</span>
                          <div className="font-bold text-primary shrink-0">
                            {course.price === 0 ? t('course.free') : `${course.price} LYD`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
