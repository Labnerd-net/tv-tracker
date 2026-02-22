ALTER TABLE `users` ADD `refresh_token_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `refresh_token_expires_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_refresh_token_hash_unique` ON `users` (`refresh_token_hash`);