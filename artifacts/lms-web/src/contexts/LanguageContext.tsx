import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.courses': 'Courses',
    'nav.live': 'Live Sessions',
    'nav.teachers': 'Teachers',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Log In',
    'nav.register': 'Sign Up',
    'home.hero.title': 'Unlock Your Potential with Top Experts',
    'home.hero.subtitle': 'Join thousands of Libyan students learning from the best teachers in the country. Master new skills, prepare for exams, and shape your future.',
    'home.hero.cta': 'Explore Courses',
    'home.featured': 'Featured Courses',
    'course.enroll': 'Enroll Now',
    'course.enrolled': 'Go to Course',
    'course.price': '{price} LYD',
    'course.free': 'Free',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.login.title': 'Welcome Back',
    'auth.login.submit': 'Log In',
    'auth.register.title': 'Create an Account',
    'auth.register.submit': 'Sign Up',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred. Please try again.',
    'courses.explore': 'Explore Courses',
    'courses.search': 'Search courses, topics, or teachers...',
    'courses.searchBtn': 'Search',
    'courses.filters': 'Filters',
    'courses.category': 'Category',
    'courses.allCategories': 'All Categories',
    'courses.level': 'Level',
    'courses.beginner': 'Beginner',
    'courses.intermediate': 'Intermediate',
    'courses.advanced': 'Advanced',
    'courses.noCourses': 'No courses found',
    'courses.adjustFilters': 'Try adjusting your filters or search term.',
    'courses.clearFilters': 'Clear Filters',
    'courses.showingResults': 'Showing {count} of {total} results',
    'courses.lessons': 'Lessons',
    'footer.description': 'Empowering Libyan students and teachers through modern, accessible, and high-quality online education.',
    'footer.explore': 'Explore',
    'footer.legal': 'Legal',
    'footer.contact': 'Contact',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.dmca': 'Copyright / DMCA',
    'footer.allRightsReserved': 'EduLibya. All rights reserved.',
  },
  ar: {
    'nav.courses': 'الدورات',
    'nav.live': 'البث المباشر',
    'nav.teachers': 'المعلمون',
    'nav.dashboard': 'لوحة التحكم',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'حساب جديد',
    'home.hero.title': 'أطلق العنان لإمكانياتك مع نخبة الخبراء',
    'home.hero.subtitle': 'انضم إلى آلاف الطلاب الليبيين الذين يتعلمون من أفضل المعلمين في البلاد. اكتسب مهارات جديدة، استعد للامتحانات، وارسم مستقبلك.',
    'home.hero.cta': 'استكشف الدورات',
    'home.featured': 'الدورات المميزة',
    'course.enroll': 'اشترك الآن',
    'course.enrolled': 'اذهب للدورة',
    'course.price': '{price} د.ل',
    'course.free': 'مجاناً',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.login.title': 'مرحباً بعودتك',
    'auth.login.submit': 'تسجيل الدخول',
    'auth.register.title': 'إنشاء حساب جديد',
    'auth.register.submit': 'تسجيل',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'courses.explore': 'استكشف الدورات',
    'courses.search': 'ابحث عن دورات، مواضيع، أو معلمين...',
    'courses.searchBtn': 'بحث',
    'courses.filters': 'التصنيفات',
    'courses.category': 'الفئة',
    'courses.allCategories': 'جميع الفئات',
    'courses.level': 'المستوى',
    'courses.beginner': 'مبتدئ',
    'courses.intermediate': 'متوسط',
    'courses.advanced': 'متقدم',
    'courses.noCourses': 'لا توجد دورات',
    'courses.adjustFilters': 'حاول تعديل الفلاتر أو مصطلح البحث.',
    'courses.clearFilters': 'مسح الفلاتر',
    'courses.showingResults': 'عرض {count} من {total} نتيجة',
    'courses.lessons': 'دروس',
    'footer.description': 'تمكين الطلاب والمعلمين في ليبيا من خلال تعليم عبر الإنترنت حديث ومتاح وعالي الجودة.',
    'footer.explore': 'استكشف',
    'footer.legal': 'قانوني',
    'footer.contact': 'تواصل معنا',
    'footer.terms': 'شروط الخدمة',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.dmca': 'حقوق الطبع والنشر',
    'footer.allRightsReserved': 'إديوليبيا. جميع الحقوق محفوظة.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar'); // Default Arabic

  useEffect(() => {
    const saved = localStorage.getItem('lms_language') as Language;
    if (saved && (saved === 'ar' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lms_language', lang);
  };

  const t = (key: string, variables?: Record<string, string>) => {
    let text = translations[language][key] || translations['en'][key] || key;
    if (variables) {
      Object.keys(variables).forEach(vKey => {
        text = text.replace(`{${vKey}}`, variables[vKey]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
