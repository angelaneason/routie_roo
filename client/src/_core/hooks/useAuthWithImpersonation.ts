import { useAuth as useBaseAuth } from "./useAuth";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useMemo } from "react";

/**
 * Enhanced useAuth hook that supports impersonation.
 * When impersonating, returns the impersonated user instead of the actual logged-in user.
 */
export function useAuthWithImpersonation() {
  const baseAuth = useBaseAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const enhancedAuth = useMemo(() => {
    if (isImpersonating && impersonatedUser) {
      return {
        ...baseAuth,
        user: impersonatedUser,
        isImpersonating: true,
      };
    }
    return {
      ...baseAuth,
      isImpersonating: false,
    };
  }, [baseAuth, isImpersonating, impersonatedUser]);

  return enhancedAuth;
}
