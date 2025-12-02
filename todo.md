# Routie Roo - Project TODO

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


## Shared Route Execution Links

### Database Schema
- [x] Add shareToken field to routes table (unique, nullable)
- [x] Add isPubliclyAccessible boolean to routes table
- [x] Add sharedAt timestamp to routes table
- [x] Push database schema changes

### Backend Implementation
- [x] Create generateShareToken procedure for routes
- [x] Create getRouteByShareToken public procedure
- [x] Allow unauthenticated access to route execution via share token
- [x] Ensure waypoint status updates work with share token
- [x] Add validation to prevent unauthorized route modifications

### Frontend Implementation
- [x] Add "Generate Share Link" button to route detail page
- [x] Create shareable link with copy-to-clipboard functionality
- [x] Create public route execution page (/share/:token)
- [x] Show route details and waypoints without requiring login
- [x] Allow marking stops as complete/missed on shared routes
- [x] Add "Powered by Routie Roo" footer on public pages

### Security & Privacy
- [x] Ensure share tokens are cryptographically secure (UUID v4)
- [x] Add option to revoke/regenerate share tokens
- [x] Hide sensitive contact info on shared routes (shows contact name and address only)
- [ ] Add rate limiting to prevent abuse of public endpoints

### Testing
- [x] Write tests for share token generation
- [x] Test unauthenticated route access
- [x] Test waypoint updates via shared routes
- [x] Verify missed stops appear in creator's dashboard


## Shared Route Enhancements - Phase 2

### Reschedule Functionality
- [x] Add reschedule date picker to missed stop dialog on shared route page
- [x] Update backend to handle reschedule via share token
- [x] Show rescheduled date on shared route waypoint cards
- [x] Add rescheduleWaypointPublic procedure

### Phone Communication
- [x] Add PhoneCallMenu component to shared route waypoints
- [x] Add PhoneTextMenu component to shared route waypoints
- [x] Parse and display phone numbers from waypoint data
- [x] Ensure phone buttons work without authentication

### Drag-and-Drop Reordering
- [x] Add @dnd-kit components to SharedRouteExecution page
- [x] Implement drag handles for waypoints on shared route
- [x] Update execution order via share token when reordering
- [x] Show visual feedback during dragging

### Testing
- [x] Test reschedule functionality on shared routes
- [x] Test phone call/text from shared route
- [x] Test drag-and-drop reordering on shared route
- [x] Verify all updates sync back to creator's account


## Branding Updates

- [x] Copy RoutieRoo logo to client/public directory
- [x] Update APP_LOGO constant to use new logo
- [x] Hide "Routie Roo" text in header
- [x] Test logo display across all pages


## Logo Size Fix

- [x] Increase logo size in header for better visibility


## Logo Size Adjustment

- [x] Increase logo size further for better visibility (h-16)

## Custom Stop Type Management

### Database Schema
- [x] Create stop_types table with name, color fields
- [x] Add userId foreign key to stop_types for user-specific types
- [x] Push database schema changes

### Backend Implementation
- [x] Create stopTypes.list procedure to fetch user's stop types
- [x] Create stopTypes.create procedure to add new stop types
- [x] Create stopTypes.update procedure to edit existing stop types
- [x] Create stopTypes.delete procedure to remove stop types
- [x] Validate stop type colors (hex format)

### Frontend Implementation
- [x] Create StopTypesSettings component in Settings page
- [x] Add list of current stop types with edit/delete buttons
- [x] Create add/edit stop type dialog with color picker
- [x] Update StopTypeSelector to use custom stop types from database
- [x] Show color preview in stop type selector
- [ ] Prevent deletion of stop types currently in use

### Testing
- [x] Test creating custom stop types
- [x] Test editing stop type colors
- [x] Test deleting unused stop types
- [x] Verify stop types persist across sessions

## Bug Fixes - Null Address Validation

- [x] Fix route creation validation error when contacts have null addresses
- [x] Prevent selection of contacts without addresses in route creation UI

## UX Improvements - Contact Address Management

- [x] Add visual warning indicator (icon) on contact cards missing addresses
- [x] Add quick "Add Address" button on contact cards for faster editing
- [x] Create "Contacts Without Addresses" filter option
- [x] Fix PhoneTextMenu to include Google Voice as a texting option

## Critical Route Fixes - Priority

- [x] Add starting point field to routes (home/office address)
- [x] Add starting point selection in route creation UI
- [x] Store user's default starting point in settings
- [x] Fix mobile responsiveness for shared route pages
- [x] Fix map display on mobile devices
- [x] Ensure touch interactions work on mobile
- [ ] Implement numbered/lettered map markers (A, B, C)
- [ ] Match marker labels to waypoint list order

## Route Editing Features

- [x] Add backend procedure to add waypoints to existing routes
- [x] Add backend procedure to remove waypoints from routes
- [x] Add backend procedure to update waypoint addresses
- [x] Create route edit mode UI with "Edit Route" button
- [x] Add contact selector to add new waypoints to route
- [x] Add remove button for each waypoint in edit mode
- [x] Add inline address editing for waypoints
- [x] Auto-refresh map when waypoints are added/removed/reordered
- [x] Auto-refresh map when addresses are edited
- [x] Recalculate route distance/duration after changes

- [x] Add "Copy Route" button to duplicate existing routes

## Route Completion Status

- [x] Add completedAt field to routes schema
- [x] Add backend logic to automatically mark route as completed when all waypoints are completed/missed
- [x] Display route completion status badge on route detail page
- [x] Show completion timestamp when route is completed

## Bug Fixes - Shared Routes

