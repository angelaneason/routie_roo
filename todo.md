# Contact Route Mapper - Project TODO

## Phase 1: Database Schema & Setup
- [x] Define routes table for storing generated routes
- [x] Define contacts table for caching contact data
- [x] Define route_waypoints table for storing route stops
- [x] Push database schema changes

## Phase 2: Google API Integration
- [x] Request Google People API credentials from user
- [x] Request Google Maps API key from user
- [x] Implement Google OAuth flow for contacts access
- [x] Create backend procedure to fetch contacts from Google People API
- [x] Test contact retrieval and address extraction

## Phase 3: Contact Selection & Route Creation
- [x] Build contact list display UI
- [x] Add contact selection checkboxes
- [x] Filter contacts with valid addresses
- [x] Create route generation form
- [x] Implement backend route calculation with Google Maps Routes API
- [x] Save generated routes to database

## Phase 4: Map Visualization
- [x] Integrate Google Maps component
- [x] Display route polyline on map
- [x] Add markers for each waypoint
- [x] Show route details (distance, duration, optimized order)
- [x] Add "Open in Google Maps" button with shareable URL

## Phase 5: Route Sharing & Export
- [x] Generate unique shareable route links
- [x] Create public route view page
- [x] Implement route privacy controls
- [ ] Add export to GPX format
- [ ] Add export to KML format
- [x] Add copy link functionality

## Phase 6: Testing & Documentation
- [ ] Test complete user flow (login → select contacts → generate route → share)
- [x] Write vitest tests for route generation procedures
- [x] Create user setup guide for Google API credentials
- [ ] Test on mobile browsers
- [ ] Verify all sharing methods work

## Phase 7: Deployment
- [ ] Save project checkpoint
- [ ] Create deployment documentation
- [ ] Provide user guide for team testing

## New Features - User Requested

### Route Management
- [x] Add option to disable route optimization (manual waypoint order)
- [x] Implement route deletion functionality
- [ ] Add drag-and-drop waypoint reordering (future enhancement)
- [x] Add confirmation dialog before deleting routes

### Folder Organization
- [x] Create folders/categories table in database
- [x] Add folder selection when creating routes
- [x] Display routes grouped by folder
- [x] Allow moving routes between folders
- [x] Add folder management UI (create, rename, delete)

## Contact Enhancement Features

- [x] Update database schema to store phone numbers with labels
- [x] Update database schema to store contact photos/avatars
- [x] Fetch phone numbers from Google People API
- [x] Fetch contact photos from Google People API
- [x] Display contact photos in contact list
- [x] Display phone numbers with labels in contact list
- [ ] Show contact photos on map markers
- [ ] Include phone numbers in route waypoint details

## Click-to-Call Features

- [x] Create dropdown menu for calling service selection
- [x] Add Google Voice calling option
- [x] Add regular phone dialer (tel:) option
- [x] Add WhatsApp calling option
- [x] Add Skype calling option
- [x] Store user's preferred calling service in database
- [ ] Add settings UI for default calling service preference (future enhancement)
- [x] Make phone numbers clickable in contact list
- [ ] Make phone numbers clickable in route waypoint details (future enhancement)

## New User Requests

- [x] Add folder filter/selector UI to view routes by folder
- [x] Add contact search bar to filter by name, phone, or address
- [x] Display all phone numbers for each contact (not just first one)
- [x] Add text messaging options (SMS, WhatsApp text)
- [x] Add distance unit preference (KM vs Miles)
- [x] Convert all distance displays based on user preference

## Waypoint Phone Numbers

- [x] Add phone numbers field to route_waypoints table
- [x] Update route creation to save contact phone numbers to waypoints
- [x] Display phone numbers in route detail page waypoint list
- [x] Add PhoneCallMenu to waypoints for click-to-call and text messaging

## Separate Call and Text Actions

- [ ] Create separate PhoneCallMenu component for calling only
- [ ] Create separate PhoneTextMenu component for texting only
- [ ] Update waypoint display to show both call and text buttons
- [ ] Test that text button opens messaging app directly

## UI Fixes

- [x] Update RouteDetail to show separate Call and Text buttons for waypoints
- [x] Add visible folder filter dropdown in routes section on Home page
- [x] Create Settings page with preferences (calling service, distance unit, etc.)
- [x] Add navigation link to Settings page


## Bug Fixes

- [x] Fix "Route Not Found" error when creating and viewing routes
- [x] Investigate route creation database storage
- [x] Fix route retrieval by ID
- [x] Test complete route creation and viewing flow


## Phone Number Formatting Fix

- [x] Create utility function to format US phone numbers as (XXX) XXX-XXXX
- [x] Clean phone numbers for click-to-call (remove formatting characters)
- [x] Update Home.tsx to use formatted phone numbers
- [x] Update RouteDetail.tsx to use formatted phone numbers
- [x] Update PhoneCallMenu to handle formatted numbers correctly
- [x] Update PhoneTextMenu to handle formatted numbers correctly


## Contact Management Enhancements

- [x] Add labels/groups field to cached_contacts table
- [x] Add isActive status field to cached_contacts table
- [x] Update Google People API to fetch contact labels/groups
- [x] Sync all contacts including those without addresses
- [x] Display contact labels in contact list
- [x] Add "Mark as Inactive" button for contacts
- [x] Add filter to show/hide inactive contacts
- [x] Create contact edit dialog UI
- [x] Add ability to add/edit contact addresses in app
- [x] Add ability to edit contact phone numbers
- [ ] Implement Google People API update endpoint
- [ ] Sync local contact changes back to Google Contacts
- [ ] Add validation for address and phone number fields


## New Feature Requests - Phase 2

