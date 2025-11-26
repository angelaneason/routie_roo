import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";

export function CommentOptionsSettings() {
  const [newOption, setNewOption] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState("");

  const { data: commentOptions, refetch } = trpc.settings.listCommentOptions.useQuery();
  const createMutation = trpc.settings.createCommentOption.useMutation();
  const updateMutation = trpc.settings.updateCommentOption.useMutation();
  const deleteMutation = trpc.settings.deleteCommentOption.useMutation();

  const handleCreate = async () => {
    if (!newOption.trim()) {
      toast.error("Please enter a comment option");
      return;
    }

    try {
      await createMutation.mutateAsync({ option: newOption.trim() });
      toast.success("Comment option created!");
      setNewOption("");
      refetch();
    } catch (error) {
      toast.error("Failed to create comment option");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingOption.trim()) {
      toast.error("Please enter a comment option");
      return;
    }

    try {
      await updateMutation.mutateAsync({ id, option: editingOption.trim() });
      toast.success("Comment option updated!");
      setEditingId(null);
      setEditingOption("");
      refetch();
    } catch (error) {
      toast.error("Failed to update comment option");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this comment option?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Comment option deleted!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete comment option");
    }
  };

  const startEditing = (id: number, option: string) => {
    setEditingId(id);
    setEditingOption(option);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingOption("");
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Comment Options</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Manage the comment options available when adding notes to contacts (e.g., VIP Client, Needs Follow-up, Special Instructions).
        An "Other" option with custom text input is always available.
      </p>

      {/* Add New Comment Option */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <Label htmlFor="new-comment-option" className="text-sm !font-bold">Add New Comment Option</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="new-comment-option"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="e.g., VIP Client, Needs Follow-up"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* List of Comment Options */}
      <div className="space-y-2">
        <Label className="text-sm !font-bold">Your Comment Options</Label>
        {!commentOptions || commentOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comment options yet. Add one above to get started!</p>
        ) : (
          <div className="space-y-2">
            {commentOptions.map((option) => (
              <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                {editingId === option.id ? (
                  <>
                    <Input
                      value={editingOption}
                      onChange={(e) => setEditingOption(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(option.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdate(option.id)}
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
                    <span className="flex-1">{option.option}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(option.id, option.option)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(option.id)}
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
