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
- [x] Add "Powered by Contact Route Mapper" footer on public pages

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
- [x] Hide "Contact Route Mapper" text in header
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
- [ ] Add manage starting points UI in Settings
- [x] Fix shared route map to center on route's starting point
- [x] Store route owner's distance unit preference with route for shared views
