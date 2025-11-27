ALTER TABLE `users` ADD `schedulingEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `enableDateReminders` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `users` ADD `reminderIntervals` text;