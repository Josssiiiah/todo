import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const resources = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull().default('09:00'),
  duration: integer('duration').notNull().default(30),
  timeStamp: integer('time_stamp', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Auth
export const Users = sqliteTable('Users', {
  id: text('id').primaryKey().notNull(),
  username: text('username').notNull(),
  name: text('name').notNull(),
  password: text('password'),
  github_id: text('github_id'),
  google_id: text('google_id'),
  email: text('email'),
  avatar_url: text('avatar_url'),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  expires_at: integer('expires_at').notNull(),
  accessToken: text('access_token'),
  tokenExpiry: integer('token_expiry'),
});
