#!/usr/bin/env node
/**
 * Backfill script to populate photoUrl for existing route waypoints
 * Fetches photoUrl from associated contacts and updates waypoint records
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import mysql from 'mysql2/promise';

// Import schema
const routeWaypoints = {
  id: 'id',
  contactId: 'contactId',
  photoUrl: 'photoUrl',
};

const contacts = {
  id: 'id',
  photoUrl: 'photoUrl',
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection);

  try {
    // Get all waypoints that have a contactId but no photoUrl
    console.log('📊 Fetching waypoints without photoUrls...');
    const [waypointsToUpdate] = await connection.execute(
      `SELECT rw.id, rw.contactId, c.photoUrl 
       FROM route_waypoints rw
       INNER JOIN cached_contacts c ON rw.contactId = c.id
       WHERE rw.contactId IS NOT NULL 
       AND c.photoUrl IS NOT NULL
       AND (rw.photoUrl IS NULL OR rw.photoUrl = '')`
    );

    console.log(`📝 Found ${waypointsToUpdate.length} waypoints to update`);

    if (waypointsToUpdate.length === 0) {
      console.log('✅ No waypoints need updating. All done!');
      await connection.end();
      return;
    }

    // Update each waypoint with the contact's photoUrl
    let updated = 0;
    for (const waypoint of waypointsToUpdate) {
      try {
        await connection.execute(
          'UPDATE route_waypoints SET photoUrl = ? WHERE id = ?',
          [waypoint.photoUrl, waypoint.id]
        );
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`   ⏳ Updated ${updated}/${waypointsToUpdate.length} waypoints...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Failed to update waypoint ${waypoint.id}:`, error.message);
      }
    }

    console.log(`✅ Successfully updated ${updated} waypoints with photoUrls`);
    
    // Verify the update
    const [verification] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM route_waypoints rw
       INNER JOIN cached_contacts c ON rw.contactId = c.id
       WHERE rw.contactId IS NOT NULL 
       AND c.photoUrl IS NOT NULL
       AND rw.photoUrl IS NOT NULL`
    );
    
    console.log(`📊 Total waypoints with photoUrls now: ${verification[0].count}`);

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

main()
  .then(() => {
    console.log('✨ Backfill completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Backfill failed:', error);
    process.exit(1);
  });
