import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StopTypesSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStopType, setEditingStopType] = useState<{ id: number; name: string; color: string } | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const { data: stopTypes, isLoading, refetch } = trpc.stopTypes.list.useQuery();
  const createMutation = trpc.stopTypes.create.useMutation({
    onSuccess: () => {
      toast.success("Stop type created");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to create stop type: ${error.message}`);
    },
  });

  const updateMutation = trpc.stopTypes.update.useMutation({
    onSuccess: () => {
      toast.success("Stop type updated");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update stop type: ${error.message}`);
    },
  });

  const deleteMutation = trpc.stopTypes.delete.useMutation({
    onSuccess: () => {
      toast.success("Stop type deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete stop type: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setEditingStopType(null);
    setName("");
    setColor("#3b82f6");
    setDialogOpen(true);
  };

  const openEditDialog = (stopType: { id: number; name: string; color: string }) => {
    setEditingStopType(stopType);
    setName(stopType.name);
    setColor(stopType.color);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingStopType(null);
    setName("");
    setColor("#3b82f6");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a stop type name");
      return;
    }

    if (editingStopType) {
      updateMutation.mutate({ id: editingStopType.id, name, color });
    } else {
      createMutation.mutate({ name, color });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this stop type?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stop Types</CardTitle>
              <CardDescription>
                Customize stop types for your routes (e.g., Delivery, Home Visit, Pickup)
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stop Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stopTypes && stopTypes.length > 0 ? (
            <div className="space-y-2">
              {stopTypes.map((stopType) => (
                <div
                  key={stopType.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: stopType.color }}
                    />
                    <span className="font-medium">{stopType.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(stopType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(stopType.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No stop types yet. Click "Add Stop Type" to create one.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStopType ? "Edit Stop Type" : "Create Stop Type"}
            </DialogTitle>
            <DialogDescription>
              {editingStopType
                ? "Update the stop type name and color"
                : "Add a new stop type for your routes"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Delivery, Home Visit, Pickup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 rounded border cursor-pointer"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingStopType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
