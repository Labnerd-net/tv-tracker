--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `tv_shows_new` (
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
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `tv_shows_new`
  SELECT
    `id`, `user_id`, `title`, `tvmaze_id`, `platform`, `status`,
    CASE
      WHEN `schedule_day` IS NULL OR `schedule_day` = '' THEN NULL
      ELSE json_array(`schedule_day`)
    END,
    `schedule_time`, `prev_episode`, `next_episode`, `image_link`
  FROM `tv_shows`;
--> statement-breakpoint
DROP TABLE `tv_shows`;
--> statement-breakpoint
ALTER TABLE `tv_shows_new` RENAME TO `tv_shows`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
