import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, X, FileText, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BulkDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

export function BulkDocumentUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: BulkDocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Get all contacts to extract unique labels
  const contactsQuery = trpc.contacts.list.useQuery();
  
  // Get contacts by selected label
  const contactsByLabelQuery = trpc.contacts.getContactsByLabel.useQuery(
    { label: selectedLabel },
    { enabled: !!selectedLabel }
  );

  const uploadMutation = trpc.contacts.bulkUploadDocument.useMutation({
    onSuccess: (result) => {
      toast.success(`Document uploaded to ${result.contactCount} contacts`);
      setSelectedFile(null);
      setSelectedLabel("");
      onOpenChange(false);
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  // Extract unique labels from all contacts
  const uniqueLabels = Array.from(
    new Set(
      (contactsQuery.data || [])
        .flatMap(contact => {
          if (!contact.labels) return [];
          try {
            const labels = JSON.parse(contact.labels);
            return Array.isArray(labels) ? labels : [];
          } catch {
            return [];
          }
        })
        .filter(Boolean)
    )
  ).sort();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!selectedLabel) {
      toast.error("Please select a label");
      return;
    }

    const contacts = contactsByLabelQuery.data || [];
    if (contacts.length === 0) {
      toast.error("No contacts found with this label");
      return;
    }

    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64Content = base64Data.split(",")[1]; // Remove data:mime;base64, prefix

        await uploadMutation.mutateAsync({
          contactIds: contacts.map(c => c.id),
          fileName: selectedFile.name,
          fileData: base64Content,
          mimeType: selectedFile.type || "application/octet-stream",
        });

        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  const contactCount = contactsByLabelQuery.data?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to all contacts with a specific label
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Contact Label</Label>
            <Select value={selectedLabel} onValueChange={setSelectedLabel} disabled={uploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a label..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueLabels.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No labels found
                  </SelectItem>
                ) : (
                  uniqueLabels.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedLabel && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {contactsByLabelQuery.isLoading
                    ? "Loading contacts..."
                    : `${contactCount} contact${contactCount !== 1 ? "s" : ""} found`}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported: PDF, Word, Images, Text (max 10MB)
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || !selectedLabel || uploading || contactCount === 0}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload to {contactCount} Contact{contactCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
