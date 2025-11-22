ALTER TABLE `routes` ADD `shareToken` varchar(36);--> statement-breakpoint
ALTER TABLE `routes` ADD `isPubliclyAccessible` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `routes` ADD `sharedAt` timestamp;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_shareToken_unique` UNIQUE(`shareToken`);