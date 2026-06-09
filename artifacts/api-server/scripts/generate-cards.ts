import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

import { db, prepaidCardsTable } from "@workspace/db";

async function main() {
  const cards = [
    { code: "LIBYA-TEST-1000", value: "100.00", status: "active" as const },
    { code: "LIBYA-TEST-2000", value: "50.00", status: "active" as const },
    { code: "LIBYA-TEST-3000", value: "20.00", status: "active" as const },
  ];

  for (const card of cards) {
    try {
      await db.insert(prepaidCardsTable).values(card).onConflictDoNothing();
      console.log(`Inserted card: ${card.code} (${card.value} LYD)`);
    } catch (e) {
      console.error(e);
    }
  }

  process.exit(0);
}

main();
