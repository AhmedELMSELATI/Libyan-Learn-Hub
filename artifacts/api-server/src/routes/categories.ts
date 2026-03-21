import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, coursesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const cats = await db.select().from(categoriesTable);
  const result = await Promise.all(
    cats.map(async (cat) => {
      const [{ value }] = await db.select({ value: count() }).from(coursesTable).where(eq(coursesTable.categoryId, cat.id));
      return {
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr,
        icon: cat.icon,
        courseCount: Number(value),
      };
    })
  );
  res.json(result);
});

export default router;
