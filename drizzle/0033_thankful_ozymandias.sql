CREATE TABLE `reminder_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`dateType` varchar(100) NOT NULL,
	`importantDate` varchar(50) NOT NULL,
	`reminderType` varchar(50) NOT NULL,
	`sentTo` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	CONSTRAINT `reminder_history_id` PRIMARY KEY(`id`)
);
