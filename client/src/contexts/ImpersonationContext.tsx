import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../../../drizzle/schema";

type ImpersonationContextType = {
  isImpersonating: boolean;
  impersonatedUser: User | null;
  adminUserId: number | null;
  startImpersonation: (targetUser: User, adminId: number) => void;
  stopImpersonation: () => void;
};

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [adminUserId, setAdminUserId] = useState<number | null>(null);

  // Load impersonation state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("impersonation");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setIsImpersonating(true);
        setImpersonatedUser(data.impersonatedUser);
        setAdminUserId(data.adminUserId);
      } catch (error) {
        console.error("Failed to parse impersonation state:", error);
        localStorage.removeItem("impersonation");
      }
    }
  }, []);

  const startImpersonation = (targetUser: User, adminId: number) => {
    const data = {
      impersonatedUser: targetUser,
      adminUserId: adminId,
    };
    localStorage.setItem("impersonation", JSON.stringify(data));
    setIsImpersonating(true);
    setImpersonatedUser(targetUser);
    setAdminUserId(adminId);
    
    // Reload the page to apply impersonation
    window.location.href = "/";
  };

  const stopImpersonation = () => {
    localStorage.removeItem("impersonation");
    setIsImpersonating(false);
    setImpersonatedUser(null);
    setAdminUserId(null);
    
    // Reload the page to restore admin session
    window.location.href = "/admin/users";
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        adminUserId,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within ImpersonationProvider");
  }
  return context;
}
