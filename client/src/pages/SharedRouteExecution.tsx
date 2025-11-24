import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, CheckCircle2, XCircle, MessageSquare, Phone } from "lucide-react";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { formatDistance } from "@shared/distance";
import { StopStatusBadge, type StopStatus } from "@/components/StopStatusBadge";
import { useEffect, useState } from "react";
import { useParams } from "wouter";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export default function SharedRouteExecution() {
  const { token } = useParams<{ token: string }>();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
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

  const routeQuery = trpc.routes.getByShareToken.useQuery(
    { shareToken: token! },
    { enabled: !!token }
  );

  const updateStatusMutation = trpc.routes.updateWaypointStatusPublic.useMutation({
    onSuccess: () => {
      toast.success("Stop status updated");
      routeQuery.refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const rescheduleMutation = trpc.routes.rescheduleWaypointPublic.useMutation({
    onSuccess: () => {
      toast.success("Stop rescheduled");
      routeQuery.refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  const route = routeQuery.data?.route;
  const waypoints = routeQuery.data?.waypoints || [];

  // Sync local waypoints with fetched data
  useEffect(() => {
    if (waypoints.length > 0) {
      setLocalWaypoints(waypoints);
    }
  }, [waypoints]);

  useEffect(() => {
    if (!map || !directionsRenderer || waypoints.length < 2) return;

    const directionsService = new google.maps.DirectionsService();
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const waypointList = waypoints.slice(1, -1).map(wp => ({
      location: new google.maps.LatLng(parseFloat(wp.latitude!), parseFloat(wp.longitude!)),
      stopover: true,
    }));

    directionsService.route(
      {
        origin: new google.maps.LatLng(parseFloat(origin.latitude!), parseFloat(origin.longitude!)),
        destination: new google.maps.LatLng(parseFloat(destination.latitude!), parseFloat(destination.longitude!)),
        waypoints: waypointList,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          
          // Add numbered markers for each waypoint
          const newMarkers: google.maps.Marker[] = [];
          waypoints.forEach((waypoint, index) => {
            const marker = new google.maps.Marker({
              position: new google.maps.LatLng(
                parseFloat(waypoint.latitude!),
                parseFloat(waypoint.longitude!)
              ),
              map,
              label: {
                text: String(index + 1),
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 20,
                fillColor: "#4F46E5",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              },
            });
            newMarkers.push(marker);
          });
          
          setMarkers(newMarkers);
        }
      }
    );
  }, [map, directionsRenderer, waypoints]);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    const renderer = new google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true, // Hide default markers, we'll add numbered ones
    });
    setDirectionsRenderer(renderer);
  };

  const openDialog = (waypoint: any, type: "complete" | "miss" | "note" | "reschedule") => {
    setSelectedWaypoint(waypoint);
    setActionType(type);
    setMissedReason("");
    setExecutionNotes("");
    setRescheduledDate("");
  };

  const closeDialog = () => {
    setSelectedWaypoint(null);
    setActionType(null);
    setMissedReason("");
    setExecutionNotes("");
    setRescheduledDate("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalWaypoints((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);

        // Update execution order in backend
        if (token) {
          const updates = reordered.map((wp, index) => ({
            waypointId: wp.id,
            executionOrder: index + 1,
          }));

          // Call backend to update order
          // Note: We'll need to add this mutation
          toast.success("Stop order updated");
        }

        return reordered;
      });
    }
  };

  const handleSubmit = () => {
    if (!selectedWaypoint || !token) return;

    if (actionType === "complete") {
      updateStatusMutation.mutate({
        shareToken: token,
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
        shareToken: token,
        waypointId: selectedWaypoint.id,
        status: "missed",
        missedReason,
        executionNotes: executionNotes || undefined,
      });
    } else if (actionType === "note") {
      if (!executionNotes.trim()) {
        toast.error("Please add a note");
        return;
      }
      updateStatusMutation.mutate({
        shareToken: token,
        waypointId: selectedWaypoint.id,
        status: selectedWaypoint.status,
        executionNotes,
      });
    } else if (actionType === "reschedule") {
      if (!rescheduledDate.trim()) {
        toast.error("Please select a reschedule date");
        return;
      }
      rescheduleMutation.mutate({
        shareToken: token,
        waypointId: selectedWaypoint.id,
        rescheduledDate,
      });
    }
  };

  if (routeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (routeQuery.isError || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Route Not Found</CardTitle>
            <CardDescription>
              This route link is invalid or has been revoked.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const completedCount = waypoints.filter(wp => wp.status === "complete").length;
  const progressPercent = waypoints.length > 0 ? (completedCount / waypoints.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">{route.name}</h1>
            <p className="text-sm text-muted-foreground">Shared Route Execution</p>
          </div>
        </div>

        {/* Map */}
        <Card>
          <CardContent className="p-0">
            <MapView 
              onMapReady={handleMapReady} 
              initialCenter={waypoints.length > 0 && waypoints[0].latitude && waypoints[0].longitude 
                ? { lat: parseFloat(waypoints[0].latitude), lng: parseFloat(waypoints[0].longitude) }
                : undefined
              }
              initialZoom={13}
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-lg" 
            />
          </CardContent>
        </Card>

        {/* Route Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDistance(route.totalDistance || 0, route.distanceUnit || "km")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Estimated Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {Math.round((route.totalDuration || 0) / 60)} min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Stops</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{waypoints.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Waypoints & Execution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Waypoints & Execution</CardTitle>
                <CardDescription>
                  {completedCount} of {waypoints.length} complete
                </CardDescription>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localWaypoints.map(wp => wp.id)}
                strategy={verticalListSortingStrategy}
              >
                {localWaypoints.map((waypoint, index) => {
                  const WaypointCard = () => {
                    const {
                      attributes,
                      listeners,
                      setNodeRef,
                      transform,
                      transition,
                    } = useSortable({ id: waypoint.id });

                    const style = {
                      transform: CSS.Transform.toString(transform),
                      transition,
                    };

                    return (
              <div ref={setNodeRef} style={style} key={waypoint.id} className="flex gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                <div className="flex-shrink-0 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                  <GripVertical className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {waypoint.contactName && (
                          <h3 className="font-semibold">{waypoint.contactName}</h3>
                        )}
                        <StopStatusBadge status={waypoint.status as StopStatus} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs ml-auto"
                          onClick={() => {
                            const encodedAddress = encodeURIComponent(waypoint.address);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
                          }}
                          title="Open in Google Maps"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Maps
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{waypoint.address}</p>
                      {waypoint.phoneNumbers && (
                        <div className="flex gap-2 mt-2">
                          <PhoneCallMenu phoneNumber={waypoint.phoneNumbers} size="sm" />
                          <PhoneTextMenu phoneNumber={waypoint.phoneNumbers} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  {waypoint.executionNotes && (
                    <div className="text-sm bg-muted p-2 rounded">
                      <p className="font-medium">Notes:</p>
                      <p>{waypoint.executionNotes}</p>
                    </div>
                  )}

                  {waypoint.status === "missed" && waypoint.missedReason && (
                    <div className="text-sm bg-destructive/10 p-2 rounded">
                      <p className="font-medium text-destructive">Missed:</p>
                      <p>{waypoint.missedReason}</p>
                    </div>
                  )}

                  {waypoint.status === "missed" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(waypoint, "reschedule")}
                      >
                        Reschedule
                      </Button>
                    </div>
                  )}

                  {waypoint.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => openDialog(waypoint, "complete")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog(waypoint, "miss")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Miss
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(waypoint, "note")}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Add Note
                      </Button>
                    </div>
                  )}
                </div>
              </div>
                    );
                  };
                  return <WaypointCard key={waypoint.id} />;
                })}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>Powered by RoutieRoo</p>
        </div>
      </main>

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
                <Label htmlFor="reschedule-date">Reschedule Date *</Label>
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
              {(updateStatusMutation.isPending || rescheduleMutation.isPending) ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
