import { db } from "@workspace/db";
import { teacherEarningsTable } from "@workspace/db";
import { eq, isNotNull } from "drizzle-orm";

async function run() {
  console.log("Fixing backfilled earnings status...");
  
  await db.update(teacherEarningsTable)
    .set({ status: "available", paidAt: null })
    .where(isNotNull(teacherEarningsTable.tutoringRequestId));
    
  console.log("Fixed.");
  process.exit(0);
}

run().catch(console.error);
