import './_group.css';
import { Search, Filter, BookOpen, Clock, Star, ArrowUpDown, SlidersHorizontal, ChevronRight, Bookmark, TrendingUp } from 'lucide-react';

const COURSES = [
  { id: 1, titleAr: 'الرياضيات المتقدمة — حساب التفاضل والتكامل', teacher: 'أ. أحمد المنصوري', level: 'متقدم', price: 120, students: 1240, rating: 4.9, reviews: 184, lessons: 42, hours: 38, tag: 'الأكثر مبيعاً', tagColor: '#f59e0b', icon: '📐', category: 'الرياضيات' },
  { id: 2, titleAr: 'أساسيات الفيزياء — الفيزياء العامة للمبتدئين', teacher: 'د. فاطمة البرغثي', level: 'مبتدئ', price: 0, students: 3400, rating: 4.8, reviews: 412, lessons: 28, hours: 22, tag: 'مجاني', tagColor: '#1a9e8f', icon: '⚛️', category: 'الفيزياء' },
  { id: 3, titleAr: 'علوم الحاسوب — البرمجة بلغة Python', teacher: 'م. عمر الكيلاني', level: 'متوسط', price: 80, students: 890, rating: 4.7, reviews: 93, lessons: 36, hours: 30, tag: 'جديد', tagColor: '#8b5cf6', icon: '💻', category: 'الحاسوب' },
  { id: 4, titleAr: 'الأدب العربي الكلاسيكي — الشعر الجاهلي', teacher: 'د. نور الدين', level: 'متوسط', price: 60, students: 1100, rating: 4.6, reviews: 127, lessons: 24, hours: 18, tag: null, tagColor: '', icon: '📖', category: 'اللغة العربية' },
  { id: 5, titleAr: 'الكيمياء العضوية — مدخل شامل', teacher: 'د. فاطمة البرغثي', level: 'متقدم', price: 90, students: 740, rating: 4.5, reviews: 78, lessons: 32, hours: 28, tag: null, tagColor: '', icon: '🧪', category: 'الكيمياء' },
  { id: 6, titleAr: 'التاريخ الليبي — من الفينيقيين إلى الاستقلال', teacher: 'أ. خالد الطرابلسي', level: 'مبتدئ', price: 45, students: 560, rating: 4.4, reviews: 54, lessons: 18, hours: 14, tag: null, tagColor: '', icon: '🏛️', category: 'التاريخ' },
];

const CATEGORIES = ['الكل', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الحاسوب', 'اللغة العربية', 'التاريخ', 'الأحياء'];

const levelColors: Record<string, string> = {
  'مبتدئ': '#d1fae5',
  'متوسط': '#fef3c7',
  'متقدم': '#fee2e2',
};
const levelTextColors: Record<string, string> = {
  'مبتدئ': '#065f46',
  'متوسط': '#92400e',
  'متقدم': '#991b1b',
};

function CourseRow({ course }: { course: typeof COURSES[0] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 120px 100px 80px 44px', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 14, background: '#fff', border: '1.5px solid rgba(0,0,0,0.06)', transition: 'all 0.15s', cursor: 'pointer' }}>
      {/* Icon */}
      <div style={{ width: 52, height: 52, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        {course.icon}
      </div>
      {/* Title + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {course.tag && (
            <span style={{ background: course.tagColor + '20', color: course.tagColor, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{course.tag}</span>
          )}
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{course.category}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e3a5f', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.titleAr}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>بقلم {course.teacher}</div>
      </div>
      {/* Rating */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#f59e0b' }}>{course.rating}</span>
          <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>({course.reviews})</span>
      </div>
      {/* Duration */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1e3a5f' }}>{course.lessons} درس</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{course.hours} ساعة</span>
      </div>
      {/* Level */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ background: levelColors[course.level], color: levelTextColors[course.level], fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>{course.level}</span>
      </div>
      {/* Price */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 17, color: course.price === 0 ? '#1a9e8f' : '#1e3a5f' }}>
          {course.price === 0 ? 'مجاني' : `${course.price}`}
        </span>
        {course.price > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>د.ل</span>}
      </div>
      {/* Bookmark */}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.06)' }}>
        <Bookmark size={16} color="#94a3b8" />
      </div>
    </div>
  );
}

export function CourseMarketplace() {
  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Compact header */}
      <header style={{ background: '#1e3a5f', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1a9e8f, #12756a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>EduLibya</span>
        </div>
        {/* Inline search */}
        <div style={{ flex: 1, maxWidth: 500, margin: '0 40px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input style={{ width: '100%', padding: '8px 42px 8px 14px', borderRadius: 10, border: 'none', fontSize: 14, background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontFamily: 'Outfit' }} placeholder="ابحث عن دورة، معلم، أو موضوع..." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: 13, background: 'transparent', cursor: 'pointer' }}>دخول</button>
          <button style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#1a9e8f', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>مجاناً</button>
        </div>
      </header>

      {/* Hero strip */}
      <div style={{ background: 'linear-gradient(135deg, #1a9e8f, #0d7a6e)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>منصة التعلم الليبية الأولى</p>
          <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1.2 }}>50+ دورة من أفضل المعلمين الليبيين</h1>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['12k+', 'طالب'], ['50+', 'دورة'], ['4.8', 'تقييم']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 24, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
            {CATEGORIES.map((cat, i) => (
              <button key={cat} style={{ padding: '7px 16px', borderRadius: 8, border: i === 0 ? 'none' : '1.5px solid rgba(0,0,0,0.08)', background: i === 0 ? '#1a9e8f' : '#fff', color: i === 0 ? '#fff' : '#1e3a5f', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Outfit' }}>
                {cat}
              </button>
            ))}
          </div>
          {/* Sort/filter */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.08)', background: '#fff', color: '#1e3a5f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit' }}>
              <SlidersHorizontal size={14} /> تصفية
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,0.08)', background: '#fff', color: '#1e3a5f', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit' }}>
              <ArrowUpDown size={14} /> ترتيب
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 120px 100px 80px 44px', gap: 16, padding: '8px 20px', marginBottom: 8 }}>
          {['', 'الدورة', 'التقييم', 'المدة', 'المستوى', 'السعر', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>{h}</div>
          ))}
        </div>

        {/* Course list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {COURSES.map(c => <CourseRow key={c.id} course={c} />)}
        </div>

        {/* Trending badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '14px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #fef3c7, #fde8a8)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <TrendingUp size={16} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>الأكثر بحثاً هذا الأسبوع:</span>
          {['الفيزياء النووية', 'البرمجة بـ Python', 'الرياضيات الجامعية'].map(t => (
            <span key={t} style={{ padding: '4px 12px', borderRadius: 100, background: '#fff', fontSize: 13, color: '#92400e', fontWeight: 600, cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
