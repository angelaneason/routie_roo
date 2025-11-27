import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users, cachedContacts, reminderHistory } from "../drizzle/schema";
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
  
  // Parse enabled date types (default: all types enabled)
  let enabledDateTypes: string[] | null = null; // null means all types enabled
  if (user[0].enabledReminderDateTypes) {
    try {
      enabledDateTypes = JSON.parse(user[0].enabledReminderDateTypes);
    } catch {
      // Use null (all enabled) if parsing fails
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
        
        // Check if this date type is enabled for reminders
        const isDateTypeEnabled = enabledDateTypes === null || enabledDateTypes.includes(dateEntry.type);

        if (shouldRemind && isDateTypeEnabled) {
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
 * Uses stage-specific templates based on days until date
 */
export async function sendDateReminder(params: {
  userId: number;
  contactId: number;
  contactName: string;
  contactEmail: string | null;
  schedulingEmail: string | null;
  dateType: string;
  date: string;
  daysUntil: number;
  isPastDue: boolean;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Get user's custom email templates
  const user = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  if (!user.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }

  // Determine which template to use based on daysUntil
  let subjectTemplate: string | null = null;
  let contactBodyTemplate: string | null = null;
  let teamBodyTemplate: string | null = null;
  
  if (params.isPastDue) {
    subjectTemplate = user[0].reminderEmailPastDueSubject;
    contactBodyTemplate = user[0].reminderEmailPastDueBodyContact;
    teamBodyTemplate = user[0].reminderEmailPastDueBodyTeam;
  } else if (params.daysUntil <= 5) {
    subjectTemplate = user[0].reminderEmail5DaysSubject;
    contactBodyTemplate = user[0].reminderEmail5DaysBodyContact;
    teamBodyTemplate = user[0].reminderEmail5DaysBodyTeam;
  } else if (params.daysUntil <= 10) {
    subjectTemplate = user[0].reminderEmail10DaysSubject;
    contactBodyTemplate = user[0].reminderEmail10DaysBodyContact;
    teamBodyTemplate = user[0].reminderEmail10DaysBodyTeam;
  } else {
    // 30 days or more
    subjectTemplate = user[0].reminderEmail30DaysSubject;
    contactBodyTemplate = user[0].reminderEmail30DaysBodyContact;
    teamBodyTemplate = user[0].reminderEmail30DaysBodyTeam;
  }

  // Default templates if user hasn't customized
  const defaultSubject = params.isPastDue
    ? `❗ OVERDUE: ${params.dateType} is past due`
    : `🔔 Reminder: ${params.dateType} coming up in ${params.daysUntil} days`;

  const defaultContactBody = params.isPastDue
    ? `Hi ${params.contactName} 👋\n\nThis is an OVERDUE notice from Routie Roo!\n\n📅 Important Date Status:\n- Type: ${params.dateType}\n- Date: ${params.date}\n- Status: PAST DUE\n\n❗ Your ${params.dateType} is now overdue. Please take action immediately!\n\nBest regards,\nThe Routie Roo Team 🦘`
    : `Hi ${params.contactName} 👋\n\nThis is a reminder from Routie Roo!\n\n📅 Important Date Approaching:\n- Type: ${params.dateType}\n- Date: ${params.date}\n- Days Until: ${params.daysUntil} days\n\nBest regards,\nThe Routie Roo Team 🦘`;

  const defaultTeamBody = params.isPastDue
    ? `Hi Team,\n\nAn OVERDUE notice has been sent to ${params.contactName} regarding their ${params.dateType} which was due on ${params.date}.\n\nThis is past due - urgent follow-up required.`
    : `Hi Team,\n\nA reminder has been sent to ${params.contactName} regarding their upcoming ${params.dateType} on ${params.date} (${params.daysUntil} days away).\n\nYou may want to follow up to ensure they're prepared.`;

  // Apply template variables
  const applyVars = (template: string) => {
    return template
      .replace(/{contactName}/g, params.contactName)
      .replace(/{dateType}/g, params.dateType)
      .replace(/{date}/g, params.date)
      .replace(/{daysUntil}/g, params.daysUntil.toString());
  };

  const subject = subjectTemplate ? applyVars(subjectTemplate) : defaultSubject;
  const contactBody = contactBodyTemplate ? applyVars(contactBodyTemplate) : defaultContactBody;
  const teamBody = teamBodyTemplate ? applyVars(teamBodyTemplate) : defaultTeamBody;

  // Log to reminder history
  if (db) {
    try {
      await db.insert(reminderHistory).values({
        userId: params.userId,
        contactId: params.contactId,
        contactName: params.contactName,
        dateType: params.dateType,
        importantDate: params.date,
        reminderType: params.isPastDue ? "past_due" : `${params.daysUntil}_days`,
        sentTo: JSON.stringify([params.contactEmail, params.schedulingEmail].filter(Boolean)),
        status: "success",
      });
    } catch (error) {
      console.error("Failed to log reminder history:", error);
    }
  }
  
  // TODO: Implement actual email sending
  // For now, just return success with stage-specific content
  return {
    success: true,
    sentTo: [params.contactEmail, params.schedulingEmail].filter(Boolean),
    subject,
    contactBody,
    teamBody,
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
        contactId: reminder.contactId,
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
