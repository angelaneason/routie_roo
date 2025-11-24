import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContactImportDialog({ open, onOpenChange, onSuccess }: ContactImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const importMutation = trpc.contacts.importFromCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.imported} contacts!`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} contacts failed validation`);
      }
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const lines = text.split("\\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must have at least a header row and one data row");
        setIsProcessing(false);
        return;
      }

      // Parse CSV
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes("name"));
      const emailIdx = headers.findIndex(h => h.includes("email"));
      const addressIdx = headers.findIndex(h => h.includes("address"));
      const phoneIdx = headers.findIndex(h => h.includes("phone"));

      if (nameIdx === -1 || addressIdx === -1) {
        toast.error("CSV must have 'name' and 'address' columns");
        setIsProcessing(false);
        return;
      }

      const parsedContacts = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        
        const contact: any = {
          name: values[nameIdx] || "",
          address: values[addressIdx] || "",
        };

        if (emailIdx !== -1 && values[emailIdx]) {
          contact.email = values[emailIdx];
        }

        if (phoneIdx !== -1 && values[phoneIdx]) {
          contact.phoneNumbers = [{
            value: values[phoneIdx],
            label: "other",
          }];
        }

        if (contact.name && contact.address) {
          parsedContacts.push(contact);
        }
      }

      setPreview(parsedContacts);
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to parse CSV file");
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.error("No contacts to import");
      return;
    }

    setIsProcessing(true);
    importMutation.mutate({ contacts: preview });
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: name, address, email (optional), phone (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {isProcessing && !importMutation.isPending && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Processing CSV file...</AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && !importMutation.isPending && (
            <div>
              <h3 className="font-medium mb-2">Preview ({preview.length} contacts)</h3>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Address</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((contact, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{contact.name}</td>
                        <td className="p-2">{contact.address}</td>
                        <td className="p-2">{contact.email || "-"}</td>
                        <td className="p-2">{contact.phoneNumbers?.[0]?.value || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="p-2 text-center text-muted-foreground text-xs border-t">
                    ... and {preview.length - 10} more
                  </div>
                )}
              </div>
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Addresses will be validated using Google Maps. Invalid addresses will be skipped.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {importMutation.isPending && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Importing and validating contacts... This may take a moment.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import {preview.length} Contacts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
