import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { formatDistance } from "@shared/distance";
import { toast } from "sonner";

export default function Calendar() {
  const { user, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const routesQuery = trpc.routes.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const routes = routesQuery.data || [];
  
  // Filter routes with scheduled dates
  const scheduledRoutes = routes.filter(r => r.scheduledDate);

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create calendar grid
  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Group routes by date
  const routesByDate = new Map<string, typeof routes>();
  scheduledRoutes.forEach(route => {
    if (route.scheduledDate) {
      const dateKey = new Date(route.scheduledDate).toDateString();
      if (!routesByDate.has(dateKey)) {
        routesByDate.set(dateKey, []);
      }
      routesByDate.get(dateKey)!.push(route);
    }
  });

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Routie Roo Calendar - Let's hop to it!</h1>
            <p className="text-muted-foreground">View and manage your scheduled routes</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <Card className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold">
              {monthNames[month]} {year}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateKey = date.toDateString();
              const dayRoutes = routesByDate.get(dateKey) || [];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dateKey}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? "bg-primary/10 border-primary" : "bg-white"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                  <div className="space-y-1">
                    {dayRoutes.slice(0, 3).map(route => (
                      <Link key={route.id} href={`/route/${route.id}`}>
                        <div className="text-xs p-1 bg-blue-100 hover:bg-blue-200 rounded cursor-pointer truncate">
                          <div className="font-medium truncate">{route.name}</div>
                          <div className="text-muted-foreground text-[10px]">
                            {formatDistance(route.totalDistance! / 1000, user?.distanceUnit || "km")}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {dayRoutes.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayRoutes.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary/10 border border-primary rounded" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded" />
                <span>Scheduled Route</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Unscheduled Routes */}
        {routes.filter(r => !r.scheduledDate).length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold mb-4">Unscheduled Routes</h3>
            <div className="grid gap-3">
              {routes.filter(r => !r.scheduledDate).map(route => (
                <Link key={route.id} href={`/route/${route.id}`}>
                  <div className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{route.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistance(route.totalDistance! / 1000, user?.distanceUnit || "km")} · {Math.round(route.totalDuration! / 60)} min
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Schedule
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
