import './_group.css';
import { ArrowRight, BookOpen, ChevronRight, Zap, Star, Clock, Lock, CheckCircle, Circle } from 'lucide-react';

const SUBJECTS = [
  { id: 'math', label: 'الرياضيات', icon: '📐', color: '#e0f5f3', border: '#1a9e8f', courses: 12, desc: 'الجبر، التفاضل، الإحصاء' },
  { id: 'physics', label: 'الفيزياء', icon: '⚛️', color: '#fef3c7', border: '#f59e0b', courses: 7, desc: 'الميكانيكا، الكهرومغناطيسية' },
  { id: 'cs', label: 'الحاسوب', icon: '💻', color: '#f0e6ff', border: '#8b5cf6', courses: 9, desc: 'البرمجة، الشبكات، الذكاء الاصطناعي' },
  { id: 'arabic', label: 'اللغة العربية', icon: '✍️', color: '#fde8e8', border: '#ef4444', courses: 6, desc: 'النحو، الأدب، الإملاء' },
  { id: 'chem', label: 'الكيمياء', icon: '🧪', color: '#e0f2e9', border: '#22c55e', courses: 5, desc: 'العضوية، اللاعضوية، التحليلية' },
  { id: 'history', label: 'التاريخ', icon: '🏛️', color: '#faf0e6', border: '#d97706', courses: 4, desc: 'التاريخ الليبي، الإسلامي، العالمي' },
];

const PATH_STEPS = [
  { id: 1, title: 'أساسيات الرياضيات', duration: '18 ساعة', lessons: 24, completed: true, locked: false, level: 'مبتدئ' },
  { id: 2, title: 'الجبر المتوسط', duration: '22 ساعة', lessons: 30, completed: true, locked: false, level: 'متوسط' },
  { id: 3, title: 'حساب التفاضل والتكامل', duration: '35 ساعة', lessons: 42, completed: false, locked: false, level: 'متقدم', current: true },
  { id: 4, title: 'الإحصاء والاحتمالات', duration: '28 ساعة', lessons: 36, completed: false, locked: true, level: 'متقدم' },
  { id: 5, title: 'الرياضيات الجامعية', duration: '40 ساعة', lessons: 50, completed: false, locked: true, level: 'خبير' },
];

const levelColors: Record<string, { bg: string; text: string }> = {
  'مبتدئ': { bg: '#d1fae5', text: '#065f46' },
  'متوسط': { bg: '#fef3c7', text: '#92400e' },
  'متقدم': { bg: '#fee2e2', text: '#991b1b' },
  'خبير': { bg: '#ede9fe', text: '#5b21b6' },
};

function SubjectCard({ subject, selected }: { subject: typeof SUBJECTS[0], selected?: boolean }) {
  return (
    <div style={{
      background: selected ? subject.color : '#fff',
      border: `2px solid ${selected ? subject.border : 'rgba(0,0,0,0.07)'}`,
      borderRadius: 16,
      padding: '18px 20px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: selected ? `0 4px 20px ${subject.border}25` : '0 1px 6px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{subject.icon}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: '#1e3a5f', marginBottom: 4 }}>{subject.label}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, lineHeight: 1.4 }}>{subject.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: selected ? subject.border : '#64748b' }}>{subject.courses} دورة</span>
        {selected && <div style={{ width: 18, height: 18, borderRadius: '50%', background: subject.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={12} color="#fff" /></div>}
      </div>
    </div>
  );
}

