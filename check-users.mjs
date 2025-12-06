import { drizzle } from "drizzle-orm/mysql2";
import { users } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const allUsers = await db.select().from(users);

console.log("All users:");
allUsers.forEach(u => {
  console.log(`  ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, OpenID: ${u.openId}`);
});
