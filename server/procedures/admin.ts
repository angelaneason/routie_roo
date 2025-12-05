import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { users, loginAttempts } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * Admin-only procedures for user management and system monitoring
 */

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const allUsers = await db.select().from(users).orderBy(desc(users.lastSignedIn));
  return allUsers;
}

export async function getUserActivity(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Get route count
  const routeCountResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM routes WHERE userId = ${userId}`
  );
  const routeCount = (routeCountResult as any)[0]?.[0]?.count || 0;

  // Get contact count
  const contactCountResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM cached_contacts WHERE userId = ${userId}`
  );
  const contactCount = (contactCountResult as any)[0]?.[0]?.count || 0;

  // Get completed stops count
  const completedStopsResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM routeWaypoints WHERE userId = ${userId} AND completedAt IS NOT NULL`
  );
  const completedStops = (completedStopsResult as any)[0]?.[0]?.count || 0;

  return {
    routeCount: Number(routeCount),
    contactCount: Number(contactCount),
    completedStops: Number(completedStops),
  };
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Total users
  const totalUsersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
  const totalUsers = (totalUsersResult as any)[0]?.[0]?.count || 0;

  // Active users (signed in within last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUsersResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM users WHERE lastSignedIn >= ${thirtyDaysAgo}`
  );
  const activeUsers = (activeUsersResult as any)[0]?.[0]?.count || 0;

  // Total routes
  const totalRoutesResult = await db.execute(sql`SELECT COUNT(*) as count FROM routes`);
  const totalRoutes = (totalRoutesResult as any)[0]?.[0]?.count || 0;

  // Total contacts
  const totalContactsResult = await db.execute(sql`SELECT COUNT(*) as count FROM cached_contacts`);
  const totalContacts = (totalContactsResult as any)[0]?.[0]?.count || 0;

  // Total completed stops
  const completedStopsResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM routeWaypoints WHERE completedAt IS NOT NULL`
  );
  const totalCompletedStops = (completedStopsResult as any)[0]?.[0]?.count || 0;

  return {
    totalUsers: Number(totalUsers),
    activeUsers: Number(activeUsers),
    totalRoutes: Number(totalRoutes),
    totalContacts: Number(totalContacts),
    totalCompletedStops: Number(totalCompletedStops),
  };
}

export async function getLoginAttempts(params: {
  limit: number;
  offset: number;
  failedOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  let query = db.select().from(loginAttempts).orderBy(desc(loginAttempts.attemptedAt));

  if (params.failedOnly) {
    query = query.where(eq(loginAttempts.success, false)) as any;
  }

  const attempts = await query.limit(params.limit).offset(params.offset);
  return attempts;
}

/**
 * Start impersonating another user
 * Returns the target user object to be stored in session
 */
export async function startImpersonation(adminUserId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Verify admin user exists and is admin
  const adminUser = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
  if (!adminUser || adminUser.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Admin user not found" });
  }
  if (adminUser[0].role !== 'admin') {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can impersonate users" });
  }

  // Get target user
  const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!targetUser || targetUser.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Target user not found" });
  }

  // Return target user data
  return {
    targetUser: targetUser[0],
    adminUser: adminUser[0],
  };
}

/**
 * Stop impersonation and return to admin user
 */
export async function stopImpersonation(adminUserId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Get admin user
  const adminUser = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
  if (!adminUser || adminUser.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Admin user not found" });
  }

  return adminUser[0];
}
