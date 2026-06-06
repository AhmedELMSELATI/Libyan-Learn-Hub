import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Manually parse .env to avoid dotenv dependency issues
try {
  const envPath = path.resolve('../../artifacts/api-server/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function deleteTeachersOnly() {
  console.log('Starting deletion of all registered teachers and their dependent data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get all teacher IDs
    const teacherRes = await client.query("SELECT id FROM users WHERE role = 'teacher'");
    const teacherIds = teacherRes.rows.map(r => r.id);

    if (teacherIds.length === 0) {
      console.log('No teachers found in the system.');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`Found ${teacherIds.length} teachers to delete (IDs: ${teacherIds.join(', ')}).`);

    // 2. Find all courses owned by these teachers
    const courseRes = await client.query(
      `SELECT id FROM courses WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    const courseIds = courseRes.rows.map(r => r.id);
    console.log(`Found ${courseIds.length} courses owned by these teachers.`);

    // 3. Delete course-related data
    if (courseIds.length > 0) {
      // Delete lesson progress
      await client.query(
        `DELETE FROM lesson_progress WHERE lesson_id IN (
          SELECT id FROM lessons WHERE section_id IN (
            SELECT id FROM sections WHERE course_id = ANY($1)
          )
        )`,
        [courseIds]
      );
      // Delete lessons
      await client.query(
        `DELETE FROM lessons WHERE section_id IN (
          SELECT id FROM sections WHERE course_id = ANY($1)
        )`,
        [courseIds]
      );
      // Delete sections
      await client.query(
        `DELETE FROM sections WHERE course_id = ANY($1)`,
        [courseIds]
      );
      // Delete enrollments
      await client.query(
        `DELETE FROM enrollments WHERE course_id = ANY($1)`,
        [courseIds]
      );
      // Delete reviews
      await client.query(
        `DELETE FROM reviews WHERE course_id = ANY($1)`,
        [courseIds]
      );
      // Delete wishlists
      await client.query(
        `DELETE FROM wishlists WHERE course_id = ANY($1)`,
        [courseIds]
      );
      // Delete courses
      await client.query(
        `DELETE FROM courses WHERE id = ANY($1)`,
        [courseIds]
      );
    }

    // 4. Delete live sessions and related registrations/questions
    await client.query(
      `DELETE FROM session_registrations WHERE session_id IN (
        SELECT id FROM live_sessions WHERE teacher_id = ANY($1)
      )`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM session_questions WHERE session_id IN (
        SELECT id FROM live_sessions WHERE teacher_id = ANY($1)
      )`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM live_sessions WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );

    // 5. Delete tutoring listings and requests
    await client.query(
      `DELETE FROM tutoring_requests WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM tutoring_listings WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );

    // 6. Delete other teacher specific details
    await client.query(
      `DELETE FROM teacher_earnings WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM teacher_devices WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM student_endorsements WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM profile_analytics WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM content_verification_jobs WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );
    await client.query(
      `DELETE FROM advertisements WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );

    // Update academy subjects to set teacher_id to NULL rather than deleting the subject
    await client.query(
      `UPDATE academy_subjects SET teacher_id = NULL WHERE teacher_id = ANY($1)`,
      [teacherIds]
    );

    // 7. Finally, delete the teachers from the users table
    const deleteRes = await client.query(
      `DELETE FROM users WHERE id = ANY($1) AND role = 'teacher'`,
      [teacherIds]
    );

    await client.query('COMMIT');
    console.log(`Successfully deleted ${deleteRes.rowCount} teachers from the database.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error executing deletion of teachers:', error);
  } finally {
    client.release();
  }
}

async function wipeDatabase() {
  console.log('Starting complete database wipe (truncating all tables)...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get all user tables in public schema
    const tablesRes = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'spatial_ref_sys'"
    );
    const tables = tablesRes.rows.map(r => `"${r.tablename}"`);
    
    if (tables.length > 0) {
      const truncateQuery = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`;
      await client.query(truncateQuery);
      console.log('Successfully truncated all tables.');
    } else {
      console.log('No tables found to truncate.');
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error executing database wipe:', error);
  } finally {
    client.release();
  }
}

const action = process.argv[2];
if (action === 'delete-teachers') {
  deleteTeachersOnly().then(() => pool.end());
} else if (action === 'wipe-db') {
  wipeDatabase().then(() => pool.end());
} else {
  console.log('Please specify an action: "delete-teachers" or "wipe-db"');
  pool.end();
}
