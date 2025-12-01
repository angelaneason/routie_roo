import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StopStatusBadge } from "@/components/StopStatusBadge";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, Calendar, Loader2, MapPin, Route } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function MissedStops() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedWaypoint, setSelectedWaypoint] = useState<any | null>(null);
  const [rescheduledDate, setRescheduledDate] = useState("");
  const [selectedWaypoints, setSelectedWaypoints] = useState<number[]>([]);

  const missedWaypointsQuery = trpc.routes.getMissedWaypoints.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const rescheduleMutation = trpc.routes.rescheduleWaypoint.useMutation({
    onSuccess: () => {
      toast.success("Stop rescheduled successfully");
      missedWaypointsQuery.refetch();
      setSelectedWaypoint(null);
      setRescheduledDate("");
    },
    onError: (error) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const missedWaypoints = missedWaypointsQuery.data || [];
  const needsReschedule = missedWaypoints.filter(w => w.needsReschedule === 1);
  const rescheduled = missedWaypoints.filter(w => w.needsReschedule === 0);

  const handleReschedule = () => {
    if (!selectedWaypoint || !rescheduledDate) {
      toast.error("Please select a date and time");
      return;
    }

    rescheduleMutation.mutate({
      waypointId: selectedWaypoint.id,
      rescheduledDate,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-3 md:py-4 flex items-center justify-between mobile-header-compact">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
        </div>
      </header>

      <main className="container py-4 md:py-8 mobile-content-padding">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Mis-Hops</h2>
            <p className="text-muted-foreground mt-2 italic">
              Stops that need a second look before the route is complete.
            </p>
          </div>

          {missedWaypointsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : missedWaypoints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No missed stops</p>
                <p className="text-sm text-muted-foreground">
                  All stops are on track!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Needs Rescheduling */}
              {needsReschedule.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Needs Rescheduling ({needsReschedule.length})
                    </CardTitle>
                    <CardDescription>
                      These stops were missed and need to be rescheduled
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {needsReschedule.map((waypoint) => (
                        <div
                          key={waypoint.id}
                          className="border rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <StopStatusBadge status="missed" />
                                <Link href={`/route/${waypoint.routeId}`}>
                                  <Button variant="link" className="h-auto p-0 text-sm">
                                    {waypoint.routeName}
                                  </Button>
                                </Link>
                              </div>
                              <p className="font-medium">{waypoint.contactName || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{waypoint.address}</p>
                              {waypoint.missedReason && (
                                <div className="mt-2 text-sm bg-red-50 p-2 rounded">
                                  <p className="font-medium text-red-900">Reason:</p>
                                  <p className="text-red-700">{waypoint.missedReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedWaypoint(waypoint);
                              setRescheduledDate("");
                            }}
                            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-[44px]"
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Already Rescheduled */}
              {rescheduled.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Rescheduled Stops ({rescheduled.length})</CardTitle>
                        <CardDescription>
                          These stops have been rescheduled
                        </CardDescription>
                      </div>
                      {selectedWaypoints.length > 0 && (
                        <Button
                          onClick={() => {
                            // Navigate to home page with selected waypoints
                            const waypointIds = selectedWaypoints.join(',');
                            navigate(`/?createRouteFromWaypoints=${waypointIds}`);
                          }}
                          className="bg-green-600 hover:bg-green-700 min-h-[44px] text-sm md:text-base"
                          size="sm"
                        >
                          <Route className="h-4 w-4 mr-2" />
                          Create Route from Selected ({selectedWaypoints.length})
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rescheduled.map((waypoint) => (
                        <div
                          key={waypoint.id}
                          className="border rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedWaypoints.includes(waypoint.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedWaypoints([...selectedWaypoints, waypoint.id]);
                                } else {
                                  setSelectedWaypoints(selectedWaypoints.filter(id => id !== waypoint.id));
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <StopStatusBadge status="missed" />
                                <Link href={`/route/${waypoint.routeId}`}>
                                  <Button variant="link" className="h-auto p-0 text-sm">
                                    {waypoint.routeName}
                                  </Button>
                                </Link>
                              </div>
                              <p className="font-medium">{waypoint.contactName || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{waypoint.address}</p>
                              {waypoint.rescheduledDate && (
                                <div className="mt-2 text-sm bg-purple-50 p-2 rounded">
                                  <p className="font-medium text-purple-900">Rescheduled for:</p>
                                  <p className="text-purple-700">
                                    {new Date(waypoint.rescheduledDate).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={!!selectedWaypoint} onOpenChange={(open) => !open && setSelectedWaypoint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Stop</DialogTitle>
            <DialogDescription>
              {selectedWaypoint?.contactName} - {selectedWaypoint?.address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date and Time</Label>
              <Input
                id="reschedule-date"
                type="datetime-local"
                value={rescheduledDate}
                onChange={(e) => setRescheduledDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWaypoint(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduleMutation.isPending || !rescheduledDate}
            >
              {rescheduleMutation.isPending ? "Scheduling..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
