import { db } from "@workspace/db";
import { coursesTable, categoriesTable } from "@workspace/db";

async function main() {
  const courses = await db.select().from(coursesTable);
  const categories = await db.select().from(categoriesTable);

  console.log("=== CATEGORIES IN DATABASE ===");
  categories.forEach(cat => {
    console.log(`ID: ${cat.id} | Name: ${cat.name} | NameAr: ${cat.nameAr}`);
  });

  console.log("\n=== COURSES IN DATABASE ===");
  courses.forEach(course => {
    console.log(`ID: ${course.id} | Title: "${course.title}" | TitleAr: "${course.titleAr}" | CategoryID: ${course.categoryId} | IsPublished: ${course.isPublished}`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
