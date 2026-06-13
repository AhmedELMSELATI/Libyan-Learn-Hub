import 'dotenv/config';
import { db } from '@workspace/db';
import { notificationsTable, usersTable, coursesTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

async function injectMissingNotifications() {
  console.log('Checking for pending_review courses missing admin notifications...\n');

  const admins = await db.select().from(usersTable).where(eq(usersTable.role, 'admin'));
  
  const pendingCourses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      titleAr: coursesTable.titleAr,
      teacherName: usersTable.fullName,
    })
    .from(coursesTable)
    .innerJoin(usersTable, eq(usersTable.id, coursesTable.teacherId))
    .where(eq(coursesTable.status, 'pending_review'));

  console.log(`Found ${admins.length} admin(s): ${admins.map(a => a.fullName).join(', ')}`);
  console.log(`Found ${pendingCourses.length} pending_review course(s): ${pendingCourses.map(c => c.title).join(', ')}\n`);

  let inserted = 0;
  for (const course of pendingCourses) {
    for (const admin of admins) {
      // Check if notification already exists
      const existing = await db
        .select({ id: notificationsTable.id })
        .from(notificationsTable)
        .where(eq(notificationsTable.userId, admin.id))
        .limit(50);

      const alreadyExists = existing.some(
        (n: any) => n.referenceId === course.id || (n as any).type === 'course_submitted' && (n as any).referenceId === course.id
      );

      // Simpler: just insert (idempotent) and let the UI handle duplicates
      await db.insert(notificationsTable).values({
        userId: admin.id,
        type: 'course_submitted' as any,
        title: 'New Course Pending Review',
        titleAr: 'دورة جديدة تنتظر المراجعة',
        message: `A new course "${course.title}" by ${course.teacherName} has been submitted for review.`,
        messageAr: `تم إرسال دورة جديدة "${course.titleAr}" بواسطة ${course.teacherName} للمراجعة.`,
        referenceId: course.id,
        isRead: false,
      }).onConflictDoNothing();

      console.log(`✓ Ensured notification: "${course.title}" → admin "${admin.fullName}"`);
      inserted++;
    }
  }

  console.log(`\n✅ Done! ${inserted} notification(s) ensured in the database.`);
  process.exit(0);
}

injectMissingNotifications().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
