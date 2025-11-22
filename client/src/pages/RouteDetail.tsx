import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView } from "@/components/Map";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Share2, Copy, Calendar, CheckCircle2, XCircle, MessageSquare, GripVertical } from "lucide-react";
import { formatDistance } from "@shared/distance";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { StopStatusBadge, type StopStatus } from "@/components/StopStatusBadge";
import { SortableWaypointItem } from "@/components/SortableWaypointItem";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const [localWaypoints, setLocalWaypoints] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Update local waypoints when data changes
  useEffect(() => {
    if (waypoints.length > 0) {
      setLocalWaypoints(waypoints);
    }
  }, [waypoints]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalWaypoints((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
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
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(waypoints.filter((w: any) => w.status === "complete").length / waypoints.length) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const pendingWaypoints = localWaypoints.filter(w => w.status === "pending");
                          if (pendingWaypoints.length === 0) {
                            toast.info("No pending stops to complete");
                            return;
                          }
                          if (confirm(`Complete all ${pendingWaypoints.length} remaining stops?`)) {
                            pendingWaypoints.forEach(waypoint => {
                              updateStatusMutation.mutate({
                                waypointId: waypoint.id,
                                status: "complete",
                              });
                            });
                          }
                        }}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete All Remaining
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const pendingWaypoints = localWaypoints.filter(w => w.status === "pending");
                          if (pendingWaypoints.length === 0) {
                            toast.info("No pending stops to mark as missed");
                            return;
                          }
                          const reason = prompt(`Mark all ${pendingWaypoints.length} remaining stops as missed?\n\nEnter reason:`);
                          if (reason) {
                            pendingWaypoints.forEach(waypoint => {
                              updateStatusMutation.mutate({
                                waypointId: waypoint.id,
                                status: "missed",
                                missedReason: reason,
                              });
                            });
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Mark All as Missed
                      </Button>
                    </div>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localWaypoints.map(w => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {localWaypoints.map((waypoint: any, index) => (
                        <SortableWaypointItem
                          key={waypoint.id}
                          waypoint={waypoint}
                          index={index}
                          onComplete={() => {
                            setSelectedWaypoint(waypoint);
                            setActionType("complete");
                            setExecutionNotes(waypoint.executionNotes || "");
                          }}
                          onMiss={() => {
                            setSelectedWaypoint(waypoint);
                            setActionType("miss");
                            setMissedReason(waypoint.missedReason || "");
                          }}
                          onNote={() => {
                            setSelectedWaypoint(waypoint);
                            setActionType("note");
                            setExecutionNotes(waypoint.executionNotes || "");
                          }}
                          onReschedule={() => {
                            setSelectedWaypoint(waypoint);
                            setActionType("reschedule");
                            setRescheduledDate(waypoint.rescheduledDate ? new Date(waypoint.rescheduledDate).toISOString().slice(0, 16) : "");
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
