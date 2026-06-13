import 'dotenv/config';
import { db } from '@workspace/db';
import { coursesTable, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const all = await db
  .select({
    id: coursesTable.id,
    title: coursesTable.title,
    status: coursesTable.status,
    teacher: usersTable.fullName,
    createdAt: coursesTable.createdAt,
  })
  .from(coursesTable)
  .innerJoin(usersTable, eq(usersTable.id, coursesTable.teacherId))
  .orderBy(coursesTable.createdAt);

console.log('All courses in DB:');
console.table(all.map(c => ({ id: c.id, title: c.title, status: c.status, teacher: c.teacher, created: c.createdAt })));
process.exit(0);
