ALTER TABLE `users` MODIFY COLUMN `enableDateReminders` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `enableDateReminders` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enabledReminderDateTypes` text;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `schedulingEmail`;