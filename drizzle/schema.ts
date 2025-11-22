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
  notes: text("notes"), // Optional notes/description for the route
  // Shared execution fields
  shareToken: varchar("shareToken", { length: 36 }).unique(), // UUID for public access
  isPubliclyAccessible: boolean("isPubliclyAccessible").default(false).notNull(), // Allow unauthenticated access
  sharedAt: timestamp("sharedAt"), // When share link was generated
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
  position: int("position").notNull(), // Order in the route (0 = origin, last = destination)
  contactName: varchar("contactName", { length: 255 }), // Name from contact (optional, for privacy)
  address: text("address").notNull(), // Full address string
  latitude: varchar("latitude", { length: 32 }), // Latitude coordinate
  longitude: varchar("longitude", { length: 32 }), // Longitude coordinate
  phoneNumbers: text("phoneNumbers"), // JSON array of {value, type, label}
  stopType: mysqlEnum("stopType", ["pickup", "delivery", "meeting", "visit", "other"]).default("other"), // Type of stop
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
