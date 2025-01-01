CREATE TABLE `Users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`password` text,
	`github_id` text,
	`google_id` text,
	`email` text,
	`avatar_url` text
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` text DEFAULT '09:00' NOT NULL,
	`duration` integer DEFAULT 30 NOT NULL,
	`time_stamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`access_token` text,
	`token_expiry` integer
);
