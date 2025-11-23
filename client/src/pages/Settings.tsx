import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, MapPin, Settings as SettingsIcon, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import React from "react";
import StopTypesSettings from "./StopTypesSettings";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [newPointName, setNewPointName] = React.useState("");
  const [newPointAddress, setNewPointAddress] = React.useState("");
  
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
  
  const updateSettingsMutation = trpc.settings.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      userQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
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
                        <div key={point.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{point.name}</p>
                            <p className="text-sm text-muted-foreground">{point.address}</p>
                          </div>
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
