# Routie Roo TODO

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

## Known Issues (Non-Blocking)

- Integration tests require test data fixtures (expected behavior)

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
- [x] Fix Google Maps API not loading in AddressAutocomplete component (causing React error #31)
