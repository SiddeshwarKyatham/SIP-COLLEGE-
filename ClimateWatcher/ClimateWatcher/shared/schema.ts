import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Task table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: doublePrecision("budget").notNull(),
  deadline: timestamp("deadline").notNull(),
  requiredSkills: text("required_skills").array().notNull(),
  employerId: integer("employer_id").notNull(),
  status: text("status").notNull().default("open"), // open, in-progress, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Application table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  studentId: integer("student_id").notNull(),
  coverLetter: text("cover_letter").notNull(),
  status: text("status").notNull().default("applied"), // applied, accepted, rejected
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Message table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

// Payment table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Badge table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // skill, achievement
  level: text("level").notNull(), // beginner, intermediate, expert
  icon: text("icon").notNull(),
});

// UserBadge table
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

// Report table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportedUserId: integer("reported_user_id"),
  reportedTaskId: integer("reported_task_id"),
  reporterId: integer("reporter_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, resolved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users, {
  skills: z.array(z.string()).optional(),
  role: z.enum(["student", "employer", "admin"]),
}).omit({ id: true });

export const insertTaskSchema = createInsertSchema(tasks, {
  requiredSkills: z.array(z.string()),
  status: z.enum(["open", "in-progress", "completed"]),
}).omit({ id: true, createdAt: true });

export const insertApplicationSchema = createInsertSchema(applications, {
  status: z.enum(["applied", "accepted", "rejected"]),
}).omit({ id: true, appliedAt: true });

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true });

export const insertPaymentSchema = createInsertSchema(payments, {
  status: z.enum(["pending", "completed"]),
}).omit({ id: true, createdAt: true });

export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, awardedAt: true });

export const insertReportSchema = createInsertSchema(reports, {
  status: z.enum(["pending", "resolved", "rejected"]),
}).omit({ id: true, createdAt: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });

// Export insert and select types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
