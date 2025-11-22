ALTER TABLE `route_waypoints` ADD `status` enum('pending','in_progress','complete','missed') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD `executionOrder` int;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD `missedReason` text;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD `executionNotes` text;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD `rescheduledDate` timestamp;--> statement-breakpoint
ALTER TABLE `route_waypoints` ADD `needsReschedule` int DEFAULT 0;