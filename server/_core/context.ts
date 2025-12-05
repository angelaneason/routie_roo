import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    
    // Check for impersonation header (admin only)
    const impersonateUserId = opts.req.headers['x-impersonate-user-id'];
    if (impersonateUserId && user && user.role === 'admin') {
      // Admin is impersonating another user
      const { getUserById } = await import('../db');
      const targetUser = await getUserById(Number(impersonateUserId));
      if (targetUser) {
        console.log(`[Context] Admin ${user.id} impersonating user ${targetUser.id}`);
        user = targetUser;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
