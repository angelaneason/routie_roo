ALTER TABLE `cached_contacts` ADD `originalAddress` text;--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `addressModified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `addressModifiedAt` timestamp;