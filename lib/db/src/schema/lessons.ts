import { pgTable, serial, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";

export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "quiz"]);

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  sectionId: integer("section_id"),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  videoUrl: text("video_url"),
  content: text("content"),
  contentAr: text("content_ar"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  duration: integer("duration").notNull().default(0),
  order: integer("order").notNull().default(0),
  isFree: boolean("is_free").notNull().default(false),
  type: lessonTypeEnum("type").notNull().default("video"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