function PathStep({ step, index }: { step: typeof PATH_STEPS[0], index: number }) {
  const lc = levelColors[step.level] || levelColors['مبتدئ'];
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', opacity: step.locked ? 0.5 : 1 }}>
      {/* Connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: step.completed ? '#1a9e8f' : step.current ? '#fff' : '#f1f5f9', border: step.current ? '3px solid #1a9e8f' : step.completed ? 'none' : '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: step.current ? '0 0 0 6px rgba(26,158,143,0.15)' : 'none', zIndex: 1, position: 'relative' }}>
          {step.locked ? <Lock size={14} color="#94a3b8" /> : step.completed ? <CheckCircle size={18} color="#fff" /> : <span style={{ fontWeight: 800, fontSize: 13, color: step.current ? '#1a9e8f' : '#94a3b8' }}>{index + 1}</span>}
        </div>
        {index < PATH_STEPS.length - 1 && (
          <div style={{ width: 2, height: 32, background: step.completed ? '#1a9e8f' : '#e2e8f0', marginTop: 0 }} />
        )}
      </div>
      {/* Card */}
      <div style={{ flex: 1, background: step.current ? '#fff' : step.completed ? '#f0faf9' : '#f8fafc', border: step.current ? '2px solid #1a9e8f' : '1.5px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '14px 18px', marginBottom: index < PATH_STEPS.length - 1 ? 0 : 0, boxShadow: step.current ? '0 4px 20px rgba(26,158,143,0.15)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1e3a5f' }}>{step.title}</span>
            {step.current && <span style={{ background: '#e0f5f3', color: '#1a9e8f', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>أنت هنا</span>}
          </div>
          <span style={{ background: lc.bg, color: lc.text, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>{step.level}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BookOpen size={11} /> {step.lessons} درس</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {step.duration}</span>
        </div>
        {step.current && (
          <button style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: '#1a9e8f', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}>
            تابع التعلم <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function PathDiscovery() {
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
          <span>المعلمون</span>
          <span style={{ color: '#1a9e8f', fontWeight: 700 }}>مساري التعليمي</span>
          <span>مباشر</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '8px 20px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', color: '#1e3a5f', fontWeight: 600, fontSize: 14, background: '#fff', cursor: 'pointer', fontFamily: 'Outfit' }}>دخول</button>
          <button style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1a9e8f, #12756a)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit', boxShadow: '0 4px 12px rgba(26,158,143,0.3)' }}>ابدأ مسارك</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: '#e0f5f3', color: '#1a9e8f', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <Zap size={13} />
            اختر تخصصك، ابنِ مسارك
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 46, lineHeight: 1.2, color: '#1e3a5f', marginBottom: 16 }}>
            ما الذي تريد<br /><span style={{ color: '#1a9e8f' }}>تعلّمه اليوم؟</span>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            اختر تخصصك وسنبني لك مساراً تعليمياً مخصصاً من المبتدئ إلى المتقدم.
          </p>
        </div>

        {/* Subject selector */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, color: '#1e3a5f', marginBottom: 20, textAlign: 'center' }}>اختر تخصصك</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            {SUBJECTS.map((s, i) => <SubjectCard key={s.id} subject={s} selected={i === 0} />)}
          </div>
        </div>

        {/* Learning path + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
          {/* Path */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: '#1e3a5f', marginBottom: 4 }}>مسار الرياضيات</h3>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>5 مراحل • 143 ساعة • شهادة إتمام</p>
              </div>
              {/* Progress ring */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 28, color: '#1a9e8f', lineHeight: 1 }}>40%</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>مكتمل</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, marginBottom: 28, overflow: 'hidden' }}>
              <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, #1a9e8f, #22d3bb)', borderRadius: 100 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PATH_STEPS.map((step, i) => <PathStep key={step.id} step={step} index={i} />)}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* CTA card */}
            <div style={{ background: 'linear-gradient(135deg, #1a9e8f, #12756a)', borderRadius: 20, padding: '28px 24px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
              <h4 style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>أنهِ مسارك واحصل على شهادتك</h4>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.5 }}>شهادات معتمدة تُعزز سيرتك الذاتية</p>
              <button style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: '#fff', color: '#1a9e8f', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}>
                تابع مسارك ←
              </button>
            </div>

            {/* Stats */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1.5px solid rgba(0,0,0,0.07)' }}>
              <h4 style={{ fontWeight: 700, fontSize: 15, color: '#1e3a5f', marginBottom: 16 }}>إحصائيات مسار الرياضيات</h4>
              {[
                { label: 'إجمالي المتعلمين', value: '4,200+' },
                { label: 'متوسط التقييم', value: '4.8 ★' },
                { label: 'معدل الإتمام', value: '78%' },
                { label: 'وقت الإنجاز', value: '4-6 أشهر' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1e3a5f' }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Quick enroll */}
            <div style={{ background: '#fef3c7', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>ابدأ مجاناً</span>
              </div>
              <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5, marginBottom: 12 }}>المرحلة الأولى متاحة مجاناً لجميع الطلاب الجدد</p>
              <button style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'Outfit' }}>
                ابدأ التعلم مجاناً
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
