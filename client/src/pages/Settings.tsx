import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPickerButton } from "@/components/EmojiPickerButton";
import { EmailPreviewDialog } from "@/components/EmailPreviewDialog";
import { StageEmailTemplateEditor } from "@/components/StageEmailTemplateEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, MapPin, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import React from "react";
import StopTypesSettings from "./StopTypesSettings";
import { ImportantDateTypesSettings } from "@/components/ImportantDateTypesSettings";
import { CommentOptionsSettings } from "@/components/CommentOptionsSettings";
import { LabelColorsSettings } from "@/components/LabelColorsSettings";
import RouteHoldersSettings from "./RouteHoldersSettings";
import { ClientBillingSettings } from "@/components/ClientBillingSettings";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [newPointName, setNewPointName] = React.useState("");
  const [newPointAddress, setNewPointAddress] = React.useState("");
  const [editingStopType, setEditingStopType] = React.useState<number | null>(null);
  const [showEmailPreview, setShowEmailPreview] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editAddress, setEditAddress] = React.useState("");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  
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
  const dateTypesQuery = trpc.settings.listImportantDateTypes.useQuery();
  const stopTypesQuery = trpc.stopTypes.list.useQuery();
  const foldersQuery = trpc.folders.list.useQuery();
  
  const createStartingPointMutation = trpc.settings.createStartingPoint.useMutation({
    onSuccess: () => {
      toast.success("Starting point saved! 🦘");
      startingPointsQuery.refetch();
      setNewPointName("");
      setNewPointAddress("");
    },
    onError: (error) => {
      toast.error(`Failed to save starting point: ${error.message}`);
    }
  });

  const deleteStartingPointMutation = trpc.settings.deleteStartingPoint.useMutation({
    onSuccess: () => {
      toast.success("Starting point deleted");
      startingPointsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    }
  });

  const updateStartingPointMutation = trpc.settings.updateStartingPoint.useMutation({
    onSuccess: () => {
      toast.success("Starting point updated! 🦘");
      startingPointsQuery.refetch();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const updateSettingsMutation = trpc.settings.updatePreferences.useMutation({
    onSuccess: () => {
      userQuery.refetch();
      toast.success("Settings updated! 🦘");
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  const disconnectCalendarMutation = trpc.settings.disconnectCalendar.useMutation({
    onSuccess: () => {
      userQuery.refetch();
      toast.success("Calendar disconnected");
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  });

  const backfillLabelsMutation = trpc.admin.backfillWaypointLabels.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} waypoints with labels! 🦘`);
    },
    onError: (error) => {
      toast.error(`Failed to update labels: ${error.message}`);
    }
  });

  const getCalendarConnectionUrlMutation = trpc.settings.getCalendarConnectionUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(`Failed to initiate calendar connection: ${error.message}`);
    }
  });

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/workspace");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    navigate("/workspace");
    return null;
  }

  const currentUser = userQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/workspace">
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
        <div className="max-w-4xl mx-auto space-y-6">
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
            <Tabs defaultValue="account" className="w-full">
              <TabsList className={`grid w-full ${['premium', 'enterprise'].includes(user?.subscriptionTier || 'free') ? 'grid-cols-7' : 'grid-cols-6'}`}>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="site">Site Config</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="routes">Routes</TabsTrigger>
                {['premium', 'enterprise'].includes(user?.subscriptionTier || 'free') && (
                  <TabsTrigger value="holders">Route Holders</TabsTrigger>
                )}
                <TabsTrigger value="labels">Label Colors</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              {/* ========== ACCOUNT TAB ========== */}
              <TabsContent value="account" className="space-y-4 mt-6">
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
              </TabsContent>

              {/* ========== SITE CONFIGURATION TAB ========== */}
              <TabsContent value="site" className="space-y-4 mt-6">
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
              </TabsContent>

              {/* ========== CONTACTS TAB ========== */}
              <TabsContent value="contacts" className="space-y-4 mt-6">
                {/* Important Date Types */}
                <ImportantDateTypesSettings />

                {/* Comment Options */}
                <CommentOptionsSettings />

                {/* Email Reminders for Important Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Reminders for Important Dates</CardTitle>
                    <CardDescription>
                      Automatically send email reminders when important dates approach
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="scheduling-email">Scheduling Team Email</Label>
                      <Input
                        id="scheduling-email"
                        type="email"
                        placeholder="scheduling@example.com"
                        defaultValue={currentUser?.schedulingEmail || ""}
                        onBlur={(e) => {
                          if (e.target.value !== currentUser?.schedulingEmail) {
                            updateSettingsMutation.mutate({
                              schedulingEmail: e.target.value
                            });
                          }
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        Reminders will be sent to both the contact's email AND this scheduling team email
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Reminder Intervals (Days Before Date)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="30, 10, 5"
                          defaultValue={
                            currentUser?.reminderIntervals
                              ? JSON.parse(currentUser.reminderIntervals).join(", ")
                              : "30, 10, 5"
                          }
                          onBlur={(e) => {
                            try {
                              const intervals = e.target.value
                                .split(",")
                                .map(s => parseInt(s.trim()))
                                .filter(n => !isNaN(n));
                              updateSettingsMutation.mutate({
                                reminderIntervals: intervals
                              });
                            } catch {
                              toast.error("Invalid format. Use comma-separated numbers like: 30, 10, 5");
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter days before the date to send reminders (e.g., 30, 10, 5). Past due reminders are sent automatically.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Select Date Types for Reminders</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose which important date types will trigger email reminders
                        </p>
                        {dateTypesQuery.isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading date types...
                          </div>
                        ) : dateTypesQuery.data && dateTypesQuery.data.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {dateTypesQuery.data.map((dateType) => {
                              const enabledTypes = currentUser?.enabledReminderDateTypes
                                ? JSON.parse(currentUser.enabledReminderDateTypes)
                                : null; // null means all enabled by default
                              const isEnabled = enabledTypes === null || enabledTypes.includes(dateType.name);
                              
                              return (
                                <label
                                  key={dateType.id}
                                  className="flex items-center gap-2 p-2 rounded border hover:bg-accent cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const currentEnabled = currentUser?.enabledReminderDateTypes
                                        ? JSON.parse(currentUser.enabledReminderDateTypes)
                                        : dateTypesQuery.data?.map(dt => dt.name) || [];
                                      
                                      const newEnabled = e.target.checked
                                        ? [...currentEnabled, dateType.name]
                                        : currentEnabled.filter((t: string) => t !== dateType.name);
                                      
                                      updateSettingsMutation.mutate({
                                        enabledReminderDateTypes: newEnabled
                                      });
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm">{dateType.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No date types configured yet. Add them in the "Important Date Types" section above.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Stage-Specific Email Template Editors */}
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label className="text-base font-semibold">Email Template Customization</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Customize email content for each reminder stage. Each stage can have different tone and urgency.
                        </p>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="30days">
                          <AccordionTrigger>30 Days Before Reminder</AccordionTrigger>
                          <AccordionContent>
                            <StageEmailTemplateEditor
                              stage="30days"
                              stageLabel="30 Days Before"
                              stageDescription="First gentle reminder sent 30 days before the important date"
                              subjectValue={currentUser?.reminderEmail30DaysSubject}
                              contactBodyValue={currentUser?.reminderEmail30DaysBodyContact}
                              teamBodyValue={currentUser?.reminderEmail30DaysBodyTeam}
                              onUpdate={(field, value) => {
                                updateSettingsMutation.mutate({ [field]: value });
                              }}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="10days">
                          <AccordionTrigger>10 Days Before Reminder</AccordionTrigger>
                          <AccordionContent>
                            <StageEmailTemplateEditor
                              stage="10days"
                              stageLabel="10 Days Before"
                              stageDescription="Second reminder with increased urgency sent 10 days before"
                              subjectValue={currentUser?.reminderEmail10DaysSubject}
                              contactBodyValue={currentUser?.reminderEmail10DaysBodyContact}
                              teamBodyValue={currentUser?.reminderEmail10DaysBodyTeam}
                              onUpdate={(field, value) => {
                                updateSettingsMutation.mutate({ [field]: value });
                              }}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="5days">
                          <AccordionTrigger>5 Days Before Reminder (Urgent)</AccordionTrigger>
                          <AccordionContent>
                            <StageEmailTemplateEditor
                              stage="5days"
                              stageLabel="5 Days Before"
                              stageDescription="Final urgent reminder sent 5 days before the date"
                              subjectValue={currentUser?.reminderEmail5DaysSubject}
                              contactBodyValue={currentUser?.reminderEmail5DaysBodyContact}
                              teamBodyValue={currentUser?.reminderEmail5DaysBodyTeam}
                              onUpdate={(field, value) => {
                                updateSettingsMutation.mutate({ [field]: value });
                              }}
                            />
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="pastdue">
                          <AccordionTrigger>Past Due Notice (Overdue)</AccordionTrigger>
                          <AccordionContent>
                            <StageEmailTemplateEditor
                              stage="pastdue"
                              stageLabel="Past Due"
                              stageDescription="Overdue notice sent after the important date has passed"
                              subjectValue={currentUser?.reminderEmailPastDueSubject}
                              contactBodyValue={currentUser?.reminderEmailPastDueBodyContact}
                              teamBodyValue={currentUser?.reminderEmailPastDueBodyTeam}
                              onUpdate={(field, value) => {
                                updateSettingsMutation.mutate({ [field]: value });
                              }}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowEmailPreview(true)}
                      >
                        Preview Email Templates
                      </Button>
                      <div>
                        <Label>Enable Date Reminders</Label>
                        <p className="text-sm text-muted-foreground">Turn on/off automatic email reminders</p>
                      </div>
                      <Button
                        variant={currentUser?.enableDateReminders ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateSettingsMutation.mutate({
                            enableDateReminders: !currentUser?.enableDateReminders
                          });
                        }}
                      >
                        {currentUser?.enableDateReminders ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Link href="/reminder-history">
                        <Button variant="outline" className="w-full">
                          View Reminder History
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========== ROUTES TAB ========== */}
              <TabsContent value="routes" className="space-y-4 mt-6">
                {/* Smart Auto-Routing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Smart Auto-Routing</CardTitle>
                    <CardDescription>
                      Automatically create weekly routes for contacts based on their scheduled visit days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="enable-smart-routing" className="text-base font-medium">
                          Enable Smart Auto-Routing
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically generate routes when you schedule contacts for specific days
                        </p>
                      </div>
                      <Switch
                        id="enable-smart-routing"
                        checked={currentUser?.enableSmartRouting === 1}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            enableSmartRouting: checked ? 1 : 0
                          });
                        }}
                      />
                    </div>

                    {/* Smart Routing Preferences (only visible when enabled) */}
                    {currentUser?.enableSmartRouting === 1 && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2">
                          <Label htmlFor="smart-routing-folder">Default Folder for Auto-Routes</Label>
                          <Select
                            value={currentUser?.smartRoutingFolder || "none"}
                            onValueChange={(value) => {
                              updateSettingsMutation.mutate({
                                smartRoutingFolder: value === "none" ? null : value
                              });
                            }}
                          >
                            <SelectTrigger id="smart-routing-folder">
                              <SelectValue placeholder="Select folder" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No folder (root level)</SelectItem>
                              {foldersQuery.data?.map((folder) => (
                                <SelectItem key={folder.id} value={folder.name}>
                                  {folder.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Auto-generated routes will be saved to this folder
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="smart-routing-starting-point">Default Starting Point</Label>
                          <Select
                            value={currentUser?.smartRoutingStartingPoint || "default"}
                            onValueChange={(value) => {
                              updateSettingsMutation.mutate({
                                smartRoutingStartingPoint: value === "default" ? null : value
                              });
                            }}
                          >
                            <SelectTrigger id="smart-routing-starting-point">
                              <SelectValue placeholder="Select starting point" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Use default starting point</SelectItem>
                              {startingPointsQuery.data?.map((point) => (
                                <SelectItem key={point.id} value={point.address}>
                                  {point.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            All auto-routes will start from this location
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="auto-optimize" className="text-sm font-medium">
                              Auto-Optimize Routes
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Automatically optimize stop order for efficiency
                            </p>
                          </div>
                          <Switch
                            id="auto-optimize"
                            checked={currentUser?.autoOptimizeRoutes === 1}
                            onCheckedChange={(checked) => {
                              updateSettingsMutation.mutate({
                                autoOptimizeRoutes: checked ? 1 : 0
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Starting Points */}
                <Card>
                  <CardHeader>
                    <CardTitle>Starting Points</CardTitle>
                    <CardDescription>Save frequently used starting locations for your routes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add new starting point */}
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="new-point-name">Location Name</Label>
                        <Input
                          id="new-point-name"
                          placeholder="e.g., Home Office"
                          value={newPointName}
                          onChange={(e) => setNewPointName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-point-address">Address</Label>
                        <Input
                          id="new-point-address"
                          placeholder="e.g., 123 Main St, City, State"
                          value={newPointAddress}
                          onChange={(e) => setNewPointAddress(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (!newPointName || !newPointAddress) {
                            toast.error("Please fill in both name and address");
                            return;
                          }
                          createStartingPointMutation.mutate({
                            name: newPointName,
                            address: newPointAddress
                          });
                        }}
                        disabled={createStartingPointMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Starting Point
                      </Button>
                    </div>

                    {/* List existing starting points */}
                    {startingPointsQuery.isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : startingPointsQuery.data && startingPointsQuery.data.length > 0 ? (
                      <div className="space-y-2">
                        {startingPointsQuery.data.map((point) => (
                          <div key={point.id} className="flex items-center gap-2 p-3 border rounded-lg">
                            {editingId === point.id ? (
                              <>
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Name"
                                  />
                                  <Input
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                    placeholder="Address"
                                  />
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    updateStartingPointMutation.mutate({
                                      id: point.id,
                                      name: editName,
                                      address: editAddress
                                    });
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <p className="font-medium">{point.name}</p>
                                  <p className="text-sm text-muted-foreground">{point.address}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(point.id);
                                    setEditName(point.name);
                                    setEditAddress(point.address);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Delete this starting point?")) {
                                      deleteStartingPointMutation.mutate({ id: point.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No starting points saved yet
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Stop Types */}
                <StopTypesSettings />

                {/* Default Stop Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Default Stop Type</CardTitle>
                    <CardDescription>Automatically assign this stop type when creating new routes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-stop-type">Default Stop Type</Label>
                      <Select
                        value={currentUser?.defaultStopType || "none"}
                        onValueChange={(value) => {
                          const stopType = value === "none" ? undefined : value;
                          const stopTypeData = stopType ? stopTypesQuery.data?.find(st => st.name === stopType) : undefined;
                          updateSettingsMutation.mutate({
                            defaultStopType: stopType,
                            defaultStopTypeColor: stopTypeData?.color
                          });
                        }}
                      >
                        <SelectTrigger id="default-stop-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (manual selection)</SelectItem>
                          {stopTypesQuery.data?.map((stopType) => (
                            <SelectItem key={stopType.id} value={stopType.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: stopType.color }}
                                />
                                {stopType.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        When creating a route, all contacts will automatically be assigned this stop type. You can change individual stop types in the route details screen.
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
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        This duration will be used by default when creating routes
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar Event Duration Mode */}
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
                          <SelectItem value="stop_only">Stop Time Only</SelectItem>
                          <SelectItem value="include_drive">Include Drive Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        "Stop Only" creates events for just the visit duration. "Include Drive Time" adds travel time before each stop.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-Archive Routes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Archive Completed Routes</CardTitle>
                    <CardDescription>Automatically archive routes after completion</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="auto-archive-days">Days After Completion</Label>
                      <Select
                        value={currentUser?.autoArchiveDays?.toString() || "never"}
                        onValueChange={(value) => {
                          updateSettingsMutation.mutate({
                            autoArchiveDays: value === "never" ? null : parseInt(value)
                          });
                        }}
                      >
                        <SelectTrigger id="auto-archive-days">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never (Manual Only)</SelectItem>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Completed routes will be automatically moved to the archive after the specified time
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Allow Multiple Visits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Multiple Visits Per Route</CardTitle>
                    <CardDescription>Allow adding the same contact multiple times to a single route</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="allow-multiple-visits">Allow Multiple Visits</Label>
                      <Select
                        value={currentUser?.allowMultipleVisits ? "yes" : "no"}
                        onValueChange={(value) => {
                          updateSettingsMutation.mutate({
                            allowMultipleVisits: value === "yes" ? 1 : 0
                          });
                        }}
                      >
                        <SelectTrigger id="allow-multiple-visits">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No - Prevent duplicate contacts</SelectItem>
                          <SelectItem value="yes">Yes - Allow same contact multiple times</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        When enabled, you can add the same contact to a route multiple times (useful for multiple service types, delivery + pickup, etc.)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Google Calendar Connection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Google Calendar Integration</CardTitle>
                    <CardDescription>
                      Connect your Google Calendar to add route stops as calendar events
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentUser?.googleCalendarAccessToken ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="h-5 w-5" />
                          <span className="font-medium">Calendar Connected</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your Google Calendar is connected. You can now add route stops to your calendar.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (confirm("Disconnect your Google Calendar?")) {
                              disconnectCalendarMutation.mutate();
                            }
                          }}
                          disabled={disconnectCalendarMutation.isPending}
                        >
                          Disconnect Calendar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Connect your Google Calendar to automatically create events for your route stops.
                        </p>
                        <Button
                          onClick={() => getCalendarConnectionUrlMutation.mutate()}
                          disabled={getCalendarConnectionUrlMutation.isPending}
                        >
                          {getCalendarConnectionUrlMutation.isPending ? "Connecting..." : "Connect Google Calendar"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Label Migration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Update Existing Routes with Labels</CardTitle>
                    <CardDescription>
                      Backfill contact labels for routes created before label support was added
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      If you have existing routes that don't show contact labels on waypoint cards, click this button to update them with labels from your contacts.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm("Update all existing routes with contact labels? This may take a moment.")) {
                          backfillLabelsMutation.mutate();
                        }
                      }}
                      disabled={backfillLabelsMutation.isPending}
                    >
                      {backfillLabelsMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Route Labels"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========== ROUTE HOLDERS TAB ========== */}
              {['premium', 'enterprise'].includes(user?.subscriptionTier || 'free') && (
                <TabsContent value="holders" className="space-y-4 mt-6">
                  <RouteHoldersSettings />
                </TabsContent>
              )}

              {/* ========== LABEL COLORS TAB ========== */}
              <TabsContent value="labels" className="space-y-4 mt-6">
                <LabelColorsSettings />
              </TabsContent>

              {/* ========== BILLING TAB ========== */}
              <TabsContent value="billing" className="space-y-4 mt-6">
                <ClientBillingSettings />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

          <EmailPreviewDialog
            open={showEmailPreview}
            onOpenChange={setShowEmailPreview}
            templates30Days={{
              subject: currentUser?.reminderEmail30DaysSubject,
              bodyContact: currentUser?.reminderEmail30DaysBodyContact,
              bodyTeam: currentUser?.reminderEmail30DaysBodyTeam,
            }}
            templates10Days={{
              subject: currentUser?.reminderEmail10DaysSubject,
              bodyContact: currentUser?.reminderEmail10DaysBodyContact,
              bodyTeam: currentUser?.reminderEmail10DaysBodyTeam,
            }}
            templates5Days={{
              subject: currentUser?.reminderEmail5DaysSubject,
              bodyContact: currentUser?.reminderEmail5DaysBodyContact,
              bodyTeam: currentUser?.reminderEmail5DaysBodyTeam,
            }}
            templatesPastDue={{
              subject: currentUser?.reminderEmailPastDueSubject,
              bodyContact: currentUser?.reminderEmailPastDueBodyContact,
              bodyTeam: currentUser?.reminderEmailPastDueBodyTeam,
            }}
          />
    </div>
  );
}
