ALTER TABLE `cached_contacts` ADD `labels` text;--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `isActive` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;