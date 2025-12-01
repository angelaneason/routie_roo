import { Link, useLocation } from "wouter";
import { Home, Route, Calendar, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onMenuClick?: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home, scroll: false },
    { href: "/#routes", label: "Routes", icon: Route, scroll: true },
    { href: "/calendar", label: "Calendar", icon: Calendar, scroll: false },
    { href: "/settings", label: "Settings", icon: Settings, scroll: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.scroll 
            ? location === "/" 
            : location === item.href;
          
          if (item.scroll) {
            // For Routes tab, scroll to section on home page
            return (
              <button
                key={item.href}
                onClick={() => {
                  if (location !== "/") {
                    window.location.href = "/";
                    setTimeout(() => {
                      document.getElementById('routes-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } else {
                    document.getElementById('routes-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Menu className="h-6 w-6" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
