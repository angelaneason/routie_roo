import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, routes, routeWaypoints, cachedContacts, InsertRoute, InsertRouteWaypoint, InsertCachedContact } from "../drizzle/schema";
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
    } else if (user.openId === ENV.ownerOpenId) {
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

  return result.length > 0 ? result[0] : undefined;
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
  
  return db.select().from(routes).where(eq(routes.userId, userId)).orderBy(routes.createdAt);
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
        addressType: contact.addressType,
        lastSynced: contact.lastSynced,
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
