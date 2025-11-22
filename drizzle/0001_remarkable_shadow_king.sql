CREATE TABLE `cached_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceName` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`address` text,
	`addressType` varchar(64),
	`lastSynced` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cached_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_waypoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`position` int NOT NULL,
	`contactName` varchar(255),
	`address` text NOT NULL,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `route_waypoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`shareId` varchar(32) NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`totalDistance` int,
	`totalDuration` int,
	`optimized` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routes_id` PRIMARY KEY(`id`),
	CONSTRAINT `routes_shareId_unique` UNIQUE(`shareId`)
);
