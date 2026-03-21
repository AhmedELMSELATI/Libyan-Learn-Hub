import './_group.css';
import { Star, Users, BookOpen, ArrowRight, Play, ChevronRight, Award, MessageCircle, Video } from 'lucide-react';

const TEACHERS = [
  {
    name: 'د. فاطمة البرغثي',
    subject: 'الفيزياء والكيمياء',
    avatar: '👩‍🔬',
    rating: 4.9,
    students: 4200,
    courses: 6,
    bio: 'دكتوراه في الفيزياء النظرية من جامعة طرابلس. 15 عاماً من الخبرة في التدريس.',
    color: '#e0f5f3',
    featured: true,
    badges: ['دكتوراه', 'الأعلى تقييماً'],
  },
  {
    name: 'أ. أحمد المنصوري',
    subject: 'الرياضيات',
    avatar: '👨‍🏫',
    rating: 4.8,
    students: 3100,
    courses: 5,
    bio: 'أستاذ في كلية الهندسة، متخصص في التحليل الرياضي والإحصاء.',
    color: '#fef3c7',
    featured: false,
    badges: ['أستاذ معتمد'],
  },
  {
    name: 'م. عمر الكيلاني',
    subject: 'علوم الحاسوب',
    avatar: '👨‍💻',
    rating: 4.7,
    students: 2400,
    courses: 4,
    bio: 'مهندس برمجيات في شركة تقنية دولية. مدرّب في تطوير تطبيقات الويب والذكاء الاصطناعي.',
    color: '#f0e6ff',
    featured: false,
    badges: ['مطور محترف'],
  },
];

const RECENT_COURSES = [
  { teacher: 'د. فاطمة البرغثي', title: 'الفيزياء النووية المتقدمة', students: 890, price: 120, icon: '⚛️' },
  { teacher: 'أ. أحمد المنصوري', title: 'التفاضل والتكامل — المستوى الثاني', students: 1100, price: 90, icon: '📐' },
  { teacher: 'م. عمر الكيلاني', title: 'Python للمبتدئين', students: 2100, price: 0, icon: '🐍' },
];

function TeacherCard({ teacher, featured }: { teacher: typeof TEACHERS[0], featured?: boolean }) {
  return (
    <div style={{
      background: '#fff',
      border: featured ? '2px solid #1a9e8f' : '1.5px solid rgba(0,0,0,0.07)',
      borderRadius: 20,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: featured ? '0 8px 32px rgba(26,158,143,0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s',
    }}>
      {featured && (
        <div style={{ background: 'linear-gradient(135deg, #1a9e8f, #12756a)', padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={13} color="#fff" />
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>معلم مميز هذا الشهر</span>
        </div>
      )}
      <div style={{ padding: 24 }}>
        {/* Avatar & basics */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: teacher.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            {teacher.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e3a5f', marginBottom: 3 }}>{teacher.name}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{teacher.subject}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {teacher.badges.map(b => (
                <span key={b} style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#64748b' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 18 }}>{teacher.bio}</p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: '14px 0', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e3a5f' }}>{teacher.rating}</div>
            <div style={{ fontSize: 11, color: '#f59e0b' }}>★ التقييم</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e3a5f' }}>{teacher.students.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>طالب</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e3a5f' }}>{teacher.courses}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>دورة</div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: featured ? 'linear-gradient(135deg, #1a9e8f, #12756a)' : '#f8fafc', color: featured ? '#fff' : '#1e3a5f', border: featured ? 'none' : '1.5px solid rgba(0,0,0,0.08)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit' }}>
            عرض الدورات
          </button>
          <button style={{ width: 42, height: 42, borderRadius: 12, background: '#f8fafc', border: '1.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <MessageCircle size={16} color="#64748b" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeacherCommunity() {
  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', background: '#fdfaf5', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 68, borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fdfaf5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1a9e8f, #12756a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18 }}>📚</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1e3a5f' }}>EduLibya</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 500, color: '#64748b' }}>
          <span>الدورات</span>
          <span style={{ color: '#1a9e8f', fontWeight: 700 }}>المعلمون</span>
          <span>مباشر</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '8px 20px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', color: '#1e3a5f', fontWeight: 600, fontSize: 14, background: '#fff', cursor: 'pointer', fontFamily: 'Outfit' }}>دخول</button>
          <button style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: '#1a9e8f', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit' }}>علّم معنا</button>
        </div>
      </nav>

      {/* Hero — teacher-forward */}
      <section style={{ padding: '64px 56px 48px', display: 'flex', alignItems: 'center', gap: 60 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            30+ معلم ليبي محترف
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 50, lineHeight: 1.15, color: '#1e3a5f', marginBottom: 20 }}>
            تعلّم من أفضل<br />
            <span style={{ color: '#1a9e8f' }}>المعلمين الليبيين</span>
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            وراء كل دورة ناجحة معلّم شغوف. تعرّف على فريقنا من الخبراء الذين يؤمنون بتحويل التعليم في ليبيا.
          </p>
          <div style={{ display: 'flex', gap: 14 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 14, background: 'linear-gradient(135deg, #1a9e8f, #12756a)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,158,143,0.3)', fontFamily: 'Outfit' }}>
              ابدأ التعلم الآن <ArrowRight size={16} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 14, background: '#fff', color: '#1e3a5f', fontWeight: 600, fontSize: 15, border: '1.5px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontFamily: 'Outfit' }}>
              <Video size={15} color="#1a9e8f" /> انضم كمعلم
            </button>
          </div>
        </div>
        {/* Social proof stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320, flexShrink: 0 }}>
          {[
            { text: '"شرح رائع، المعلمة أجابت على كل أسئلتي"', name: 'سارة ع.', course: 'الفيزياء' },
            { text: '"تعلمت أكثر من الجامعة في أسبوعين فقط!"', name: 'خالد م.', course: 'البرمجة' },
            { text: '"يستحق كل ريال. المحتوى احترافي جداً"', name: 'ريم ط.', course: 'الكيمياء' },
          ].map((r, i) => (
            <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 13, color: '#1e3a5f', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>{r.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: '#64748b' }}>{r.name}</span>
                <span style={{ background: '#e0f5f3', color: '#1a9e8f', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{r.course}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Teacher grid */}
      <section style={{ padding: '0 56px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 26, color: '#1e3a5f' }}>معلمونا المميزون</h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1a9e8f', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}>
            عرض جميع المعلمين <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TEACHERS.map((t, i) => <TeacherCard key={i} teacher={t} featured={t.featured} />)}
        </div>
      </section>

      {/* Recent launches */}
      <section style={{ padding: '0 56px 48px' }}>
        <div style={{ background: '#1e3a5f', borderRadius: 20, padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>أحدث الدورات</h3>
            <button style={{ color: '#1a9e8f', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}>عرض الكل ←</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {RECENT_COURSES.map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 18px', cursor: 'pointer' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>{c.teacher}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{c.students.toLocaleString()} طالب</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: c.price === 0 ? '#1a9e8f' : '#f59e0b' }}>{c.price === 0 ? 'مجاني' : `${c.price} د.ل`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
