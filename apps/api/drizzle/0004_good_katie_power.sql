CREATE INDEX `idx_user_shows` ON `tv_shows` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_tvmaze_user` ON `tv_shows` (`tvmaze_id`,`user_id`);