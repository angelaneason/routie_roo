import { Button } from "@/components/ui/button";
import { APP_LOGO } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Home as HomeIcon,
  Calendar as CalendarIcon, 
  AlertTriangle, 
  History, 
  Archive, 
  FileText, 
  Settings as SettingsIcon, 
  Users, 
  LogOut,
  MapPin,
  UsersIcon
} from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user } = useAuth();
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("See you later, alligator! 🦘");
      window.location.href = "/";
    },
  });

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container py-4 px-2 md:px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src={APP_LOGO} alt="RoutieRoo" className="h-16 md:h-24" />
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          <span className="text-sm text-muted-foreground">
            {user?.name || user?.email}
          </span>
          <Link href="/">
            <Button variant="outline" size="sm">
              <HomeIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          </Link>
          <Link href="/workspace">
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Plan Routes</span>
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Calendar</span>
            </Button>
          </Link>
          <Link href="/missed-stops">
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Mis-Hops</span>
            </Button>
          </Link>
          <Link href="/reschedule-history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Reschedule</span>
            </Button>
          </Link>
          <Link href="/archived-routes">
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Archive</span>
            </Button>
          </Link>
          <Link href="/changed-addresses">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Changed Addresses</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <SettingsIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Settings</span>
            </Button>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Admin</span>
              </Button>
            </Link>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Log Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
