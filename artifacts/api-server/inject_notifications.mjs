import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    const admins = await client.query("SELECT id, \"fullName\" FROM users WHERE role = 'admin'");
    const courses = await client.query(
      "SELECT c.id, c.title, c.\"titleAr\", u.\"fullName\" FROM courses c JOIN users u ON u.id = c.\"teacherId\" WHERE c.status = 'pending_review'"
    );

    console.log('Found', admins.rows.length, 'admin(s):', admins.rows.map(a => a.fullName));
    console.log('Found', courses.rows.length, 'pending_review course(s):', courses.rows.map(c => c.title));

    let inserted = 0;
    for (const course of courses.rows) {
      for (const admin of admins.rows) {
        const existing = await client.query(
          "SELECT id FROM notifications WHERE \"userId\" = $1 AND type = 'course_submitted' AND \"referenceId\" = $2",
          [admin.id, course.id]
        );
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO notifications ("userId", type, title, "titleAr", message, "messageAr", "referenceId", "isRead")
             VALUES ($1, 'course_submitted', $2, $3, $4, $5, $6, false)`,
            [
              admin.id,
              'New Course Pending Review',
              'دورة جديدة تنتظر المراجعة',
              `A new course "${course.title}" by ${course.fullName} has been submitted for review.`,
              `تم إرسال دورة جديدة "${course.titleAr}" بواسطة ${course.fullName} للمراجعة.`,
              course.id
            ]
          );
          console.log(`✓ Inserted notification: course "${course.title}" → admin ${admin.id} (${admin.fullName})`);
          inserted++;
        } else {
          console.log(`- Already exists: course "${course.title}" → admin ${admin.id}`);
        }
      }
    }

    console.log(`\nDone! ${inserted} new notification(s) inserted.`);
  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
