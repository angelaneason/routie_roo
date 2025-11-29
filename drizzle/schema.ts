import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  preferredCallingService: mysqlEnum("preferredCallingService", ["phone", "google-voice", "whatsapp", "skype", "facetime"]).default("phone"),
  distanceUnit: mysqlEnum("distanceUnit", ["km", "miles"]).default("km"),
  defaultStartingPoint: text("defaultStartingPoint"), // User's default starting address for routes
  defaultStopDuration: int("defaultStopDuration").default(30), // Default stop duration in minutes (15, 30, 45, 60)
  eventDurationMode: mysqlEnum("eventDurationMode", ["stop_only", "include_drive"]).default("stop_only"), // Calendar event duration mode
  defaultStopType: varchar("defaultStopType", { length: 100 }), // Default stop type for new routes
  defaultStopTypeColor: varchar("defaultStopTypeColor", { length: 7 }), // Default stop type color
  googleCalendarAccessToken: text("googleCalendarAccessToken"), // Google Calendar OAuth access token
  googleCalendarRefreshToken: text("googleCalendarRefreshToken"), // Google Calendar OAuth refresh token
  googleCalendarTokenExpiry: timestamp("googleCalendarTokenExpiry"), // When the access token expires
  googleCalendarList: text("googleCalendarList"), // JSON: Array of { id, summary, backgroundColor } from Google Calendar API
  calendarPreferences: text("calendarPreferences"), // JSON: { visibleCalendars: string[], defaultCalendar: string }
  autoArchiveDays: int("autoArchiveDays"), // Days after completion to auto-archive (null = never)
  schedulingEmail: varchar("schedulingEmail", { length: 320 }), // Email for scheduling team
  enableDateReminders: int("enableDateReminders").default(0).notNull(), // 0 = disabled, 1 = enabled
  reminderIntervals: text("reminderIntervals"), // JSON array of days before date to send reminders (e.g., [30, 10, 5])
  enabledReminderDateTypes: text("enabledReminderDateTypes"), // JSON array of date types that trigger reminders (e.g., ["License Renewal", "Birthday"])
  // Stage-specific email templates (30 days, 10 days, 5 days, past due)
  reminderEmail30DaysSubject: text("reminderEmail30DaysSubject"),
  reminderEmail30DaysBodyContact: text("reminderEmail30DaysBodyContact"),
  reminderEmail30DaysBodyTeam: text("reminderEmail30DaysBodyTeam"),
  reminderEmail10DaysSubject: text("reminderEmail10DaysSubject"),
  reminderEmail10DaysBodyContact: text("reminderEmail10DaysBodyContact"),
  reminderEmail10DaysBodyTeam: text("reminderEmail10DaysBodyTeam"),
  reminderEmail5DaysSubject: text("reminderEmail5DaysSubject"),
  reminderEmail5DaysBodyContact: text("reminderEmail5DaysBodyContact"),
  reminderEmail5DaysBodyTeam: text("reminderEmail5DaysBodyTeam"),
  reminderEmailPastDueSubject: text("reminderEmailPastDueSubject"),
  reminderEmailPastDueBodyContact: text("reminderEmailPastDueBodyContact"),
  reminderEmailPastDueBodyTeam: text("reminderEmailPastDueBodyTeam"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Routes table - stores generated driving routes
 */
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the route
  name: varchar("name", { length: 255 }).notNull(), // User-defined route name
  shareId: varchar("shareId", { length: 32 }).notNull().unique(), // Unique ID for sharing
  isPublic: boolean("isPublic").default(false).notNull(), // Privacy control
  totalDistance: int("totalDistance"), // Total distance in meters
  totalDuration: int("totalDuration"), // Total duration in seconds
  optimized: boolean("optimized").default(true).notNull(), // Whether waypoints were optimized
  folderId: int("folderId"), // Optional folder/category ID
  calendarId: int("calendarId"), // Optional calendar ID for scheduling
  googleCalendarId: varchar("googleCalendarId", { length: 255 }), // Google Calendar ID (e.g., 'primary' or calendar email)
  notes: text("notes"), // Optional notes/description for the route
  startingPointAddress: text("startingPointAddress"), // Starting point address for this route
  distanceUnit: mysqlEnum("distanceUnit", ["km", "miles"]).default("km"), // Owner's preferred distance unit
  // Shared execution fields
  shareToken: varchar("shareToken", { length: 36 }).unique(), // UUID for public access
  isPubliclyAccessible: boolean("isPubliclyAccessible").default(false).notNull(), // Allow unauthenticated access
  sharedAt: timestamp("sharedAt"), // When share link was generated
  completedAt: timestamp("completedAt"), // When all waypoints were completed/missed
  scheduledDate: timestamp("scheduledDate"), // When the route is scheduled to be executed
  isArchived: boolean("isArchived").default(false).notNull(), // Whether route is archived
  archivedAt: timestamp("archivedAt"), // When route was archived
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

/**
 * Route waypoints table - stores individual stops in a route
 */
export const routeWaypoints = mysqlTable("route_waypoints", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull(), // Foreign key to routes
  contactId: int("contactId"), // Foreign key to cachedContacts (for Google sync)
  position: int("position").notNull(), // Order in the route (0 = origin, last = destination)
  contactName: varchar("contactName", { length: 255 }), // Name from contact (optional, for privacy)
  address: text("address").notNull(), // Full address string
  latitude: varchar("latitude", { length: 32 }), // Latitude coordinate
  longitude: varchar("longitude", { length: 32 }), // Longitude coordinate
  phoneNumbers: text("phoneNumbers"), // JSON array of {value, type, label}
  contactLabels: text("contactLabels"), // JSON array of contact labels from Google
  importantDates: text("importantDates"), // JSON array of {type, date} from contact
  comments: text("comments"), // JSON array of {option, customText} from contact
  stopType: varchar("stopType", { length: 100 }).default("other"), // Type of stop (supports custom types)
  stopColor: varchar("stopColor", { length: 7 }).default("#3b82f6"), // Hex color for marker
  // Execution workflow fields
  status: mysqlEnum("status", ["pending", "in_progress", "complete", "missed"]).default("pending"), // Stop completion status
  executionOrder: int("executionOrder"), // Order during execution (can differ from waypoint_order)
  completedAt: timestamp("completedAt"), // When stop was completed
  missedReason: text("missedReason"), // Reason for missing stop
  executionNotes: text("executionNotes"), // Notes added during execution
  rescheduledDate: timestamp("rescheduledDate"), // When missed stop is rescheduled for
  needsReschedule: int("needsReschedule").default(0), // 1 if missed and needs rescheduling
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouteWaypoint = typeof routeWaypoints.$inferSelect;
export type InsertRouteWaypoint = typeof routeWaypoints.$inferInsert;

/**
 * Cached contacts table - stores user's Google contacts for faster access
 */
export const cachedContacts = mysqlTable("cached_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the cached contact
  googleResourceName: varchar("googleResourceName", { length: 255 }), // Google People API resource name
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  phoneNumbers: text("phoneNumbers"), // JSON array of {value, type, label}
  photoUrl: text("photoUrl"), // Contact photo URL from Google
  labels: text("labels"), // JSON array of contact labels/groups from Google
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  importantDates: text("importantDates"), // JSON array of {type: string, date: string} - user-defined important dates
  comments: text("comments"), // JSON array of {option: string, customText?: string} - user-defined comments
  originalAddress: text("originalAddress"), // Original address from Google Contacts (for tracking changes)
  addressModified: int("addressModified").default(0).notNull(), // 1 if address was modified in Routie Roo, 0 if not
  addressModifiedAt: timestamp("addressModifiedAt"), // When address was last modified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CachedContact = typeof cachedContacts.$inferSelect;
export type InsertCachedContact = typeof cachedContacts.$inferInsert;

/**
 * Folders table - organize routes into categories
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the folder
  name: varchar("name", { length: 255 }).notNull(), // Folder name
  color: varchar("color", { length: 7 }), // Optional color hex code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Stop types table - custom stop types for route waypoints
 */
export const stopTypes = mysqlTable("stop_types", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the stop type
  name: varchar("name", { length: 100 }).notNull(), // Stop type name (e.g., "Delivery", "Home Visit")
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // Hex color code
  isDefault: boolean("isDefault").default(false).notNull(), // System default types
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StopType = typeof stopTypes.$inferSelect;
export type InsertStopType = typeof stopTypes.$inferInsert;

/**
 * Saved starting points table - frequently used starting locations
 */
export const savedStartingPoints = mysqlTable("saved_starting_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the starting point
  name: varchar("name", { length: 100 }).notNull(), // Name (e.g., "Home", "Office", "Warehouse")
  address: text("address").notNull(), // Full address
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedStartingPoint = typeof savedStartingPoints.$inferSelect;
export type InsertSavedStartingPoint = typeof savedStartingPoints.$inferInsert;

/**
 * Calendars table - organize routes into different calendars (work, personal, etc.)
 */
export const calendars = mysqlTable("calendars", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the calendar
  name: varchar("name", { length: 100 }).notNull(), // Calendar name (e.g., "Work", "Personal")
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // Hex color code
  isDefault: boolean("isDefault").default(false).notNull(), // Default calendar for new routes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Calendar = typeof calendars.$inferSelect;
export type InsertCalendar = typeof calendars.$inferInsert;

/**
 * Route notes table - stores timestamped comments/notes for routes
 */
export const routeNotes = mysqlTable("route_notes", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull(), // Route this note belongs to
  userId: int("userId").notNull(), // User who created the note
  note: text("note").notNull(), // Note content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RouteNote = typeof routeNotes.$inferSelect;
export type InsertRouteNote = typeof routeNotes.$inferInsert;

/**
 * Important Date Types table - user-defined types for contact important dates
 */
export const importantDateTypes = mysqlTable("important_date_types", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the date type
  name: varchar("name", { length: 100 }).notNull(), // Date type name (e.g., "Birthday", "Anniversary", "Renewal Date")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImportantDateType = typeof importantDateTypes.$inferSelect;
export type InsertImportantDateType = typeof importantDateTypes.$inferInsert;

/**
 * Comment Options table - user-defined comment options for contacts
 */
export const commentOptions = mysqlTable("comment_options", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the comment option
  option: varchar("option", { length: 255 }).notNull(), // Comment option text (e.g., "VIP Client", "Needs Follow-up")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentOption = typeof commentOptions.$inferSelect;
export type InsertCommentOption = typeof commentOptions.$inferInsert;

/**
 * Contact Documents table - stores uploaded documents for contacts
 */
export const contactDocuments = mysqlTable("contact_documents", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(), // Contact this document belongs to
  userId: int("userId").notNull(), // User who uploaded the document
  fileName: varchar("fileName", { length: 255 }).notNull(), // Original file name
  fileKey: text("fileKey").notNull(), // S3 storage key
  fileUrl: text("fileUrl").notNull(), // Public URL to access the file
  fileSize: int("fileSize").notNull(), // File size in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(), // File MIME type
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type ContactDocument = typeof contactDocuments.$inferSelect;
export type InsertContactDocument = typeof contactDocuments.$inferInsert;

/**
 * Reminder History table - tracks sent email reminders for important dates
 */
export const reminderHistory = mysqlTable("reminder_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who owns the contact
  contactId: int("contactId").notNull(), // Contact the reminder was sent for
  contactName: varchar("contactName", { length: 255 }).notNull(), // Contact name (denormalized for history)
  dateType: varchar("dateType", { length: 100 }).notNull(), // Type of date (e.g., "License Renewal", "Birthday")
  importantDate: varchar("importantDate", { length: 50 }).notNull(), // The actual important date
  reminderType: varchar("reminderType", { length: 50 }).notNull(), // "30_days", "10_days", "5_days", "past_due"
  sentTo: text("sentTo").notNull(), // JSON array of email addresses sent to
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["success", "failed"]).notNull(), // Whether email was sent successfully
  errorMessage: text("errorMessage"), // Error message if failed
});

export type ReminderHistory = typeof reminderHistory.$inferSelect;
export type InsertReminderHistory = typeof reminderHistory.$inferInsert;

/**
 * Reschedule History table - tracks all reschedule events for missed stops
 */
export const rescheduleHistory = mysqlTable("reschedule_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who owns the route
  waypointId: int("waypointId").notNull(), // Waypoint that was rescheduled
  routeId: int("routeId").notNull(), // Original route
  routeName: varchar("routeName", { length: 255 }).notNull(), // Route name (denormalized)
  contactName: varchar("contactName", { length: 255 }).notNull(), // Contact name (denormalized)
  address: text("address").notNull(), // Stop address (denormalized)
  originalDate: timestamp("originalDate"), // Original scheduled date (if route was scheduled)
  rescheduledDate: timestamp("rescheduledDate").notNull(), // New rescheduled date
  missedReason: text("missedReason"), // Reason for missing the stop
  status: mysqlEnum("status", ["pending", "completed", "re_missed", "cancelled"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"), // When the rescheduled stop was completed
  notes: text("notes"), // Additional notes
  createdAt: timestamp("createdAt").defaultNow().notNull(), // When the reschedule was created
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RescheduleHistory = typeof rescheduleHistory.$inferSelect;
export type InsertRescheduleHistory = typeof rescheduleHistory.$inferInsert;
