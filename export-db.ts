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
  
  fs.writeFileSync(
    "/home/ubuntu/routie-roo-database-export.json",
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
  
  process.exit(0);
}

exportData().catch(console.error);
