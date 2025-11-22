import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, Route as RouteIcon, Share2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [routeName, setRouteName] = useState("");
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);

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

  // Fetch contacts
  const contactsQuery = trpc.contacts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch user routes
  const routesQuery = trpc.routes.list.useQuery(undefined, {
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
      setRouteName("");
      setIsCreatingRoute(false);
      routesQuery.refetch();
      navigate(`/route/${data.routeId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create route");
      setIsCreatingRoute(false);
    },
  });

  const handleSyncContacts = async () => {
    const result = await googleAuthQuery.refetch();
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  };

  const handleToggleContact = (contactId: number) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
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
    const waypoints = Array.from(selectedContacts)
      .map(id => contacts.find(c => c.id === id))
      .filter(c => c)
      .map(c => ({
        contactName: c!.name || undefined,
        address: c!.address!,
      }));

    setIsCreatingRoute(true);
    createRouteMutation.mutate({
      name: routeName,
      waypoints,
      isPublic: false,
    });
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
            <MapPin className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
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
  const hasContacts = contacts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
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
                {contactsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !hasContacts ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Click "Sync Contacts" to import your Gmail contacts</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleToggleContact(contact.id)}
                      >
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={() => handleToggleContact(contact.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.address}
                          </p>
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
                  <CardTitle>Create Route</CardTitle>
                  <CardDescription>
                    Select at least 2 contacts to create an optimized route
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
                <CardTitle>Your Routes</CardTitle>
                <CardDescription>
                  {routes.length > 0 
                    ? `${routes.length} saved route${routes.length !== 1 ? 's' : ''}`
                    : "No routes created yet"}
                </CardDescription>
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
                    {routes.map((route) => (
                      <Link key={route.id} href={`/route/${route.id}`}>
                        <div className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{route.name}</h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>{(route.totalDistance! / 1000).toFixed(1)} km</span>
                                <span>{Math.round(route.totalDuration! / 60)} min</span>
                              </div>
                            </div>
                            <RouteIcon className="h-5 w-5 text-primary flex-shrink-0" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
