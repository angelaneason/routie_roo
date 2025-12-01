import mysql from 'mysql2/promise';

/**
 * Script to update stop type colors for existing routes
 * Maps stop types to user's custom colors
 */

async function updateStopColors() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Starting stop color update...\n');
    
    // Get user's custom stop types
    const [stopTypes] = await conn.query(
      'SELECT name, color FROM stop_types WHERE userId = 38'
    );
    
    console.log('Custom stop types found:');
    stopTypes.forEach(st => {
      console.log(`  ${st.name}: ${st.color}`);
    });
    console.log('');
    
    // Create mapping from stopType to color
    // Match by the actual stop type word (eval, oasis, visit, re, dc)
    const colorMap = {
      'eval': stopTypes.find(st => st.name.toLowerCase().includes('eval'))?.color || '#3b82f6',
      'oasis': stopTypes.find(st => st.name.toLowerCase().includes('oasis'))?.color || '#f73bb2',
      'visit': stopTypes.find(st => st.name.toLowerCase().includes('visit'))?.color || '#f7d83b',
      're': stopTypes.find(st => st.name.toLowerCase().includes('re'))?.color || '#3beaf7',
      'dc': stopTypes.find(st => st.name.toLowerCase().includes('dc'))?.color || '#f7573b',
    };
    
    console.log('Color mapping:');
    Object.entries(colorMap).forEach(([type, color]) => {
      console.log(`  ${type} → ${color}`);
    });
    console.log('');
    
    // Update each stop type
    let totalUpdated = 0;
    
    for (const [stopType, color] of Object.entries(colorMap)) {
      const [result] = await conn.query(
        `UPDATE route_waypoints 
         SET stopColor = ? 
         WHERE stopType = ? 
         AND routeId IN (SELECT id FROM routes WHERE userId = 38)`,
        [color, stopType]
      );
      
      console.log(`Updated ${result.affectedRows} waypoints with stopType="${stopType}" to color ${color}`);
      totalUpdated += result.affectedRows;
    }
    
    console.log(`\n✓ Total waypoints updated: ${totalUpdated}`);
    
  } catch (error) {
    console.error('Error updating stop colors:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

updateStopColors().catch(console.error);
