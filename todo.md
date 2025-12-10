# Routie Roo TODO

## Calendar Badge Update (2025-12-09)
- [x] Replace current calendar badge with full calendar image (—Pngtree—calendariconwithahighlighted_22163766.png)
- [x] Display entire calendar graphic with "ON CALENDAR" header and green checkmark
- [x] Make badge larger and more prominent on route cards and detail pages
- [x] Update single-stop route map to show Routie Roo standing at destination (not holding map pin)
- [x] Change route title format to show: Name Day Date (e.g., "Alisha Gardner Friday 12/12/2025")
- [x] Increase calendar icon size even larger for better visibility (h-24 = 96px)

## Ready to Publish
- [x] Important dates display on waypoints with blank fields for missing values
- [x] Duplicate stop type legend entries fixed

(rest of file continues...)


## Scheduled Contacts Filter (2025-12-09)
- [x] Add "Show scheduled contacts" filter checkbox to contact list
- [x] Implement filter logic to show only contacts with scheduledDays or oneTimeVisits


## Scheduled Contacts Filter Bug Fix (2025-12-09)
- [x] Investigate why contacts with no visible schedule show up in scheduled filter
- [x] Fix filter logic to exclude contacts with empty/null schedule arrays
- [x] Test filter to ensure only truly scheduled contacts appear

## Route Title Simplification (2025-12-09)
- [x] Update route title generation to use format "Name - Day Date" instead of "Name - Day Route - Week of Date Day Date"
- [x] Test with Smart Auto-Routing generated routes

## Auto-Delete Incomplete Routes on Schedule Deletion (2025-12-09)
- [x] Analyze current schedule deletion logic in contacts.updateScheduledDays
- [x] Implement route cleanup to delete incomplete auto-generated routes when schedule is removed
- [x] Keep completed routes for historical records
- [x] Write tests for route cleanup functionality
- [x] Test with various route completion states
