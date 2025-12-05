import { trpc } from "./trpc";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useMemo } from "react";

/**
 * Custom tRPC context that injects impersonation headers
 * This allows the backend to use the impersonated user's context
 */
export function useTRPCContext() {
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const context = trpc.useUtils().client;

  // Create a custom header that tells the backend which user to impersonate
  const headers = useMemo(() => {
    if (isImpersonating && impersonatedUser) {
      return {
        "x-impersonate-user-id": impersonatedUser.id.toString(),
      };
    }
    return {};
  }, [isImpersonating, impersonatedUser]);

  return { headers };
}
