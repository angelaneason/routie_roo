import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function RouteHoldersSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHolder, setEditingHolder] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [googleCalendarId, setGoogleCalendarId] = useState("");
  const [defaultStopType, setDefaultStopType] = useState("");
  const [defaultStopTypeColor, setDefaultStopTypeColor] = useState("#3b82f6");

  // Fetch data
  const { data: routeHolders, isLoading, refetch } = trpc.routeHolders.list.useQuery();
  const { data: calendars } = trpc.contacts.getCalendarList.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();

  // Mutations
  const createMutation = trpc.routeHolders.create.useMutation({
    onSuccess: () => {
      toast.success("Route holder created successfully");
      refetch();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create route holder: ${error.message}`);
    },
  });

  const updateMutation = trpc.routeHolders.update.useMutation({
    onSuccess: () => {
      toast.success("Route holder updated successfully");
      refetch();
      setIsEditDialogOpen(false);
      setEditingHolder(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update route holder: ${error.message}`);
    },
  });

  const deleteMutation = trpc.routeHolders.delete.useMutation({
    onSuccess: () => {
      toast.success("Route holder deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete route holder: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName("");
    setGoogleCalendarId("");
    setDefaultStopType("");
    setDefaultStopTypeColor("#3b82f6");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      googleCalendarId: googleCalendarId || undefined,
      defaultStopType: defaultStopType || undefined,
      defaultStopTypeColor: defaultStopTypeColor || undefined,
    });
  };

  const handleEdit = (holder: any) => {
    setEditingHolder(holder);
    setName(holder.name);
    setGoogleCalendarId(holder.googleCalendarId || "");
    setDefaultStopType(holder.defaultStopType || "");
    setDefaultStopTypeColor(holder.defaultStopTypeColor || "#3b82f6");
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingHolder || !name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    updateMutation.mutate({
      id: editingHolder.id,
      name: name.trim(),
      googleCalendarId: googleCalendarId || undefined,
      defaultStopType: defaultStopType || undefined,
      defaultStopTypeColor: defaultStopTypeColor || undefined,
    });
  };

  const handleDelete = (holderId: number) => {
    if (confirm("Are you sure you want to delete this route holder? This cannot be undone.")) {
      deleteMutation.mutate({ id: holderId });
    }
  };

  const getCalendarName = (calendarId: string | null) => {
    if (!calendarId) return "Not assigned";
    if (calendarId === "primary") return "Primary Calendar";
    
    const calendar = calendars?.find((cal: any) => cal.id === calendarId);
    return calendar?.summary || calendarId;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Route Holders</h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Route Holders</h1>
            <p className="text-sm text-muted-foreground">Manage staff members who execute routes</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Route Holder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Route Holder</DialogTitle>
              <DialogDescription>
                Add a new staff member who will execute routes. Assign them a calendar and default stop type.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Randy, PTA Team, Shaquana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calendar">Google Calendar</Label>
                <Select value={googleCalendarId} onValueChange={setGoogleCalendarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select calendar (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No calendar</SelectItem>
                    {calendars?.map((cal: any) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.summary}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Routes assigned to this holder will be saved to this calendar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stopType">Default Stop Type</Label>
                <Input
                  id="stopType"
                  placeholder="e.g., Visit, Eval, Assessment"
                  value={defaultStopType}
                  onChange={(e) => setDefaultStopType(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Stop Type Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={defaultStopTypeColor}
                    onChange={(e) => setDefaultStopTypeColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={defaultStopTypeColor}
                    onChange={(e) => setDefaultStopTypeColor(e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Route Holders List */}
      {!routeHolders || routeHolders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No route holders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create route holders to assign staff members to routes with specific calendars and stop types.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Route Holder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {routeHolders.map((holder: any) => (
            <Card key={holder.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {holder.name}
                      {holder.defaultStopTypeColor && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: holder.defaultStopTypeColor }}
                        />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div>
                        <strong>Calendar:</strong> {getCalendarName(holder.googleCalendarId)}
                      </div>
                      {holder.defaultStopType && (
                        <div>
                          <strong>Default Stop Type:</strong> {holder.defaultStopType}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(holder)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(holder.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route Holder</DialogTitle>
            <DialogDescription>
              Update the route holder's details, calendar, and default stop type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Randy, PTA Team, Shaquana"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-calendar">Google Calendar</Label>
              <Select value={googleCalendarId || "none"} onValueChange={(val) => setGoogleCalendarId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No calendar</SelectItem>
                  {calendars?.map((cal: any) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      {cal.summary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-stopType">Default Stop Type</Label>
              <Input
                id="edit-stopType"
                placeholder="e.g., Visit, Eval, Assessment"
                value={defaultStopType}
                onChange={(e) => setDefaultStopType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-color">Stop Type Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={defaultStopTypeColor}
                  onChange={(e) => setDefaultStopTypeColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={defaultStopTypeColor}
                  onChange={(e) => setDefaultStopTypeColor(e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingHolder(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
