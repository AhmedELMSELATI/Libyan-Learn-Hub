process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require";

import { db } from "./src/index.js";
import { prepaidCardsTable } from "./src/schema/prepaid-cards.js";

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