- [x] Fix shared route map showing wrong starting location (San Francisco instead of route's starting point)
- [x] Fix shared route displaying distance in km instead of owner's preferred unit (miles)

## Starting Point System

- [x] Create saved starting points table (name, address, user)
- [x] Add backend procedures to manage saved starting points (create, list, delete)
- [x] Add startingPointAddress field to routes table
- [x] Create starting point dropdown in route creation UI
- [x] Allow selecting from saved starting points or entering custom address
- [x] Add manage starting points UI in Settings
- [x] Fix shared route map to center on route's starting point
- [x] Store route owner's distance unit preference with route for shared views

## Routie Roo Rebranding

- [x] Update app name to "Routie Roo" (user can change in Settings → General)
- [x] Add playful microcopy to button labels and CTAs
- [x] Update empty states with friendly Routie messages
- [x] Add personality to toast notifications
- [x] Update success/error messages with encouraging tone
- [x] Keep professional balance - playful but not gimmicky

- [x] Replace all instances of "Contact Route Mapper" with "Routie Roo" in codebase

- [x] Fix Select.Item empty value error preventing login

- [x] Add visible logout button to header navigation

- [x] Fix save button for starting locations not working when clicked

- [x] Add edit functionality for saved starting points (update name and address)

- [x] Make route map sticky/stationary while scrolling through waypoints list

- [x] Add phone call/text icons back to contact cards on home page
- [x] Display phone numbers on route detail screen for each waypoint

## Map Marker Improvements

- [x] Add numbered markers (1, 2, 3, etc.) to map matching waypoint list order
- [x] Update marker labels to show numbers instead of default pins
- [x] Add Google Maps icon button to each waypoint in the list for quick navigation
- [x] Ensure marker numbers stay synchronized when waypoints are reordered

## Display Issues

- [x] Show actual phone numbers as text on route waypoint page (e.g., "(936) 900-1828 (Patient)")
- [x] Remove technical metadata (group IDs like "10a5e7768dc5c4f2") from contact cards on home page

## Layout Improvements

- [x] Adjust route detail page layout - make map smaller and waypoint section wider for better visual balance
- [x] Fine-tune layout proportions - current 1/3 map and 2/3 waypoints is too wide, find better balance
- [x] Remove redundant phone emoji from phone number display (Call button already has icon)
- [x] Fix hex ID still showing in contact labels (e.g., "63c2ee10e427465")

## New Features

### Route Export
- [x] Add "Export to CSV" button on route detail page
- [x] Export route metadata (name, distance, duration, date)
- [x] Export all waypoints with addresses, phone numbers, and completion status
- [x] Generate downloadable CSV file

### Contact Import
- [x] Add "Import Contacts" button on home page
- [x] Create CSV upload interface with file picker
- [x] Parse CSV and validate required fields (name, address)
- [x] Validate addresses using Google Maps Geocoding
- [x] Show import preview with validation results
- [x] Bulk insert validated contacts into database

### Route Scheduling Calendar
- [x] Create new Calendar page/view
- [x] Display routes in monthly calendar grid
- [x] Show route cards with name, distance, and time on scheduled dates
- [ ] Implement drag-and-drop to reschedule routes (future enhancement)
- [ ] Add conflict detection for overlapping routes on same day (future enhancement)
- [ ] Show conflict warnings when routes overlap (future enhancement)
- [x] Add navigation link to Calendar in main navigation
- [x] Add calendars table for users with multiple calendars (work, personal, etc.)
- [x] Add calendarId field to routes table
- [ ] Add calendar selector in route creation and calendar view (future enhancement)

## Google Contact Labels Display

- [x] Display Google Contact labels on waypoint cards in route detail page
- [x] Add label filter dropdown to contact selection on home page
- [x] Show label badges on waypoint cards with proper styling

## Google Contact Labels Display

- [x] Display Google Contact labels on waypoint cards in route detail page
- [x] Add label filter dropdown to contact selection on home page
- [x] Show label badges on waypoint cards with proper styling
- [x] Fix Filter by Label dropdown not showing on home page
- [x] Remove "myContacts" and "starred" from label display (show only custom labels)

## Mobile Issues

- [x] Fix map pins not showing on mobile devices when viewing shared execution link

## New Features - Route Scheduling & Completion

### Route Scheduling Date Picker
- [x] Add date picker field to route creation form
- [x] Save scheduledDate when creating routes
- [x] Display scheduled routes on calendar view
- [ ] Allow editing scheduled date from route detail page

### Offline Mode for Route Execution
- [ ] Implement local storage caching for route data
- [ ] Cache waypoints and route details when route is loaded
- [ ] Allow status updates (complete/miss) to work offline
- [ ] Queue offline changes and sync when connection restored
- [ ] Show offline indicator when no connection
- [ ] Display sync status (pending/synced)

### Route Completion Summary
- [ ] Detect when all waypoints are complete
- [ ] Display completion summary modal with statistics
- [ ] Show total time, miles driven, completed vs missed stops
- [ ] Add PDF export button for completion summary
- [ ] Generate PDF report with route details and statistics
- [x] Verify label dropdown shows when custom labels exist

### Recurring/Repeat Dates (Google Calendar-style)
- [x] Add date picker for route scheduling
- [ ] Create RecurrenceSelector component with:
  - Repeat frequency (Daily, Weekly, Monthly, Yearly)
  - Repeat interval (Every 1, 2, 3... weeks/months/etc)
  - Days of week selector (for weekly recurrence)
  - End options (Never, On date, After X occurrences)
- [ ] Update database schema with recurrence fields
- [ ] Generate recurring route instances based on pattern
- [ ] Display recurring routes on calendar view
- [ ] Allow editing/deleting single occurrence or entire series
- [ ] Remove numbered marker from starting location (it's just an anchor, not a stop)

## Custom Labels Not Displaying Issue

- [x] Investigate what label data is stored in database for contacts
- [x] Check label filtering logic in ContactCard.tsx
- [x] Verify label extraction from Google Contact groups format
- [x] Add fetchContactGroupNames function to resolve group IDs to names
- [x] Update sync process to fetch and resolve group names
- [x] Fix label display on contact cards and filter dropdown
- [x] Update SortableWaypointItem to show resolved labels

## Shared Route Execution Map Issues

- [x] Add numbered markers to shared route execution map (they were rendering, just needed better zoom)
- [x] Fix incorrect distance display in SharedRouteExecution (was showing meters as km)
- [x] Verify distance calculation uses correct units (meters vs kilometers)

## Shared Route Map Not Rendering

- [x] Investigate why route line and markers are not showing on shared route execution page
- [x] Check if route data is being fetched correctly from API
- [x] Fixed map rendering by filtering waypoints without coordinates
- [x] Added warning banner for missing coordinates
- [x] Tested with actual shared route: https://routieroo.manus.space/share/74f21387-337f-4692-83c4-005d5c4638a3

## Re-optimize Route with New Stops

- [x] Add database field to track when waypoints were added (createdAt timestamp already exists)
- [x] Implement algorithm to find optimal insertion points for new stops
- [x] Add "Re-optimize Route" button to route detail page
- [x] Calculate best position for each new stop without changing existing order
- [x] Update route distance and duration after re-optimization
- [x] Write tests for re-optimization logic (4/4 tests passing)

## Auto-use Default Starting Point

- [x] Update route creation logic to use user's default starting point from settings when "None" is selected
- [x] Ensure custom starting point and saved starting points still override the default
- [x] Implemented priority: custom > saved > default from settings > none

## Hide Completed Routes Filter

- [x] Add checkbox filter to hide routes where all waypoints are marked complete
- [x] Filter works alongside existing folder filter
- [x] Added checkbox to route list header

## Route Archive System

### Database Schema
- [x] Add `isArchived` boolean field to routes table (default false)
- [x] Add `archivedAt` timestamp field to routes table
- [x] Add `autoArchiveDays` field to users table (nullable int, null = never auto-archive)
- [x] Run database migration

### Backend Procedures
- [x] Create `archiveRoute` mutation (sets isArchived=true, archivedAt=now)
- [x] Create `unarchiveRoute` mutation (sets isArchived=false, archivedAt=null)
- [x] Update `getUserRoutes` to filter out archived routes by default
- [x] Create `getArchivedRoutes` query to fetch archived routes
- [x] Update user settings mutation to handle autoArchiveDays

### Frontend UI
- [x] Create ArchivedRoutes page component
- [x] Add "Archived Routes" link to navigation header
- [x] Add Archive button to route detail page
- [x] Add Unarchive button to archived routes page (already in ArchivedRoutes.tsx)
- [x] Add Archive button to route list items
- [x] Update route list to exclude archived routes (backend filters them out)
- [ ] Add auto-archive settings to Settings page (optional - can be added later)

### Auto-Archive Logic
- [ ] Implement auto-archive check (can be done via scheduled job or on-demand)
- [ ] Auto-archive completed routes based on user's autoArchiveDays setting

## Route Detail Header Layout

- [x] Reorganize route detail page header buttons to wrap to multiple rows
- [x] Group related buttons together (primary, sharing, secondary actions)
- [x] Ensure responsive layout with flex-wrap that doesn't overflow on smaller screens
- [x] Shortened button labels for cleaner appearance

## Route Notes/Comments System

### Database Schema
- [x] Create `route_notes` table with fields: id, routeId, userId, note (text), createdAt, updatedAt
- [x] Run database migration

### Backend Procedures
- [x] Create `addNote` mutation to add new note to a route
- [x] Create `getNotes` query to fetch all notes for a route (ordered by createdAt desc)
- [x] Create `deleteNote` mutation to remove a note
- [x] Create `updateNote` mutation to edit existing note

### Frontend UI
- [x] Add notes section to route detail page
- [x] Create note input field with "Add Note" button
- [x] Display notes list with timestamp and content
- [x] Add edit/delete buttons for user's own notes
- [x] Show relative timestamps (e.g., "2 hours ago", "Yesterday")
- [x] Add empty state message when no notes exist

### Testing
- [x] Write tests for note CRUD operations (5/5 tests passing)
- [x] Test note permissions (users can only edit/delete their own notes)

## Auto-Archive Settings UI

- [x] Add auto-archive settings section to Settings page
- [x] Create dropdown/select for auto-archive timeframe (Never, 7 days, 30 days, 60 days, 90 days)
- [x] Save autoArchiveDays preference to user settings
- [x] Display current auto-archive setting

## Route Completion Progress Badges

- [x] Calculate completed stops vs total stops for each route using SQL subqueries
- [x] Add progress badge to route cards in main list (e.g., "8/12 stops")
- [x] Style badge with visual indicator (green=complete, blue=in progress, gray=not started)
- [x] Show badge on both active and archived route lists


## Railway Deployment OAuth Fix

- [x] Replace Manus OAuth portal with direct Google OAuth implementation
- [x] Update frontend login flow to use Google OAuth directly
- [x] Install googleapis and jsonwebtoken packages
- [x] Update ENV configuration with Google OAuth credentials
- [x] Fix JWT payload to include appId field (required by session validator)
- [x] Replace jsonwebtoken with jose library (already installed)
- [ ] Test authentication on Railway deployment


## Calendar OAuth Redirect URI Fix

- [x] Add publicUrl to ENV configuration
- [x] Update googleOAuthRoute.ts to use ENV.publicUrl instead of req.headers.host
- [x] Update routers.ts calendar OAuth URL generation to use ENV.publicUrl
- [x] Add ENV import to routers.ts
- [ ] Test calendar OAuth flow on Manus deployment

## Main OAuth Login Redirect URI Fix

- [x] Fix main OAuth login to use ENV.publicUrl instead of dynamic host
- [x] Update oauth.ts or relevant OAuth route handler
- [ ] Test login flow on Manus deployment

## Google Contacts Sync OAuth Redirect URI Fix

- [x] Find and fix contacts sync OAuth redirect URI
- [x] Update to use ENV.publicUrl instead of dynamic host
- [ ] Test contacts sync flow on Manus deployment

## Calendar Integration Improvements

### Phase 1 - Calendar Scheduling (In Progress)
- [x] Add calendar selection UI (let user choose which calendar)
- [x] Fetch user's calendar list from Google Calendar API
- [x] Update backend to create separate events for each waypoint
- [x] Calculate individual time slots for each stop based on route timing
- [x] Keep user in Routie Roo instead of redirecting to Google Calendar
- [x] Update route status to "scheduled" after adding to calendar
- [x] Store scheduled date/time in route database
- [x] Add googleCalendarId field to routes table
- [x] Remove "contactGroups/myContacts" from label display
- [ ] Show scheduled date/time in route cards
- [ ] Test calendar integration with multiple events

### Phase 2 - Calendar View Component (Future)
- [ ] Build calendar view component in Routie Roo
- [ ] Fetch and display Google Calendar events
- [ ] Show birthday calendar from Google Contacts
- [ ] Display routes on the calendar
- [ ] Support different views (month/week/day)
- [ ] Sync with multiple Google calendars


## Calendar Event Creation Bug

- [x] Investigate "Failed to create calendar event" error
- [x] Add calendar.readonly OAuth scope
- [x] Add detailed error logging to calendar OAuth callback
- [x] Add error logging to getCalendarList function
- [x] Test on published site to see actual error logs
- [x] Fix the underlying calendar API issue - calendar.readonly scope was the fix!

## Calendar View Component - Phase 2

- [x] Create CalendarView page component (already exists as Calendar.tsx)
- [x] Add backend procedure to fetch calendar events from Google Calendar API
- [x] Display scheduled routes on calendar grid
- [ ] Display contact birthdays from Google Contacts
- [x] Add monthly navigation (previous/next month)
- [x] Add event click to view route details
- [x] Style calendar with color coding for different event types
- [ ] Add filter to show/hide different event types

## Bulk Scheduling Feature

- [ ] Create bulk scheduling UI component
- [ ] Add route selection checkboxes to route list
- [ ] Implement smart time slot suggestion algorithm
- [ ] Add date range picker for bulk scheduling
- [ ] Add time spacing configuration (e.g., 2 hours between routes)
- [ ] Create backend procedure to schedule multiple routes at once
- [ ] Show preview of suggested schedule before confirming
- [ ] Handle conflicts with existing calendar events
- [ ] Add bulk calendar event creation


## Default Stop Time Configuration

- [x] Add defaultStopDuration field to user preferences (15, 30, 45, 60 minutes)
- [x] Add stop duration setting to Settings page
- [x] Update calendar event creation to include stop duration + drive time
- [x] Calculate accurate event times: arrival + stop duration + drive to next stop
- [ ] Show estimated schedule in calendar event creation dialog
- [ ] Allow per-route override of default stop duration


## Calendar Event Duration Mode

- [x] Add eventDurationMode field to user preferences ("stop_only" | "include_drive")
- [x] Add setting in Settings page to choose duration mode
- [x] Update createWaypointEvents to support both modes:
  - "stop_only": Event duration = stop duration, drive time added between events
  - "include_drive": Event duration = stop duration + drive time to this location
- [x] Add tooltip explaining the difference between modes


## Calendar Page UI Updates

- [x] Update calendar page heading to "Routie Roo Calendar - Let's hop to it!"


## Full Google Calendar Integration

- [x] Add function to fetch Google Calendar events for a date range
- [x] Update calendar.getEvents backend procedure to merge routes + Google Calendar events
- [x] Handle calendar OAuth token storage and refresh
- [x] Add color coding: routes (blue), other events (gray)
- [x] Display event details on calendar grid
- [x] Add Connect/Disconnect Google Calendar in Settings
- [ ] Add filter toggles to show/hide different event types
- [ ] Handle events that span multiple days
- [ ] Show event times on hover tooltip


## OAuth Redirect URI Fix

- [x] Check existing Google OAuth redirect URIs
- [x] Update calendar connection to use same redirect URI as contacts sync
- [x] Updated main callback to handle both contacts and calendar via action parameter
- [ ] Test calendar connection with corrected redirect URI


## Calendar View UX Improvements

- [x] Fix color coding - routes are now blue (bg-blue-500), Google events are gray (bg-gray-300)
- [x] Make "+X more" clickable to show all events for that day in a dialog
- [x] Show event times for all events in dialog view
- [x] Display event location and description in dialog
- [ ] Add calendar selection filter to choose which calendars to display


## Calendar Agenda View Redesign

- [ ] Replace monthly grid with day/week agenda view (like Google Calendar)
- [ ] Add time slots (hourly) on the left side
- [ ] Display events as blocks with full titles and times
- [ ] Add calendar selection sidebar with checkboxes
- [ ] Implement view switcher (Day / Week / Month)
- [ ] Color code events by calendar source
- [ ] Show event details on hover
- [ ] Make events clickable to view/edit


## Route Editing Functionality

- [x] Add backend procedure to update route name
- [x] Add backend procedure to update route notes
- [x] Add backend procedure to change starting point
- [x] Add backend procedure to move route to different folder
- [x] Add backend procedure to add waypoints to existing route (already existed)
- [x] Add backend procedure to remove waypoints from route (already existed)
- [x] Create route edit dialog UI with all fields
- [x] Wire up edit dialog to backend procedures
- [x] Test all editing operations (4/4 tests passing)


## Route Editing UX Improvements

- [x] Move Edit Route button from top actions to Waypoints & Execution section header
- [x] Add visible "Add Contact" button in Waypoints section
- [x] Remove contact (trash icon) already visible on each waypoint
- [ ] Test that all buttons are easily discoverable


## Calendar Event Management on Route Edit

- [x] Show warning in edit dialog when route has googleCalendarId
- [x] Add "Delete Calendar Events" button in edit dialog
- [x] Add backend procedure to clear googleCalendarId from route
- [x] Display info message: "Calendar events won't update automatically"
- [x] Allow user to delete old events and recreate with updated route


## Remove Contact Button Fix

- [x] Find where trash icon should be displayed on waypoints
- [x] Add visible trash/delete button to each waypoint (always visible now)
- [x] Wire up to removeWaypoint mutation
- [x] Test waypoint removal functionality


## UI Fixes

- [x] Remove number from starting point display (replaced with flag icon)
- [x] Filter out labels starting with "contactGroups" from contact labels

## Calendar Connection Debug

- [x] Investigate why Google Calendar events aren't showing despite connection
- [x] Implement automatic token refresh when access token expires
- [x] Update calendar.getEvents to refresh token if expired
- [ ] Test token refresh after 1 hour expiry
- [ ] Check if googleCalendarAccessToken is being saved correctly
- [ ] Verify calendar.getEvents is fetching from Google Calendar API
- [ ] Add error logging to calendar event fetching

## Calendar Agenda View Redesign

- [ ] Design day/week view with hourly time slots (7am-9pm)
- [ ] Add view switcher (Day / Week / Month)
- [ ] Display events as blocks positioned by time
- [ ] Add sidebar with mini calendar for date navigation
- [ ] Show calendar list with checkboxes to filter calendars
- [ ] Color code events by calendar
- [ ] Handle overlapping events
- [ ] Add current time indicator


## Calendar Agenda View Redesign

- [x] Create day view with hourly time slots (6am-10pm)
- [x] Create week view with 7 columns and hourly rows
- [x] Display events as colored blocks positioned by time
- [x] Show full event titles and times on blocks
- [x] Add view switcher buttons (Day/Week/Month)
- [x] Keep existing monthly grid as Month view option
- [x] Make Day view the default
- [x] Add navigation for previous/next day or week
- [x] Events displayed inline (no overlap handling needed for now)
- [x] Add current time indicator line (red line) for today


## Calendar Management Features

- [x] Add backend procedure to fetch user's calendar list from Google Calendar API
- [x] Store calendar preferences (visible/hidden) in user settings
- [x] Add calendar sidebar to Calendar page with list of all calendars
- [x] Add checkboxes to show/hide individual calendars
- [x] Color-code events by their source calendar (not just route vs other)
- [ ] Add calendar selector dropdown when scheduling routes
- [ ] Save selected calendar as user's default for route scheduling
- [x] Filter events based on calendar visibility preferences
- [ ] Show calendar name on event hover/click


## Calendar Sidebar Debug - Calendar List Not Showing

- [x] Investigate why calendar sidebar shows "No calendars found" when calendar is connected
- [ ] Issue: User context not refreshed after calendar connection - useAuth() returns stale user data
- [ ] Add refetch mechanism to calendar list query
- [ ] Add manual refresh button to calendar sidebar
- [ ] Invalidate auth.me query when returning from calendar connection
- [ ] Test that calendar list appears after connecting calendar


## Critical Bugs to Fix Before Publishing

- [x] Contact groups (contactGroups/xxx) still showing as labels on contacts
- [x] Contact groups still appearing in label filter dropdown
- [x] Remove all contactGroups references from contact display
- [x] Calendar sidebar not showing calendars even though tokens exist in database
- [x] Fixed by adding auth refresh on calendar connection callback
- [x] Settings page now refreshes user session after connecting calendar


## Calendar Sidebar Still Not Working

- [x] Calendar sidebar still shows "No calendars found" after connecting calendar
- [x] Tested: disconnect → reconnect → still no calendars showing
- [x] Root cause: Calendar tokens are in database but not in session context
- [x] Solution: Fetch calendar tokens directly from database in calendar procedures
- [ ] Implement: getCalendarList should query DB for tokens using ctx.user.id
- [ ] Implement: getCalendarEvents should query DB for tokens using ctx.user.id
- [ ] Remove dependency on ctx.user.googleCalendarAccessToken


## Reliable Calendar Sidebar Implementation

- [x] Add googleCalendarList JSON field to users table to store calendar list
- [x] Add calendarPreferences JSON field to users table to store visibility settings (already exists)
- [x] Fetch calendar list during OAuth connection and save to database
- [x] Create getCalendarList procedure that reads from database (not API)
- [x] Create saveCalendarPreferences procedure to store visibility settings (updateCalendarPreferences already exists)
- [ ] Update Calendar page sidebar to load calendar list from database
- [ ] Add checkboxes for each calendar with instant filtering
- [ ] Filter events based on stored calendar preferences
- [ ] Write tests for calendar list storage and filtering
- [ ] Test complete flow: connect → see calendars → toggle visibility


## Calendar OAuth Not Storing Calendar List

- [x] Check server logs for OAuth callback execution
- [x] Verify getCalendarList function is being called during OAuth
- [x] Check if calendar list JSON is being saved to database
- [x] Verify database has googleCalendarList field populated after connection
- [x] Calendar sidebar now shows calendars successfully!

## Calendar Events Not Displaying

- [x] Calendar list shows in sidebar but no events appear
- [x] Check if getEvents is passing selected calendar IDs
- [x] Verify getEvents procedure fetches from Google Calendar API
- [x] Update getEvents to filter by visible calendars
- [x] Updated getAllCalendarEvents to accept calendar IDs filter
- [x] Updated getEvents procedure to pass visibleCalendars parameter
- [x] Updated Calendar.tsx to pass visibleCalendars to query
- [ ] Test that events appear after fixing query


## Final Two Features Before Publishing

- [x] Make contact labels larger font and bold
- [ ] Add "Add Event" button to Calendar page
- [ ] Create event creation dialog with title, date/time pickers, all-day checkbox
- [ ] Add recurrence options (does not repeat, daily, weekly, custom recurrence)
- [ ] Add calendar selector dropdown in event dialog
- [ ] Add description field for events
- [ ] Create backend procedure to save non-routed events to Google Calendar
- [ ] Test event creation flow
- [ ] Write unit tests for event creation


## Final Polish Items - November 2024

### Contact Label Styling
- [x] Make contact labels larger (text-sm instead of text-xs)
- [x] Make contact labels bold (font-bold)
- [x] Verify labels display prominently on contact cards

### Non-Routed Calendar Events
- [x] Create AddEventDialog component with full event creation UI
- [x] Add title input field
- [x] Add start/end date and time pickers
- [x] Add "All day" checkbox
- [x] Add recurrence options (none, daily, weekly, monthly, custom)
- [x] Add custom recurrence configuration (interval, end conditions)
- [x] Add calendar selector dropdown
- [x] Add description textarea
- [x] Create backend calendar.createEvent tRPC procedure
- [x] Implement Google Calendar API integration for event creation
- [x] Add "Add Event" button to Calendar page
- [x] Test event creation with all field combinations
- [x] Write unit tests for event creation validation


## Route Optimization Bug Fixes - November 2024

### Initial Optimization Not Working
- [x] Investigate why initial route creation with "Optimize Route Order" enabled doesn't reorder waypoints
- [x] Check if Google Routes API optimization flag is being passed correctly
- [x] Verify waypoint order is being saved from API response
- [x] Test initial optimization with multiple contacts
- [x] Fix: Added optimize parameter to calculateRoute function
- [x] Fix: Pass optimizeRoute flag to calculateRoute when creating routes
- [x] Fix: Set requestBody.optimizeWaypointOrder = true when optimize flag is true

### Re-optimization Reverting Manual Changes
- [x] Fix re-optimization to preserve manually reordered waypoints
- [x] Ensure re-optimize only finds optimal positions for newly added stops
- [x] Keep existing waypoints in their manual order
- [x] Test re-optimization after manual drag-and-drop reordering
- [x] Test re-optimization after adding new contacts to existing route
- [x] Fix: When no new stops, recalculate route with current order (preserves manual changes)
- [x] Fix: Update waypoint coordinates after re-optimization to refresh map
- [x] Fix: Map automatically refreshes via useEffect dependency on waypoints


## Home Page Layout Improvements - November 2024

### Section Reorganization
- [x] Move "Route Setup Screen" section to top of Home page
- [x] Move "Your Contact List" section to bottom of Home page
- [x] Change "Your Contacts" title to "Route Setup Screen" in route creation area
- [x] Make all labels bold in route setup form (matching contact list style)

## Custom Contact Fields - November 2024

### Important Dates Feature
- [x] Create important_date_types table in database (id, userId, name, createdAt)
- [x] Add importantDates field to cached_contacts table (JSON array)
- [x] Backend tRPC procedures created (list, create, delete)
- [x] Create Settings UI for managing date type options (add, edit, delete)
- [x] Add Important Dates section to contact edit dialog
- [ ] Add Important Dates editing in route setup screen (inline with contact selection)
- [x] Allow multiple dates per contact with type dropdown
- [x] Display important dates in contact card
- [x] Display important dates in route detail page for each waypoint (read from contact)
- [x] Changes made in route setup update the contact's permanent record (via ContactEditDialog)
- [x] Test important dates functionality
- [x] **FIXED**: Replaced HTML5 date input with shadcn/ui Calendar component
  - Comments feature works perfectly ✅
  - Important Dates feature now working with Calendar picker ✅
  - Calendar picker properly updates React state
  - Both features tested and verified working end-to-end

### Comments Feature
- [x] Create comment_options table in database (id, userId, option, createdAt)
- [x] Add comments field to cached_contacts table (JSON array)
- [x] Backend tRPC procedures created (list, create, delete)
- [x] Create Settings UI for managing comment options (add, edit, delete)
- [x] Add "Other" option that requires custom text input
- [x] Add Comments section to contact edit dialog
- [ ] Add Comments editing in route setup screen (inline with contact selection)
- [x] Display comments in contact card
- [x] Display comments in route detail page for each waypoint (read from contact)
- [x] Changes made in route setup update the contact's permanent record (via ContactEditDialog)
- [x] Test comments functionality


## Route Setup Label Styling Fix - November 2024
- [x] Update Route Setup form labels to use text-sm font-bold (matching contact label style)
- [x] Verify all 6 labels have consistent styling


## RouteDetail Label Styling - November 2024
- [x] Update all labels in Waypoints & Execution screen to use !font-bold
- [x] Verify labels match Home page styling
- [x] Updated 10 Label components in RouteDetail.tsx


## Contact Labels in RouteDetail - November 2024
- [x] Make contact labels/tags bold in waypoint cards (PT Randy Harms, Abundant, etc.)
- [x] Match Home page contact label styling (text-sm font-bold)
- [x] Updated SortableWaypointItem.tsx line 83


## Map Marker Numbering Fix - November 2024
- [x] Change starting point marker from number "1" to flag icon on map
- [x] Renumber actual stops starting from 1 (not 2)
- [x] Ensure waypoint list and map markers use consistent numbering
- [x] Updated RouteDetail.tsx lines 301-315 (flag icon), 325 (renumber from 1), 349 (adjust end marker)


## Routie Roo Starting Point Marker - November 2024
- [x] Copy routieroo2.png to client/public folder as routie-roo-marker.png
- [x] Update map marker to use Routie Roo image instead of flag icon
- [x] Adjust marker size (48x64) and anchor point (24, 64) for proper positioning


## Waypoint List Numbering Fix - November 2024
- [x] Update waypoint list to show stops numbered from 1 (not 2)
- [x] Ensure list numbering matches map marker numbering
- [x] Changed SortableWaypointItem.tsx line 67 from `index + 1` to `index`


## Bug Fixes - Calendar Integration

### Important Dates Calendar UI Issue
- [ ] Fix Calendar component displaying inline instead of in popover
- [ ] Ensure calendar only shows when "Pick a date" button is clicked
- [ ] Test calendar picker UI in ContactEditDialog

### Google Calendar Event Display Issue
- [ ] Investigate why calendar events for Nov 25-28 are not showing in Randy PT Schedule calendar
- [ ] Check calendar event creation logic for date range restrictions
- [ ] Verify timezone handling in calendar integration
- [ ] Test event creation for specific date range (Nov 25-28)
- [ ] Fix root cause of missing calendar events


## Critical Bugs - User Reported (Nov 26, 2025)

- [ ] Fix Calendar UI display bug - calendar showing inline instead of in popover dropdown when adding important dates
- [ ] Remove duplicate comment options (Needs Follow-up 3x, Special Instructions 2x, VIP Client 3x)
- [ ] Investigate Google Calendar events not showing for Nov 25-28 in Randy PT Schedule calendar


## Address Management Improvements - November 2024

### Address Update Workflow
- [x] When user edits waypoint address on route screen, show dialog asking: "Is this a temporary change for this route only, or would you like to update the contact's permanent address?"
- [x] Add "Temporary (route only)" option to keep contact address unchanged
- [x] Add "Update contact address" option to save to cached_contacts table
- [x] Create backend procedure contacts.updateAddress to update contact address
- [x] Test that contact address updates persist and sync to contact card

### Google Maps Address Verification
- [x] Integrate Google Maps Places Autocomplete API for address validation
- [x] Add address autocomplete dropdown with suggestions as user types
- [x] Show formatted address suggestions with city, state, ZIP
- [x] Validate addresses against Google Maps database
- [x] Auto-fill complete address when user selects from dropdown
- [x] Add "powered by Google" attribution per API requirements
- [x] Test address autocomplete in ContactEditDialog
- [x] Test address autocomplete in waypoint address edit dialog

## Page Header Updates - Routie Roo Themed Titles

- [x] Route Setup Screen - "Plan Your Next Hop" (bold) with subtitle "Set up the route Roo will guide you through."
- [x] Your Routes - "Your Hop Library" (bold) with subtitle "A clear, hop-by-hop look at your route." (italic/cursive)
- [x] Your Contacts - "Your Kangaroo Crew" (bold) with subtitle "Everyone you connect with along the journey." (italic/cursive)
- [x] Waypoints & Execution - "Hop-By-Hop Navigation" (bold) with subtitle "Every hop in order — smooth, simple, efficient." (italic/cursive)
- [x] Missed Stops - "Missed Hops" with subtitle "Stops that need a second look before the route is complete." (italic/cursive)


## Bug Fixes - Address Autocomplete

- [x] Fix Google Places Autocomplete to include complete address with state and ZIP code
- [x] Ensure formatted_address is properly captured when user selects from dropdown
- [x] Load Google Maps API globally so autocomplete works on all pages
- [ ] Fix z-index issue - dropdown appears but suggestions are not clickable
- [ ] Test in ContactEditDialog
- [ ] Test in RouteDetail Edit Address dialog


## UI Updates - November 26, 2024

- [x] Change "Missed Hops" header to "Mis-Hops" (play on mishaps)

## Address Validation Feature - November 26, 2024

- [x] Create backend tRPC procedure for address validation using Google Geocoding API
- [x] Add "Validate Address" button next to address input in ContactEditDialog
- [x] Add "Validate Address" button next to address input in RouteDetail Edit Address dialog
- [x] Show validation results with toast messages (valid/suggestions/invalid)
- [x] Allow user to accept suggested formatted address
- [x] Add loading state to validation button
- [x] Test address validation with various address formats (7/7 unit tests passing)


## Bug Fixes - Address Validation (November 26, 2024)

- [ ] Fix "Use This" button in address validation toast - clicking it closes dialog instead of updating address field
- [ ] Ensure validated address fills the input field and keeps dialog open
- [ ] Test address validation flow in ContactEditDialog
- [ ] Test address validation flow in RouteDetail Edit Address dialog

## Changed Addresses Report Feature (November 26, 2024)

### Database Schema
- [ ] Add addressModifiedAt timestamp to cached_contacts table
- [ ] Add originalAddress field to cached_contacts table to track Google's version
- [ ] Push database schema changes

### Backend Implementation
- [ ] Create contacts.getChangedAddresses procedure to fetch contacts with modified addresses
- [ ] Return contact name, original address, new address, and modification date
- [ ] Add CSV export functionality for changed addresses report

### Frontend Implementation
- [ ] Create Changed Addresses Report page/section
- [ ] Display table with: Contact Name, Original Address, New Address, Date Modified
- [ ] Add "Mark as Synced" toggle/button for each contact to remove from report after manual Google update
- [ ] Add "Export to CSV" button for manual Google Contacts sync
- [ ] Add navigation link to report from Settings or main menu
- [ ] Show count of changed addresses that need manual sync
- [ ] Filter out contacts marked as synced from the report

### Testing
- [ ] Test that address changes are tracked with timestamps
- [ ] Test "Mark as Synced" removes contacts from report
- [ ] Test CSV export format is compatible with Google Contacts import
- [ ] Verify report shows only unsynced modified contacts


## Document Upload for Labeled Contacts

- [x] Add documents table to database schema (contactId, fileName, fileUrl, fileKey, uploadedAt, fileSize, mimeType)
- [x] Create document upload UI component with drag-and-drop
- [x] Implement S3 file upload for contact documents
- [x] Add document list display on contact cards
- [x] Add bulk document upload for contacts filtered by label (e.g., "Prairie PT")
- [x] Add document download functionality
- [x] Add document delete functionality
- [x] Support multiple file types (PDF, Word, images, etc.)
- [x] Add file size validation (max 10MB per file)
- [x] Test document upload and retrieval

## Email Reminders for Important Dates

- [x] Add email notification settings to user preferences table
- [x] Add scheduling email address field to settings
- [x] Create email reminder configuration UI in Settings page
- [x] Implement reminder intervals (30 days, 10 days, 5 days before, past due)
- [ ] Create scheduled job to check for upcoming important dates
- [ ] Implement email sending functionality using notification API
- [ ] Add email template for date reminders (License Renewal, etc.)
- [ ] Test email reminder system with different date scenarios
- [ ] Add ability to configure which date types trigger reminders
- [ ] Add reminder history/log for tracking sent notifications


## Document Viewer in Contact Detail View

- [x] Add Documents tab to contact detail view
- [x] Display list of all uploaded documents for a contact
- [x] Show file name, upload date, file size for each document
- [x] Add download button for each document
- [x] Add delete button for each document with confirmation
- [x] Show empty state when no documents exist
- [x] Add upload button in documents tab
- [x] Test document viewer UI and functionality

## Scheduled Reminder Job for Daily Email Checks

- [x] Create scheduled job to run daily at 9 AM
- [x] Job checks all users for upcoming important dates
- [x] Send email reminders based on configured intervals
- [x] Log successful and failed reminder sends
- [x] Handle timezone considerations for scheduling
- [x] Test scheduled job execution
- [ ] Verify emails are sent at correct intervals

## Reminder History Log and Tracking System

- [x] Create reminder_history table in database
- [x] Track: contactId, dateType, reminderDate, sentAt, sentTo, status
- [x] Add backend query to fetch reminder history
- [x] Create "Sent Reminders" page in UI
- [x] Display reminder history with filters (date range, contact, status)
- [x] Show success/failure status for each reminder
- [x] Add pagination for large reminder lists
- [x] Test reminder history tracking and display


## Configure Which Date Types Trigger Email Reminders

- [x] Add enabledReminderDateTypes field to users table (JSON array)
- [x] Update backend to filter reminders by enabled date types only
- [x] Add UI in Settings to show checkbox list of all date types
- [x] Allow user to toggle each date type on/off for reminders
- [x] Default to all date types enabled for backward compatibility
- [x] Test that only enabled date types trigger reminders


## Reorganize Settings Page

- [x] Group settings into logical sections with clear headers
- [x] Site Configuration section (distance units, calling service, app preferences)
- [x] Contacts section (important date types, comment options, email reminders)
- [x] Routes section (starting points, stop types, stop duration, calendar integration)
- [x] Improve visual hierarchy and spacing between sections


## Tabbed Settings Layout

- [x] Convert Settings page to use tabs instead of long scrolling page
- [x] Create tabs: Account, Site Config, Contacts, Routes
- [x] Use shadcn/ui Tabs component for clean implementation
- [x] Ensure mobile responsiveness
- [x] Test tab switching and content display


## Email Template Editor

- [ ] Add email template fields to users table (subject, body for contact, body for team)
- [ ] Create email template editor UI in Settings → Contacts tab
- [ ] Support template variables like {{contactName}}, {{dateType}}, {{date}}, {{daysUntil}}
- [ ] Add emoji support in email templates
- [ ] Preview email template before saving
- [ ] Update email sending to use custom templates
- [ ] Provide default template with emojis

## Emoji Support in Comments

- [ ] Add emoji picker component to comment fields
- [ ] Install emoji picker library (emoji-picker-react or similar)
- [ ] Add emoji button next to comment textarea
- [ ] Test emoji display in saved comments
- [ ] Ensure emojis work across all comment fields (contact comments, route notes, route comments)


## Emoji Picker Widget

- [x] Install emoji-picker-react package
- [x] Create reusable EmojiPicker component wrapper
- [x] Add emoji picker button to contact comment fields
- [x] Add emoji picker button to route notes textarea
- [x] Add emoji picker button to email template textareas
- [x] Style emoji picker to match app theme
- [x] Test emoji insertion in all fields

## Email Template Preview

- [x] Create EmailPreviewDialog component
- [x] Add "Preview Email" button in Settings Contacts tab
- [x] Generate sample email with placeholder data (sample contact, date, etc.)
- [x] Show both contact email and team email versions in preview
- [x] Apply template variables substitution in preview
- [x] Style preview to look like actual email
- [x] Test preview with different template configurations


## Fix Kangaroo Crew Display Issue

- [x] Fix "Bulk Upload Doc" button text getting cut off by card border
- [x] Adjust button layout or card padding to prevent overflow
- [x] Ensure all header buttons are fully visible
- [x] Test on different screen sizes


## Stage-Specific Email Templates

- [x] Update database schema to store separate templates for each reminder stage
- [x] Add fields for 30-day, 10-day, 5-day, and past-due templates (subject + body for contact and team)
- [x] Update Settings UI to show tabbed or accordion interface for each stage
- [x] Add emoji picker to all stage-specific template fields
- [x] Update email sending logic to select correct template based on days until/past date
- [x] Update email preview to show all four stage templates
- [x] Provide default templates for each stage with appropriate tone/urgency
- [x] Test that correct template is used for each reminder interval


## Rescheduled Stops Management System

### Calendar Integration
- [x] Show rescheduled stops on calendar view as distinct event type
- [x] Color code rescheduled stops differently from routes and Google events
- [x] Display reschedule date/time on calendar grid
- [x] Add click handler to view rescheduled stop details
- [x] Group rescheduled stops by date on calendar

### Create Route from Rescheduled Stops
- [x] Add "Create Route from Selected" button to Mis-Hops page
- [x] Add checkboxes to select individual rescheduled stops
- [x] Implement backend procedure to create route from waypoint IDs
- [x] Pre-populate route creation form with selected stops
- [x] Clear reschedule status when stop is added to new route
- [x] Show success message with link to new route

### Reschedule History Tracking
- [x] Create reschedule_history table to track all reschedule events
- [x] Store: waypointId, originalDate, rescheduledDate, reason, status, createdAt
- [x] Add backend procedures: logReschedule, getRescheduleHistory, updateRescheduleStatus
- [x] Create RescheduleHistory page component
- [x] Display all rescheduled stops with filters (pending, completed, re-missed)
- [x] Show original route, contact name, reschedule reason, dates
- [x] Add navigation link to RescheduleHistory page in header
- [x] Export reschedule history to CSV

### Testing
- [x] Write tests for calendar integration with rescheduled stops
- [x] Write tests for route creation from rescheduled stops
- [x] Write tests for reschedule history logging
- [x] Test complete workflow: miss stop → reschedule → create route → complete


## Share Route Bug Fix

- [x] Investigate share route 404 error
- [x] Check if shared route URL pattern is registered in App.tsx
- [x] Verify backend generateShareToken and getSharedRoute procedures
- [x] Test share route generation and access
- [x] Ensure share link works for public access (no auth required)


## Kangaroo Crew Section Layout Update

- [x] Make "Everyone you connect with along the journey" tagline span full width of section
- [x] Adjust layout so tagline is not constrained by title column


## Calendar Display Bug

- [x] Investigate why calendar is not showing any events
- [x] Check calendar.getEvents backend procedure
- [x] Verify Calendar.tsx component rendering
- [x] Check for console errors in browser
- [x] Test with different date ranges


## Kangaroo Crew Button Alignment

- [x] Move action buttons (Refresh, Import CSV, Bulk Upload Doc) to the left
- [x] Adjust button row layout to align with tagline instead of right-aligned


## Rescheduled Stops Not Showing on Calendar

- [x] Fix rescheduleWaypoint procedure to log to reschedule_history table
- [x] Backfill existing rescheduled stops into history table
- [x] Add "Mark as Completed" action to reschedule history page
- [x] Add "Mark as Re-Missed" action to reschedule history page
- [ ] Fix calendar query timezone issue preventing rescheduled stops from appearing
- [ ] Test that rescheduled stops appear on calendar after fix


## Rescheduled Stops Calendar Improvements

- [ ] Make rescheduled stops display as full event blocks on calendar (not small icons)
- [ ] Add title/contact name to rescheduled stop calendar events
- [ ] Ensure rescheduled stops have proper time display on calendar
- [ ] Sync rescheduled stops to Google Calendar when created
- [ ] Update Google Calendar event when reschedule status changes (completed/re-missed)
- [ ] Delete Google Calendar event when reschedule is cancelled
- [ ] Test that rescheduled stops appear as full events like routes
- [ ] Test Google Calendar sync for rescheduled stops


## Account Consolidation & Admin User Management

### Immediate Fix
- [x] Transfer all routes from user 3060004 to user 38
- [x] Transfer all contacts from user 3060004 to user 38
- [x] Update reschedule_history records to use user 38
- [x] Verify rescheduled stops appear on calendar after consolidation

### Admin User Management Page
- [x] Create AdminUsers page component
- [x] Add backend procedure to list all users with stats (route count, contact count)
- [x] Show current logged-in user indicator
- [x] Add "Merge Users" functionality to combine duplicate accounts
- [x] Add "Transfer Routes" functionality to move routes between users
- [x] Add "Delete User" functionality (with confirmation)
- [ ] Add "View as User" functionality for debugging
- [x] Add navigation link to Admin Users page in Settings
- [x] Restrict access to admin role only

### Testing
- [x] Test account consolidation
- [x] Test user merge functionality
- [x] Test that calendar shows rescheduled stops after fix
- [x] Verify both users see same data after consolidation


## Google OAuth Verification

### Testing Mode Setup (Immediate)
- [ ] Document how to add test users in Google Cloud Console
- [ ] Add team members' email addresses as test users
- [ ] Verify test users don't see "unverified app" warning
- [ ] Document testing mode limitations (100 users max)

### Full Verification (Future)
- [ ] Create privacy policy page
- [ ] Create terms of service page
- [ ] Add homepage with app description
- [ ] Submit OAuth verification request to Google
- [ ] Respond to Google's verification questions
- [ ] Wait for approval (1-2 weeks)

## URGENT - Route Detail Page Error

- [x] Fix "Route Not Found" error when clicking on routes
- [x] Add missing columns to route_waypoints table
- [x] Test route detail page loads correctly

## Calendar Integration Issues

- [x] Fix "No calendars found" error on calendar page
- [x] Fix Connect Calendar button to use proper OAuth flow
- [ ] Test calendar connection and verify it works
- [ ] Verify calendar events display correctly

## Email Reminder Template Editing

- [x] Make template placeholders into actual editable default values
- [x] Pre-fill templates with suggested text as default values
- [x] Test template editing and saving

## Contact Sync Issues - Fix Existing Refresh Button

- [x] Investigate why existing Refresh button doesn't update contacts
- [x] Fix refresh to properly update label names (*Abundant, etc.)
- [x] Fix refresh to pull in missing contacts (ABUNDANT Offices, Oscar RN)
- [x] Debug why refresh still doesn't work after publishing
- [x] Found issue: getGoogleAuthUrl was using old state format
- [x] Fixed getGoogleAuthUrl to use JSON state format


## Multi-User Platform Transformation

### Landing Page
- [ ] Create public landing page component (LandingPage.tsx)
- [ ] Add hero section with kangaroo branding and tagline
- [ ] Add features section highlighting key capabilities
- [ ] Add "Sign Up with Google" and "Login" buttons
- [ ] Add footer with links and branding
- [ ] Design friendly/casual style matching Routie Roo theme

### Authentication & User Management
- [ ] Update routing to show landing page for non-authenticated users
- [ ] Keep existing Google OAuth flow for user registration
- [ ] Ensure each user's data is isolated (contacts, routes, settings)
- [ ] Verify admin role is preserved for owner
- [ ] Test new user sign-up flow

### Admin Dashboard
- [ ] Create AdminUsers page (already exists, verify functionality)
- [ ] Show list of all registered users
- [ ] Display user stats (contact count, route count, last active)
- [ ] Add ability to view user details
- [ ] Add ability to disable/enable user accounts (optional)

### Data Isolation & Testing
- [ ] Verify contacts are user-specific
- [ ] Verify routes are user-specific
- [ ] Verify settings are user-specific
- [ ] Test with multiple user accounts
- [ ] Ensure admin can see all users but regular users only see their data

### Deployment
- [ ] Save checkpoint after landing page
- [ ] Save checkpoint after auth updates
- [ ] Save final checkpoint
- [ ] Test on published site with new user registration


## Multi-User SaaS Platform Transformation

### Public Landing Page
- [x] Create LandingPage.tsx component with kangaroo branding
- [x] Add hero section with tagline "Hop Through Your Day with Smart Route Planning"
- [x] Add features grid showcasing route planning, contacts, calendar, reminders
- [x] Add benefits section highlighting time savings and free access
- [x] Add CTA section with "Sign Up with Google" button
- [x] Add footer with branding
- [x] Update App.tsx routing to show landing page for non-authenticated users
- [x] Update App.tsx to show dashboard only for authenticated users
- [x] Add loading spinner while checking authentication
- [x] Keep shared route execution accessible without login

### User Registration & Authentication
- [ ] Verify Google OAuth allows new user registration
- [ ] Test new user sign-up flow
- [ ] Confirm new users get default role of "user"
- [ ] Verify Angela (angelaneason@gmail.com) retains admin role
- [ ] Test that new users start with empty contact/route data

### Data Isolation
- [ ] Verify all contact queries filter by userId
- [ ] Verify all route queries filter by userId
- [ ] Verify all settings queries filter by userId
- [ ] Test that User A cannot see User B's contacts
- [ ] Test that User A cannot see User B's routes
- [ ] Test that User A cannot access User B's route detail pages
- [ ] Verify shared routes work across users (public access)

### Admin Dashboard
- [x] AdminUsers page already exists with user list
- [x] Admin can see all users with stats (routes, contacts, last login)
- [x] Admin can merge duplicate user accounts
- [x] Admin can delete user accounts
- [ ] Test admin dashboard shows all registered users
- [ ] Verify only admin role can access /admin/users
- [ ] Test user merge functionality
- [ ] Test user delete functionality

### Testing & Validation
- [ ] Create test user account via Google OAuth
- [ ] Verify test user sees landing page before login
- [ ] Verify test user can sign up and access dashboard
- [ ] Verify test user has isolated data workspace
- [ ] Verify Angela can access admin dashboard
- [ ] Verify non-admin users cannot access admin dashboard
- [ ] Test multi-user scenarios (2+ users with separate data)

### Documentation
- [ ] Update README with multi-user platform description
- [ ] Document admin features for Angela
- [ ] Create user onboarding guide
- [ ] Document data isolation architecture


## Calendar View Update
- [x] Change default calendar view from Day to Month

## Calendar Event Dialog Colors
- [x] Update event popup dialog to display events with their calendar colors

## Calendar Color Mapping Fix
- [x] Map Google Calendar color IDs to actual hex color values
- [x] Update backend to include calendar backgroundColor in event data
- [x] Display events with proper vibrant colors in popup dialog

## Stop Types Bug Fix
- [x] Fix "Cannot read properties of undefined (reading 'contactName')" error when planning routes with stop types
- [x] Ensure stop types are properly saved when creating routes
- [x] Test route creation with different stop type selections

## Stop Type Selection and Display Issues
- [x] Fix stop type dropdown - unable to change from "other" default
- [x] Display stop types in Hop-By-Hop Navigation view
- [x] Test stop type selection and persistence

## Stop Type Map Icons
- [x] Create custom map marker icons for each stop type
- [x] Update RouteDetail map to use stop type icons
- [x] Test icon visibility and differentiation on map

## Stop Type Selection Bug
- [x] Fix stop type selector reverting to "other" instead of saving selected type
- [x] Verify stop type state is properly updated in contactStopTypes Map
- [x] Test that selected stop types persist when creating routes

## Custom Stop Type Colors Bug
- [x] Fix stop type selector showing blue dots for all custom stop types
- [x] Ensure custom stop type colors from database are properly displayed
- [x] Update color matching logic to work with custom stop type names
- [x] Fix stop type name not displaying in selector (only showing dot)


## Default Stop Type Feature
- [x] Add defaultStopType field to users table in database schema
- [x] Add defaultStopTypeColor field to users table
- [x] Create backend procedure to get/update default stop type preference
- [x] Add default stop type dropdown to Settings page (Routes tab)
- [x] Update route creation to automatically assign default stop type to all contacts
- [x] Allow changing stop type for individual waypoints in route details screen (already exists)
- [x] Test end-to-end: Set default in Settings → Create route → Verify all stops use default → Change individual stop types in route details


## Route Creation Validation Bug
- [x] Fix route.create procedure to accept custom stop type names (currently only accepts hardcoded enum: pickup, delivery, meeting, visit, other)
- [x] Change stopType validation from enum to string to support user's custom stop types
- [x] Fix addWaypoint procedure validation as well
- [x] Remove stop type selector UI from route builder (redundant since we have default + can edit in route details)
- [x] Change database stopType column from enum to varchar(100)
- [x] Test route creation with custom stop types like "Visit", "Eval", "OASIS"


## Stop Type Display and Editing Issues
- [x] Add edit button to waypoint cards for comprehensive editing (stop type, contact name, etc.)
- [x] Create edit dialog with stop type selector and other editable fields
- [x] Move stop type display to be more prominent - show before patient name or on first line
- [x] Add backend mutation for updating waypoint stop type


## Expand Edit Details Dialog
- [x] Add address field to Edit Details dialog
- [x] Add phone numbers editing to Edit Details dialog
- [x] Update backend mutation to handle address and phone number updates
- [ ] Remove redundant "Edit Address" button since it's now in Edit Details (keep for now - separate workflow)
- [x] Test comprehensive waypoint editing (stop type, name, address, phone)


## Automatic Google Contact Sync
- [x] Research Google People API for updating contact details (addresses, phoneNumbers, memberships supported)
- [x] Add labels/groups field to Edit Details dialog UI
- [x] Fetch user's contact groups/labels for selection (user can type labels manually)
- [x] Add labels to updateWaypointDetails backend mutation
- [x] Add contactId field to routeWaypoints schema for tracking Google contacts
- [x] Update route creation to store contactId when adding waypoints
- [x] Implement Google People API sync helper function (stub created, needs OAuth token integration)
- [x] Call sync helper from updateWaypointDetails mutation
- [x] Handle cases where contact doesn't exist in Google (skip sync gracefully)
- [x] Add error handling for Google API failures (don't block waypoint update)
- [ ] Implement OAuth token storage and retrieval for Google sync
- [ ] Implement actual Google People API updateContact call
- [ ] Test label editing and automatic sync end-to-end


## Complete Google Contact Sync Implementation
- [x] Add OAuth token fields to users table (accessToken, refreshToken, tokenExpiry)
- [x] Update OAuth callback to store tokens when user logs in
- [x] Implement token refresh logic for expired tokens
- [x] Complete syncToGoogleContact helper with actual Google People API calls
- [x] Fetch current contact from Google to get etag
- [x] Build proper update request with field masks
- [x] Test full sync flow: edit waypoint → updates Google Contact (ready for user testing)
- [ ] Note: Label sync requires mapping label names to contact group resource names (future enhancement)


## Add Google Sync to Kangaroo Crew Contact Editor
- [x] Update contacts.update procedure to call syncToGoogleContact
- [x] Pass contactId, userId, address, and phoneNumbers to sync helper
- [x] Test editing contact in Kangaroo Crew → verify Google Contact updates


## Calendar Integration Improvements
- [x] Remove starting point from calendar events (only add actual stops)
- [x] Change event titles from "Stop 1: Name" to "Stop Type: Name" (e.g., "Eval: John Smith")
- [x] Add updateCalendarEvent function to googleAuth.ts for Google Calendar API
- [x] Create backend calendar.updateEvent mutation with access token handling
- [x] Add Edit button to event detail dialog in Calendar page
- [x] Create EditEventDialog component with fields for title, start/end time, location, description
- [x] Wire up mutation to EditEventDialog and refresh events after update
- [x] Test: Create route → Add to calendar → Edit event → Verify Google Calendar updates


## Automatic Calendar Sync for Routes

### Database Schema
- [x] Add calendarEventId field to route_waypoints table (VARCHAR storing Google Calendar event ID)
- [x] Update routes table to track calendar sync status (already has googleCalendarId)

### Backend Implementation
- [x] Store calendar event IDs when creating calendar events (map waypoint to event ID)
- [x] Create syncRouteToCalendar mutation to handle route changes (integrated into add/remove/update mutations)
- [x] Detect waypoint additions and create new calendar events
- [x] Detect waypoint removals and delete corresponding calendar events from Google
- [x] Detect waypoint modifications (address, time, stop type) and update calendar events
- [x] Handle token refresh for calendar API calls
- [x] Add error handling for partial sync failures

### Frontend Implementation
- [x] Add "📅 On Calendar" badge to route cards when calendarId exists
- [x] Add calendar indicator to route details page header
- [x] Automatically trigger calendar sync when route is edited (integrated into mutations)
- [x] Show sync status with loading indicator (handled by tRPC mutation states)
- [x] Display success/error messages for sync operations (console logs for debugging)
- [ ] Update "Delete Calendar Events" to also clear event IDs from waypoints (future enhancement)

### Testing
- [x] Test: Database schema supports calendarEventId field
- [x] Test: Calendar event IDs can be stored and updated
- [x] Test: Route tracks calendar sync status
- [x] Test: Visual indicator appears on routes with calendar events
- [ ] Manual test: Add waypoint to route with calendar → Verify new event in Google Calendar
- [ ] Manual test: Remove waypoint from route with calendar → Verify event deleted
- [ ] Manual test: Edit waypoint address → Verify calendar event location updates
- [ ] Manual test: Edit waypoint stop type → Verify calendar event title updates


## Calendar Event Editing Issues

- [x] Fix: Individual calendar events cannot be clicked (only "more" button shows events)
- [x] Add: Individual event click handler to open event detail dialog
- [x] Add: Edit button in event detail dialog for Google Calendar events (already exists)
- [x] Ensure: Edit functionality works for non-route calendar events
- [x] Test: Click individual event → Opens detail dialog → Edit button appears → Can edit and save


## Calendar Event Editing Bug

- [x] Fix: "Missing Event Information" error when clicking calendar events to edit
- [x] Investigate: Event data structure mismatch between Calendar.tsx and EditEventDialog
- [x] Ensure: Event object has all required fields (id, googleEventId, calendarId, etc.)
- [x] Test: Click event → Edit dialog opens with pre-filled data → Can save changes


## Calendar Event Update DateTime Bug

- [x] Fix: "timeRangeEmpty" error when updating calendar events
- [x] Investigate: Datetime formatting in EditEventDialog and updateCalendarEvent
- [x] Ensure: Datetime strings are properly formatted for Google Calendar API (RFC3339 with Z suffix)
- [x] Test: Edit event times → Save → Verify update succeeds


## Calendar Event Title Format

- [ ] Change calendar event titles from "Route - Stop 1: Name" to "Route - StopType: Name"
- [ ] Update createWaypointEvents function to use stopType instead of stop number
- [ ] Capitalize stop type for display (eval → Eval, visit → Visit, etc.)
- [ ] Test: Add route to calendar → Verify event titles show stop types


## Remove from Calendar Button Bug

- [x] Fix: "Remove from Calendar" button does nothing when clicked
- [x] Investigate: Check if deleteCalendarEvents mutation exists and is wired correctly
- [x] Ensure: Button triggers mutation and shows loading/success states
- [x] Update: clearCalendarEvents now deletes events from Google Calendar API
- [x] Update: Clear calendarEventId from all waypoints when removing from calendar
- [x] Test: Click remove button → Events deleted from Google Calendar → UI updates


## Standalone Mobile-First Rebuild (Market Launch Priority)

### Phase 1: Remove Google Dependency - Core Contact Management
- [ ] Create manual contact entry form (name, phone, email, address)
- [ ] Build contact list view (works without Google Contacts)
- [ ] Add contact editing functionality
- [ ] Add contact deletion with confirmation
- [ ] Implement contact search (by name, phone, address)
- [ ] Add contact photo upload (local file upload)
- [ ] Build CSV contact import (upload CSV file with contacts)
- [ ] Add contact export to CSV
- [ ] Create contact validation (ensure required fields)
- [ ] Add address autocomplete using Google Maps Autocomplete API (no auth required)
- [ ] Test contact management flow end-to-end

### Phase 2: Remove Google Dependency - Local Calendar System
- [ ] Create calendar_events table in database (id, userId, title, startTime, endTime, location, description, type)
- [ ] Build manual event creation form
- [ ] Add event editing functionality
- [ ] Add event deletion with confirmation
- [ ] Create calendar view (month/week/day) showing local events
- [ ] Integrate route events into local calendar
- [ ] Add iCal export for events (users can import to any calendar app)
- [ ] Add CSV export for events
- [ ] Remove dependency on Google Calendar API for event storage
- [ ] Make Google Calendar sync optional (keep as enhancement feature)
- [ ] Test local calendar system end-to-end

### Phase 3: Mobile-First UI Redesign
- [ ] Audit all pages on mobile (iPhone, Android)
- [ ] Redesign homepage for mobile (touch-friendly navigation)
- [ ] Redesign contact list for mobile (card layout, large touch targets)
- [ ] Redesign route creation for mobile (step-by-step wizard)
- [ ] Redesign route detail for mobile (collapsible sections)
- [ ] Redesign calendar for mobile (swipe navigation)
- [ ] Redesign settings for mobile (accordion layout)
- [ ] Add mobile-friendly map controls
- [ ] Implement bottom navigation bar for mobile
- [ ] Add pull-to-refresh on list views
- [ ] Test all touch interactions (tap, swipe, pinch-zoom)
- [ ] Optimize for small screens (320px width minimum)

### Phase 4: Simplified Onboarding (No Google Required)
- [ ] Remove Google OAuth requirement for sign-up
- [ ] Create simple email/password registration
- [ ] Build "Getting Started" wizard (no Google steps)
  - Step 1: Add your first contact
  - Step 2: Create your first route
  - Step 3: Explore calendar and execution
- [ ] Add sample data option (pre-populate with demo contacts/routes)
- [ ] Create interactive tutorial overlays
- [ ] Add skip option for users who want to dive in
- [ ] Test onboarding with 10 new users (target < 5 min to first route)

### Phase 5: Offline Mode (Critical for Field Workers)
- [ ] Implement service worker for offline support
- [ ] Cache route data in IndexedDB
- [ ] Cache contact data in IndexedDB
- [ ] Allow route execution offline (mark stops complete/missed)
- [ ] Queue offline changes for sync when online
- [ ] Add offline indicator banner
- [ ] Test offline → online transition
- [ ] Ensure maps work offline (cached tiles)

### Phase 6: Performance Optimization for Mobile
- [ ] Reduce initial bundle size (< 300KB gzipped)
- [ ] Implement lazy loading for routes
- [ ] Implement lazy loading for contacts
- [ ] Add image compression for contact photos
- [ ] Optimize map rendering for mobile
- [ ] Add loading skeletons for all pages
- [ ] Test on slow 3G connection
- [ ] Test on low-end Android device
- [ ] Measure and optimize Time to Interactive (< 3 seconds)

### Phase 7: Mobile-Specific Features
- [ ] Add "Call" button with tel: link (no Google Voice dependency)
- [ ] Add "Text" button with sms: link
- [ ] Add "Navigate" button with maps: link (opens native maps app)
- [ ] Add "Share Route" via native share API
- [ ] Implement geolocation for "Use Current Location" as starting point
- [ ] Add camera integration for contact photos
- [ ] Support mobile notifications (route reminders)
- [ ] Add home screen install prompt (PWA)

### Phase 8: Optional Google Integration (Enhancement, Not Requirement)
- [ ] Move Google Calendar sync to "Integrations" settings
- [ ] Move Google Contacts sync to "Integrations" settings
- [ ] Make both integrations clearly optional
- [ ] Add "Connect Google" buttons (not required for core functionality)
- [ ] Show benefits of connecting Google (automatic sync)
- [ ] Allow disconnecting Google without losing data
- [ ] Test app works fully without any Google connection

### Phase 9: Alternative Authentication
- [ ] Implement email/password authentication
- [ ] Add "Forgot Password" flow
- [ ] Add email verification
- [ ] Add social login options (Apple, Facebook) as alternatives to Google
- [ ] Remove Google OAuth as only login method
- [ ] Test authentication flow on mobile

### Phase 10: Data Portability
- [ ] Build comprehensive CSV export (all contacts, routes, events)
- [ ] Build CSV import for contacts
- [ ] Build CSV import for routes (if user has data from other tools)
- [ ] Add "Download All My Data" button (GDPR compliance)
- [ ] Create data backup/restore functionality
- [ ] Test import/export with large datasets

### Testing & Launch Preparation
- [ ] Test complete flow on iPhone (iOS Safari)
- [ ] Test complete flow on Android (Chrome)
- [ ] Test on tablet (iPad, Android tablet)
- [ ] Test with 1000+ contacts (performance)
- [ ] Test with 100+ routes (performance)
- [ ] Test offline mode thoroughly
- [ ] Conduct user testing with 10 field workers
- [ ] Fix all critical bugs found in testing
- [ ] Create mobile-optimized screenshots for marketing
- [ ] Update user manual for standalone version

### Documentation Updates
- [ ] Rewrite user manual to remove Google dependency mentions
- [ ] Create "Import Contacts from CSV" guide
- [ ] Create "Export to Your Calendar App" guide
- [ ] Update marketing copy to emphasize "No Google Required"
- [ ] Create comparison chart: Standalone vs Google-Connected modes



## Hybrid Architecture: Support Both Google & Standalone Modes

### Phase 1: Dual Authentication System
- [ ] Keep existing Google OAuth login
- [ ] Add email/password authentication as alternative
- [ ] Create unified user model (supports both auth methods)
- [ ] Add "Sign up with Email" and "Sign up with Google" options on registration
- [ ] Allow users to link Google account to existing email account later
- [ ] Test both authentication flows

### Phase 2: Hybrid Contact Management
- [ ] Keep existing Google Contacts sync functionality
- [ ] Add manual contact entry form (for non-Google users)
- [ ] Add CSV contact import (for non-Google users)
- [ ] Show "Import from Google Contacts" button for Google-authenticated users
- [ ] Show "Add Manually" and "Import CSV" buttons for all users
- [ ] Store all contacts in local database (regardless of source)
- [ ] Add contact_source field (google, manual, csv) to track origin
- [ ] Enable editing locally-stored Google contacts
- [ ] Add optional Google Contacts sync toggle in settings
- [ ] Test contact management for both user types

### Phase 3: Hybrid Calendar System
- [ ] Keep existing Google Calendar integration
- [ ] Create local calendar_events table for standalone events
- [ ] Show "Add to Google Calendar" button (only for Google-authenticated users)
- [ ] Show "Add to Local Calendar" button (for all users)
- [ ] Display both Google and local events in calendar view
- [ ] Add iCal export for local events
- [ ] Add "Sync to Google Calendar" toggle in settings (for Google users)
- [ ] Allow Google users to choose: local-only, Google-only, or both
- [ ] Test calendar functionality for both user types

### Phase 4: Settings & User Preferences
- [ ] Add "Account Type" indicator in settings (Google-connected vs Standalone)
- [ ] Add "Connect Google Account" button for standalone users
- [ ] Add "Disconnect Google Account" button for Google users (with warning)
- [ ] Show Google-specific settings only to Google-connected users
- [ ] Add "Data Source" preferences (prefer Google vs prefer local)
- [ ] Create migration flow: standalone → Google-connected
- [ ] Create migration flow: Google-connected → standalone
- [ ] Test account type switching

### Phase 5: UI Adaptation Based on Account Type
- [ ] Show/hide Google-specific buttons based on authentication method
- [ ] Display "Connect Google for automatic sync" banner for standalone users
- [ ] Add "Benefits of Connecting Google" tooltip/modal
- [ ] Show contact source badges (Google icon vs manual icon)
- [ ] Adapt onboarding wizard based on chosen authentication method
- [ ] Test UI for both user types

### Phase 6: Data Sync Logic
- [ ] Implement contact sync: Google → Local (for Google users)
- [ ] Implement calendar sync: Local → Google (optional for Google users)
- [ ] Add conflict resolution (last-write-wins or user-choice)
- [ ] Add sync status indicators ("Synced", "Syncing", "Sync Failed")
- [ ] Add manual "Sync Now" button
- [ ] Handle Google token expiration gracefully
- [ ] Test sync reliability

### Phase 7: Mobile Optimization (Universal)
- [ ] Ensure mobile UI works for both user types
- [ ] Test onboarding on mobile for email/password flow
- [ ] Test onboarding on mobile for Google OAuth flow
- [ ] Optimize contact import (CSV) for mobile file upload
- [ ] Test all features on iPhone and Android for both modes

### Phase 8: Documentation & Marketing
- [ ] Update user manual to explain both modes
- [ ] Create "Standalone vs Google-Connected" comparison chart
- [ ] Add FAQ: "Do I need a Google account?"
- [ ] Create tutorial: "How to connect Google later"
- [ ] Create tutorial: "How to import contacts without Google"
- [ ] Update marketing copy: "Works with or without Google"



## Route Detail Screen Enhancements

### Stop Reordering Improvements
- [x] Remove drag-and-drop interface for stop reordering
- [x] Add stop number input field for each waypoint
- [x] Allow users to type new position number to reorder
- [x] Add save button to persist manual order
- [x] Add hasManualOrder flag to routes table
- [x] Add reorderWaypoints backend procedure
- [x] Fix TypeScript errors in RouteDetail
- [ ] Modify re-optimize to preserve manual order (only optimize new stops)

### Visual Enhancements
- [ ] Add contact icons to route detail waypoints (matching contact list)
- [x] Display contact labels/groups on each stop (already implemented in SortableWaypointItem lines 84-99)
- [ ] Show visual indicators for contacts without addresses
- [ ] Ensure consistent styling between contact list and route detail

### Gap Stop Feature
- [x] Add isGapStop boolean field to route_waypoints table
- [x] Add gapDuration field to route_waypoints table (in minutes)
- [x] Add gapDescription field to route_waypoints table
- [ ] Create "Add Gap Stop" button in route detail
- [ ] Create gap stop dialog (description, duration, position)
- [ ] Display gap stops differently from contact stops
- [ ] Include gap stop duration in calendar time calculations
- [ ] Exclude gap stops from contact-based operations

### Calendar Visual Indicator
- [ ] Add calendar icon/badge to routes that have been added to calendar
- [ ] Show calendar status in route list (Home page)
- [ ] Show calendar status in route detail header
- [ ] Use different visual for routes with scheduled dates vs calendar events

### Backend Updates
- [ ] Update route creation to support gap stops
- [ ] Update re-optimize logic to skip gap stops
- [ ] Update waypoint reordering to handle gap stops
- [ ] Add validation for gap stop data

## Bug Fix - Map Markers Disappearing on Reorder

- [x] Fix map markers disappearing when changing stop order with number inputs
- [x] Ensure map updates when localWaypoints state changes
- [x] Verify map markers persist after reordering

## Bug Fix - Contact Photos Not Displaying on Waypoints

- [ ] Verify photoUrl is being fetched from cached_contacts
- [ ] Check if photoUrl is being passed when creating routes
- [ ] Verify photoUrl is stored in route_waypoints table
- [ ] Debug SortableWaypointItem photo rendering logic
- [ ] Test with actual Google contact photos

## UI/UX Improvements - User Requested

- [x] Exclude starting point from calendar events (it's just an anchor)
- [x] Fix route notes section not working at bottom of Route Details (route_notes table was missing, now created)
- [x] Remove "Copy Link" button (doesn't work, duplicate of Share)
- [x] Move route name from screen header into route details card
- [x] Move contact labels to display under contact name
- [x] Change "Calendar" button text to "Add To Calendar"


## Gap Stop Feature - In Progress

- [x] Create "Add Gap Stop" button in route detail page
- [x] Build gap stop creation dialog (name, duration, description)
- [x] Add backend mutation to create gap stops (waypoints with isGapStop=true)
- [x] Display gap stops in waypoint list with distinct styling (clock icon, no contact info)
- [x] Add gap stop icon/marker on map (happy emoji with clock)
- [x] Calendar logic: Skip gap stops as events but add their duration to timing calculations
- [x] Allow reordering gap stops with regular stops (drag-and-drop works)
- [x] Test gap stop creation, display, and calendar timing

## Gap Stop UI Refinement - Complete

- [x] Hide Complete/Miss/Add Note buttons for gap stops (they're time blocks, not contact stops)
- [x] Keep only Edit Details and Remove buttons for gap stops
- [x] Test gap stop action buttons display correctly

## Gap Stop Visual Update - Complete

- [x] Replace clock icon with cute emoji image in stop list
- [x] Test gap stop display with new image

## Gap Stop Position Control - Complete

- [x] Add "Insert After Stop #" field to gap stop dialog
- [x] Update addGapStop mutation to accept insertAfterPosition parameter
- [x] Update backend logic to insert gap stop at specified position
- [x] Test gap stop insertion at various positions

## Gap Stop Map Display - Complete

- [x] Removed gap stop markers from map (they're time blocks, not physical locations)
- [x] Gap stops now only appear in stop list with cute emoji
- [x] Map shows only physical stops for cleaner visualization

## Bug Fixes - Complete

- [x] Add validation message when attempting to add contact without address (already implemented)
- [x] Fix stop type colors in shared route view (now using waypoint.stopColor)
- [x] Fix missing Google profile photos in shared route view (now displaying with stop number badge)
- [x] Test all fixes

## PhotoUrl Backfill - Complete

- [x] Create backfill script to update existing waypoints with contact photoUrls
- [x] Run backfill script on all existing routes (updated 9 waypoints, 24 total with photos)
- [x] Verify photoUrls are populated in route waypoints
- [x] Ensure addWaypoint mutation saves photoUrl for new waypoints

## PhotoUrl Fix - Complete

- [x] Verified stop types display correctly (Visit in blue)
- [x] Identified root cause: waypoints missing contactId field
- [x] Created improved backfill script that matches by contact name
- [x] Backfilled 96 waypoints with photoUrl and contactId
- [x] Verified Home page already saves contactId for new routes
- [x] Confirmed route 390001 now has photos


## Stop Type Color Fix - Complete

- [x] Investigated why waypoints show default blue color instead of custom stop type colors
- [x] Found old routes were created before custom stop types were set up
- [x] Created update script to map stop types to user's custom colors
- [x] Updated 81 waypoints with correct custom colors
- [x] Verified route 390001 now displays yellow for "Visit" stop type


## Route Copy Color Fix - Complete

- [x] Investigated route copy logic (routes.copyRoute procedure)
- [x] Found copyRoute was missing stopColor, photoUrl, and contactId fields
- [x] Fixed route copy to preserve stopColor, photoUrl, and contactId from original
- [x] Verified addWaypoint already includes stopColor for new stops
- [ ] Test that newly copied routes maintain custom colors


## Color Legend Feature - Complete

- [x] Designed color legend component for route detail page
- [x] Extract unique stop types from route waypoints (excluding starting point and gap stops)
- [x] Display legend with stop type names and color circles
- [x] Positioned legend in Route Details card after notes section
- [x] Legend only shows if route has actual stop types


## Scheduler Sticky Notes - Complete

- [x] Created scheduler_notes table in database schema
- [x] Added userId, noteText, isCompleted, createdAt, completedAt fields
- [x] Pushed database schema changes via SQL
- [x] Created backend procedures (list, create, toggleComplete, delete)
- [x] Copied pushpin graphic to client/public directory
- [x] Designed sticky note UI component with pushpin graphic
- [x] Added toggle to expand/collapse notes
- [x] Added note input with Enter key support
- [x] Implemented checklist with checkboxes
- [x] Added delete button for each note
- [x] Separated pending and completed notes sections
- [x] Added sticky note component to home page (centered at top)
- [x] Made sticky note draggable with mouse and touch
- [x] Positioned sticky note at top right on desktop, centered on mobile
- [x] Added drag handle with grip icon
- [x] Added mobile touch support (touchstart, touchmove, touchend)
- [x] Prevents scrolling while dragging on mobile
- [x] Responsive width for mobile screens
- [x] Notes are private (stored per user, not shared with routes)


## Sticky Note Redesign - Complete

- [x] Use sticky note graphic as background image
- [x] Overlay reminder text directly ON the sticky note graphic
- [x] Styled text with cursive font to look handwritten
- [x] Text appears on the pink/coral sticky note paper area
- [x] Entire sticky note (including pushpin) is draggable
- [x] Maintained all functionality (add, complete, delete, toggle)
- [x] Compact design to fit on sticky note dimensions


## Sticky Note Improvements - Complete

- [x] Moved input field down to avoid pushpin overlap (pt-[110px])
- [x] Made all note text bold for better readability
- [x] Added resize functionality (drag corner resize handle)
- [x] Minimum size constraint (250x250px)
- [x] Resize works on both desktop and mobile
- [x] Resize handle with maximize icon in bottom-right corner


## Sticky Note Redesign with Pushpin - Complete

- [x] Copied yellow pushpin graphic to public folder
- [x] Redesigned sticky note with light purple background (#e9d5ff)
- [x] Positioned pushpin at top center (draggable)
- [x] No overlap - content starts below pushpin with proper padding
- [x] Added scrollable area for unlimited notes
- [x] Kept resize functionality (250-500px width, 300-700px height)
- [x] Each note has white/transparent background for readability
- [x] Resize handle with grip icon in bottom-right


## Sticky Note Collapse Fix - Complete

- [x] Make collapsed state shrink to minimal height (50px)
- [x] Add smooth transition animation when collapsing/expanding
- [x] Hide resize handle when collapsed
- [x] Ensure add reminder input works when expanded


## Sticky Note Mobile Layout Issue

- [x] Fix sticky note covering page content when expanded on mobile
- [x] Adjust z-index or positioning to prevent layout interference
- [x] Consider making sticky note collapsible by default on mobile
- [x] Test sticky note doesn't block important UI elements


## Sticky Note Horizontal Scroll Issue

- [x] Hide sticky note completely on mobile (< 768px) by default
- [x] Add floating toggle button on mobile to show/hide sticky note
- [x] Ensure no horizontal scroll when sticky note is hidden
- [x] Make sticky note overlay content (not push layout) when shown on mobile
- [x] Test that mobile layout stays normal width without sticky note


## Mobile Viewport Width Issue

- [x] Fix screen being too wide on mobile
- [x] Fix stretched logo on mobile
- [x] Fix calendar layout being misaligned
- [x] Ensure sticky note toggle button is visible and accessible
- [x] Add proper viewport constraints to prevent horizontal overflow
- [x] Test all header elements fit within mobile viewport


## Remaining Mobile Width Issues

- [x] Fix screen still being too wide on mobile (cannot see full content)
- [x] Fix calendar page - stuck on calendar list with no way to scroll or exit
- [x] Add back button or navigation on calendar page for mobile
- [x] Identify and fix elements causing horizontal overflow
- [x] Ensure all pages have proper max-width constraints
- [x] Test navigation between pages on mobile


## Home Screen Width Issue

- [x] Fix home screen still being too wide on mobile
- [x] Identify elements causing horizontal overflow on home page
- [x] Make route planning cards responsive
- [x] Ensure hop library fits within mobile viewport
- [x] Test all home page sections on mobile


## Contact Label Badge Layout

- [x] Make contact label badges span full width on mobile
- [x] Change label badges from inline to block/full-width layout
- [x] Test label display on mobile


## Label Text Wrapping Fix

- [x] Prevent label text from wrapping to multiple lines
- [x] Make labels display on single line (e.g., "PT Randy Harms" on one line)
- [x] Test on mobile


## Sticky Note Desktop Toggle

- [x] Make sticky note hidden by default on desktop (like mobile)
- [x] Show floating pushpin button on desktop
- [x] Test toggle functionality on desktop


## Pushpin Button Visibility Issue

- [x] Fix pushpin button not appearing on desktop
- [x] Ensure button is always visible regardless of sticky note state
- [x] Test button visibility on desktop


## Contact Labels Not Showing on Route Details

- [x] Investigate why labels are not displaying on waypoint cards
- [x] Check if contactLabels field is being passed to waypoint component
- [x] Fix label rendering in SortableWaypointItem component (extract from contactGroups/ format)
- [ ] Test label display on route details page
- [ ] Verify labels are being saved when creating new routes
- [ ] Check if existing routes need label data migration

## Mobile Label Truncation Issue

- [x] Remove text truncation (whitespace-nowrap, text-ellipsis) from mobile contact labels
- [x] Extract full label names from contactGroups/ format ("R. Harms" instead of "PT R Harms")
- [x] Fix label container to allow text wrapping like phone numbers
- [ ] Test label display on mobile devices


## Mobile Route Detail Text Overflow

- [x] Fix text running off page on mobile route detail view
- [x] Add proper text wrapping and responsive layout (header and action buttons)
- [ ] Test on mobile devices


## Stop Type Colors Not Applied

- [x] Investigate where stop types are assigned during route creation - stop types were deleted
- [x] Fix to use user's custom stop type colors instead of hardcoded defaults
- [x] Created "Visit" stop type with black color (#000000)
- [x] Set "Visit" as default stop type in settings
- [ ] Test creating new route to verify black color is applied


## Duplicate Contact Issue

- [ ] Investigate Ashley Marston appearing under wrong label (Prairie PT instead of correct label)
- [ ] Check if contact ID 750664c109a2dd83 has correct labels in database
- [ ] Verify label filtering logic is working correctly
- [ ] Fix any data inconsistencies
