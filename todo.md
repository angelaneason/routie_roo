# Routie Roo TODO

## Ready to Publish
- [x] Important dates display on waypoints with blank fields for missing values
- [x] Duplicate stop type legend entries fixed

## In Progress - Enhanced Recurring Schedule System

### Database Schema Updates
- [x] Add repeatInterval field (number of weeks between visits)
- [x] Add repeatDays field (array of selected days)
- [x] Add scheduleEndType field (never/date/occurrences)
- [x] Add scheduleEndDate field (for "On" option)
- [x] Add scheduleEndOccurrences field (for "After" option)
- [x] Add currentOccurrenceCount field (track completed occurrences)

### Backend Procedures
- [x] Update contacts.updateScheduledDays to accept new schedule fields
- [x] Add logic to calculate next occurrence dates
- [x] Add logic to check if schedule has ended
- [x] Update route generation to respect recurrence rules

### Enhanced Scheduling Dialog UI
- [x] "Repeat every X weeks" input with spinner controls
- [x] Day selector buttons (S M T W T F S) with multi-select
- [x] "Ends" radio group (Never/On/After)
- [x] Date picker for "On" option
- [x] Occurrences input for "After" option
- [x] Cancel and Done buttons
- [x] Integrate dialog into Home/Workspace page
- [x] Update contact card to show enhanced schedule info

### Route Generation Logic
- [x] Check if current week matches recurrence pattern
- [x] Skip weeks based on repeatInterval
- [x] Only generate routes for selected days
- [x] Stop generating when end condition is met
- [ ] Increment occurrence counter after each route (needs testing)

### Testing
- [ ] Test weekly recurrence (every 1 week)
- [ ] Test bi-weekly recurrence (every 2 weeks)
- [ ] Test monthly recurrence (every 4 weeks)
- [ ] Test "Never" end condition
- [ ] Test "On date" end condition
- [ ] Test "After X occurrences" end condition
- [ ] Test multiple days selected
- [ ] Test schedule expiration handling

## Completed - Smart Auto-Routing Feature

### Phase 5: Smart Routing Dashboard
- [x] Create SmartRoutingDashboard page component
- [x] Add weekly calendar view showing scheduled contacts
- [x] Display auto-generated routes for the current week
- [x] Add navigation link to dashboard in sidebar
- [x] Show scheduled days summary for each contact

### Phase 6: Testing & Refinement
- [x] Test scheduling contacts for multiple days
- [x] Test adding/removing scheduled days
- [x] Test multiple contacts on same day
- [x] Test route auto-creation with different settings
- [x] Test edge cases (no folder, no starting point, etc.)
- [x] Database migration completed successfully
- [x] Core API tests passing

### Phase 7: Documentation
- [x] Create user guide for Smart Auto-Routing
- [x] Document feature configuration steps
- [x] Add tooltips and help text in UI
- [x] Comprehensive troubleshooting section
- [x] Best practices guide

## Urgent Bug Fixes
- [x] Fix "getPrimaryAddress is not defined" error in recurring schedule dialog
- [x] Fix dialog state not refreshing when switching between contacts
- [x] Fix TypeScript compilation errors in route_waypoints status field (BLOCKING DEPLOYMENT)
- [x] Fix Smart Auto-Routing creating routes with missing coordinates (contacts not geocoded)
- [x] Fix missing address coordinates - contacts should be geocoded during sync
- [x] Ensure waypoints get coordinates when added to routes
- [x] Fix label updates in waypoint editor to sync to contact and Google Contacts (already implemented and working)

## Known Issues (Non-Blocking)

- Integration tests require test data fixtures (expected behavior)

## New Issues (2025-12-08)

