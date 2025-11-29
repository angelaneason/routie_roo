import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, routes, routeWaypoints, cachedContacts, folders, InsertRoute, InsertRouteWaypoint, InsertCachedContact, InsertFolder, importantDateTypes, commentOptions, InsertImportantDateType, InsertCommentOption } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || user.email === 'angelaneason@gmail.com') {
      // Assign admin role to owner (by openId or email)
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  
  if (result.length > 0) {
    const user = result[0];
    console.log('[Database] getUserByOpenId returned user:', {
      id: user.id,
      email: user.email,
      hasCalendarToken: !!user.googleCalendarAccessToken,
      keys: Object.keys(user)
    });
    return user;
  }
  
  return undefined;
}

// Route management functions
export async function createRoute(route: InsertRoute) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(routes).values(route);
  return result;
}

export async function getRouteById(routeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRouteByShareId(shareId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(routes).where(eq(routes.shareId, shareId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserRoutes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { sql } = await import('drizzle-orm');
  
  return db.select({
    id: routes.id,
    userId: routes.userId,
    name: routes.name,
    shareId: routes.shareId,
    isPublic: routes.isPublic,
    totalDistance: routes.totalDistance,
    totalDuration: routes.totalDuration,
    optimized: routes.optimized,
    folderId: routes.folderId,
    calendarId: routes.calendarId,
    scheduledDate: routes.scheduledDate,
    shareToken: routes.shareToken,
    completedAt: routes.completedAt,
    isArchived: routes.isArchived,
    archivedAt: routes.archivedAt,
    distanceUnit: routes.distanceUnit,
    notes: routes.notes,
    createdAt: routes.createdAt,
    updatedAt: routes.updatedAt,
    waypointCount: sql<number>`(SELECT COUNT(*) FROM route_waypoints WHERE route_waypoints.routeId = routes.id)`,
    completedWaypointCount: sql<number>`(SELECT COUNT(*) FROM route_waypoints WHERE route_waypoints.routeId = routes.id AND route_waypoints.status = 'complete')`
  }).from(routes).where(eq(routes.userId, userId)).orderBy(routes.createdAt);
}

// Route waypoints functions
export async function createRouteWaypoints(waypoints: InsertRouteWaypoint[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (waypoints.length === 0) return;
  return db.insert(routeWaypoints).values(waypoints);
}

export async function getRouteWaypoints(routeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(routeWaypoints)
    .where(eq(routeWaypoints.routeId, routeId))
    .orderBy(routeWaypoints.position);
}

// Cached contacts functions
export async function upsertCachedContacts(contacts: InsertCachedContact[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (contacts.length === 0) return;
  
  // Insert or update each contact
  for (const contact of contacts) {
    await db.insert(cachedContacts).values(contact).onDuplicateKeyUpdate({
      set: {
         name: contact.name,
      email: contact.email,
      address: contact.address,
      phoneNumbers: contact.phoneNumbers,
      photoUrl: contact.photoUrl,
      },
    });
  }
}

export async function getUserCachedContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(cachedContacts)
    .where(eq(cachedContacts.userId, userId))
    .orderBy(cachedContacts.name);
}

export async function clearUserCachedContacts(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(cachedContacts).where(eq(cachedContacts.userId, userId));
}

// Folder management functions
export async function createFolder(folder: InsertFolder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(folders).values(folder);
  return result;
}

export async function getUserFolders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(folders.name);
}

export async function updateFolder(folderId: number, updates: Partial<InsertFolder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(folders).set(updates).where(eq(folders.id, folderId));
}

export async function deleteFolder(folderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove folder reference from routes
  await db.update(routes).set({ folderId: null }).where(eq(routes.folderId, folderId));
  
  // Delete the folder
  await db.delete(folders).where(eq(folders.id, folderId));
}

// Route deletion and updates
export async function deleteRoute(routeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete waypoints first
  await db.delete(routeWaypoints).where(eq(routeWaypoints.routeId, routeId));
  
  // Delete the route
  await db.delete(routes).where(eq(routes.id, routeId));
}

export async function updateRoute(routeId: number, updates: Partial<InsertRoute>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(routes).set(updates).where(eq(routes.id, routeId));
}

// Important Date Types management
export async function createImportantDateType(dateType: InsertImportantDateType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(importantDateTypes).values(dateType);
  return result;
}

export async function getUserImportantDateTypes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(importantDateTypes).where(eq(importantDateTypes.userId, userId)).orderBy(importantDateTypes.name);
}

export async function updateImportantDateType(id: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(importantDateTypes).set({ name }).where(eq(importantDateTypes.id, id));
}

export async function deleteImportantDateType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(importantDateTypes).where(eq(importantDateTypes.id, id));
}

// Comment Options management
export async function createCommentOption(commentOption: InsertCommentOption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(commentOptions).values(commentOption);
  return result;
}

export async function getUserCommentOptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(commentOptions).where(eq(commentOptions.userId, userId)).orderBy(commentOptions.option);
}

export async function updateCommentOption(id: number, option: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(commentOptions).set({ option }).where(eq(commentOptions.id, id));
}

export async function deleteCommentOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(commentOptions).where(eq(commentOptions.id, id));
}
