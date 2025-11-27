import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users, cachedContacts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get contacts with upcoming important dates that need reminders
 * Returns contacts whose important dates are within the reminder intervals
 */
export async function getUpcomingDateReminders(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Get user's reminder settings
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length || !user[0].enableDateReminders) {
    return [];
  }

  // Parse reminder intervals (default: [30, 10, 5] days)
  let intervals = [30, 10, 5];
  if (user[0].reminderIntervals) {
    try {
      intervals = JSON.parse(user[0].reminderIntervals);
    } catch {
      // Use default if parsing fails
    }
  }

  // Get all contacts with important dates
  const contacts = await db.select().from(cachedContacts)
    .where(eq(cachedContacts.userId, userId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders: Array<{
    contactId: number;
    contactName: string;
    contactEmail: string | null;
    dateType: string;
    date: string;
    daysUntil: number;
    isPastDue: boolean;
  }> = [];

  for (const contact of contacts) {
    if (!contact.importantDates) continue;

    try {
      const dates = JSON.parse(contact.importantDates);
      if (!Array.isArray(dates)) continue;

      for (const dateEntry of dates) {
        const dateObj = new Date(dateEntry.date);
        dateObj.setHours(0, 0, 0, 0);

        const diffTime = dateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if date is within reminder intervals or past due
        const shouldRemind = intervals.includes(diffDays) || diffDays < 0;

        if (shouldRemind) {
          reminders.push({
            contactId: contact.id,
            contactName: contact.name || "Unknown",
            contactEmail: contact.email,
            dateType: dateEntry.type,
            date: dateEntry.date,
            daysUntil: diffDays,
            isPastDue: diffDays < 0,
          });
        }
      }
    } catch {
      // Skip contacts with invalid date data
      continue;
    }
  }

  return reminders;
}

/**
 * Send email reminder for an important date
 * Sends to both contact and scheduling team
 */
export async function sendDateReminder(params: {
  userId: number;
  contactName: string;
  contactEmail: string | null;
  schedulingEmail: string | null;
  dateType: string;
  date: string;
  daysUntil: number;
  isPastDue: boolean;
}) {
  // Note: This would integrate with your email service
  // For now, we'll use the notification API as a placeholder
  
  const subject = params.isPastDue
    ? `PAST DUE: ${params.dateType} for ${params.contactName}`
    : `Reminder: ${params.dateType} for ${params.contactName} in ${params.daysUntil} days`;

  const message = params.isPastDue
    ? `${params.contactName}'s ${params.dateType} (${params.date}) is past due by ${Math.abs(params.daysUntil)} days.`
    : `${params.contactName}'s ${params.dateType} is coming up on ${params.date} (${params.daysUntil} days from now).`;

  // TODO: Implement actual email sending
  // For now, just return success
  return {
    success: true,
    sentTo: [params.contactEmail, params.schedulingEmail].filter(Boolean),
    subject,
    message,
  };
}

/**
 * Process all pending reminders for a user
 * This would be called by a scheduled job
 */
export async function processUserReminders(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Get user's scheduling email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length || !user[0].enableDateReminders) {
    return { processed: 0, sent: 0 };
  }

  const schedulingEmail = user[0].schedulingEmail;
  const reminders = await getUpcomingDateReminders(userId);

  let sentCount = 0;
  for (const reminder of reminders) {
    try {
      await sendDateReminder({
        userId,
        contactName: reminder.contactName,
        contactEmail: reminder.contactEmail,
        schedulingEmail,
        dateType: reminder.dateType,
        date: reminder.date,
        daysUntil: reminder.daysUntil,
        isPastDue: reminder.isPastDue,
      });
      sentCount++;
    } catch (error) {
      console.error(`Failed to send reminder for ${reminder.contactName}:`, error);
    }
  }

  return {
    processed: reminders.length,
    sent: sentCount,
  };
}
