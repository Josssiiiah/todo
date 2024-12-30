import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  href: text("href").notNull(),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey(),
  name: text("name"),
  category: text("category"),
  description: text("description"),
  image_url: text("image_url"),
});

// Auth
export const Users = sqliteTable("Users", {
  id: text("id").primaryKey().notNull(),
  username: text("username").notNull(),
  password: text("password"),
  github_id: text("github_id"),
  google_id: text("google_id"),
  email: text("email"),
  avatar_url: text("avatar_url"),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  expires_at: integer("expires_at").notNull(),
});
