import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Archive, ArrowLeft, Loader2, Unplug } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function ArchivedRoutes() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Fetch archived routes
  const archivedRoutesQuery = trpc.routes.getArchivedRoutes.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const unarchiveMutation = trpc.routes.unarchiveRoute.useMutation({
    onSuccess: () => {
      toast.success("Route restored successfully");
      archivedRoutesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to restore route: ${error.message}`);
    },
  });

  const handleUnarchive = (routeId: number) => {
    unarchiveMutation.mutate({ routeId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Archived Routes</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view your archived routes
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const routes = archivedRoutesQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Archived Routes</h1>
              <p className="text-sm text-muted-foreground">
                Routes that have been archived
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Archived Routes</CardTitle>
            <CardDescription>
              {routes.length > 0
                ? `${routes.length} archived route${routes.length !== 1 ? "s" : ""}`
                : "No archived routes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {archivedRoutesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No archived routes yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Routes you archive will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className="p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <Link href={`/route/${route.id}`} className="flex-1 min-w-0">
                        <div className="cursor-pointer">
                          <h3 className="font-medium truncate">{route.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {route.totalDistance && (
                              <span>
                                {route.distanceUnit === "miles"
                                  ? `${(route.totalDistance / 1609.34).toFixed(1)} miles`
                                  : `${(route.totalDistance / 1000).toFixed(1)} km`}
                              </span>
                            )}
                            {route.totalDuration && (
                              <span>{Math.round(route.totalDuration / 60)} min</span>
                            )}
                            {route.archivedAt && (
                              <span className="text-xs">
                                Archived {new Date(route.archivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchive(route.id)}
                        disabled={unarchiveMutation.isPending}
                      >
                        <Unplug className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
