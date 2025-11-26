import { drizzle } from 'drizzle-orm/mysql2';
import { eq, like } from 'drizzle-orm';
import { cachedContacts } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const contacts = await db.select().from(cachedContacts).where(like(cachedContacts.name, '%ABREU%')).limit(1);

console.log(JSON.stringify(contacts, null, 2));
