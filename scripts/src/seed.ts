import { db } from "@workspace/db";
import { categoriesTable, usersTable, coursesTable, lessonsTable, liveSessionsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Categories
  const cats = await db.insert(categoriesTable).values([
    { name: "Mathematics", nameAr: "الرياضيات", icon: "📐" },
    { name: "Sciences", nameAr: "العلوم", icon: "🔬" },
    { name: "Arabic Language", nameAr: "اللغة العربية", icon: "📖" },
    { name: "English Language", nameAr: "اللغة الإنجليزية", icon: "🇬🇧" },
    { name: "History", nameAr: "التاريخ", icon: "🏛️" },
    { name: "Physics", nameAr: "الفيزياء", icon: "⚛️" },
    { name: "Chemistry", nameAr: "الكيمياء", icon: "🧪" },
    { name: "Biology", nameAr: "الأحياء", icon: "🧬" },
    { name: "Computer Science", nameAr: "علوم الحاسوب", icon: "💻" },
    { name: "Islamic Studies", nameAr: "الدراسات الإسلامية", icon: "🌙" },
  ]).returning().onConflictDoNothing();
  console.log(`Inserted ${cats.length} categories`);

  // Teacher users
  const pwdHash = await bcrypt.hash("password123", 10);
  const teachers = await db.insert(usersTable).values([
    {
      email: "ahmed@lms.ly",
      passwordHash: pwdHash,
      fullName: "Ahmed Al-Mansouri",
      fullNameAr: "أحمد المنصوري",
      role: "teacher" as const,
      bio: "Mathematics professor with 15 years of experience",
      bioAr: "أستاذ الرياضيات بخبرة 15 عامًا",
      expertise: "Mathematics, Algebra, Calculus",
      language: "ar" as const,
    },
    {
      email: "fatima@lms.ly",
      passwordHash: pwdHash,
      fullName: "Fatima Al-Zawiya",
      fullNameAr: "فاطمة الزاوية",
      role: "teacher" as const,
      bio: "Physics and Chemistry teacher",
      bioAr: "معلمة الفيزياء والكيمياء",
      expertise: "Physics, Chemistry",
      language: "ar" as const,
    },
    {
      email: "omar@lms.ly",
      passwordHash: pwdHash,
      fullName: "Omar Benghazi",
      fullNameAr: "عمر البنغازي",
      role: "teacher" as const,
      bio: "Computer Science instructor",
      bioAr: "مدرس علوم الحاسوب",
      expertise: "Programming, Web Development",
      language: "ar" as const,
    },
  ]).returning().onConflictDoNothing();
  console.log(`Inserted ${teachers.length} teachers`);

  // Student users
  await db.insert(usersTable).values([
    {
      email: "student@lms.ly",
      passwordHash: pwdHash,
      fullName: "Ali Student",
      fullNameAr: "علي الطالب",
      role: "student" as const,
      language: "ar" as const,
    },
  ]).onConflictDoNothing();

  const allCats = await db.select().from(categoriesTable);
  const mathCat = allCats.find(c => c.name === "Mathematics")!;
  const physicsCat = allCats.find(c => c.name === "Physics")!;
  const csCat = allCats.find(c => c.name === "Computer Science")!;
  const arabicCat = allCats.find(c => c.name === "Arabic Language")!;
  const chemCat = allCats.find(c => c.name === "Chemistry")!;
  const biocat = allCats.find(c => c.name === "Biology")!;

  const allTeachers = await db.select().from(usersTable).where(
    (await import("drizzle-orm")).eq(usersTable.role, "teacher")
  );
  const t1 = allTeachers[0];
  const t2 = allTeachers[1];
  const t3 = allTeachers[2];

  if (!t1 || !t2 || !t3) {
    console.log("Teachers already seeded, skipping courses");
    return;
  }

  // Courses
  const courses = await db.insert(coursesTable).values([
    {
      title: "Algebra Fundamentals",
      titleAr: "أساسيات الجبر",
      description: "Complete algebra course from basics to advanced",
      descriptionAr: "دورة شاملة في الجبر من الأساسيات إلى المتقدم",
      price: "150.00",
      level: "beginner" as const,
      language: "ar",
      categoryId: mathCat?.id || 1,
      teacherId: t1.id,
      isPublished: true,
      thumbnailUrl: "/images/course-math.jpg",
    },
    {
      title: "Calculus I",
      titleAr: "حساب التفاضل والتكامل ١",
      description: "Introduction to differential and integral calculus",
      descriptionAr: "مقدمة في حساب التفاضل والتكامل",
      price: "200.00",
      level: "intermediate" as const,
      language: "ar",
      categoryId: mathCat?.id || 1,
      teacherId: t1.id,
      isPublished: true,
      thumbnailUrl: "/images/course-calc.jpg",
    },
    {
      title: "Physics: Mechanics",
      titleAr: "الفيزياء: الميكانيكا",
      description: "Classical mechanics and Newtonian physics",
      descriptionAr: "الميكانيكا الكلاسيكية وفيزياء نيوتن",
      price: "180.00",
      level: "intermediate" as const,
      language: "ar",
      categoryId: physicsCat?.id || 6,
      teacherId: t2.id,
      isPublished: true,
    },
    {
      title: "Web Development Basics",
      titleAr: "أساسيات تطوير الويب",
      description: "HTML, CSS, JavaScript fundamentals",
      descriptionAr: "HTML وCSS وJavaScript للمبتدئين",
      price: "250.00",
      level: "beginner" as const,
      language: "ar",
      categoryId: csCat?.id || 9,
      teacherId: t3.id,
      isPublished: true,
    },
    {
      title: "Python Programming",
      titleAr: "برمجة بايثون",
      description: "Complete Python programming course",
      descriptionAr: "دورة شاملة في برمجة بايثون",
      price: "300.00",
      level: "beginner" as const,
      language: "en",
      categoryId: csCat?.id || 9,
      teacherId: t3.id,
      isPublished: true,
    },
    {
      title: "Arabic Grammar",
      titleAr: "قواعد اللغة العربية",
      description: "Comprehensive Arabic grammar and linguistics",
      descriptionAr: "قواعد شاملة في النحو والصرف",
      price: "100.00",
      level: "beginner" as const,
      language: "ar",
      categoryId: arabicCat?.id || 3,
      teacherId: t1.id,
      isPublished: true,
    },
    {
      title: "Chemistry: Organic Chemistry",
      titleAr: "الكيمياء العضوية",
      description: "Introduction to organic chemistry",
      descriptionAr: "مقدمة في الكيمياء العضوية",
      price: "220.00",
      level: "advanced" as const,
      language: "ar",
      categoryId: chemCat?.id || 7,
      teacherId: t2.id,
      isPublished: true,
    },
    {
      title: "Biology: Cell Biology",
      titleAr: "علم الأحياء: علم الخلية",
      description: "Introduction to cell biology and genetics",
      descriptionAr: "مقدمة في علم الخلية والوراثة",
      price: "190.00",
      level: "intermediate" as const,
      language: "ar",
      categoryId: biocat?.id || 8,
      teacherId: t2.id,
      isPublished: true,
    },
  ]).returning().onConflictDoNothing();
  console.log(`Inserted ${courses.length} courses`);

  // Lessons for first course
  if (courses.length > 0) {
    const firstCourse = courses[0];
    await db.insert(lessonsTable).values([
      { courseId: firstCourse.id, title: "Introduction to Algebra", titleAr: "مقدمة في الجبر", duration: 30, order: 1, isFree: true, type: "video" as const },
      { courseId: firstCourse.id, title: "Variables and Expressions", titleAr: "المتغيرات والتعبيرات", duration: 45, order: 2, isFree: false, type: "video" as const },
      { courseId: firstCourse.id, title: "Linear Equations", titleAr: "المعادلات الخطية", duration: 60, order: 3, isFree: false, type: "video" as const },
      { courseId: firstCourse.id, title: "Quadratic Equations", titleAr: "المعادلات التربيعية", duration: 75, order: 4, isFree: false, type: "video" as const },
      { courseId: firstCourse.id, title: "Practice Problems", titleAr: "تمارين تطبيقية", duration: 30, order: 5, isFree: false, type: "quiz" as const },
    ]).onConflictDoNothing();
  }

  // Live sessions
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await db.insert(liveSessionsTable).values([
    {
      teacherId: t1.id,
      title: "Live Q&A: Algebra Problems",
      titleAr: "جلسة مباشرة: أسئلة الجبر",
      description: "Live session to solve algebra problems",
      scheduledAt: tomorrow,
      durationMinutes: 90,
      maxParticipants: 50,
      meetingUrl: "https://meet.jit.si/lms-libya-algebra-qa",
      status: "scheduled" as const,
    },
    {
      teacherId: t2.id,
      title: "Physics Lab: Experiments",
      titleAr: "مختبر الفيزياء: التجارب",
      description: "Virtual physics lab demonstration",
      scheduledAt: nextWeek,
      durationMinutes: 120,
      maxParticipants: 30,
      meetingUrl: "https://meet.jit.si/lms-libya-physics-lab",
      status: "scheduled" as const,
    },
  ]).onConflictDoNothing();

  console.log("Seeding complete!");
}

seed().catch(console.error);
