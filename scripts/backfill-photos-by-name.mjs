import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Get all waypoints without photoUrl and without contactId
  const [waypoints] = await connection.execute(`
    SELECT id, contactName, routeId
    FROM route_waypoints
    WHERE (photoUrl IS NULL OR photoUrl = '')
    AND (contactId IS NULL OR contactId = 0)
    AND contactName IS NOT NULL
    AND contactName != 'Starting Point'
    AND contactName != 'Gap Stop'
  `);

  console.log(`Found ${waypoints.length} waypoints without photos or contactId`);

  let updated = 0;
  let matched = 0;

  for (const wp of waypoints) {
    // Try to find matching contact by name
    const [contacts] = await connection.execute(`
      SELECT id, photoUrl
      FROM cached_contacts
      WHERE name = ?
      AND photoUrl IS NOT NULL
      AND photoUrl != ''
      LIMIT 1
    `, [wp.contactName]);

    if (contacts.length > 0) {
      const contact = contacts[0];
      matched++;
      
      // Update waypoint with both contactId and photoUrl
      await connection.execute(`
        UPDATE route_waypoints
        SET photoUrl = ?, contactId = ?
        WHERE id = ?
      `, [contact.photoUrl, contact.id, wp.id]);
      
      updated++;
      console.log(`✓ Updated waypoint ${wp.id} (${wp.contactName}) with photo and contactId`);
    } else {
      console.log(`✗ No matching contact found for: ${wp.contactName}`);
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`- Matched: ${matched} waypoints`);
  console.log(`- Updated: ${updated} waypoints with photos and contactIds`);

} catch (error) {
  console.error('Backfill error:', error);
} finally {
  await connection.end();
}
