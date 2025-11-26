import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all comment options
const result = await connection.execute('SELECT * FROM comment_options ORDER BY option, createdAt');
const [rows] = result;

console.log('Found', rows.length, 'comment options');

// Group by option and userId, keep only the first one
const seen = new Set();
const toDelete = [];

for (const row of rows) {
  const key = `${row.option}-${row.userId}`;
  if (seen.has(key)) {
    toDelete.push(row.id);
  } else {
    seen.add(key);
  }
}

console.log('Will delete', toDelete.length, 'duplicates');

if (toDelete.length > 0) {
  for (const id of toDelete) {
    await connection.execute('DELETE FROM comment_options WHERE id = ?', [id]);
    console.log('Deleted comment option', id);
  }
}

await connection.end();
console.log('Done!');
