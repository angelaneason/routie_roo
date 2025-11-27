import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";

export function ImportantDateTypesSettings() {
  const [newDateType, setNewDateType] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: dateTypes, refetch } = trpc.settings.listImportantDateTypes.useQuery();
  const createMutation = trpc.settings.createImportantDateType.useMutation();
  const updateMutation = trpc.settings.updateImportantDateType.useMutation();
  const deleteMutation = trpc.settings.deleteImportantDateType.useMutation();

  const handleCreate = async () => {
    if (!newDateType.trim()) {
      toast.error("Please enter a date type name");
      return;
    }

    try {
      await createMutation.mutateAsync({ name: newDateType.trim() });
      toast.success("Date type created!");
      setNewDateType("");
      refetch();
    } catch (error) {
      toast.error("Failed to create date type");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) {
      toast.error("Please enter a date type name");
      return;
    }

    try {
      await updateMutation.mutateAsync({ id, name: editingName.trim() });
      toast.success("Date type updated!");
      setEditingId(null);
      setEditingName("");
      refetch();
    } catch (error) {
      toast.error("Failed to update date type");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this date type?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Date type deleted!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete date type");
    }
  };

  const startEditing = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Important Date Types</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Manage the types of important dates you can track for contacts (e.g., Birthday, Anniversary, Renewal Date).
      </p>

      {/* Add New Date Type */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <Label htmlFor="new-date-type" className="text-sm !font-bold">Add New Date Type</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="new-date-type"
              value={newDateType}
              onChange={(e) => setNewDateType(e.target.value)}
              placeholder="e.g., Birthday, Anniversary"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* List of Date Types */}
      <div className="space-y-2">
        <Label className="text-sm !font-bold">Your Date Types</Label>
        {!dateTypes || dateTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No date types yet. Add one above to get started!</p>
        ) : (
          <div className="space-y-2">
            {dateTypes.map((dateType) => (
              <div key={dateType.id} className="flex items-center gap-2 p-2 border rounded">
                {editingId === dateType.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(dateType.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdate(dateType.id)}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{dateType.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(dateType.id, dateType.name)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(dateType.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
