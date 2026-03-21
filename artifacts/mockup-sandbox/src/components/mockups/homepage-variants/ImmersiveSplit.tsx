import './_group.css';
import { BookOpen, Star, Users, Play, ArrowRight, Zap, Award, Globe } from 'lucide-react';

const COURSES = [
  { id: 1, title: 'Advanced Mathematics', titleAr: 'الرياضيات المتقدمة', teacher: 'أ. أحمد المنصوري', level: 'متقدم', price: 120, students: 1240, rating: 4.9, color: '#e0f5f3', icon: '📐' },
  { id: 2, title: 'Physics Fundamentals', titleAr: 'أساسيات الفيزياء', teacher: 'د. فاطمة البرغثي', level: 'مبتدئ', price: 0, students: 3400, rating: 4.8, color: '#fef3c7', icon: '⚛️' },
  { id: 3, title: 'Computer Science', titleAr: 'علوم الحاسوب', teacher: 'م. عمر الكيلاني', level: 'متوسط', price: 80, students: 890, rating: 4.7, color: '#f0e6ff', icon: '💻' },
  { id: 4, title: 'Arabic Literature', titleAr: 'الأدب العربي', teacher: 'د. نور الدين', level: 'متوسط', price: 60, students: 1100, rating: 4.6, color: '#fde8e8', icon: '📖' },
  { id: 5, title: 'Chemistry', titleAr: 'الكيمياء', teacher: 'د. فاطمة البرغثي', level: 'متقدم', price: 90, students: 740, rating: 4.5, color: '#e0f2e9', icon: '🧪' },
];

const CATEGORIES = [
  { name: 'الرياضيات', icon: '📐', count: 12 },
  { name: 'العلوم', icon: '🔬', count: 18 },
  { name: 'اللغة العربية', icon: '✍️', count: 9 },
  { name: 'الفيزياء', icon: '⚛️', count: 7 },
  { name: 'التاريخ', icon: '🏛️', count: 5 },
  { name: 'الكيمياء', icon: '🧪', count: 6 },
];

function MiniCourseCard({ course, rotation = 0, scale = 1 }: any) {
  return (
    <div style={{
      background: course.color,
      border: '1.5px solid rgba(0,0,0,0.06)',
      borderRadius: 16,
      padding: '14px 16px',
      transform: `rotate(${rotation}deg) scale(${scale})`,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      minWidth: 180,
      cursor: 'pointer',
      transition: 'transform 0.2s',
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{course.icon}</div>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, color: '#1e3a5f', marginBottom: 4, lineHeight: 1.3 }}>
        {course.titleAr}
      </div>
      <div style={{ fontFamily: 'Outfit', fontSize: 12, color: '#64748b', marginBottom: 8 }}>{course.teacher}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 14, color: '#1a9e8f' }}>
          {course.price === 0 ? 'مجاني' : `${course.price} د.ل`}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#64748b' }}>
          <span style={{ color: '#f59e0b' }}>★</span> {course.rating}
        </span>
      </div>
    </div>
  );
}

export function ImmersiveSplit() {
  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', background: '#fdfaf5', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 68, borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(253,250,245,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1a9e8f, #12756a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 18 }}>📚</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1e3a5f' }}>EduLibya</span>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500, color: '#64748b' }}>
          <span style={{ color: '#1a9e8f', fontWeight: 700 }}>الرئيسية</span>
          <span>الدورات</span>
          <span>المعلمون</span>
          <span>مباشر</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '8px 20px', borderRadius: 10, border: '1.5px solid #1a9e8f', color: '#1a9e8f', fontWeight: 600, fontSize: 14, background: 'transparent', cursor: 'pointer' }}>دخول</button>
          <button style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1a9e8f, #12756a)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,158,143,0.3)' }}>انضم مجاناً</button>
        </div>
      </nav>

      {/* Hero - split layout */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 68px)', gap: 0 }}>
        {/* Left: Content */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 48px 80px 56px', background: '#fdfaf5', position: 'relative' }}>
          {/* Decorative blob */}
          <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(26,158,143,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: '#e0f5f3', color: '#1a9e8f', fontSize: 13, fontWeight: 600, marginBottom: 24, width: 'fit-content' }}>
            <Zap size={13} />
            منصة التعلم الرقم 1 في ليبيا
          </div>

          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 56, lineHeight: 1.1, color: '#1e3a5f', marginBottom: 24 }}>
            ابدأ رحلتك<br />
            <span style={{ background: 'linear-gradient(135deg, #1a9e8f, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              التعليمية
            </span>
            <br />اليوم
          </h1>

          <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
            تعلّم مع أفضل المعلمين الليبيين في الرياضيات والعلوم والأدب وأكثر. دروس احترافية بالعربية.
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #1a9e8f, #12756a)', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(26,158,143,0.35)' }}>
              استكشف الدورات <ArrowRight size={18} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 14, background: '#fff', color: '#1e3a5f', fontWeight: 600, fontSize: 15, border: '1.5px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}>
              <Play size={16} fill="#1a9e8f" color="#1a9e8f" /> شاهد كيف نعمل
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40 }}>
            {[
              { val: '50+', label: 'دورة متاحة' },
              { val: '12k+', label: 'طالب نشط' },
              { val: '30+', label: 'معلم محترف' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontWeight: 900, fontSize: 28, color: '#1e3a5f', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Floating card mosaic */}
        <div style={{ background: 'linear-gradient(160deg, #1a9e8f 0%, #0d7a6e 60%, #1e3a5f 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,158,11,0.15) 0%, transparent 40%)' }} />
          
          {/* Cards floating in space */}
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Central feature card */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
              <MiniCourseCard course={COURSES[0]} scale={1.1} />
            </div>
            {/* Orbiting cards */}
            <div style={{ position: 'absolute', top: '18%', left: '12%' }}>
              <MiniCourseCard course={COURSES[1]} rotation={-4} />
            </div>
            <div style={{ position: 'absolute', top: '15%', right: '10%' }}>
              <MiniCourseCard course={COURSES[2]} rotation={5} />
            </div>
            <div style={{ position: 'absolute', bottom: '18%', left: '8%' }}>
              <MiniCourseCard course={COURSES[3]} rotation={3} />
            </div>
            <div style={{ position: 'absolute', bottom: '15%', right: '8%' }}>
              <MiniCourseCard course={COURSES[4]} rotation={-3} />
            </div>

            {/* Live badge */}
            <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '8px 16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'none' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>3 جلسات مباشرة الآن</span>
            </div>

            {/* Bottom badge */}
            <div style={{ position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '8px 20px', whiteSpace: 'nowrap' }}>
              <Award size={14} color="#f59e0b" />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>1,240 طالب انضم هذا الأسبوع</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category ribbon */}
      <section style={{ padding: '32px 56px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 8 }}>التخصصات:</span>
          {CATEGORIES.map(cat => (
            <button key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 100, background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.07)', fontWeight: 600, fontSize: 14, color: '#1e3a5f', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              <span>{cat.icon}</span>
              {cat.name}
              <span style={{ background: '#e0f5f3', color: '#1a9e8f', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cat.count}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
