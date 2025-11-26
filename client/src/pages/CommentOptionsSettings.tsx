import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export default function CommentOptionsSettings() {
  const [newCommentOption, setNewCommentOption] = React.useState("");
  
  const commentOptionsQuery = trpc.settings.listCommentOptions.useQuery();
  
  const createCommentOptionMutation = trpc.settings.createCommentOption.useMutation({
    onSuccess: () => {
      toast.success("Comment option added! 🦘");
      setNewCommentOption("");
      commentOptionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add comment option: ${error.message}`);
    },
  });
  
  const deleteCommentOptionMutation = trpc.settings.deleteCommentOption.useMutation({
    onSuccess: () => {
      toast.success("Comment option deleted! 🦘");
      commentOptionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete comment option: ${error.message}`);
    },
  });
  
  const handleAddCommentOption = () => {
    if (!newCommentOption.trim()) {
      toast.error("Please enter a comment option");
      return;
    }
    createCommentOptionMutation.mutate({ option: newCommentOption.trim() });
  };
  
  const handleDeleteCommentOption = (id: number) => {
    if (confirm("Are you sure you want to delete this comment option?")) {
      deleteCommentOptionMutation.mutate({ id });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comment Options
        </CardTitle>
        <CardDescription>
          Manage quick comment options for your contacts (e.g., VIP Client, Needs Follow-up). "Other" option is always available for custom comments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment option */}
        <div className="space-y-2">
          <Label htmlFor="newCommentOption" className="text-sm !font-bold">
            Add New Comment Option
          </Label>
          <div className="flex gap-2">
            <Input
              id="newCommentOption"
              placeholder="e.g., VIP Client, Needs Follow-up, Special Instructions"
              value={newCommentOption}
              onChange={(e) => setNewCommentOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCommentOption();
                }
              }}
            />
            <Button
              onClick={handleAddCommentOption}
              disabled={createCommentOptionMutation.isPending || !newCommentOption.trim()}
            >
              {createCommentOptionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* List existing comment options */}
        <div className="space-y-2">
          <Label className="text-sm !font-bold">Your Comment Options</Label>
          {commentOptionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : commentOptionsQuery.data && commentOptionsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {commentOptionsQuery.data.map((commentOption) => (
                <div
                  key={commentOption.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-medium">{commentOption.option}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCommentOption(commentOption.id)}
                    disabled={deleteCommentOptionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No comment options yet. Add your first one above!
            </p>
          )}
        </div>
        
        {/* Note about "Other" option */}
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> The "Other" option is always available when adding comments to contacts, allowing you to enter custom text.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
