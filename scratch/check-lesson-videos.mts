import { db, lessonsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const lessons = await db
  .select({
    id: lessonsTable.id,
    title: lessonsTable.title,
    type: lessonsTable.type,
    videoUrl: lessonsTable.videoUrl,
    videoFilePath: lessonsTable.videoFilePath,
  })
  .from(lessonsTable)
  .where(eq(lessonsTable.courseId, 9));

console.log(JSON.stringify(lessons, null, 2));
process.exit(0);
