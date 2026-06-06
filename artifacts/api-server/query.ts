import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
async function run() {
  const users = await db.select().from(usersTable).where(eq(usersTable.email, 'A95ALmeslati@gmail.com'));
  console.log(users);
  process.exit(0);
}
run();
