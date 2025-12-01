import { Link } from "wouter";
import { X, AlertTriangle, History, Archive, FileText, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = "/";
    },
  });

  if (!isOpen) return null;

  const menuItems = [
    { href: "/missed-stops", label: "Missed Stops", icon: AlertTriangle },
    { href: "/reschedule-history", label: "Reschedule History", icon: History },
    { href: "/archived-routes", label: "Archive", icon: Archive },
    { href: "/changed-addresses", label: "Changed Addresses", icon: FileText },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ href: "/admin/users", label: "Admin Users", icon: Users });
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Menu Drawer */}
      <div className="md:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <p className="font-semibold">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={onClose}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                logoutMutation.mutate();
                onClose();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
