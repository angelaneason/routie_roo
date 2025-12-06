# Smart Auto-Routing Feature Guide

**Routie Roo - Intelligent Weekly Route Automation**

---

## Overview

The **Smart Auto-Routing** feature transforms how you manage recurring visits by automatically creating optimized weekly routes based on your contact schedules. Instead of manually planning routes every week, you simply tell Routie Roo which days you visit each contact, and the system handles the rest.

This feature is designed for professionals who visit the same contacts on a regular weekly schedule—such as sales representatives, field service technicians, healthcare providers, and delivery personnel.

---

## Key Benefits

**Time Savings**: Eliminate the repetitive task of creating similar routes week after week. What used to take 30-60 minutes of planning now happens automatically.

**Consistency**: Ensure you never miss a scheduled visit. The system creates routes for every scheduled day, maintaining your regular visit cadence without manual intervention.

**Optimization**: Routes are automatically optimized for the most efficient travel path, reducing drive time and fuel costs while maximizing the number of contacts you can visit.

**Flexibility**: While routes are auto-generated, you retain full control to modify them as needed for special circumstances or last-minute changes.

---

## How It Works

The Smart Auto-Routing system operates on a simple three-step process that runs automatically each week.

### Step 1: Schedule Your Contacts

For each contact in your database, you specify which days of the week you plan to visit them. This can be any combination of days—for example, "Monday and Thursday" or "Tuesday, Wednesday, Friday." Contacts without scheduled days are simply excluded from auto-routing.

### Step 2: Configure Your Preferences

In the Settings page, you enable Smart Auto-Routing and optionally configure:

- **Default Folder**: Where auto-generated routes should be saved (keeps your workspace organized)
- **Starting Point**: Your office, home, or preferred starting location for all routes
- **Auto-Optimization**: Whether routes should automatically optimize waypoint order for efficiency

### Step 3: Automatic Route Creation

Every week, the system automatically creates one route for each day that has scheduled contacts. For example, if you have contacts scheduled for Monday, Wednesday, and Friday, three routes are created:

- "Monday Route - Week of Dec 9, 2024"
- "Wednesday Route - Week of Dec 9, 2024"  
- "Friday Route - Week of Dec 9, 2024"

Each route contains all contacts scheduled for that specific day, ordered for optimal travel efficiency if auto-optimization is enabled.

---

## Getting Started

### Enabling Smart Auto-Routing

1. Navigate to **Settings** from the sidebar menu
2. Scroll to the **Smart Auto-Routing** section
3. Toggle **Enable Smart Auto-Routing** to ON
4. (Optional) Select a **Default Folder** for auto-generated routes
5. (Optional) Enter a **Starting Point** address
6. (Optional) Toggle **Auto-Optimize Routes** based on your preference
7. Click **Save Preferences**

### Scheduling Contacts

There are two ways to schedule contacts for recurring visits:

#### Method 1: Individual Contact Scheduling

1. Go to **Plan Routes** and view your contacts list
2. Click on any contact card
3. In the contact details panel, find the **Scheduled Days** section
4. Select the days you visit this contact (e.g., Monday, Wednesday)
5. Click **Save** to apply the schedule

#### Method 2: Bulk Scheduling (Coming Soon)

Future updates will include the ability to schedule multiple contacts at once using filters and bulk actions.

### Viewing Your Schedule

The **Smart Routing Dashboard** provides a comprehensive overview of your weekly schedule:

1. Navigate to **Smart Routing** from the sidebar menu
2. View summary cards showing:
   - Total scheduled contacts
   - Number of auto-generated routes
   - Active days in your schedule
3. Review the **Weekly Schedule** section to see which contacts are scheduled for each day
4. Check the **Auto-Generated Routes** section to access this week's routes

---

## Managing Auto-Generated Routes

### Viewing Routes

Auto-generated routes appear in your routes list with a special indicator. Click any route to view:

- Complete list of scheduled contacts for that day
- Optimized travel order (if auto-optimization is enabled)
- Estimated total distance and drive time
- Interactive map showing all waypoints

### Modifying Routes

While routes are created automatically, you can modify them just like any manual route:

- **Add contacts**: Include additional stops not in the weekly schedule
- **Remove contacts**: Skip a contact for this specific week
- **Reorder stops**: Manually adjust the sequence if needed
- **Change starting point**: Override the default for a specific route

Changes to auto-generated routes do not affect future weeks—the system creates fresh routes each week based on your contact schedules.

### Archiving Old Routes

