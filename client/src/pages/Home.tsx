import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, Route as RouteIcon, Share2, RefreshCw, Trash2, Folder, Plus, Search, Filter, Settings as SettingsIcon, Edit, EyeOff, Eye, AlertTriangle, AlertCircle } from "lucide-react";
import { formatDistance } from "@shared/distance";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { ContactEditDialog } from "@/components/ContactEditDialog";
import { StopTypeSelector, getStopTypeConfig, type StopType } from "@/components/StopTypeSelector";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [contactStopTypes, setContactStopTypes] = useState<Map<number, { type: string; color: string }>>(new Map());
  const [routeName, setRouteName] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [optimizeRoute, setOptimizeRoute] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showMissingAddresses, setShowMissingAddresses] = useState(false);

  // Check for OAuth callback status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncStatus = params.get("sync");
    
    if (syncStatus === "success") {
      toast.success("Contacts synced successfully!");
      window.history.replaceState({}, "", "/");
      contactsQuery.refetch();
    } else if (syncStatus === "error") {
      toast.error("Failed to sync contacts. Please try again.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Fetch user data
  const userQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch contacts
  const contactsQuery = trpc.contacts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch user routes
  const routesQuery = trpc.routes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch folders
  const foldersQuery = trpc.folders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get Google Auth URL
  const googleAuthQuery = trpc.contacts.getGoogleAuthUrl.useQuery(undefined, {
    enabled: false,
  });

  // Create route mutation
  const createRouteMutation = trpc.routes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Route created successfully!");
      setSelectedContacts(new Set());
      setContactStopTypes(new Map());
      setRouteName("");
      setRouteNotes("");
      setOptimizeRoute(true);
      setSelectedFolderId("");
      setIsCreatingRoute(false);
      routesQuery.refetch();
      navigate(`/route/${data.routeId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create route");
      setIsCreatingRoute(false);
    },
  });

  // Delete route mutation
  const deleteRouteMutation = trpc.routes.delete.useMutation({
    onSuccess: () => {
      toast.success("Route deleted successfully!");
      setDeleteRouteId(null);
      routesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete route");
      setDeleteRouteId(null);
    },
  });

  // Update contact mutation
  const updateContactMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      contactsQuery.refetch();
    },
  });

  // Toggle contact active status mutation
  const toggleContactActiveMutation = trpc.contacts.toggleActive.useMutation({
    onSuccess: () => {
      contactsQuery.refetch();
    },
  });

  // Create folder mutation
  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      toast.success("Folder created!");
      setNewFolderName("");
      setShowNewFolderInput(false);
      foldersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create folder");
    },
  });

  const handleSyncContacts = async () => {
    const result = await googleAuthQuery.refetch();
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  };

  const handleContactToggle = (contactId: number) => {
    const newSelected = new Set(selectedContacts);
    const newStopTypes = new Map(contactStopTypes);
    
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
      newStopTypes.delete(contactId);
    } else {
      newSelected.add(contactId);
      // Initialize with default stop type
      const defaultConfig = getStopTypeConfig("visit");
      newStopTypes.set(contactId, { type: defaultConfig.type, color: defaultConfig.color });
    }
    
    setSelectedContacts(newSelected);
    setContactStopTypes(newStopTypes);
  };

  const handleCreateRoute = () => {
    if (!routeName.trim()) {
      toast.error("Please enter a route name");
      return;
    }

    if (selectedContacts.size < 2) {
      toast.error("Please select at least 2 contacts");
      return;
    }

    const contacts = contactsQuery.data || [];
    const selectedContactsList = Array.from(selectedContacts)
      .map(id => contacts.find(c => c.id === id))
      .filter(c => c);

    // Check for contacts without addresses
    const contactsWithoutAddress = selectedContactsList.filter(c => !c!.address || c!.address.trim() === "");
    if (contactsWithoutAddress.length > 0) {
      const names = contactsWithoutAddress.map(c => c!.name || "Unknown").join(", ");
      toast.error(`The following contact${contactsWithoutAddress.length > 1 ? 's have' : ' has'} no address: ${names}`);
      return;
    }

    let waypoints = selectedContactsList.map(c => {
      const stopTypeInfo = contactStopTypes.get(c!.id) || { type: "visit", color: "#3b82f6" };
      return {
        contactName: c!.name || undefined,
        address: c!.address!,
        phoneNumbers: c!.phoneNumbers || undefined,
        stopType: stopTypeInfo.type as "pickup" | "delivery" | "meeting" | "visit" | "other",
        stopColor: stopTypeInfo.color,
      };
    });

    // Add starting point if provided
    const finalStartingPoint = startingPoint.trim() || userQuery.data?.defaultStartingPoint;
    if (finalStartingPoint) {
      waypoints = [
        {
          contactName: "Starting Point",
          address: finalStartingPoint,
          phoneNumbers: undefined,
          stopType: "other" as const,
          stopColor: "#10b981",
        },
        ...waypoints,
      ];
    }

    setIsCreatingRoute(true);
    createRouteMutation.mutate({
      name: routeName,
      notes: routeNotes || undefined,
      waypoints,
      isPublic: false,
      optimizeRoute,
      folderId: (selectedFolderId && selectedFolderId !== "none") ? parseInt(selectedFolderId) : undefined,
    });
  };

  const handleDeleteRoute = (routeId: number) => {
    setDeleteRouteId(routeId);
  };

  const confirmDeleteRoute = () => {
    if (deleteRouteId) {
      deleteRouteMutation.mutate({ routeId: deleteRouteId });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    createFolderMutation.mutate({ name: newFolderName });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="p-6">
          <div className="container flex items-center gap-3">
            <img src={APP_LOGO} alt="RoutieRoo" className="h-32" />
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome!</CardTitle>
              <CardDescription className="text-base mt-2">
                Create optimized driving routes from your Gmail contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Select Contacts</p>
                    <p className="text-sm text-muted-foreground">Choose contacts from your Gmail</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RouteIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Generate Routes</p>
                    <p className="text-sm text-muted-foreground">Get optimized driving directions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Share2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Share Easily</p>
                    <p className="text-sm text-muted-foreground">Send routes via link or export</p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Sign in to Get Started
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const contacts = contactsQuery.data || [];
  const routes = routesQuery.data || [];
  const folders = foldersQuery.data || [];
  const hasContacts = contacts.length > 0;
  
  // Filter contacts based on search query and active status
  const filteredContacts = contacts.filter(contact => {
    // Filter by active status - default shows only active, checkbox shows only inactive
    const isActive = contact.isActive === 1;
    if (showInactive) {
      // When checked, show ONLY inactive contacts
      if (isActive) return false;
    } else {
      // When unchecked (default), show ONLY active contacts
      if (!isActive) return false;
    }
    
    // Filter by missing addresses
    if (showMissingAddresses) {
      const hasAddress = contact.address && contact.address.trim() !== "";
      if (hasAddress) return false; // Only show contacts WITHOUT addresses
    }
    
    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = contact.name?.toLowerCase().includes(query);
    const addressMatch = contact.address?.toLowerCase().includes(query);
    let phoneMatch = false;
    if (contact.phoneNumbers) {
      try {
        const phones = JSON.parse(contact.phoneNumbers);
        phoneMatch = phones.some((p: any) => p.value.toLowerCase().includes(query));
      } catch (e) {}
    }
    return nameMatch || addressMatch || phoneMatch;
  });
  
  // Filter routes by folder
  const filteredRoutes = selectedFolderFilter === "all" 
    ? routes 
    : selectedFolderFilter === "none"
    ? routes.filter(r => r.folderId === null)
    : routes.filter(r => r.folderId === parseInt(selectedFolderFilter));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="RoutieRoo" className="h-24" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <Link href="/missed-stops">
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Missed Stops
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contacts Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Contacts</CardTitle>
                    <CardDescription>
                      {hasContacts 
                        ? `${contacts.length} contacts with addresses`
                        : "Sync your Gmail contacts to get started"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncContacts}
                    disabled={googleAuthQuery.isFetching}
                  >
                    {googleAuthQuery.isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">{hasContacts ? "Refresh" : "Sync Contacts"}</span>
                  </Button>
                </div>
              </CardHeader>
                <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search contacts by name, phone, or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-inactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="show-inactive" className="text-sm text-muted-foreground cursor-pointer">
                        Show inactive contacts
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-missing-addresses"
                        checked={showMissingAddresses}
                        onChange={(e) => setShowMissingAddresses(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="show-missing-addresses" className="text-sm text-muted-foreground cursor-pointer">
                        Show contacts without addresses
                      </label>
                    </div>
                  </div>
                </div>
                {filteredContacts.length === 0 && !searchQuery ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !hasContacts ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Click "Sync Contacts" to import your Gmail contacts</p>
                  </div>
                ) : filteredContacts.length === 0 && searchQuery ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No contacts found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleContactToggle(contact.id)}
                      >
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                        />
                        {contact.photoUrl && (
                          <img
                            src={contact.photoUrl}
                            alt={contact.name || "Contact"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        {!contact.photoUrl && (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {(contact.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contact.name}</p>
                            {(!contact.address || contact.address.trim() === "") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>No address</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {contact.labels && (() => {
                            try {
                              const labels = JSON.parse(contact.labels);
                              if (labels.length > 0) {
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {labels.slice(0, 3).map((label: string, idx: number) => {
                                      const labelName = label.split('/').pop() || label;
                                      return (
                                        <span key={idx} className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                          {labelName}
                                        </span>
                                      );
                                    })}
                                    {labels.length > 3 && (
                                      <span className="inline-block px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                                        +{labels.length - 3}
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {contact.address || "No address"}
                          </p>
                          {contact.phoneNumbers && (() => {
                            try {
                              const phones = JSON.parse(contact.phoneNumbers);
                              if (phones.length > 0) {
                                return (
                                  <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
                                    {phones.map((phone: any, idx: number) => (
                                      <PhoneCallMenu 
                                        key={idx}
                                        phoneNumber={phone.value}
                                        label={`${phone.value} ${phone.label ? `(${phone.label})` : ''}`}
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 text-sm text-muted-foreground hover:text-foreground"
                                        preferredService={user?.preferredCallingService || "phone"}
                                      />
                                    ))}
                                  </div>
                                );
                              }
                            } catch (e) {
                              return null;
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {(!contact.address || contact.address.trim() === "") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setEditingContact(contact)}
                            >
                              Add Address
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingContact(contact)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              toggleContactActiveMutation.mutate({
                                contactId: contact.id,
                                isActive: contact.isActive !== 1,
                              });
                            }}
                          >
                            {contact.isActive === 1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create Route Section */}
            {hasContacts && (
              <Card>
              <CardHeader>
                <CardTitle>Your Contacts</CardTitle>
                <CardDescription>
                  {filteredContacts.length} contacts {searchQuery && `(filtered from ${contacts.length})`}
                </CardDescription>
              </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="routeName">Route Name</Label>
                    <Input
                      id="routeName"
                      placeholder="e.g., Client Visits - Monday"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="routeNotes">Notes (Optional)</Label>
                    <Textarea
                      id="routeNotes"
                      placeholder="Add any notes or details about this route..."
                      value={routeNotes}
                      onChange={(e) => setRouteNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startingPoint">Starting Point (Optional)</Label>
                    <Input
                      id="startingPoint"
                      placeholder={userQuery.data?.defaultStartingPoint || "e.g., 123 Main St, City, State"}
                      value={startingPoint}
                      onChange={(e) => setStartingPoint(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use your default starting point from Settings
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="folder">Folder (Optional)</Label>
                    <div className="flex gap-2">
                      <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="No folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No folder</SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4" />
                                {folder.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showNewFolderInput && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                      />
                      <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
                        {createFolderMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="optimize">Optimize Route Order</Label>
                    <Switch
                      id="optimize"
                      checked={optimizeRoute}
                      onCheckedChange={setOptimizeRoute}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {optimizeRoute 
                      ? "Waypoints will be reordered for the shortest route"
                      : "Waypoints will be visited in the order you selected them"}
                  </p>
                  
                  <div className="text-sm text-muted-foreground">
                    {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
                  </div>

                  {selectedContacts.size > 0 && (
                    <div className="space-y-2">
                      <Label>Stop Types</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Array.from(selectedContacts).map(contactId => {
                          const contact = contacts.find(c => c.id === contactId);
                          if (!contact) return null;
                          const stopTypeInfo = contactStopTypes.get(contactId) || { type: "visit", color: "#3b82f6" };
                          return (
                            <div key={contactId} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <span className="text-sm flex-1 truncate">{contact.name}</span>
                              <div className="w-32">
                                <StopTypeSelector
                                  value={stopTypeInfo.type as StopType}
                                  onChange={(newType) => {
                                    const config = getStopTypeConfig(newType);
                                    const newStopTypes = new Map(contactStopTypes);
                                    newStopTypes.set(contactId, { type: config.type, color: config.color });
                                    setContactStopTypes(newStopTypes);
                                  }}
                                  size="sm"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleCreateRoute}
                    disabled={selectedContacts.size < 2 || !routeName.trim() || isCreatingRoute}
                  >
                    {isCreatingRoute ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating Route...
                      </>
                    ) : (
                      <>
                        <RouteIcon className="h-4 w-4 mr-2" />
                        Create Route
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Routes Section */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Routes</CardTitle>
                    <CardDescription>
                      {routes.length > 0 
                        ? `${routes.length} saved route${routes.length !== 1 ? 's' : ''}`
                        : "No routes created yet"}
                    </CardDescription>
                  </div>
                  {folders.length > 0 && (
                    <Select value={selectedFolderFilter} onValueChange={setSelectedFolderFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Folders" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Folders</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id.toString()}>
                            <Folder className="h-4 w-4 inline mr-2" />
                            {folder.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="none">No Folder</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {routesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : routes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Create your first route to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredRoutes.map((route) => (
                      <div key={route.id} className="p-4 rounded-lg border hover:bg-accent transition-colors group">
                        <div className="flex items-start justify-between">
                          <Link href={`/route/${route.id}`} className="flex-1 min-w-0">
                            <div className="cursor-pointer">
                              <h3 className="font-medium truncate">{route.name}</h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>{formatDistance(route.totalDistance! / 1000, user?.distanceUnit || "km")}</span>
                                <span>{Math.round(route.totalDuration! / 60)} min</span>
                                {!route.optimized && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded">Manual</span>
                                )}
                              </div>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteRoute(route.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <RouteIcon className="h-5 w-5 text-primary flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteRouteId !== null} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route and all its waypoints.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRoute} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Edit Dialog */}
      {editingContact && (
        <ContactEditDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onSave={async (updates) => {
            updateContactMutation.mutate({
              contactId: editingContact.id,
              ...updates,
            });
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}
