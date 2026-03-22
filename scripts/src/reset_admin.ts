import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  const email = "admin@lms.ly"; // Assuming lms.ly based on earlier seeds, but feel free to change it!

  await db.insert(usersTable)
    .values({
      email,
      passwordHash: hash,
      fullName: "System Administrator",
      fullNameAr: "مدير النظام",
      role: "admin",
      isVerified: true,
      emailVerified: true,
      language: "en"
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { passwordHash: hash, role: "admin" }
    });

  console.log(`Successfully created (or reset the password for) ${email} to: password123`);
}

main().catch(console.error).finally(() => process.exit(0));