Routes from previous weeks can be archived to keep your active routes list clean. Archived routes remain accessible for record-keeping and mileage tracking.

---

## Best Practices

### Organizing Your Schedule

**Start with your most frequent contacts**: Begin by scheduling contacts you visit every week on the same days. This provides immediate value and builds confidence in the system.

**Use consistent day patterns**: Try to maintain regular visit days for each contact. This helps you and your contacts establish predictable routines.

**Review weekly**: Check the Smart Routing Dashboard at the start of each week to confirm routes were created as expected and make any necessary adjustments.

### Folder Organization

Create a dedicated folder called "Weekly Routes" or "Auto-Generated" to keep auto-created routes separate from special-purpose or one-time routes. This makes it easier to find and manage your recurring schedule.

### Starting Point Strategy

If you start from the same location most days (like an office), set that as your default starting point. If your starting location varies, leave this blank and set it manually for each route as needed.

### Optimization Settings

**Enable auto-optimization if**: You visit many contacts per day (5+) and want the system to find the most efficient route order automatically.

**Disable auto-optimization if**: The order you visit contacts matters for business reasons (e.g., priority clients first, or specific time windows), and you prefer to manually arrange the sequence.

---

## Troubleshooting

### Routes Not Being Created

**Check that Smart Auto-Routing is enabled**: Go to Settings and verify the toggle is ON.

**Verify contacts have scheduled days**: At least one contact must have scheduled days assigned for routes to be created.

**Confirm folder exists**: If you specified a default folder, make sure it hasn't been deleted.

### Contacts Missing from Routes

**Check the scheduled days**: Ensure the contact is scheduled for the day in question (e.g., if Monday's route is missing a contact, verify that contact has "Monday" in their scheduled days).

**Verify contact is active**: Inactive contacts are excluded from auto-routing.

### Routes in Wrong Folder

If routes are appearing in the wrong folder, check your default folder setting in Settings > Smart Auto-Routing. Changes to this setting apply to future routes, not existing ones.

---

## Technical Details

### Route Naming Convention

Auto-generated routes follow the pattern: `{Day} Route - Week of {Month} {Date}, {Year}`

For example: "Monday Route - Week of Dec 9, 2024"

This naming scheme ensures routes are easily identifiable and sortable by date.

### Scheduled Days Format

Contact scheduled days are stored as a comma-separated list of full day names: "Monday, Wednesday, Friday"

The system recognizes: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

### Auto-Optimization Algorithm

When auto-optimization is enabled, routes use a traveling salesman algorithm to find the most efficient order of waypoints, minimizing total drive time while visiting all scheduled contacts.

### Database Schema

The feature adds the following fields to the system:

**Users table**:
- `enableSmartRouting`: Enable/disable flag
- `smartRoutingFolder`: Default folder name
- `smartRoutingStartingPoint`: Default starting address
- `autoOptimizeRoutes`: Auto-optimization flag

**Contacts table**:
- `scheduledDays`: Comma-separated day names

**Routes table**:
- `isAutoGenerated`: Flag to identify auto-created routes

---

## Frequently Asked Questions

**Q: Can I schedule a contact for different days in different weeks?**  
A: Currently, scheduled days apply to every week. If you need to skip a week, you can delete or modify the auto-generated route for that specific week.

**Q: What happens if I change a contact's scheduled days?**  
A: Changes apply to future routes. Routes already created for the current week are not automatically updated.

**Q: Can I disable Smart Auto-Routing temporarily?**  
A: Yes, simply toggle it OFF in Settings. Existing auto-generated routes remain, but no new routes will be created.

**Q: Do auto-generated routes count toward my route limit?**  
A: Auto-generated routes count the same as manually created routes. There is no separate limit.

**Q: Can I have both auto-generated and manual routes?**  
A: Absolutely. Smart Auto-Routing is designed to complement your manual route planning, not replace it entirely.

---

## Future Enhancements

We're continuously improving Smart Auto-Routing based on user feedback. Planned features include:

- **Bulk contact scheduling**: Schedule multiple contacts at once
- **Bi-weekly and monthly patterns**: Support for visit schedules beyond weekly
- **Time window support**: Specify preferred visit times for each contact
- **Route templates**: Save and reuse custom route configurations
- **Advanced optimization**: Factor in traffic patterns and appointment times

---

## Support

If you encounter issues or have questions about Smart Auto-Routing, please contact support through the Help menu or visit our documentation portal.

---

*Last updated: December 2024*  
*Routie Roo - Smart Route Planning Made Simple*
