ALTER TABLE `cached_contacts` ADD `googleResourceName` varchar(255);--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `phoneNumbers` text;--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `cached_contacts` DROP COLUMN `resourceName`;--> statement-breakpoint
ALTER TABLE `cached_contacts` DROP COLUMN `addressType`;--> statement-breakpoint
ALTER TABLE `cached_contacts` DROP COLUMN `lastSynced`;