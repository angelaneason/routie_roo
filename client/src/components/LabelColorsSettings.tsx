import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Palette } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export function LabelColorsSettings() {
  const [selectedColors, setSelectedColors] = React.useState<Record<string, string>>({});
  
  // Fetch all contacts to get unique labels
  const contactsQuery = trpc.contacts.list.useQuery();
  const labelColorsQuery = trpc.labelColors.list.useQuery();
  const setColorMutation = trpc.labelColors.setColor.useMutation({
    onSuccess: () => {
      toast.success("Label color saved! 🦘");
      labelColorsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save color: ${error.message}`);
    }
  });

  // Extract unique labels from contacts
  const uniqueLabels = React.useMemo(() => {
    if (!contactsQuery.data) return [];
    
    const labelsSet = new Set<string>();
    contactsQuery.data.forEach(contact => {
      if (contact.labels) {
        try {
          const labels = JSON.parse(contact.labels);
          if (Array.isArray(labels)) {
            labels.forEach(label => {
              // Filter out hex IDs (8-16 character hex strings)
              if (typeof label === 'string' && !/^[0-9a-f]{8,16}$/i.test(label)) {
                labelsSet.add(label);
              }
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    return Array.from(labelsSet).sort();
  }, [contactsQuery.data]);

  // Initialize selected colors from saved label colors
  React.useEffect(() => {
    if (labelColorsQuery.data) {
      const colorMap: Record<string, string> = {};
      labelColorsQuery.data.forEach(lc => {
        colorMap[lc.labelName] = lc.color;
      });
      setSelectedColors(colorMap);
    }
  }, [labelColorsQuery.data]);

  const handleColorChange = (labelName: string, color: string) => {
    setSelectedColors(prev => ({ ...prev, [labelName]: color }));
  };

  const handleSaveColor = (labelName: string) => {
    const color = selectedColors[labelName];
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      toast.error("Please enter a valid hex color (e.g., #FF5733)");
      return;
    }
    
    setColorMutation.mutate({ labelName, color });
  };

  // Default color palette for quick selection
  const defaultColors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33",
    "#33FFF5", "#FF8C33", "#8C33FF", "#33FF8C", "#FF3333",
    "#000000", "#808080", "#C0C0C0", "#800000", "#008000"
  ];

  if (contactsQuery.isLoading || labelColorsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (uniqueLabels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Label Colors
          </CardTitle>
          <CardDescription>
            No labels found in your contacts. Labels will appear here once you sync contacts with labels from Google.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Label Colors
        </CardTitle>
        <CardDescription>
          Assign custom colors to your contact labels for easier visual identification on maps and contact cards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uniqueLabels.map(label => {
          const currentColor = selectedColors[label] || "#808080";
          const isSaving = setColorMutation.isPending;
          
          return (
            <div key={label} className="flex items-center gap-4 p-4 border rounded-lg">
              <div 
                className="w-12 h-12 rounded-md border-2 border-gray-300 flex-shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              
              <div className="flex-1 min-w-0">
                <Label className="text-base font-medium">{label}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={currentColor}
                  onChange={(e) => handleColorChange(label, e.target.value)}
                  placeholder="#FF5733"
                  className="w-28 font-mono text-sm"
                  maxLength={7}
                />
                
                <Input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleColorChange(label, e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                
                <Button
                  onClick={() => handleSaveColor(label)}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <Label className="text-sm font-medium mb-2 block">Quick Color Palette</Label>
          <div className="flex flex-wrap gap-2">
            {defaultColors.map(color => (
              <button
                key={color}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  // This will be used when user clicks a label's color picker
                  toast.info("Click a label's color picker, then select from this palette");
                }}
                title={color}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Use the color picker or enter a hex code directly (e.g., #FF5733)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
