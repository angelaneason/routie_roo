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
