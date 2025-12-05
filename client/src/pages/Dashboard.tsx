// Dashboard with professional Routie Roo mascot and metrics
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Calendar, 
  CheckCircle, 
  MapPin, 
  Route as RouteIcon, 
  Users, 
  PlayCircle,
  ArrowUp,
  ArrowRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DashboardCustomization } from "@/components/DashboardCustomization";
import { Link } from "wouter";
import { Settings } from "lucide-react";
import Chart from "chart.js/auto";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const activityChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartInstance = useRef<Chart | null>(null);
  const activityChartInstance = useRef<Chart | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  // Fetch dashboard data
  const { data: routes } = trpc.routes.list.useQuery(undefined, { enabled: !!user });
  const { data: contacts } = trpc.contacts.list.useQuery(undefined, { enabled: !!user });
  const { data: preferences, refetch: refetchPreferences } = trpc.dashboardPreferences.get.useQuery(undefined, { enabled: !!user });

  // Widget visibility from preferences
  const widgetVisibility = preferences?.widgetVisibility || {
    metrics: true,
    charts: true,
    upcomingRoutes: true,
    quickActions: true,
  };
  const widgetOrder = preferences?.widgetOrder || ["charts", "metrics", "upcomingRoutes", "quickActions"];

  // Calculate metrics
  const totalRoutes = routes?.length || 0;
  const activeRoutes = routes?.filter(r => !r.completedAt && !r.archivedAt).length || 0;
  const completedRoutes = routes?.filter(r => r.completedAt).length || 0;
  const archivedRoutes = routes?.filter(r => r.archivedAt).length || 0;
  const totalContacts = contacts?.length || 0;

  // Calculate completed stops across all routes
  const completedStops = routes?.reduce((sum, route) => {
    return sum + (route.completedWaypointCount || 0);
  }, 0) || 0;

  // Get upcoming scheduled routes (next 5)
  const upcomingRoutes = routes
    ?.filter(r => r.scheduledDate && new Date(r.scheduledDate) >= new Date() && !r.completedAt && !r.archivedAt)
    .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
    .slice(0, 5) || [];

  // Initialize charts
  useEffect(() => {
    if (!statusChartRef.current || !activityChartRef.current || !routes) return;

    // Destroy existing charts
    if (statusChartInstance.current) {
      statusChartInstance.current.destroy();
    }
    if (activityChartInstance.current) {
      activityChartInstance.current.destroy();
    }

    // Status Pie Chart
    const statusCtx = statusChartRef.current.getContext('2d');
    if (statusCtx) {
      statusChartInstance.current = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Completed', 'Archived'],
          datasets: [{
            data: [activeRoutes, completedRoutes, archivedRoutes],
            backgroundColor: ['#3b82f6', '#10b981', '#94a3b8'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: { size: 12 }
              }
            }
          }
        }
      });
    }

    // Activity Bar Chart (last 7 days)
    const activityCtx = activityChartRef.current.getContext('2d');
    if (activityCtx) {
      // Calculate routes completed per day for last 7 days
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const routesPerDay = last7Days.map(date => {
        return routes.filter(r => {
          if (!r.completedAt) return false;
          const completedDate = new Date(r.completedAt);
          return completedDate.toDateString() === date.toDateString();
        }).length;
      });

      const dayLabels = last7Days.map(date => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });

      activityChartInstance.current = new Chart(activityCtx, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [{
            label: 'Routes Completed',
            data: routesPerDay,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    }

    return () => {
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
      if (activityChartInstance.current) {
        activityChartInstance.current.destroy();
      }
    };
  }, [routes, activeRoutes, completedRoutes, archivedRoutes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img src="/routie-dashboard.png" alt="Routie Roo" className="h-64 w-64 object-contain" />
            <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {user?.name || 'there'}!
            </h1>
            <p className="text-slate-600">
              Here's what's hopping in your route planning world
            </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomization(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize Dashboard
          </Button>
        </div>


        {/* Render widgets in custom order */}
        <div className="space-y-8">
          {widgetOrder.map((widgetId: string) => {
            if (!widgetVisibility[widgetId as keyof typeof widgetVisibility]) return null;

            switch (widgetId) {
              case 'metrics':
                return (
                  <div key="metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
              <RouteIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRoutes}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">All time</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
              <PlayCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRoutes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to hop
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Stops</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedStops}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All routes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContacts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Your kangaroo crew
              </p>
            </CardContent>
          </Card>
                  </div>
                );

              case 'charts':
                return (
                  <div key="charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Routes by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <canvas ref={statusChartRef}></canvas>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Route Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <canvas ref={activityChartRef}></canvas>
              </div>
            </CardContent>
          </Card>
                  </div>
                );

              case 'upcomingRoutes':
                return (
                  <div key="upcomingRoutes" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Routes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Scheduled Routes</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRoutes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No upcoming scheduled routes. Time to plan your next hop!
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingRoutes.map((route) => (
                    <Link key={route.id} href={`/routes/${route.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors">
                        <div>
                          <div className="font-semibold text-sm">{route.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(route.scheduledDate!).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                            {route.waypointCount || 0} stops
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

                  <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/workspace">
                <Button className="w-full justify-start" size="lg">
                  <MapPin className="mr-2 h-4 w-4" />
                  Plan New Route
                </Button>
              </Link>
              <Link href="/workspace">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Contacts
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Button>
              </Link>
              <Link href="/missed-stops">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  View Mis-Hops
                </Button>
              </Link>
            </CardContent>
                  </Card>
                  </div>
                );

              case 'quickActions':
                return (
                  <Card key="quickActions">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Link href="/workspace">
                        <Button className="w-full justify-start" size="lg">
                          <MapPin className="mr-2 h-4 w-4" />
                          Plan New Route
                        </Button>
                      </Link>
                      <Link href="/workspace">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <Users className="mr-2 h-4 w-4" />
                          Manage Contacts
                        </Button>
                      </Link>
                      <Link href="/calendar">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Calendar
                        </Button>
                      </Link>
                      <Link href="/missed-stops">
                        <Button variant="outline" className="w-full justify-start" size="lg">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          View Mis-Hops
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );

              default:
                return null;
            }
          })}
        </div>
        </div>
      </div>

      <DashboardCustomization
        open={showCustomization}
        onOpenChange={setShowCustomization}
        onSave={() => refetchPreferences()}
      />
    </DashboardLayout>
  );
}
