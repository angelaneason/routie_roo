/**
 * Scheduled job to check and send email reminders for upcoming important dates
 * 
 * This script is designed to be run daily (e.g., at 9 AM) via a cron schedule.
 * It checks all users' contacts for upcoming important dates and sends reminders
 * based on their configured intervals (e.g., 30, 10, 5 days before).
 * 
 * Usage: node scheduled-reminder-job.mjs
 */

import { getDb } from "./server/db.js";
import { users } from "./drizzle/schema.js";
import { processUserReminders } from "./server/emailReminders.js";

async function runReminderJob() {
  console.log(`[${new Date().toISOString()}] Starting scheduled reminder job...`);
  
  const db = await getDb();
  if (!db) {
    console.error("Database unavailable, skipping reminder job");
    return;
  }

  try {
    // Get all users with reminders enabled
    const allUsers = await db.select().from(users);
    const enabledUsers = allUsers.filter(user => user.enableDateReminders === 1);

    console.log(`Found ${enabledUsers.length} users with reminders enabled`);

    let totalProcessed = 0;
    let totalSent = 0;

    // Process reminders for each user
    for (const user of enabledUsers) {
      try {
        console.log(`Processing reminders for user ${user.id} (${user.email || user.name})...`);
        const result = await processUserReminders(user.id);
        
        totalProcessed += result.processed;
        totalSent += result.sent;
        
        console.log(`  - Processed: ${result.processed}, Sent: ${result.sent}`);
      } catch (error) {
        console.error(`Failed to process reminders for user ${user.id}:`, error);
      }
    }

    console.log(`[${new Date().toISOString()}] Reminder job completed`);
    console.log(`Total reminders processed: ${totalProcessed}`);
    console.log(`Total emails sent: ${totalSent}`);
  } catch (error) {
    console.error("Error running reminder job:", error);
  }
}

// Run the job
runReminderJob()
  .then(() => {
    console.log("Job finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Job failed:", error);
    process.exit(1);
  });