- [x] Fix geocoding for BRODT Marcia (stop #11) - address not geocoded, missing coordinates
- [x] Fix map marker colors - should show yellow for DeltaCare label, currently showing pink
- [x] Add label editing capability to Edit Details dialog in route waypoint editor (already implemented, verified working)

## Layout Fixes
- [x] Fix schedule information overlapping with Schedule button on contact cards

- [x] Fix Smart Auto-Routing scheduledDate - all routes get Monday's date instead of correct day (Wed, Fri)
- [x] Fix calendar connection OAuth redirect_uri_mismatch error (Error 400)
- [ ] Implement Route Holders feature (staff assignment with calendar integration)


## Route Holders Feature (Option B with Stop Type)

### Database Schema
- [ ] Create route_holders table (id, userId, name, googleCalendarId, defaultStopType, defaultStopTypeColor, createdAt)
- [ ] Add routeHolderId field to routes table
- [ ] Add routeHolderId field to contact schedules (for per-day assignment)

### Backend Procedures
- [x] routeHolders.list - Get all route holders for user
- [x] routeHolders.create - Create new route holder
- [x] routeHolders.update - Update route holder details
- [x] routeHolders.delete - Delete route holder
- [x] Update contacts.updateScheduledDays to accept routeHolderId per day
- [x] Update route generation to assign correct holder and calendar

### Settings UI
- [x] Create Route Holders Settings section
- [x] List existing route holders
- [x] Add new route holder form (name, calendar selector, default stop type)
- [x] Edit/delete route holder functionality
- [x] Fetch user's Google Calendars for dropdown

### Enhanced Scheduling Interface
- [x] Update RecurringScheduleDialog to show Route Holder dropdown per day
- [x] Show default stop type for selected holder
- [x] Allow stop type override if needed
- [x] Save routeHolderId with each scheduled day

### Dashboard View
- [x] Group routes by Route Holder on Smart Routing Dashboard
- [x] Show "Randy's Routes", "PTA Team Routes", etc.
- [x] Display stop count per route
- [x] Add "View Route" button for each route
- [x] Show calendar sync status

### Testing
- [ ] Test creating route holders
- [ ] Test assigning different holders to different days
- [ ] Test calendar integration per holder
- [ ] Test stop type defaults and overrides
- [ ] Test dashboard grouping by holder


## Contact Card UI Reorganization

### Contact Card Simplification
- [x] Remove Info button from contact card
- [x] Remove Upload button from contact card  
- [x] Remove Labels button from contact card
- [x] Keep Schedule, Edit, and Active/Inactive toggle buttons

### Edit Dialog Enhancement
- [x] Add Labels management section to ContactEditDialog
- [x] Add Document upload section to ContactEditDialog
- [x] Add Documents list/viewer to ContactEditDialog
- [x] Reorganize dialog layout with tabs or sections

## Sticky Note Drag Fix
- [x] Investigate why sticky note can't be dragged
- [x] Fix drag functionality on sticky note
- [x] Test dragging works on desktop and mobile

## Dashboard Quick Actions Update
- [x] Change "Plan Your Route" button to "Routes"
- [x] Add "Contacts" button to quick actions

## OAuth Redirect URI Fix
- [x] Update PUBLIC_URL environment variable to https://routieroo.cc
- [x] Test OAuth login on routieroo.cc
- [x] Verify redirect URI matches Google Cloud Console configuration

## Contact Edit Dialog Fixes
- [x] Fix React error #31 when rendering labels (getAllLabels returns objects, not strings)
- [x] Fix React error #31 by adding enabled flag to allLabelsQuery and error handling

## Dashboard Updates
- [x] Remove Smart Scheduling link from dashboard

## Contact Edit Dialog UI Improvements
- [x] Replace label button grid with searchable dropdown/combobox
- [x] Display selected labels as removable badges

## Waypoint Edit Details Dialog
- [x] Add label selector dropdown to waypoint Edit Details dialog (like RoadRunner interface)
- [x] Enable label selection/deselection with checkboxes
- [x] Sync label changes to contact card and Google Contacts

## Navigation Flow Updates
- [x] Change default landing page from Dashboard to Routes (/workspace)
- [x] Update back buttons to navigate to Routes instead of Dashboard
- [x] Keep Dashboard accessible via sidebar menu only

## Calendar Waypoint Event Display Issue
- [x] Investigate why individual waypoint events don't appear in Routie Roo calendar
- [x] Update calendar.getEvents to fetch and display individual waypoint events
- [x] Ensure waypoint events can be edited and sync back to Google Calendar
- [x] Test that waypoint events appear alongside route events in calendar view

## Important Dates on Waypoints Feature
- [x] Add showOnWaypoint boolean field to important_date_types table
- [x] Update Settings UI to show checkbox for "Show on Waypoint" next to each date type
- [x] Update backend to save showOnWaypoint preference for date types
- [x] Display important dates at bottom of waypoint cards (above action buttons)
- [x] Show blank date fields for flagged date types with no value
- [x] Add inline date editing on waypoint cards
- [x] Sync date changes from waypoints back to contact cards
- [x] Test that dates display correctly and sync properly

## Bug Fixes - Important Dates Feature
- [x] Fix duplicate "Visit" entries in stop type legend
- [x] Fix important date fields not displaying on waypoint cards

## UI Layout Update
- [x] Move important dates to display horizontally above action buttons on waypoint cards

## Route Holders Settings Enhancements
- [x] Add Google Calendar dropdown (fetch from user's connected calendars)
- [x] Add stop type dropdown with colors from Settings
- [x] Add default starting address field
- [x] Update database schema to store starting address
- [x] Update backend procedures to handle new fields

## Route Holders Name Field Enhancement
- [x] Change Name field from text input to contact dropdown
- [x] Fetch contacts from Kangaroo Crew (Google Contacts)
- [x] Display contact names in dropdown selector
- [x] Update create/edit forms to use contact selector

## Route Holders UI Fixes (2025-12-09)
- [x] Fix Contact Name dropdown - make it searchable and selectable (not opening)
- [x] Fix Default Stop Type dropdown - not working/responding to clicks
- [x] Auto-populate Starting Address when contact is selected from dropdown

## Route Holders UI Issues (2025-12-09 - Continued)
- [x] Fix Contact Name dropdown - not allowing typing or searching contact names
- [x] Fix Default Stop Type dropdown - not showing the stop types from Settings

## Route Holders Contact Search Issue (2025-12-09)
- [x] Fix Combobox search - typing doesn't filter the contact list

## Route Holders Search Filtering Bug (2025-12-09)
- [x] Fix "No contact found" appearing when typing - search filter not matching contacts correctly

## Critical Issues (2025-12-09)
- [ ] Fix geocoding - addresses not getting coordinates when syncing contacts
- [ ] Integrate Route Holders with Smart Auto-Routing - scheduled routes should be assigned to correct route holder
- [ ] Support multiple route holders on same schedule day
- [ ] Implement folder management for auto-generated routes
- [ ] Create "Scheduled Routes" folder for auto-generated routes
- [ ] Add ability to move routes between folders
- [ ] Add ability to move scheduled routes to main workspace or other folders


## Subscription Tier System Implementation (2025-12-09)

### Database Schema
- [x] Add subscriptionTier field to users table (VARCHAR(20), default 'free')
- [x] Options: 'free', 'premium', 'enterprise'

### Backend Subscription Gating
- [x] Add subscription check to contacts.updateScheduledDays procedure
- [x] Add subscription check to all routeHolders procedures (list, create, update, delete)
- [x] Return proper error message for free users trying to access premium features

### Frontend UI Updates
- [x] Hide "Schedule" button on contact cards for free users
- [x] Hide scheduled days badge on contact cards for free users
- [x] Hide "Route Holders" tab in Settings for free users
- [x] Keep manual route creation available to all users

### Testing
- [ ] Test free user cannot access Smart Routing features
- [ ] Test premium user can access all Smart Routing features
- [ ] Test enterprise tier placeholder works correctly
- [ ] Test error messages display correctly when free users try to access premium features
- [ ] Verify manual route creation works for all tiers


## Route Holder Scheduling Integration (2025-12-09)

### Database Schema Updates
- [x] Add routeHolderSchedule field to cached_contacts (JSON: {day: routeHolderId})
- [x] Add scheduleStartDate field to cached_contacts (when schedule begins)
- [x] Ensure folders table can store route holder names

### Backend Updates
- [x] Update contacts.updateScheduledDays to accept routeHolderSchedule mapping
- [x] Update contacts.updateScheduledDays to accept scheduleStartDate
- [x] Update route generation to assign correct routeHolderId per day
- [x] Auto-create folders named after route holders if they don't exist
- [x] Assign auto-generated routes to route holder's folder
- [x] Update calendar event titles to include route holder name

### Schedule Dialog UI Updates
- [x] Add "Start Date" field to RecurringScheduleDialog
- [x] Add route holder dropdown for each selected day
- [x] Show which holder is assigned to each day
- [x] Save routeHolderSchedule mapping when user clicks Done

### Route Organization
- [x] Auto-create folder with route holder's name when generating routes
- [x] Place auto-generated routes in holder's folder
- [x] Sort routes by date within folders
- [x] Ensure folder names match route holder names exactly

### Calendar Integration
- [x] Update calendar event titles to show: "Randy - Mon Route (3 stops)"
- [x] Include route holder name in event description
- [x] Test calendar events display correctly with holder names

### Testing
- [ ] Test assigning different holders to different days (Mon→Randy, Wed→Shaquana)
- [ ] Test auto-folder creation with route holder names
- [ ] Test routes sorted by date within folders
- [ ] Test calendar titles include route holder names
- [ ] Test start date controls when routes begin generating


## Scheduling Improvements (2025-12-09)

### Address Update Refresh Issue
- [x] Fix contact card not refreshing after adding address via "Add Address" link
- [x] Invalidate contacts query after successful address update
- [x] Ensure "Add Address" warning disappears after address is added

### Route Not Created After Schedule
- [x] Debug why clicking "Done" in schedule dialog doesn't create route
- [x] Check if enableSmartRouting is set to 1 in user settings
- [x] Verify route creation logic is triggered after updateScheduledDays
- [x] Enabled Smart Auto-Routing in user settings

### Schedule Visibility and Management
- [x] Add visual indicator on contact cards showing existing schedules
- [x] Display schedule summary (e.g., "Every week on Mon, Wed, Fri")
- [x] Add "Delete Schedule" button to clear existing schedules
- [x] Confirm deletion with dialog to prevent accidental removal
- [x] Update backend to support schedule deletion

### One-Time Visit Scheduling
- [x] Add "One-Time Visit" option to schedule dialog
- [x] Support scheduling single visit on specific date
- [x] Don't create recurring schedule for one-time visits
- [x] Use case: Leon does eval, needs re-eval in 30 days (non-recurring)
- [x] Use case: Debbie does weekly visits (recurring)
- [x] Database schema updated with isOneTimeVisit and oneTimeVisitDate fields
- [x] Frontend UI updated with visit type toggle
- [x] Backend procedures updated to handle one-time visits

### One-Time Visit Route Holder and Visit Type (2025-12-09)
- [x] Add oneTimeRouteHolderId field to cached_contacts table
- [x] Add oneTimeStopType and oneTimeStopTypeColor fields to cached_contacts table
- [x] Update schedule dialog UI to show route holder dropdown for one-time visits
- [x] Update schedule dialog UI to show stop type dropdown for one-time visits
- [x] Update backend updateScheduledDays to save route holder and stop type for one-time visits
- [ ] Test creating one-time visit with route holder (e.g., Randy for Leon's eval)
- [ ] Test creating one-time visit with stop type (e.g., Eval for Leon)
- [ ] Verify route generation uses correct holder and stop type for one-time visits

### Calendar Integration Bug (2025-12-09)
- [x] Fix "Add to Calendar" - route not being added to Google Calendar after selecting calendar
- [x] Debug calendar event creation backend logic
- [x] Verify calendar API calls are being made correctly
- [ ] Test that calendar events appear in selected Google Calendar

### Database Schema Error (2025-12-09)
- [x] Fix cached_contacts table schema mismatch - missing columns causing query errors
- [x] Run database migration to add missing columns
- [x] Verify all queries work after schema update


### Calendar Indicator Feature (2025-12-09)
- [x] Check if googleCalendarId field already exists in routes table
- [x] Update addToCalendar mutation to save calendar ID when events are created (already implemented)
- [x] Add visual "On Calendar" badge to route cards in route list
- [x] Add visual "On Calendar" badge to route detail page header
- [ ] Test that badge appears after adding route to calendar
- [ ] Test that badge doesn't appear for routes without calendar events
