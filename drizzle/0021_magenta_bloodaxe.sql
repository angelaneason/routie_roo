CREATE TABLE `route_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`routeId` int NOT NULL,
	`userId` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `route_notes_id` PRIMARY KEY(`id`)
);
