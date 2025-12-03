-- Add addresses field to cached_contacts table
ALTER TABLE `cached_contacts` ADD COLUMN `addresses` text;

-- Add addressType field to route_waypoints table
ALTER TABLE `route_waypoints` ADD COLUMN `addressType` varchar(50);
