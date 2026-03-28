PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tv_shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`tvmaze_id` integer NOT NULL,
	`platform` text,
	`status` text,
	`schedule_day` text,
	`schedule_time` text,
	`prev_episode` text,
	`next_episode` text,
	`image_link` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tv_shows`("id", "user_id", "title", "tvmaze_id", "platform", "status", "schedule_day", "schedule_time", "prev_episode", "next_episode", "image_link") SELECT "id", "user_id", "title", "tvmaze_id", "platform", "status", "schedule_day", "schedule_time", "prev_episode", "next_episode", "image_link" FROM `tv_shows`;--> statement-breakpoint
DROP TABLE `tv_shows`;--> statement-breakpoint
ALTER TABLE `__new_tv_shows` RENAME TO `tv_shows`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_user_shows` ON `tv_shows` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_tvmaze_user` ON `tv_shows` (`tvmaze_id`,`user_id`);