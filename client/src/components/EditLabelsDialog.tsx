import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface EditLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: number;
  contactName: string;
  currentLabels: string[]; // Readable label names
  onSuccess?: () => void;
}

export function EditLabelsDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  currentLabels,
  onSuccess,
}: EditLabelsDialogProps) {
  const [selectedLabelResourceNames, setSelectedLabelResourceNames] = useState<string[]>([]);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  // Fetch all available labels
  const { data: allLabels, isLoading: labelsLoading, refetch: refetchLabels } = trpc.contacts.getAllLabels.useQuery(
    undefined,
    { enabled: open }
  );

  // Update labels mutation
  const updateLabelsMutation = trpc.contacts.updateLabels.useMutation({
    onSuccess: () => {
      toast.success("Labels updated successfully! 🦘");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update labels: ${error.message}`);
    },
  });

  // Create label mutation
  const createLabelMutation = trpc.contacts.createLabel.useMutation({
    onSuccess: (data) => {
      toast.success(`Label "${data.name}" created! 🦘`);
      setNewLabelName("");
      setShowCreateNew(false);
      refetchLabels();
      // Add the new label to selected labels
      setSelectedLabelResourceNames(prev => [...prev, data.resourceName]);
    },
    onError: (error) => {
      toast.error(`Failed to create label: ${error.message}`);
    },
  });

  // Initialize selected labels when dialog opens
  useEffect(() => {
    if (open && allLabels) {
      // Match current label names to resource names
      const resourceNames = allLabels
        .filter(label => currentLabels.includes(label.name))
        .map(label => label.resourceName);
      setSelectedLabelResourceNames(resourceNames);
    }
  }, [open, allLabels, currentLabels]);

  const handleToggleLabel = (resourceName: string) => {
    setSelectedLabelResourceNames(prev => {
      if (prev.includes(resourceName)) {
        return prev.filter(rn => rn !== resourceName);
      } else {
        return [...prev, resourceName];
      }
    });
  };

  const handleSave = () => {
    updateLabelsMutation.mutate({
      contactId,
      labelResourceNames: selectedLabelResourceNames,
    });
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) {
      toast.error("Please enter a label name");
      return;
    }
    createLabelMutation.mutate({ name: newLabelName.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Labels for {contactName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {labelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allLabels && allLabels.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {allLabels.map(label => (
                <div key={label.resourceName} className="flex items-center space-x-3">
                  <Checkbox
                    id={label.resourceName}
                    checked={selectedLabelResourceNames.includes(label.resourceName)}
                    onCheckedChange={() => handleToggleLabel(label.resourceName)}
                  />
                  <Label
                    htmlFor={label.resourceName}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label.name}
                    {label.memberCount !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({label.memberCount} contacts)
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No labels found. Create your first label below!
            </p>
          )}

          {/* Create new label section */}
          {showCreateNew ? (
            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="new-label" className="text-sm !font-bold">
                New Label Name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="new-label"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Enter label name..."
                  className="flex-1 h-11 text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateLabel();
                    }
                  }}
                />
                <Button
                  onClick={handleCreateLabel}
                  disabled={createLabelMutation.isPending || !newLabelName.trim()}
                  className="touch-target"
                >
                  {createLabelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateNew(false);
                    setNewLabelName("");
                  }}
                  className="touch-target"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowCreateNew(true)}
              className="w-full touch-target"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Label
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateLabelsMutation.isPending}
            className="touch-target"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateLabelsMutation.isPending}
            className="touch-target"
          >
            {updateLabelsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
