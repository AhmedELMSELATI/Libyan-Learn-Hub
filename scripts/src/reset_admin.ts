import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  const result = await db.update(usersTable)
    .set({ passwordHash: hash })
    .where(eq(usersTable.email, "admin@edulibya.ly"))
    .returning();

  if (result.length > 0) {
    console.log("Successfully reset password for admin@edulibya.ly to: password123");
  } else {
    console.log("Error: User admin@edulibya.ly not found in the database. Are you sure the email is correct?");
  }
}

main().catch(console.error).finally(() => process.exit(0));
