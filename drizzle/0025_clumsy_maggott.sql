ALTER TABLE `users` ADD `googleCalendarAccessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `googleCalendarRefreshToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `googleCalendarTokenExpiry` timestamp;