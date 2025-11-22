import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView } from "@/components/Map";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Share2, Copy, Calendar, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { formatDistance } from "@shared/distance";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { StopStatusBadge, type StopStatus } from "@/components/StopStatusBadge";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const routeId = id;
  const { user, isAuthenticated } = useAuth();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [calendarStartTime, setCalendarStartTime] = useState("");
  const [selectedWaypoint, setSelectedWaypoint] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"complete" | "miss" | "note" | "reschedule" | null>(null);
  const [missedReason, setMissedReason] = useState("");
  const [executionNotes, setExecutionNotes] = useState("");
  const [rescheduledDate, setRescheduledDate] = useState("");

  const routeQuery = trpc.routes.get.useQuery(
    { routeId: parseInt(routeId!) },
    { enabled: !!routeId && isAuthenticated }
  );

  const googleMapsUrlQuery = trpc.routes.getGoogleMapsUrl.useQuery(
    { routeId: parseInt(routeId!) },
    { enabled: !!routeId }
  );

  const route = routeQuery.data?.route;
  const waypoints = routeQuery.data?.waypoints || [];

  const updateStatusMutation = trpc.routes.updateWaypointStatus.useMutation({
    onSuccess: () => {
      toast.success("Stop status updated");
      routeQuery.refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const rescheduleMutation = trpc.routes.rescheduleWaypoint.useMutation({
    onSuccess: () => {
      toast.success("Stop rescheduled");
      routeQuery.refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  const closeDialog = () => {
    setSelectedWaypoint(null);
    setActionType(null);
    setMissedReason("");
    setExecutionNotes("");
    setRescheduledDate("");
  };

  const handleSubmit = () => {
    if (!selectedWaypoint) return;

    if (actionType === "reschedule") {
      if (!rescheduledDate) {
        toast.error("Please select a reschedule date");
        return;
      }
      rescheduleMutation.mutate({
        waypointId: selectedWaypoint.id,
        rescheduledDate,
      });
    } else if (actionType === "complete") {
      updateStatusMutation.mutate({
        waypointId: selectedWaypoint.id,
        status: "complete",
        executionNotes: executionNotes || undefined,
      });
    } else if (actionType === "miss") {
      if (!missedReason.trim()) {
        toast.error("Please provide a reason for missing this stop");
        return;
      }
      updateStatusMutation.mutate({
        waypointId: selectedWaypoint.id,
        status: "missed",
        missedReason,
        executionNotes: executionNotes || undefined,
      });
    } else if (actionType === "note") {
      updateStatusMutation.mutate({
        waypointId: selectedWaypoint.id,
        status: selectedWaypoint.status,
        executionNotes: executionNotes || undefined,
      });
    }
  };

  // Initialize map and render route
  useEffect(() => {
    if (!map || !waypoints.length || waypoints.length < 2) return;

    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#4F46E5",
        strokeWeight: 5,
      },
    });

    setDirectionsRenderer(renderer);

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const waypointsForApi = waypoints.slice(1, -1).map(wp => ({
      location: wp.address,
      stopover: true,
    }));

    directionsService.route(
      {
        origin: origin.address,
        destination: destination.address,
        waypoints: waypointsForApi,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // Already optimized by backend
      },
      (result, status) => {
        if (status === "OK" && result) {
          renderer.setDirections(result);
        } else {
          console.error("Directions request failed:", status);
          toast.error("Failed to display route on map");
        }
      }
    );

    return () => {
      renderer.setMap(null);
    };
  }, [map, waypoints]);

  const handleCopyShareLink = () => {
    if (!route) return;
    const shareUrl = `${window.location.origin}/share/${route.shareId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  const handleOpenInGoogleMaps = () => {
    if (googleMapsUrlQuery.data?.url) {
      window.open(googleMapsUrlQuery.data.url, "_blank");
    }
  };

  const calendarMutation = trpc.routes.getCalendarAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to calendar");
    },
  });

  const handleAddToCalendar = () => {
    // Set default start time to now
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15); // Round to next 15 minutes
    const defaultTime = now.toISOString().slice(0, 16);
    setCalendarStartTime(defaultTime);
    setShowCalendarDialog(true);
  };

  const handleConfirmAddToCalendar = () => {
    if (!calendarStartTime || !routeId) return;
    
    calendarMutation.mutate({
      routeId: parseInt(routeId),
      startTime: new Date(calendarStartTime).toISOString(),
    });
  };

  if (routeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (routeQuery.error || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Route Not Found</CardTitle>
            <CardDescription>
              The route you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold">{route.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddToCalendar}>
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
              <Button size="sm" onClick={handleOpenInGoogleMaps}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-[600px]">
                <MapView
                  onMapReady={(loadedMap) => {
                    setMap(loadedMap);
                  }}
                  initialCenter={{ lat: 37.7749, lng: -122.4194 }}
                  initialZoom={12}
                />
              </div>
            </Card>
          </div>

          {/* Route Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="text-2xl font-bold">
                    {formatDistance(route.totalDistance! / 1000, user?.distanceUnit || "km")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="text-2xl font-bold">
                    {Math.round(route.totalDuration! / 60)} min
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stops</p>
                  <p className="text-2xl font-bold">{waypoints.length}</p>
                </div>
                {route.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{route.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Waypoints & Execution</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {waypoints.filter((w: any) => w.status === "complete").length} of {waypoints.length} complete
                  </span>
                </CardTitle>
                <CardDescription>Track your route progress</CardDescription>
                {waypoints.length > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(waypoints.filter((w: any) => w.status === "complete").length / waypoints.length) * 100}%` 
                      }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {waypoints.map((waypoint: any, index) => {
                    const phoneNumbers = waypoint.phoneNumbers ? JSON.parse(waypoint.phoneNumbers) : [];
                    return (
                      <div key={waypoint.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {waypoint.contactName && (
                                <p className="font-medium">{waypoint.contactName}</p>
                              )}
                              <StopStatusBadge status={waypoint.status || "pending"} />
                              {waypoint.needsReschedule === 1 && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                  Needs Reschedule
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {waypoint.address}
                            </p>
                            {waypoint.executionNotes && (
                              <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                                <p className="font-medium text-blue-900">Notes:</p>
                                <p className="text-blue-700">{waypoint.executionNotes}</p>
                              </div>
                            )}
                            {waypoint.missedReason && (
                              <div className="mt-2 text-sm bg-red-50 p-2 rounded">
                                <p className="font-medium text-red-900">Missed Reason:</p>
                                <p className="text-red-700">{waypoint.missedReason}</p>
                              </div>
                            )}
                            {waypoint.rescheduledDate && (
                              <div className="mt-2 text-sm bg-purple-50 p-2 rounded">
                                <p className="font-medium text-purple-900">Rescheduled for:</p>
                                <p className="text-purple-700">
                                  {new Date(waypoint.rescheduledDate).toLocaleString()}
                                </p>
                              </div>
                            )}
                            {phoneNumbers.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {phoneNumbers.map((phone: any, idx: number) => (
                                  <div key={idx} className="flex gap-2">
                                    <PhoneCallMenu
                                      phoneNumber={phone.value}
                                      label={`Call ${phone.label || phone.type || 'Phone'}`}
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs flex-1"
                                    />
                                    <PhoneTextMenu
                                      phoneNumber={phone.value}
                                      label="Text"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Execution Controls */}
                        <div className="flex gap-2 flex-wrap pt-2 border-t">
                          {waypoint.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedWaypoint(waypoint);
                                  setActionType("complete");
                                  setExecutionNotes(waypoint.executionNotes || "");
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedWaypoint(waypoint);
                                  setActionType("miss");
                                  setMissedReason(waypoint.missedReason || "");
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Miss
                              </Button>
                            </>
                          )}
                          {waypoint.status === "missed" && waypoint.needsReschedule === 1 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedWaypoint(waypoint);
                                setActionType("reschedule");
                                setRescheduledDate(waypoint.rescheduledDate ? new Date(waypoint.rescheduledDate).toISOString().slice(0, 16) : "");
                              }}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWaypoint(waypoint);
                              setActionType("note");
                              setExecutionNotes(waypoint.executionNotes || "");
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {waypoint.executionNotes ? "Edit Note" : "Add Note"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Calendar Dialog */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Route to Google Calendar</DialogTitle>
            <DialogDescription>
              Select when you want to start this route
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={calendarStartTime}
                onChange={(e) => setCalendarStartTime(e.target.value)}
              />
            </div>
            {route && (
              <div className="text-sm text-muted-foreground">
                <p>Duration: {Math.round(route.totalDuration! / 60)} minutes</p>
                <p>Distance: {formatDistance(route.totalDistance! / 1000, user?.distanceUnit || "km")}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendarDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddToCalendar} disabled={!calendarStartTime}>
              Add to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Action Dialog */}
      <Dialog open={!!selectedWaypoint && !!actionType} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "complete" && "Complete Stop"}
              {actionType === "miss" && "Mark Stop as Missed"}
              {actionType === "note" && "Add Note"}
              {actionType === "reschedule" && "Reschedule Stop"}
            </DialogTitle>
            <DialogDescription>
              {selectedWaypoint?.contactName} - {selectedWaypoint?.address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "miss" && (
              <div className="space-y-2">
                <Label htmlFor="missed-reason">Reason for Missing Stop *</Label>
                <textarea
                  id="missed-reason"
                  placeholder="e.g., Customer not home, gate locked, wrong address..."
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            {actionType === "reschedule" && (
              <div className="space-y-2">
                <Label htmlFor="reschedule-date">Reschedule Date and Time *</Label>
                <Input
                  id="reschedule-date"
                  type="datetime-local"
                  value={rescheduledDate}
                  onChange={(e) => setRescheduledDate(e.target.value)}
                />
              </div>
            )}

            {(actionType === "complete" || actionType === "note" || actionType === "miss") && (
              <div className="space-y-2">
                <Label htmlFor="execution-notes">
                  Notes {actionType === "note" ? "*" : "(Optional)"}
                </Label>
                <textarea
                  id="execution-notes"
                  placeholder="Add any notes about this stop..."
                  value={executionNotes}
                  onChange={(e) => setExecutionNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending || rescheduleMutation.isPending}
            >
              {updateStatusMutation.isPending || rescheduleMutation.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
