ALTER TABLE `routes` ADD `isArchived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `routes` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `autoArchiveDays` int;