### Google People API Write Functionality
- [x] Update Google OAuth scope to include write permissions
- [x] Implement updateGoogleContact function in googleAuth.ts
- [ ] Note: Google People API write requires service account or different auth approach
- [ ] Consider alternative: Export contacts to CSV/vCard for manual import

### Route Notes
- [x] Add notes field to routes table in database schema
- [x] Update route creation form to include notes textarea
- [x] Display notes in route detail page
- [ ] Add edit notes functionality to existing routes
- [x] Push database schema changes
- [x] Test route notes feature

### Google Calendar Integration
- [x] Add Google Calendar OAuth scope to existing auth
- [x] Implement createCalendarEvent function
- [x] Add "Add to Calendar" button on route detail page
- [x] Create calendar dialog for selecting start time
- [x] Generate calendar event with route details (name, waypoints, time, notes)
- [x] Handle calendar OAuth callback
- [x] Test calendar event creation

### Stop Types with Color Codes and Shapes
- [x] Add stopType field to route_waypoints table (pickup, delivery, meeting, visit, other)
- [x] Add stopColor field to route_waypoints table
- [x] Create stop type selector component
- [x] Add stop type selector in route creation UI
- [ ] Update map markers to show different shapes/colors based on stop type
- [ ] Add legend showing stop type meanings
- [ ] Update waypoint list to display stop type badges
- [x] Push database schema changes


## Bug Fixes

### Distance Unit Display
- [x] Fix route list to show miles when user selects miles in settings
- [x] Fix route detail page to show miles when user selects miles in settings
- [x] Ensure unit conversion is applied consistently across all distance displays


## Route Execution Workflow

### Database Schema Updates
- [x] Add status field to route_waypoints (pending, in_progress, complete, missed)
- [x] Add completedAt timestamp to route_waypoints
- [x] Add missedReason text field to route_waypoints
- [x] Add rescheduledDate field to route_waypoints
- [x] Add executionOrder field to route_waypoints (for reordering during execution)
- [x] Add executionNotes field to route_waypoints
- [x] Add needsReschedule boolean flag to route_waypoints
- [x] Push database schema changes

### Stop Status Tracking
- [x] Create stop status badge component (pending/in-progress/complete/missed)
- [x] Add status update buttons to route detail page
- [x] Implement updateWaypointStatus tRPC procedure
- [x] Add completion timestamp recording
- [x] Add reason/notes input for missed stops
- [x] Show stop completion progress indicator on route
- [x] Add comments/notes field for route drivers

### Stop Reordering
- [ ] Add drag-and-drop reordering UI to route detail page
- [x] Implement updateWaypointOrder tRPC procedure
- [x] Save execution order separately from original order
- [ ] Add "Reset to Original Order" button
- [ ] Show visual indicator when order differs from original

### Reschedule System
- [x] Add "Reschedule" button for missed stops
- [x] Create reschedule dialog with date/time picker
- [ ] Integrate with Google Calendar API for reschedule events
- [x] Mark stop as rescheduled when date is set
- [x] Clear needsReschedule flag when rescheduled

### Manager Dashboard
- [x] Create "Missed Stops" dashboard view
- [x] Show all missed stops across all routes
- [x] Filter by: needs reschedule, rescheduled
- [ ] Add bulk actions (assign, reschedule, mark resolved)
- [x] Show route name and link to route detail
- [ ] Add export to CSV functionality

### Route Execution UI
- [x] Create route execution panel component
- [x] Show current stop with prominent highlight
- [x] Show route progress (X of Y stops complete)
- [x] Add quick action buttons (Complete, Miss, Add Note)
- [x] Add execution notes dialog for each stop
- [x] Display missed reason and reschedule date
- [ ] Add "Next Stop" navigation button
- [ ] Show estimated time remaining based on incomplete stops

### Testing
- [x] Write tests for waypoint status updates
- [x] Write tests for stop reordering
- [x] Write tests for reschedule workflow
- [x] Test manager dashboard queries
- [x] Test execution mode UI flows


## UI Integration Improvements

### Waypoint and Route Completion Integration
- [x] Merge execution controls into main waypoints list
- [x] Show stop status badges inline with waypoint details
- [x] Add execution action buttons (Complete, Miss, Add Note) to each waypoint card
- [x] Display execution notes and missed reasons inline
- [x] Show progress bar at top of waypoints section
- [x] Remove separate RouteExecutionPanel component


## New Feature Requests - Phase 3

### Drag-and-Drop Stop Reordering
- [x] Install @dnd-kit/core and @dnd-kit/sortable packages
- [x] Add drag handles to waypoint cards
- [x] Implement drag-and-drop functionality for reordering stops
- [x] Update executionOrder when stops are reordered
- [x] Show visual feedback during dragging
- [ ] Add "Reset to Original Order" button

### Bulk Stop Actions
- [x] Add "Complete All Remaining" button to route detail page
- [x] Add "Mark All as Missed" bulk action with reason dialog
- [x] Show confirmation dialog before bulk actions
- [x] Update progress bar after bulk actions

### Bug Fixes
- [x] Fix "Show inactive contacts" to only show inactive when checked (not add to active)
- [x] Update contact filtering logic in Home.tsx


## Bug Fixes - Phase 4

### Contact Display Issues
- [x] Fix contacts showing resource IDs (10a5e7768dc5c4f2, 5db8c017898daefe, myContacts) instead of names
- [x] Investigate Google Contacts sync parsing logic
- [x] Filter out non-contact entries from sync results

### UX Clarification
- [x] Document that drag-and-drop reordering is on route detail page, not home page
- [ ] Add visual indicator or tooltip showing drag handles are available on route execution
