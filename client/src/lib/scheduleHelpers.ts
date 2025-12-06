/**
 * Format recurring schedule information into human-readable text
 */
export function formatRecurringSchedule(schedule: {
  repeatInterval?: number;
  repeatDays?: string | string[];
  scheduleEndType?: "never" | "date" | "occurrences";
  scheduleEndDate?: string | Date;
  scheduleEndOccurrences?: number;
}): string {
  const { repeatInterval = 1, repeatDays, scheduleEndType, scheduleEndDate, scheduleEndOccurrences } = schedule;

  // Parse repeatDays if it's a JSON string
  let days: string[] = [];
  if (typeof repeatDays === "string") {
    try {
      days = JSON.parse(repeatDays);
    } catch {
      days = [];
    }
  } else if (Array.isArray(repeatDays)) {
    days = repeatDays;
  }

  if (days.length === 0) {
    return "No schedule";
  }

  // Format days (use short names)
  const dayShortNames: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };
  const formattedDays = days.map((d) => dayShortNames[d] || d).join(", ");

  // Build schedule text
  let scheduleText = "";

  // Frequency
  if (repeatInterval === 1) {
    scheduleText = `Every week on ${formattedDays}`;
  } else {
    scheduleText = `Every ${repeatInterval} weeks on ${formattedDays}`;
  }

  // End condition
  if (scheduleEndType === "date" && scheduleEndDate) {
    const endDate = typeof scheduleEndDate === "string" ? new Date(scheduleEndDate) : scheduleEndDate;
    const formatted = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    scheduleText += ` (until ${formatted})`;
  } else if (scheduleEndType === "occurrences" && scheduleEndOccurrences) {
    scheduleText += ` (${scheduleEndOccurrences} times)`;
  }

  return scheduleText;
}

/**
 * Get short badge text for scheduled days (e.g., "Mon, Wed, Fri")
 */
export function getScheduledDaysBadge(scheduledDays?: string | string[]): string {
  let days: string[] = [];
  if (typeof scheduledDays === "string") {
    try {
      days = JSON.parse(scheduledDays);
    } catch {
      days = [];
    }
  } else if (Array.isArray(scheduledDays)) {
    days = scheduledDays;
  }

  if (days.length === 0) {
    return "";
  }

  const dayShortNames: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  return days.map((d) => dayShortNames[d] || d).join(", ");
}
