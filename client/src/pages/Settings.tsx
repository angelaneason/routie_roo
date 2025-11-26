import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, MapPin, Settings as SettingsIcon, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import React from "react";
import StopTypesSettings from "./StopTypesSettings";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [newPointName, setNewPointName] = React.useState("");
  const [newPointAddress, setNewPointAddress] = React.useState("");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editAddress, setEditAddress] = React.useState("");
  
  // Check for calendar connection success
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarConnected = params.get("calendar_connected");
    
    if (calendarConnected === "true") {
      // Clean up URL first
      window.history.replaceState({}, "", "/settings");
      
      // Show success message
      toast.success("Calendar connected! 🦘");
      
      // Force a full page reload to refresh the session context
      // This ensures ctx.user gets the updated calendar tokens from database
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, []);
  
  const userQuery = trpc.auth.me.useQuery();
  const startingPointsQuery = trpc.settings.listStartingPoints.useQuery();
  
  const createStartingPointMutation = trpc.settings.createStartingPoint.useMutation({
    onSuccess: () => {
      toast.success("Starting point saved! 🦘");
      setNewPointName("");
      setNewPointAddress("");
      startingPointsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save starting point");
    }
  });
  
  const updateStartingPointMutation = trpc.settings.updateStartingPoint.useMutation({
    onSuccess: () => {
      toast.success("Starting point updated! 🦘");
      setEditingId(null);
      startingPointsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update starting point");
    }
  });
  
  const updateSettingsMutation = trpc.settings.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      userQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  const connectCalendarMutation = trpc.settings.getCalendarConnectionUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast.error("Failed to start calendar connection");
    }
  });

  const disconnectCalendarMutation = trpc.settings.disconnectCalendar.useMutation({
    onSuccess: () => {
      toast.success("Calendar disconnected");
      userQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to disconnect calendar");
    }
  });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const currentUser = userQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4 flex items-center justify-between">
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

      <main className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Settings</h2>
            <p className="text-muted-foreground mt-2">
              Manage your preferences and account settings
            </p>
          </div>

          {userQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="text-base font-medium">{currentUser?.name || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-base font-medium">{currentUser?.email || "Not set"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Calling Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Calling Preferences</CardTitle>
                  <CardDescription>Choose your default calling service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calling-service">Default Calling Service</Label>
                    <Select
                      value={currentUser?.preferredCallingService || "phone"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          preferredCallingService: value as any
                        });
                      }}
                    >
                      <SelectTrigger id="calling-service">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone Dialer</SelectItem>
                        <SelectItem value="google-voice">Google Voice</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="skype">Skype</SelectItem>
                        <SelectItem value="facetime">FaceTime</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This service will be used by default when you click on phone numbers
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distance Unit Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Distance Unit</CardTitle>
                  <CardDescription>Choose how distances are displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance-unit">Preferred Distance Unit</Label>
                    <Select
                      value={currentUser?.distanceUnit || "km"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          distanceUnit: value as "km" | "miles"
                        });
                      }}
                    >
                      <SelectTrigger id="distance-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">Kilometers (km)</SelectItem>
                        <SelectItem value="miles">Miles (mi)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      All route distances will be displayed in your preferred unit
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stop Duration Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Stop Duration</CardTitle>
                  <CardDescription>How long you typically spend at each stop</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stop-duration">Default Stop Time</Label>
                    <Select
                      value={currentUser?.defaultStopDuration?.toString() || "30"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          defaultStopDuration: parseInt(value)
                        });
                      }}
                    >
                      <SelectTrigger id="stop-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This duration is added to drive time when creating calendar events, giving you realistic scheduling
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Google Calendar Connection */}
              <Card>
                <CardHeader>
                  <CardTitle>Google Calendar Integration</CardTitle>
                  <CardDescription>Connect your Google Calendar to view all events in Routie Roo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentUser?.googleCalendarAccessToken ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        <span>Google Calendar connected</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your calendar events will appear alongside your scheduled routes in the Calendar view.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => disconnectCalendarMutation.mutate()}
                      >
                        Disconnect Calendar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Connect your Google Calendar to see all your events (meetings, birthdays, appointments) alongside your Routie Roo routes in one unified calendar view.
                      </p>
                      <Button
                        onClick={() => connectCalendarMutation.mutate()}
                      >
                        Connect Google Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Duration Mode */}
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Event Duration</CardTitle>
                  <CardDescription>How calendar events should calculate time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-duration-mode">Event Duration Mode</Label>
                    <Select
                      value={currentUser?.eventDurationMode || "stop_only"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          eventDurationMode: value as "stop_only" | "include_drive"
                        });
                      }}
                    >
                      <SelectTrigger id="event-duration-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stop_only">Stop time only (+ drive time between)</SelectItem>
                        <SelectItem value="include_drive">Include drive time in event</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      <strong>Stop time only:</strong> Each calendar event shows just your time at the location. Drive time is added between events.<br/>
                      <strong>Include drive time:</strong> Each event includes both the drive to that location and your time there.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-Archive Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Archive Completed Routes</CardTitle>
                  <CardDescription>Automatically archive completed routes after a set period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="auto-archive">Archive completed routes after</Label>
                    <Select
                      value={currentUser?.autoArchiveDays?.toString() || "never"}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({
                          autoArchiveDays: value === "never" ? null : parseInt(value)
                        });
                      }}
                    >
                      <SelectTrigger id="auto-archive">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never (manual only)</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Completed routes will automatically move to the Archive after the selected period. You can always manually archive or unarchive routes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Starting Point */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Starting Point</CardTitle>
                  <CardDescription>Set your default starting address for routes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="starting-point">Starting Address</Label>
                    <Input
                      id="starting-point"
                      type="text"
                      placeholder="e.g., 123 Main St, City, State ZIP"
                      defaultValue={currentUser?.defaultStartingPoint || ""}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value !== currentUser?.defaultStartingPoint) {
                          updateSettingsMutation.mutate({
                            defaultStartingPoint: value || undefined
                          });
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      This address will be used as the starting point for all new routes (e.g., your home or office)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Saved Starting Points */}
              <Card>
                <CardHeader>
                  <CardTitle>Saved Starting Points</CardTitle>
                  <CardDescription>Manage frequently-used starting locations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add new starting point */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label htmlFor="point-name">Location Name</Label>
                      <Input
                        id="point-name"
                        placeholder="e.g., Home, Office, Warehouse"
                        value={newPointName}
                        onChange={(e) => setNewPointName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="point-address">Address</Label>
                      <Input
                        id="point-address"
                        placeholder="e.g., 123 Main St, City, State ZIP"
                        value={newPointAddress}
                        onChange={(e) => setNewPointAddress(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!newPointName.trim() || !newPointAddress.trim()) {
                          toast.error("Please enter both name and address");
                          return;
                        }
                        createStartingPointMutation.mutate({ 
                          name: newPointName.trim(), 
                          address: newPointAddress.trim() 
                        });
                      }}
                      disabled={createStartingPointMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Save Starting Point
                    </Button>
                  </div>

                  {/* List of saved starting points */}
                  <div className="space-y-2">
                    {startingPointsQuery.data?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No saved starting points yet. Add one above!
                      </p>
                    ) : (
                      startingPointsQuery.data?.map((point) => (
                        <div key={point.id} className="p-3 border rounded-lg">
                          {editingId === point.id ? (
                            // Edit mode
                            <div className="space-y-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Location name"
                              />
                              <Input
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                placeholder="Address"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (!editName.trim() || !editAddress.trim()) {
                                      toast.error("Please enter both name and address");
                                      return;
                                    }
                                    updateStartingPointMutation.mutate({
                                      id: point.id,
                                      name: editName.trim(),
                                      address: editAddress.trim(),
                                    });
                                  }}
                                  disabled={updateStartingPointMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{point.name}</p>
                                <p className="text-sm text-muted-foreground">{point.address}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(point.id);
                                    setEditName(point.name);
                                    setEditAddress(point.address);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Delete "${point.name}"?`)) {
                                      trpc.settings.deleteStartingPoint.useMutation({
                                        onSuccess: () => {
                                          toast.success("Starting point deleted");
                                          startingPointsQuery.refetch();
                                        },
                                        onError: (error) => {
                                          toast.error(error.message || "Failed to delete starting point");
                                        }
                                      }).mutate({ id: point.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stop Types Management */}
              <StopTypesSettings />

              {/* Google Integration */}
              <Card>
                <CardHeader>
                  <CardTitle>Google Integration</CardTitle>
                  <CardDescription>Manage your Google account connection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Google Contacts</p>
                      <p className="text-sm text-muted-foreground">
                        Connected and syncing
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Sync Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
