# Routie Roo - Database Export Guide

**Date:** November 24, 2025  
**Purpose:** Export your database data (contacts, routes, etc.) for backup or migration

---

## Quick Export via Manus UI (Recommended)

The easiest way to export your database is through the Manus Management UI:

### Step-by-Step:

1. **Open Management UI** (right panel in your interface)
2. **Click "Database" tab**
3. **Select each table** you want to export:
   - `users` - Your account settings
   - `cached_contacts` - All 225 contacts
   - `routes` - All 127 routes
   - `route_waypoints` - All waypoint data
   - `folders` - Route folders
   - `stop_types` - Custom stop types
   - `saved_starting_points` - Saved starting locations
   - `calendars` - Calendar configurations
   - `route_notes` - Route notes/comments

4. **Click "Export" button** for each table
5. **Choose format:**
   - CSV (recommended for Excel/spreadsheets)
   - JSON (recommended for programmatic import)
   - SQL (recommended for database migration)

6. **Download files** to your computer

---

## Manual Export via SQL

If you prefer SQL exports, you can use the Database tab in Manus UI to run these queries:

### Export Contacts
```sql
SELECT * FROM cached_contacts;
```

### Export Routes
```sql
SELECT * FROM routes;
```

### Export Waypoints
```sql
SELECT * FROM route_waypoints;
```

### Export Folders
```sql
SELECT * FROM folders;
```

### Export Stop Types
```sql
SELECT * FROM stop_types;
```

### Export Starting Points
```sql
SELECT * FROM saved_starting_points;
```

### Export Calendars
```sql
SELECT * FROM calendars;
```

### Export Route Notes
```sql
SELECT * FROM route_notes;
```

### Export User Settings
```sql
SELECT * FROM users;
```

Copy the results and save them as CSV or JSON files.

---

## Programmatic Export (Advanced)

If you want to export programmatically, create this script:

### `export-db.ts`
```typescript
import { drizzle } from "drizzle-orm/mysql2";
import { users, routes, routeWaypoints, cachedContacts, folders, stopTypes, savedStartingPoints, calendars, routeNotes } from "./drizzle/schema";
import fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function exportData() {
  console.log("Exporting database data...");
  
  const data = {
    users: await db.select().from(users),
    routes: await db.select().from(routes),
    routeWaypoints: await db.select().from(routeWaypoints),
    cachedContacts: await db.select().from(cachedContacts),
    folders: await db.select().from(folders),
    stopTypes: await db.select().from(stopTypes),
    savedStartingPoints: await db.select().from(savedStartingPoints),
    calendars: await db.select().from(calendars),
    routeNotes: await db.select().from(routeNotes),
  };
  
  // Write JSON export
  fs.writeFileSync(
    "database-export.json",
    JSON.stringify(data, null, 2)
  );
  
  console.log("✅ Database exported successfully!");
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Routes: ${data.routes.length}`);
  console.log(`- Waypoints: ${data.routeWaypoints.length}`);
  console.log(`- Contacts: ${data.cachedContacts.length}`);
  console.log(`- Folders: ${data.folders.length}`);
  console.log(`- Stop Types: ${data.stopTypes.length}`);
  console.log(`- Starting Points: ${data.savedStartingPoints.length}`);
  console.log(`- Calendars: ${data.calendars.length}`);
  console.log(`- Route Notes: ${data.routeNotes.length}`);
}

exportData().catch(console.error).finally(() => process.exit(0));
```

### Run the export:
```bash
cd /home/ubuntu/contact-route-mapper
tsx export-db.ts
```

This creates `database-export.json` with all your data.

---

## What's Included in Export

### User Data
- Account settings (name, email, preferences)
- Preferred calling service
- Distance unit preference (km/miles)
- Default starting point
- Auto-archive settings

### Contacts (225 contacts)
- Names, emails, addresses
- Phone numbers with labels
- Contact photos (URLs)
- Google Contact labels
- Active/inactive status

### Routes (127 routes)
- Route names and notes
- Total distance and duration
- Optimization settings
- Folder assignments
- Calendar assignments
- Scheduled dates
- Share tokens
- Completion status
- Archive status

### Waypoints
- Addresses and coordinates
- Contact names
- Phone numbers
- Stop types and colors
- Execution status (pending/complete/missed)
- Completion timestamps
- Missed reasons
- Execution notes
- Reschedule dates

### Organization
- Folders with colors
- Custom stop types
- Saved starting points
- Calendars

### Collaboration
- Route notes with timestamps
- User attribution

---

## Import Data to New System

### JSON Import
```typescript
import fs from "fs";
import { drizzle } from "drizzle-orm/mysql2";
import { users, routes, routeWaypoints, cachedContacts, folders, stopTypes, savedStartingPoints, calendars, routeNotes } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function importData() {
  const data = JSON.parse(fs.readFileSync("database-export.json", "utf-8"));
  
  // Import in correct order (respecting foreign keys)
  await db.insert(users).values(data.users);
  await db.insert(folders).values(data.folders);
  await db.insert(calendars).values(data.calendars);
  await db.insert(stopTypes).values(data.stopTypes);
  await db.insert(savedStartingPoints).values(data.savedStartingPoints);
  await db.insert(cachedContacts).values(data.cachedContacts);
  await db.insert(routes).values(data.routes);
  await db.insert(routeWaypoints).values(data.routeWaypoints);
  await db.insert(routeNotes).values(data.routeNotes);
  
  console.log("✅ Data imported successfully!");
}

importData().catch(console.error);
```

### CSV Import
Use your database tool's CSV import feature or write a custom parser.

---

## Backup Strategy

### Regular Backups
- Export weekly or after major changes
- Store in multiple locations (cloud + local)
- Keep versioned backups

### Before Migration
- Export all data before switching platforms
- Verify export completeness
- Test import on new system before decommissioning old

### Automated Backups
Set up a cron job to export daily:
```bash
0 2 * * * cd /home/ubuntu/contact-route-mapper && tsx export-db.ts
```

---

## Security Considerations

### Sensitive Data
Your export contains:
- ⚠️ Contact information (names, addresses, phone numbers)
- ⚠️ Route details (customer locations)
- ⚠️ User settings and preferences

### Protection
- ✅ Encrypt exports before storing
- ✅ Don't commit exports to public repositories
- ✅ Use secure transfer methods (SFTP, encrypted cloud storage)
- ✅ Delete old exports after migration

### Share Tokens
- Share tokens in export can be used to access routes
- Consider revoking all share tokens before export
- Or regenerate tokens after import

---

## Troubleshooting

### Export Fails
- Check database connection (DATABASE_URL environment variable)
- Verify database permissions
- Check disk space

### Import Fails
- Ensure target database schema matches (run migrations first)
- Check for duplicate IDs (may need to reset auto-increment)
- Import in correct order (respect foreign keys)

### Missing Data
- Verify all tables were exported
- Check export file size (should be several MB for 225 contacts + 127 routes)
- Validate JSON structure

---

## Need Help?

If you encounter issues:
1. Check the Manus Database UI for direct table access
2. Contact Manus support at https://help.manus.im
3. Refer to Drizzle ORM documentation for advanced queries

---

*This guide covers all methods for exporting your Routie Roo database. Choose the method that best fits your technical comfort level and use case.*
