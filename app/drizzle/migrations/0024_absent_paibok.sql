CREATE TABLE `Users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`github_id` text
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`href` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`category` text,
	`description` text,
	`image_url` text
);
