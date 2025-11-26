CREATE TABLE `comment_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`option` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `important_date_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `important_date_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `importantDates` text;--> statement-breakpoint
ALTER TABLE `cached_contacts` ADD `comments` text;