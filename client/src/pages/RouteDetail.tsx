import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView } from "@/components/Map";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Share2, Copy, Calendar, CheckCircle2, XCircle, MessageSquare, GripVertical, Edit, Save, X, Plus, Trash2, Copy as CopyIcon, Download, Sparkles, Archive } from "lucide-react";
import { formatDistance } from "@shared/distance";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { PhoneTextMenu } from "@/components/PhoneTextMenu";
import { StopStatusBadge, type StopStatus } from "@/components/StopStatusBadge";
import { SortableWaypointItem } from "@/components/SortableWaypointItem";
import RouteNotes from "@/components/RouteNotes";
import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
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
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [calendarStartTime, setCalendarStartTime] = useState("");
  const [selectedWaypoint, setSelectedWaypoint] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"complete" | "miss" | "note" | "reschedule" | null>(null);
  const [missedReason, setMissedReason] = useState("");
  const [executionNotes, setExecutionNotes] = useState("");
  const [rescheduledDate, setRescheduledDate] = useState("");
  const [localWaypoints, setLocalWaypoints] = useState<any[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editRouteName, setEditRouteName] = useState("");
  const [editRouteNotes, setEditRouteNotes] = useState("");
  const [editFolderId, setEditFolderId] = useState<number | null>(null);
  const [editStartingPoint, setEditStartingPoint] = useState("");
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [editingWaypointId, setEditingWaypointId] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState("");

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

  const recalculateRouteMutation = trpc.routes.recalculateRoute.useMutation({
    onSuccess: (data) => {
      routeQuery.refetch();
      toast.success("Route recalculated");
    },
    onError: (error) => {
      toast.error(`Failed to recalculate: ${error.message}`);
    },
  });

  const archiveRouteMutation = trpc.routes.archiveRoute.useMutation({
    onSuccess: () => {
      toast.success("Route archived");
      navigate("/");
    },
    onError: (error) => {
      toast.error(`Failed to archive: ${error.message}`);
    },
  });

  const reoptimizeRouteMutation = trpc.routes.reoptimizeRoute.useMutation({
    onSuccess: (data) => {
      routeQuery.refetch();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Failed to re-optimize: ${error.message}`);
    },
  });

  const removeWaypointMutation = trpc.routes.removeWaypoint.useMutation({
    onSuccess: () => {
      toast.success("Waypoint removed");
      routeQuery.refetch();
      // Recalculate route after removing waypoint
      if (routeId) {
        recalculateRouteMutation.mutate({ routeId: parseInt(routeId) });
      }
    },
    onError: (error) => {
      toast.error(`Failed to remove waypoint: ${error.message}`);
    },
  });

  const updateAddressMutation = trpc.routes.updateWaypointAddress.useMutation({
    onSuccess: () => {
      toast.success("Address updated");
      setEditingWaypointId(null);
      setEditingAddress("");
      routeQuery.refetch();
      // Recalculate route after updating address
      if (routeId) {
        recalculateRouteMutation.mutate({ routeId: parseInt(routeId) });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update address: ${error.message}`);
    },
  });

  const updateRouteMutation = trpc.routes.update.useMutation({
    onSuccess: () => {
      toast.success("Route updated successfully");
      setShowEditDialog(false);
      routeQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update route: ${error.message}`);
    },
  });

  const clearCalendarEventsMutation = trpc.routes.clearCalendarEvents.useMutation({
    onSuccess: () => {
      toast.success("Calendar events cleared");
      routeQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to clear calendar events: ${error.message}`);
    },
  });

  const foldersQuery = trpc.folders.list.useQuery(undefined, {
    enabled: isAuthenticated,
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
      suppressMarkers: true, // Hide default markers, we'll add numbered ones
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
          
          // Clear existing markers
          markers.forEach(marker => marker.setMap(null));
          
          // Add numbered markers for each waypoint using the route's leg coordinates
          const newMarkers: google.maps.Marker[] = [];
          const route = result.routes[0];
          
          if (route && route.legs) {
            // First marker at the start location (Routie Roo mascot)
            const startMarker = new google.maps.Marker({
              position: route.legs[0].start_location,
              map,
              icon: {
                url: '/routie-roo-marker.png',
                scaledSize: new google.maps.Size(48, 64),
                anchor: new google.maps.Point(24, 64),
              },
            });
            newMarkers.push(startMarker);
            
            // Intermediate waypoint markers
            route.legs.forEach((leg, index) => {
              if (index < route.legs.length - 1) {
                const marker = new google.maps.Marker({
                  position: leg.end_location,
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
              }
            });
            
            // Last marker at the end location
            const lastLeg = route.legs[route.legs.length - 1];
            const endMarker = new google.maps.Marker({
              position: lastLeg.end_location,
              map,
              label: {
                text: String(waypoints.length - 1),
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
            newMarkers.push(endMarker);
          }
          
          setMarkers(newMarkers);
        } else {
          console.error("Directions request failed:", status);
          toast.error("Failed to display route on map");
        }
      }
    );

    return () => {
      renderer.setMap(null);
      markers.forEach(marker => marker.setMap(null));
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

  const generateShareTokenMutation = trpc.routes.generateShareToken.useMutation({
    onSuccess: (data) => {
      setShareToken(data.shareToken);
      toast.success("Share link generated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate share link");
    },
  });

  const calendarMutation = trpc.routes.getCalendarAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add to calendar");
    },
  });

  const copyRouteMutation = trpc.routes.copyRoute.useMutation({
    onSuccess: (data) => {
      toast.success("Route copied successfully!");
      window.location.href = `/routes/${data.routeId}`;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to copy route");
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

  const handleCopyRoute = () => {
    if (!routeId) return;
    copyRouteMutation.mutate({ routeId: parseInt(routeId) });
  };

  const handleArchiveRoute = () => {
    if (!routeId) return;
    archiveRouteMutation.mutate({ routeId: parseInt(routeId) });
  };

  const handleReoptimizeRoute = () => {
    if (!routeId) return;
    reoptimizeRouteMutation.mutate({ routeId: parseInt(routeId) });
  };

  const handleExportToCSV = () => {
    if (!route || !waypoints) return;

    // CSV headers
    const headers = [
      "Waypoint #",
      "Contact Name",
      "Address",
      "Phone Numbers",
      "Status",
      "Notes",
      "Missed Reason",
      "Rescheduled Date"
    ];

    // CSV rows
    const rows = waypoints.map((wp: any, index: number) => {
      const phoneNumbers = wp.phoneNumbers
        ? wp.phoneNumbers.map((p: any) => `${p.value} (${p.label || p.type})`).join("; ")
        : "";
      
      return [
        index + 1,
        wp.contactName || "",
        wp.address || "",
        phoneNumbers,
        wp.status || "pending",
        wp.executionNotes || "",
        wp.missedReason || "",
        wp.rescheduledDate ? new Date(wp.rescheduledDate).toLocaleDateString() : ""
      ];
    });

    // Add route metadata at the top
    const metadata = [
      ["Route Name", route.name || ""],
      ["Total Distance", `${formatDistance(route.totalDistance! / 1000, user?.distanceUnit || "km")}`],
      ["Estimated Time", `${Math.round(route.totalDuration! / 60)} min`],
      ["Total Stops", waypoints.length.toString()],
      ["Created", new Date(route.createdAt).toLocaleString()],
      route.completedAt ? ["Completed", new Date(route.completedAt).toLocaleString()] : [],
      [""], // Empty row
    ].filter(row => row.length > 0);

    // Combine all data
    const csvData = [
      ...metadata,
      headers,
      ...rows
    ];

    // Convert to CSV string
    const csvContent = csvData
      .map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
      .join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${route.name || 'route'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Route exported to CSV!");
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
              {route.completedAt && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isEditMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" variant="default" onClick={() => {
                    setIsEditMode(false);
                    routeQuery.refetch();
                    toast.success("Route updated");
                  }}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                 <>                  {/* Primary Actions */}
                  <Button variant="outline" size="sm" onClick={handleReoptimizeRoute} disabled={reoptimizeRouteMutation.isPending}>
                    {reoptimizeRouteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Re-optimize
                  </Button>
                  <Button size="sm" onClick={handleOpenInGoogleMaps}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Maps
                  </Button>
                  
                  {/* Sharing Actions */}
                  <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  {/* Secondary Actions */}
                  <Button variant="outline" size="sm" onClick={handleCopyRoute}>
                    <CopyIcon className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddToCalendar}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleArchiveRoute} disabled={archiveRouteMutation.isPending}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
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
          <div className="lg:col-span-3 space-y-6">
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
                {route.completedAt && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {new Date(route.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditRouteName(route?.name || "");
                        setEditRouteNotes(route?.notes || "");
                        setEditFolderId(route?.folderId || null);
                        setEditStartingPoint(route?.startingPointAddress || "");
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Route
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddContactDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Track your route progress and manage waypoints
                </CardDescription>
                {!isEditMode && waypoints.length > 0 && (
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
                          isEditMode={isEditMode}
                          onRemove={() => {
                            if (confirm(`Remove ${waypoint.contactName || "this waypoint"}?`)) {
                              removeWaypointMutation.mutate({ waypointId: waypoint.id });
                            }
                          }}
                          onEditAddress={() => {
                            setEditingWaypointId(waypoint.id);
                            setEditingAddress(waypoint.address);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            {/* Route Notes */}
            <Card>
              <CardContent className="pt-6">
                <RouteNotes routeId={Number(routeId)} />
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
              <Label htmlFor="start-time" className="!font-bold">Start Time</Label>
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
                <Label htmlFor="missed-reason" className="!font-bold">Reason for Missing Stop *</Label>
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
                <Label htmlFor="reschedule-date" className="!font-bold">Reschedule Date and Time *</Label>
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
                <Label htmlFor="execution-notes" className="!font-bold">
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

      {/* Share for Execution Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Route for Execution</DialogTitle>
            <DialogDescription>
              Generate a link that allows drivers to execute this route and mark stops as complete/missed without logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!shareToken && !route?.shareToken ? (
              <div className="text-sm text-muted-foreground">
                <p>Click "Generate Link" to create a shareable execution link. The driver will be able to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>View the route and all waypoints</li>
                  <li>Mark stops as complete or missed</li>
                  <li>Add notes and reasons for missed stops</li>
                  <li>Reorder stops during execution</li>
                </ul>
                <p className="mt-2 font-medium">All updates will sync back to your account automatically.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="!font-bold">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/share/${shareToken || route?.shareToken}`}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken || route?.shareToken}`);
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can execute the route and update stop statuses.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
            {!shareToken && !route?.shareToken && (
              <Button
                onClick={() => generateShareTokenMutation.mutate({ routeId: parseInt(routeId!) })}
                disabled={generateShareTokenMutation.isPending}
              >
                {generateShareTokenMutation.isPending ? "Generating..." : "Generate Link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
            <DialogDescription>
              Update route name, notes, folder, or starting point
            </DialogDescription>
          </DialogHeader>
          {route?.googleCalendarId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-2">
              <p className="text-sm text-yellow-800">
                ⚠️ This route has calendar events. Changes won't update automatically in Google Calendar.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm("Clear calendar event tracking for this route? You can recreate events after editing.")) {
                    clearCalendarEventsMutation.mutate({ routeId: parseInt(routeId!) });
                  }
                }}
                disabled={clearCalendarEventsMutation.isPending}
              >
                {clearCalendarEventsMutation.isPending ? "Clearing..." : "Delete Calendar Events"}
              </Button>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-route-name" className="!font-bold">Route Name</Label>
              <Input
                id="edit-route-name"
                value={editRouteName}
                onChange={(e) => setEditRouteName(e.target.value)}
                placeholder="Enter route name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-route-notes" className="!font-bold">Notes (Optional)</Label>
              <Input
                id="edit-route-notes"
                value={editRouteNotes}
                onChange={(e) => setEditRouteNotes(e.target.value)}
                placeholder="Add any notes or details about this route"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder" className="!font-bold">Folder (Optional)</Label>
              <select
                id="edit-folder"
                value={editFolderId || ""}
                onChange={(e) => setEditFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">No folder</option>
                {foldersQuery.data?.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-starting-point" className="!font-bold">Starting Point (Optional)</Label>
              <Input
                id="edit-starting-point"
                value={editStartingPoint}
                onChange={(e) => setEditStartingPoint(e.target.value)}
                placeholder="Enter starting address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editRouteName.trim()) {
                  toast.error("Route name cannot be empty");
                  return;
                }
                updateRouteMutation.mutate({
                  routeId: parseInt(routeId!),
                  name: editRouteName,
                  notes: editRouteNotes || undefined,
                  folderId: editFolderId,
                  startingPointAddress: editStartingPoint || undefined,
                });
              }}
              disabled={updateRouteMutation.isPending}
            >
              {updateRouteMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={editingWaypointId !== null} onOpenChange={(open) => !open && setEditingWaypointId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Waypoint Address</DialogTitle>
            <DialogDescription>
              Update the address for this stop
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="!font-bold">Address</Label>
              <Input
                id="edit-address"
                value={editingAddress}
                onChange={(e) => setEditingAddress(e.target.value)}
                placeholder="Enter new address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWaypointId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingAddress.trim()) {
                  toast.error("Address cannot be empty");
                  return;
                }
                updateAddressMutation.mutate({
                  waypointId: editingWaypointId!,
                  address: editingAddress,
                });
              }}
              disabled={updateAddressMutation.isPending}
            >
              {updateAddressMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Contact to Route</DialogTitle>
            <DialogDescription>
              Select a contact to add as a waypoint
            </DialogDescription>
          </DialogHeader>
          <AddContactToRoute
            routeId={parseInt(routeId!)}
            onSuccess={() => {
              setShowAddContactDialog(false);
              routeQuery.refetch();
              toast.success("Contact added to route");
              // Recalculate route after adding waypoint
              if (routeId) {
                recalculateRouteMutation.mutate({ routeId: parseInt(routeId) });
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for adding contacts to route
function AddContactToRoute({ routeId, onSuccess }: { routeId: number; onSuccess: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const contactsQuery = trpc.contacts.list.useQuery();
  const addWaypointMutation = trpc.routes.addWaypoint.useMutation({
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });

  const contacts = contactsQuery.data || [];
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.address?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search contacts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredContacts.map((contact) => (
          <Card
            key={contact.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => {
              if (!contact.address) {
                toast.error(`${contact.name} has no address`);
                return;
              }
              addWaypointMutation.mutate({
                routeId,
                contactName: contact.name || undefined,
                address: contact.address,
                phoneNumbers: contact.phoneNumbers || undefined,
              });
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.address || "No address"}</p>
                </div>
                {!contact.address && (
                  <span className="text-xs text-orange-600 font-medium">No Address</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No contacts found
          </div>
        )}
      </div>
    </div>
  );
}
