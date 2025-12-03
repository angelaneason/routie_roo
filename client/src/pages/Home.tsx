import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPickerButton } from "@/components/EmojiPickerButton";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, Route as RouteIcon, Share2, RefreshCw, Trash2, Folder, Plus, Search, Filter, Settings as SettingsIcon, Edit, EyeOff, Eye, AlertTriangle, AlertCircle, LogOut, Upload, Download, Calendar as CalendarIcon, Archive, FileText, Paperclip, Info, History, Users, Copy } from "lucide-react";
import { formatDistance } from "@shared/distance";
import { PhoneCallMenu } from "@/components/PhoneCallMenu";
import { ContactEditDialog } from "@/components/ContactEditDialog";
import { ContactImportDialog } from "@/components/ContactImportDialog";
import { DocumentUploadDialog } from "@/components/DocumentUploadDialog";
import { BulkDocumentUploadDialog } from "@/components/BulkDocumentUploadDialog";
import { ContactDetailDialog } from "@/components/ContactDetailDialog";
import { AddressSelector } from "@/components/AddressSelector";
import { SchedulerNotes } from "@/components/SchedulerNotes";
// StopTypeSelector removed - stop types now set via default in Settings and editable in route details
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { getPrimaryAddress, hasMultipleAddresses, getAddressTypeIcon, getAddressTypeLabel } from "@/lib/addressHelpers";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [contactStopTypes, setContactStopTypes] = useState<Map<number, { type: string; color: string }>>(new Map());
  const [selectedAddresses, setSelectedAddresses] = useState<Map<number, { addressType: string; formattedValue: string }>>(new Map());
  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);
  const [addressSelectorContact, setAddressSelectorContact] = useState<{ id: number; name: string; addresses: string | null } | null>(null);
  const [routeName, setRouteName] = useState("");
  const [routeNotes, setRouteNotes] = useState("");
  const [startingPoint, setStartingPoint] = useState("");
  const [customStartingPoint, setCustomStartingPoint] = useState("");
  const [optimizeRoute, setOptimizeRoute] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [hideCompletedRoutes, setHideCompletedRoutes] = useState(false);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showMissingAddresses, setShowMissingAddresses] = useState(false);
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>("all");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [showCalendarSelectionDialog, setShowCalendarSelectionDialog] = useState(false);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadContactId, setUploadContactId] = useState<number | null>(null);
  const [uploadContactName, setUploadContactName] = useState<string>("");
  const [showBulkDocumentUpload, setShowBulkDocumentUpload] = useState(false);
  const [viewingContact, setViewingContact] = useState<any | null>(null);

  // Check for OAuth callback status and route creation from waypoints
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const syncStatus = params.get("sync");
    const calendarAuth = params.get("calendar_auth");
    const data = params.get("data");
    const createFromWaypoints = params.get("createRouteFromWaypoints");
    
    if (syncStatus === "success") {
      toast.success("Contacts synced! Routie's ready to help 🦘");
      window.history.replaceState({}, "", "/");
      contactsQuery.refetch();
    } else if (syncStatus === "error") {
      toast.error("Oops! Couldn't sync contacts. Let's try again");
      window.history.replaceState({}, "", "/");
    } else if (calendarAuth === "success" && data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setCalendarData(parsedData);
        setShowCalendarSelectionDialog(true);
        window.history.replaceState({}, "", "/");
      } catch (error) {
        toast.error("Failed to process calendar data");
        window.history.replaceState({}, "", "/");
      }
    } else if (createFromWaypoints) {
      // Handle route creation from rescheduled waypoints
      const waypointIds = createFromWaypoints.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (waypointIds.length > 0) {
        toast.info(`Creating route from ${waypointIds.length} rescheduled stop(s)...`);
        // Scroll to route creation form
        setTimeout(() => {
          const routeForm = document.getElementById('route-creation-form');
          if (routeForm) {
            routeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
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

  // Fetch saved starting points
  const startingPointsQuery = trpc.settings.listStartingPoints.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch user's stop types
  const stopTypesQuery = trpc.stopTypes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch label colors
  const labelColorsQuery = trpc.labelColors.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get Google Auth URL
  const googleAuthQuery = trpc.contacts.getGoogleAuthUrl.useQuery(undefined, {
    enabled: false,
  });

  // Create route mutation
  const createRouteMutation = trpc.routes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Route planned! Let's hop to it 🦘");
      
      // Show warning if any coordinates are missing
      if (data.missingCoordinatesWarning) {
        toast.warning(data.missingCoordinatesWarning, {
          duration: 6000,
        });
      }
      
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
      toast.error(error.message || "Couldn't create route. Try again?");
      setIsCreatingRoute(false);
    },
  });

  // Archive route mutation
  const archiveRouteMutation = trpc.routes.archiveRoute.useMutation({
    onSuccess: () => {
      toast.success("Route archived");
      routesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to archive: ${error.message}`);
    },
  });

  // Delete route mutation
  const deleteRouteMutation = trpc.routes.delete.useMutation({
    onSuccess: () => {
      toast.success("Route removed!");
      setDeleteRouteId(null);
      routesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't delete route");
      setDeleteRouteId(null);
    },
  });

  // Copy route mutation
  const copyRouteMutation = trpc.routes.copyRoute.useMutation({
    onSuccess: (data) => {
      toast.success("Route copied successfully!");
      routesQuery.refetch();
      navigate(`/route/${data.routeId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to copy route");
    },
  });

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
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

  // Create waypoint events mutation
  const createWaypointEventsMutation = trpc.routes.createWaypointEvents.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.eventsCreated} calendar events created!`);
      setShowCalendarSelectionDialog(false);
      setCalendarData(null);
      setSelectedCalendar("");
      routesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create calendar events");
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
      toast.error(error.message || "Couldn't create folder");
    },
  });

  const handleSyncContacts = async () => {
    const result = await googleAuthQuery.refetch();
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  };

  const handleExportContacts = async () => {
    try {
      // Fetch contacts for export
      const contacts = contactsQuery.data || [];
      
      if (contacts.length === 0) {
        toast.info("No contacts to export");
        return;
      }

      // Convert to CSV format
      const headers = ['Name', 'Email', 'Address', 'Phone Numbers', 'Labels', 'Important Dates', 'Comments', 'Active'];
      const csvRows = [
        headers.join(','),
        ...contacts.map((contact: any) => [
          `"${contact.name || ''}"`,
          `"${contact.email || ''}"`,
          `"${contact.address || ''}"`,
          `"${contact.phoneNumbers || ''}"`,
          `"${contact.labels || ''}"`,
          `"${contact.importantDates || ''}"`,
          `"${contact.comments || ''}"`,
          contact.isActive ? 'Yes' : 'No',
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `routieroo-contacts-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export contacts');
    }
  };

  const handleContactToggle = (contactId: number) => {
    const allowMultiple = userQuery.data?.allowMultipleVisits === 1;
    const newSelected = new Set(selectedContacts);
    const newStopTypes = new Map(contactStopTypes);
    const newSelectedAddresses = new Map(selectedAddresses);
    
    if (newSelected.has(contactId)) {
      // If multiple visits not allowed, deselect the contact
      if (!allowMultiple) {
        newSelected.delete(contactId);
        newStopTypes.delete(contactId);
        newSelectedAddresses.delete(contactId);
      } else {
        // If multiple visits allowed, show warning that they can't unselect this way
        toast.info("To remove a specific visit, use the route creation panel below");
        return;
      }
    } else {
      // Find the contact to check if it has multiple addresses
      const contact = contactsQuery.data?.find(c => c.id === contactId);
      if (contact && hasMultipleAddresses(contact.addresses)) {
        // Show address selector dialog
        setAddressSelectorContact({
          id: contact.id,
          name: contact.name || 'Contact',
          addresses: contact.addresses
        });
        setAddressSelectorOpen(true);
        return; // Don't select yet, wait for address selection
      }
      
      // Single address or no addresses - select immediately
      newSelected.add(contactId);
      // Initialize with user's default stop type from settings, or "visit" as fallback
      const userDefaultStopType = userQuery.data?.defaultStopType || "visit";
      const userDefaultStopTypeColor = userQuery.data?.defaultStopTypeColor || "#3b82f6";
      newStopTypes.set(contactId, { type: userDefaultStopType, color: userDefaultStopTypeColor });
      
      // Store primary address for single-address contacts
      if (contact) {
        const primaryAddr = getPrimaryAddress(contact.addresses);
        if (primaryAddr) {
          newSelectedAddresses.set(contactId, {
            addressType: primaryAddr.type,
            formattedValue: primaryAddr.formattedValue
          });
        }
      }
    }
    
    setSelectedContacts(newSelected);
    setContactStopTypes(newStopTypes);
    setSelectedAddresses(newSelectedAddresses);
  };

  const handleAddressSelected = (address: any) => {
    if (!addressSelectorContact) return;
    
    const contactId = addressSelectorContact.id;
    const newSelected = new Set(selectedContacts);
    const newStopTypes = new Map(contactStopTypes);
    const newSelectedAddresses = new Map(selectedAddresses);
    
    // Add contact to selection
    newSelected.add(contactId);
    
    // Initialize with user's default stop type
    const userDefaultStopType = userQuery.data?.defaultStopType || "visit";
    const userDefaultStopTypeColor = userQuery.data?.defaultStopTypeColor || "#3b82f6";
    newStopTypes.set(contactId, { type: userDefaultStopType, color: userDefaultStopTypeColor });
    
    // Store selected address
    newSelectedAddresses.set(contactId, {
      addressType: address.type,
      formattedValue: address.formattedValue
    });
    
    setSelectedContacts(newSelected);
    setContactStopTypes(newStopTypes);
    setSelectedAddresses(newSelectedAddresses);
    setAddressSelectorOpen(false);
    setAddressSelectorContact(null);
    
    toast.success(`Added ${addressSelectorContact.name} (${address.type} address)`);
  };

  const handleAddressSelectorCancel = () => {
    setAddressSelectorOpen(false);
    setAddressSelectorContact(null);
  };

  const handleCreateRoute = () => {
    if (!routeName.trim()) {
      toast.error("Don't forget to name your route!");
      return;
    }

    if (selectedContacts.size < 2) {
      toast.error("Pick at least 2 stops for your route");
      return;
    }

    const contacts = contactsQuery.data || [];
    const selectedContactsList = Array.from(selectedContacts)
      .map(id => contacts.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined && c !== null);

    // Check for contacts without addresses
    const contactsWithoutAddress = selectedContactsList.filter(c => {
      // Check both new addresses array and legacy address field
      const primaryAddr = getPrimaryAddress(c.addresses);
      const hasAddress = primaryAddr?.formattedValue || c.address;
      return !hasAddress || hasAddress.trim() === "";
    });
    if (contactsWithoutAddress.length > 0) {
      const names = contactsWithoutAddress.map(c => c.name || "Unknown").join(", ");
      toast.error(`The following contact${contactsWithoutAddress.length > 1 ? 's have' : ' has'} no address: ${names}`);
      return;
    }

    let waypoints: Array<{
      contactId?: number;
      contactName?: string;
      address: string;
      addressType?: string;
      phoneNumbers?: string;
      photoUrl?: string;
      contactLabels?: string;
      importantDates?: string;
      comments?: string;
      stopType: string;
      stopColor: string;
    }> = selectedContactsList.map(c => {
      // Get stop type from contactStopTypes map, or use user's custom "visit" type as default
      let stopTypeInfo = contactStopTypes.get(c.id);
      if (!stopTypeInfo) {
        // Find user's "visit" stop type or use blue as final fallback
        const visitStopType = stopTypesQuery.data?.find(st => st.name.toLowerCase() === "visit");
        stopTypeInfo = {
          type: "visit",
          color: visitStopType?.color || "#3b82f6"
        };
      }
      // Get address from selectedAddresses map (user's choice for multi-address contacts)
      // or fall back to primary address for single-address contacts
      const selectedAddr = selectedAddresses.get(c.id);
      const primaryAddr = getPrimaryAddress(c.addresses);
      const addressToUse = selectedAddr?.formattedValue || primaryAddr?.formattedValue || c.address || "";
      const addressType = selectedAddr?.addressType || primaryAddr?.type || undefined;
      
      return {
        contactId: c.id, // Store contact ID for Google sync
        contactName: c.name || undefined,
        address: addressToUse,
        addressType: addressType, // Track which address type was used
        phoneNumbers: c.phoneNumbers || undefined,
        photoUrl: c.photoUrl || undefined,
        contactLabels: c.labels || undefined,
        importantDates: c.importantDates || undefined,
        comments: c.comments || undefined,
        stopType: stopTypeInfo.type,
        stopColor: stopTypeInfo.color,
      };
    });

    // Add starting point if provided
    // Priority: custom > saved > default from settings > none
    let finalStartingPoint = "";
    if (startingPoint === "custom") {
      finalStartingPoint = customStartingPoint.trim();
    } else if (startingPoint && startingPoint !== "none") {
      finalStartingPoint = startingPoint.trim();
    } else if (startingPoint === "none" || !startingPoint) {
      // Fall back to user's default starting point from settings
      finalStartingPoint = userQuery.data?.defaultStartingPoint?.trim() || "";
    }
    
    if (finalStartingPoint) {
      waypoints = [
        {
          contactId: undefined, // Starting point is not a contact
          contactName: "Starting Point",
          address: finalStartingPoint,
          phoneNumbers: undefined,
          photoUrl: undefined,
          contactLabels: undefined,
          importantDates: undefined,
          comments: undefined,
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
      startingPointAddress: finalStartingPoint || undefined,
      distanceUnit: userQuery.data?.distanceUnit || "km",
      scheduledDate: scheduledDate || undefined,
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

  const handleArchiveRoute = (routeId: number) => {
    archiveRouteMutation.mutate({ routeId });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Don't forget to name your folder!");
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
  
  // Get all unique labels from contacts (excluding default labels)
  const allLabels = Array.from(new Set(
    contacts.flatMap(contact => {
      if (!contact.labels) return [];
      try {
        const labels = JSON.parse(contact.labels);
        return labels
          .map((label: string) => {
            // Extract name from contactGroups/xxx format
            if (label.startsWith('contactGroups/')) {
              return label.split('/').pop() || '';
            }
            return label;
          })
          .filter((label: string) => {
            const lower = label.toLowerCase();
            // Filter out system labels and hex IDs (Google's internal group IDs)
            const isHexId = /^[0-9a-f]{12,}$/i.test(label);
            return lower !== 'mycontacts' && lower !== 'starred' && label.trim() !== '' && !isHexId;
          });
      } catch {
        return [];
      }
    })
  )).sort();

  // Filter contacts based on search query, active status, and labels
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
    
    // Filter by label
    if (selectedLabelFilter && selectedLabelFilter !== "all") {
      if (!contact.labels) return false;
      try {
        const labels = JSON.parse(contact.labels);
        const extractedLabels = labels.map((label: string) => {
          if (label.startsWith('contactGroups/')) {
            const parts = label.split('/');
            return parts[parts.length - 1];
          }
          return label;
        });
        if (!extractedLabels.includes(selectedLabelFilter)) return false;
      } catch {
        return false;
      }
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
  let filteredRoutes = selectedFolderFilter === "all" 
    ? routes 
    : selectedFolderFilter === "none"
    ? routes.filter(r => r.folderId === null)
    : routes.filter(r => r.folderId === parseInt(selectedFolderFilter));
  
  // Filter out archived routes from main library (they only appear in Archive section)
  filteredRoutes = filteredRoutes.filter(route => !route.archivedAt);
  
  // Filter out completed routes if checkbox is checked
  if (hideCompletedRoutes) {
    filteredRoutes = filteredRoutes.filter(route => {
      // A route is completed if it has a completedAt timestamp
      return !route.completedAt;
    });
  }

  return (
    <>
      <ContactImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          contactsQuery.refetch();
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4 px-2 md:px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="RoutieRoo" className="h-16 md:h-24" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <Link href="/calendar">
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Calendar</span>
              </Button>
            </Link>
            <Link href="/missed-stops">
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Missed Stops</span>
              </Button>
            </Link>
            <Link href="/reschedule-history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Reschedule History</span>
              </Button>
            </Link>
            <Link href="/archived-routes">
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Archive</span>
              </Button>
            </Link>
            <Link href="/changed-addresses">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Changed Addresses</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin/users">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Admin Users</span>
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4 md:py-8 px-2 md:px-4">
        {/* Scheduler Sticky Notes - Fixed position, draggable */}
        <SchedulerNotes />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Contacts Section */}
          <div className="space-y-6">
            {/* Create Route Section */}
            {hasContacts && (
              <Card id="route-creation-form">
              <CardHeader>
                <CardTitle className="font-bold">Plan Your Next Hop</CardTitle>
                <CardDescription>
                  Set up the route Roo will guide you through.
                </CardDescription>
              </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="routeName" className="text-sm !font-bold">Route Name</Label>
                    <Input
                      id="routeName"
                      placeholder="e.g., Client Visits - Monday"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="routeNotes" className="text-sm !font-bold">Notes (Optional)</Label>
                    <div className="relative">
                      <Textarea
                        id="routeNotes"
                        placeholder="Add any notes or details about this route..."
                        value={routeNotes}
                        onChange={(e) => setRouteNotes(e.target.value)}
                        rows={5}
                        className="pr-10"
                      />
                      <div className="absolute bottom-2 right-2">
                        <EmojiPickerButton
                          onEmojiSelect={(emoji) => setRouteNotes(routeNotes + emoji)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate" className="text-sm !font-bold">Scheduled Date (Optional)</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Schedule this route for a specific date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startingPoint" className="text-sm !font-bold">Starting Point (Optional)</Label>
                    <Select value={startingPoint} onValueChange={(val) => {
                      setStartingPoint(val);
                      if (val !== "custom") setCustomStartingPoint("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or enter starting point" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="custom">Enter custom address...</SelectItem>
                        {startingPointsQuery.data?.map((point) => (
                          <SelectItem key={point.id} value={point.address}>
                            {point.name} - {point.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {startingPoint === "custom" && (
                      <Input
                        placeholder="Enter custom starting address"
                        value={customStartingPoint}
                        onChange={(e) => setCustomStartingPoint(e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Choose a saved location or enter a custom address
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="folder" className="text-sm !font-bold">Folder (Optional)</Label>
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
                    <Label htmlFor="optimize" className="text-sm !font-bold">Optimize Route Order</Label>
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
                        Plan My Route
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="font-bold">Your Kangaroo Crew</CardTitle>
                    </div>
                    <CardDescription className="italic">
                      Everyone you connect with along the journey.
                    </CardDescription>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncContacts}
                        disabled={googleAuthQuery.isFetching}
                        className="whitespace-nowrap"
                      >
                        {googleAuthQuery.isFetching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">{hasContacts ? "Refresh" : "Sync Your Contacts"}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImportDialog(true)}
                        className="whitespace-nowrap"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="ml-2">Import CSV</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkDocumentUpload(true)}
                        className="whitespace-nowrap"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="ml-2">Bulk Upload Doc</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportContacts}
                        className="whitespace-nowrap"
                      >
                        <Download className="h-4 w-4" />
                        <span className="ml-2">Export Contacts</span>
                      </Button>
                    </div>
                  </div>
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
                    {allLabels.length > 0 && (
                      <div className="space-y-1">
                        <Label htmlFor="label-filter" className="text-sm">Filter by Label</Label>
                        <Select value={selectedLabelFilter} onValueChange={setSelectedLabelFilter}>
                          <SelectTrigger id="label-filter" className="w-full">
                            <SelectValue placeholder="All Labels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Labels</SelectItem>
                            {allLabels.map((label) => (
                              <SelectItem key={label} value={label}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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
                    <p>Let's hop to it! Sync your Gmail contacts to get started 🦘</p>
                  </div>
                ) : filteredContacts.length === 0 && searchQuery ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Routie couldn't find any contacts matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try a different search term</p>
                  </div>
                ) : filteredContacts.length === 0 && showMissingAddresses ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Great news! All your contacts have addresses 🎉</p>
                    <p className="text-sm mt-2">Routie's ready to plan routes anytime</p>
                  </div>
                ) : filteredContacts.length === 0 && !showInactive ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active contacts yet</p>
                    <p className="text-sm mt-2">Sync your contacts or check "Show inactive contacts"</p>
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
                        <div className="flex-1">
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
              // Extract label names from contactGroups/ format and filter out system labels
              const userFriendlyLabels = labels
                .map((label: string) => {
                  // Extract name from contactGroups/xxx format
                  if (label.startsWith('contactGroups/')) {
                    return label.split('/').pop() || '';
                  }
                  return label;
                })
                .filter((label: string) => {
                  const lower = label.toLowerCase();
                  // Filter out system labels and hex IDs (Google's internal group IDs)
                  const isHexId = /^[0-9a-f]{12,}$/i.test(label);
                  return lower !== 'mycontacts' && lower !== 'starred' && label.trim() !== '' && !isHexId;
                                });
                              if (userFriendlyLabels.length > 0) {
                                return (
                                   <div className="flex flex-wrap gap-1 mt-1">
                                    {userFriendlyLabels.slice(0, 3).map((label: string, idx: number) => {
                                      // Find custom color for this label
                                      const labelColor = labelColorsQuery.data?.find(lc => lc.labelName === label);
                                      const bgColor = labelColor ? labelColor.color : '#e0e7ff'; // default light blue
                                      const textColor = labelColor ? '#ffffff' : '#4f46e5'; // white for custom colors, dark blue for default
                                      
                                      return (
                                        <span 
                                          key={idx} 
                                          style={{ 
                                            whiteSpace: 'nowrap', 
                                            wordBreak: 'keep-all', 
                                            hyphens: 'none', 
                                            overflowWrap: 'normal',
                                            backgroundColor: bgColor,
                                            color: textColor
                                          }} 
                                          className="inline-block px-2 py-0.5 text-sm font-bold rounded"
                                        >
                                          {label}
                                        </span>
                                      );
                                    })}
                                    {userFriendlyLabels.length > 3 && (
                                      <span className="inline-block px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded whitespace-nowrap">
                                        +{userFriendlyLabels.length - 3}
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                          <div className="mt-1">
                            {(() => {
                              // Try to get address from new addresses array first, fall back to legacy address field
                              const primaryAddr = getPrimaryAddress(contact.addresses);
                              const displayAddress = primaryAddr?.formattedValue || contact.address || "No address";
                              const hasMultiple = hasMultipleAddresses(contact.addresses);
                              
                              return (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-muted-foreground truncate flex-1">
                                    {displayAddress}
                                  </p>
                                  {hasMultiple && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded whitespace-nowrap">
                                      {getAddressTypeIcon(primaryAddr?.type || 'other')} +{hasMultipleAddresses(contact.addresses) ? 'more' : ''}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
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
                          
                          {/* Important Dates */}
                          {contact.importantDates && (() => {
                            try {
                              const dates = JSON.parse(contact.importantDates);
                              if (dates.length > 0) {
                                return (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Important Dates:</p>
                                    {dates.map((date: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        <span className="font-medium">{date.type}:</span> {new Date(date.date).toLocaleDateString()}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                          
                          {/* Comments */}
                          {contact.comments && (() => {
                            try {
                              const comments = JSON.parse(contact.comments);
                              if (comments.length > 0) {
                                return (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Comments:</p>
                                    {comments.map((comment: any, idx: number) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {comment.option === "Other" ? comment.customText : comment.option}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            } catch (e) {}
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
                            onClick={() => setViewingContact(contact)}
                            title="View Details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setUploadContactId(contact.id);
                              setUploadContactName(contact.name || "Contact");
                              setShowDocumentUpload(true);
                            }}
                            title="Upload Document"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
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
          </div>

          {/* Routes Section */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-bold">Your Hop Library</CardTitle>
                    <CardDescription className="italic">
                      A clear, hop-by-hop look at your route.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {folders.length > 0 && (
                      <Select value={selectedFolderFilter} onValueChange={setSelectedFolderFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
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
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="hide-completed" 
                        checked={hideCompletedRoutes}
                        onCheckedChange={(checked) => setHideCompletedRoutes(checked as boolean)}
                      />
                      <label 
                        htmlFor="hide-completed" 
                        className="text-sm cursor-pointer select-none"
                      >
                        Hide completed
                      </label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {routesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No routes yet!</p>
                    <p className="text-sm mt-2">Create your first route above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto">
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
                                {(route as any).waypointCount !== undefined && (route as any).waypointCount > 0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    (route as any).completedWaypointCount === (route as any).waypointCount
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                      : (route as any).completedWaypointCount && (route as any).completedWaypointCount > 0
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                      : 'bg-muted'
                                  }`}>
                                    {(route as any).completedWaypointCount || 0}/{(route as any).waypointCount} stops
                                  </span>
                                )}
                                {route.calendarId && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    📅 On Calendar
                                  </span>
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
                                copyRouteMutation.mutate({ routeId: route.id });
                              }}
                              title="Copy route"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                handleArchiveRoute(route.id);
                              }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
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
            <AlertDialogTitle>Delete This Route?</AlertDialogTitle>
            <AlertDialogDescription>
              Routie will permanently remove this route and all its stops. This can't be undone.
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
      
      {/* Document Upload Dialog */}
      {uploadContactId && (
        <DocumentUploadDialog
          open={showDocumentUpload}
          onOpenChange={setShowDocumentUpload}
          contactId={uploadContactId}
          contactName={uploadContactName}
          onUploadComplete={() => {
            // Refresh contacts if needed
            contactsQuery.refetch();
          }}
        />
      )}
      
      {/* Bulk Document Upload Dialog */}
      <BulkDocumentUploadDialog
        open={showBulkDocumentUpload}
        onOpenChange={setShowBulkDocumentUpload}
        onUploadComplete={() => {
          // Refresh contacts if needed
          contactsQuery.refetch();
        }}
      />
      
      {/* Contact Detail Dialog */}
      <ContactDetailDialog
        contact={viewingContact}
        open={!!viewingContact}
        onOpenChange={(open) => !open && setViewingContact(null)}
        onEdit={() => {
          setEditingContact(viewingContact);
          setViewingContact(null);
        }}
      />

      {/* Address Selector Dialog */}
      {addressSelectorContact && (
        <AddressSelector
          contactName={addressSelectorContact.name}
          addressesJson={addressSelectorContact.addresses}
          open={addressSelectorOpen}
          onSelect={handleAddressSelected}
          onCancel={handleAddressSelectorCancel}
        />
      )}

      {/* Calendar Selection Dialog */}
      <Dialog open={showCalendarSelectionDialog} onOpenChange={setShowCalendarSelectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Calendar</DialogTitle>
            <DialogDescription>
              Choose which calendar to add your route stops to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-select">Calendar</Label>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger id="calendar-select">
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendarData?.calendars?.map((cal: any) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      {cal.summary} {cal.primary && "(Primary)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {calendarData && (
              <div className="text-sm text-muted-foreground">
                <p>This will create separate calendar events for each stop in your route.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendarSelectionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedCalendar || !calendarData) return;
                createWaypointEventsMutation.mutate({
                  routeId: calendarData.routeId,
                  calendarId: selectedCalendar,
                  startTime: calendarData.startTime,
                  accessToken: calendarData.accessToken,
                });
              }} 
              disabled={!selectedCalendar || createWaypointEventsMutation.isPending}
            >
              {createWaypointEventsMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                "Create Events"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
