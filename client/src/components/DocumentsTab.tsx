import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, Download, Trash2, Upload, Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentUploadDialog } from "./DocumentUploadDialog";

interface DocumentsTabProps {
  contactId: number;
  contactName: string;
}

export function DocumentsTab({ contactId, contactName }: DocumentsTabProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const documentsQuery = trpc.contacts.getDocuments.useQuery({ contactId });
  const utils = trpc.useUtils();

  const deleteDocumentMutation = trpc.contacts.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      documentsQuery.refetch();
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleDelete = (documentId: number) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate({ documentId: documentToDelete });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (documentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const documents = documentsQuery.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Paperclip className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">No documents yet</h4>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Upload documents like contracts, forms, or certificates for {contactName}
            </p>
            <Button onClick={() => setShowUploadDialog(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(doc.fileUrl, "_blank")}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        contactId={contactId}
        contactName={contactName}
        onUploadComplete={() => {
          documentsQuery.refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDocumentMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteDocumentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
