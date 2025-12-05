import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { useImpersonation } from "@/contexts/ImpersonationContext";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-0 border-b-2 border-orange-500 bg-orange-100 text-orange-900">
      <Eye className="h-5 w-5" />
      <AlertDescription className="flex items-center justify-between">
        <span className="font-semibold">
          Viewing as: {impersonatedUser.name || impersonatedUser.email || "User"} (ID: {impersonatedUser.id})
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="bg-white hover:bg-gray-50"
        >
          <X className="h-4 w-4 mr-2" />
          Exit View As
        </Button>
      </AlertDescription>
    </Alert>
  );
}
