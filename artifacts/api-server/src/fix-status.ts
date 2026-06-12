import { db } from "@workspace/db";
import { teacherEarningsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Fixing backfilled earnings status...");
  
  const res = await db.update(teacherEarningsTable)
    .set({ status: "available" })
    .where(eq(teacherEarningsTable.id, 1))
    .returning();
    
  console.log("Fixed:", res);
  process.exit(0);
}

run().catch(console.error);
