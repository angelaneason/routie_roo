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
- [ ] Create Settings UI for managing date type options (add, edit, delete)
- [ ] Add Important Dates section to contact edit dialog
- [ ] Add Important Dates editing in route setup screen (inline with contact selection)
- [ ] Allow multiple dates per contact with type dropdown
- [ ] Display important dates in contact card
- [ ] Display important dates in route detail page for each waypoint (read from contact)
- [ ] Changes made in route setup update the contact's permanent record
- [ ] Test important dates functionality

### Comments Feature
- [x] Create comment_options table in database (id, userId, option, createdAt)
- [x] Add comments field to cached_contacts table (JSON array)
- [ ] Create Settings UI for managing comment options (add, edit, delete)
- [ ] Add "Other" option that requires custom text input
- [ ] Add Comments section to contact edit dialog
- [ ] Add Comments editing in route setup screen (inline with contact selection)
- [ ] Display comments in contact card
- [ ] Display comments in route detail page for each waypoint (read from contact)
- [ ] Changes made in route setup update the contact's permanent record
- [ ] Test comments functionality


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
