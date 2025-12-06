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
