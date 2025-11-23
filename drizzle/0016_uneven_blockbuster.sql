ALTER TABLE `routes` ADD `startingPointAddress` text;--> statement-breakpoint
ALTER TABLE `routes` ADD `distanceUnit` enum('km','miles') DEFAULT 'km';