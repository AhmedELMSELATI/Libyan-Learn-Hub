import { db } from "./src/index.js";
import { prepaidCardsTable } from "./src/schema/prepaid-cards.js";
import { usersTable, walletTransactionsTable } from "./src/schema/index.js";
import { eq, sql } from "drizzle-orm";

async function main() {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require";

  const code = "LIBYA-TEST-1000";
  // We need a valid user ID. Let's find one.
  const user = await db.query.usersTable.findFirst();
  if (!user) throw new Error("No user found");

  console.log(`Using user: ${user.email} (ID: ${user.id})`);

  try {
    await db.transaction(async (tx) => {
      const card = await tx.query.prepaidCardsTable.findFirst({
        where: eq(prepaidCardsTable.code, code),
      });

      if (!card) {
        throw new Error("Invalid card code");
      }

      if (card.status !== "active") {
        throw new Error(`Card is already ${card.status}`);
      }

      await tx.update(prepaidCardsTable)
        .set({
          status: "used",
          usedBy: user.id,
          usedAt: new Date(),
        })
        .where(eq(prepaidCardsTable.id, card.id));

      await tx.update(usersTable)
        .set({
          balance: sql`${usersTable.balance} + ${card.value}`,
        })
        .where(eq(usersTable.id, user.id));

      await tx.insert(walletTransactionsTable).values({
        userId: user.id,
        amount: card.value,
        type: "credit",
        referenceType: "prepaid_card",
        referenceId: card.id,
        description: `Redeemed Prepaid Card`,
      });
    });
    console.log("Success!");
  } catch (err) {
    console.error("Failed to redeem:", err);
  }
  process.exit(0);
}

main();
