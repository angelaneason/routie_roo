import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function checkUsers() {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
  }).from(users);

  console.log("\n=== All Users ===");
  allUsers.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`);
  });
  console.log("\n");
}

checkUsers().catch(console.error);
