import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2, Plus, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export default function ImportantDateTypesSettings() {
  const [newDateType, setNewDateType] = React.useState("");
  
  const dateTypesQuery = trpc.settings.listImportantDateTypes.useQuery();
  
  const createDateTypeMutation = trpc.settings.createImportantDateType.useMutation({
    onSuccess: () => {
      toast.success("Date type added! 🦘");
      setNewDateType("");
      dateTypesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add date type: ${error.message}`);
    },
  });
  
  const deleteDateTypeMutation = trpc.settings.deleteImportantDateType.useMutation({
    onSuccess: () => {
      toast.success("Date type deleted! 🦘");
      dateTypesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete date type: ${error.message}`);
    },
  });
  
  const handleAddDateType = () => {
    if (!newDateType.trim()) {
      toast.error("Please enter a date type name");
      return;
    }
    createDateTypeMutation.mutate({ name: newDateType.trim() });
  };
  
  const handleDeleteDateType = (id: number) => {
    if (confirm("Are you sure you want to delete this date type?")) {
      deleteDateTypeMutation.mutate({ id });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Important Date Types
        </CardTitle>
        <CardDescription>
          Manage custom date types for your contacts (e.g., Birthday, Anniversary, Renewal Date)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new date type */}
        <div className="space-y-2">
          <Label htmlFor="newDateType" className="text-sm !font-bold">
            Add New Date Type
          </Label>
          <div className="flex gap-2">
            <Input
              id="newDateType"
              placeholder="e.g., Birthday, Anniversary, Renewal Date"
              value={newDateType}
              onChange={(e) => setNewDateType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddDateType();
                }
              }}
            />
            <Button
              onClick={handleAddDateType}
              disabled={createDateTypeMutation.isPending || !newDateType.trim()}
            >
              {createDateTypeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* List existing date types */}
        <div className="space-y-2">
          <Label className="text-sm !font-bold">Your Date Types</Label>
          {dateTypesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dateTypesQuery.data && dateTypesQuery.data.length > 0 ? (
            <div className="space-y-2">
              {dateTypesQuery.data.map((dateType) => (
                <div
                  key={dateType.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-medium">{dateType.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDateType(dateType.id)}
                    disabled={deleteDateTypeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No date types yet. Add your first one above!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
