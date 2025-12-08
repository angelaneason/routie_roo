import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Calendar and Popover imports removed - using native date input instead

import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIconLucide, MessageSquare, Plus, X, CheckCircle2, Tags, Paperclip, Upload, Eye, EyeOff, FileText, Trash2 } from "lucide-react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PhoneNumber {
  value: string;
  label: string;
}

interface ImportantDate {
  type: string;
  date: string;
}

interface Comment {
  option: string;
  customText?: string;
}

interface Address {
  type: string;
  formattedValue: string;
  isPrimary: boolean;
}

interface ContactEditDialogProps {
  contact: {
    id: number;
    name: string | null;
    email: string | null;
    address: string | null;
    addresses: string | null;
    phoneNumbers: string | null;
    importantDates: string | null;
    comments: string | null;
    labels: string | null;
    isActive: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    email: string;
    address: string;
    addresses?: Address[];
    phoneNumbers: PhoneNumber[];
    importantDates?: ImportantDate[];
    comments?: Comment[];
  }) => Promise<void>;
}

export function ContactEditDialog({ contact, open, onOpenChange, onSave }: ContactEditDialogProps) {
  const initialPhones: PhoneNumber[] = contact.phoneNumbers 
    ? JSON.parse(contact.phoneNumbers) 
    : [];
    
  const initialDates: ImportantDate[] = contact.importantDates
    ? JSON.parse(contact.importantDates)
    : [];
    
  const initialComments: Comment[] = contact.comments
    ? JSON.parse(contact.comments)
    : [];
    
  const initialAddresses: Address[] = contact.addresses
    ? JSON.parse(contact.addresses)
    : [];
  
  const [name, setName] = useState(contact.name || "");
  const [email, setEmail] = useState(contact.email || "");
  const [address, setAddress] = useState(contact.address || "");
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>(initialPhones);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(initialDates);
  // Removed openPopoverIndex state - using native date input instead
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  
  // Labels state
  const initialLabels: string[] = contact.labels ? (() => {
    try {
      const labels = JSON.parse(contact.labels);
      return labels
        .map((label: string) => {
          if (label.startsWith('contactGroups/')) {
            return label.split('/').pop() || '';
          }
          return label;
        })
        .filter((label: string) => {
          const lower = label.toLowerCase();
          const isHexId = /^[0-9a-f]{12,}$/i.test(label);
          return lower !== 'mycontacts' && lower !== 'starred' && label.trim() !== '' && !isHexId;
        });
    } catch (e) {
      return [];
    }
  })() : [];
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialLabels);
  
  // Document upload state
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch date types and comment options from settings
  const dateTypesQuery = trpc.settings.listImportantDateTypes.useQuery();
  const commentOptionsQuery = trpc.settings.listCommentOptions.useQuery();
  
  // Fetch all available labels and documents
  const allLabelsQuery = trpc.contacts.getAllLabels.useQuery();
  const documentsQuery = trpc.contacts.getDocuments.useQuery({ contactId: contact.id }, { enabled: open });
  
  // Mutations
  const updateLabelsMutation = trpc.contacts.updateLabels.useMutation();
  const uploadDocumentMutation = trpc.contacts.uploadDocument.useMutation();
  const deleteDocumentMutation = trpc.contacts.deleteDocument.useMutation();
  
  const validateAddressMutation = trpc.contacts.validateAddress.useMutation({
    onSuccess: (result) => {
      if (result.isValid && result.formattedAddress) {
        // Automatically update the address field with the validated address
        setAddress(result.formattedAddress);
        toast.success(`✓ Address validated and updated to: ${result.formattedAddress}`);
      } else if (result.error) {
        toast.error(result.error);
      }
      setValidating(false);
    },
    onError: (error) => {
      toast.error(`Validation failed: ${error.message}`);
      setValidating(false);
    },
  });
  
  const handleValidateAddress = () => {
    if (!address || address.trim().length === 0) {
      toast.error("Please enter an address to validate");
      return;
    }
    setValidating(true);
    validateAddressMutation.mutate({ address });
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, { value: "", label: "mobile" }]);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const updatePhoneNumber = (index: number, field: "value" | "label", value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneNumbers(updated);
  };
  
  const addAddress = () => {
    setAddresses([...addresses, { type: "home", formattedValue: "", isPrimary: addresses.length === 0 }]);
  };
  
  const removeAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    // If we removed the primary address, make the first one primary
    if (addresses[index].isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setAddresses(updated);
  };
  
  const updateAddress = (index: number, field: "type" | "formattedValue" | "isPrimary", value: string | boolean) => {
    const updated = [...addresses];
    if (field === "isPrimary" && value === true) {
      // Unset all other primary flags
      updated.forEach((addr, i) => {
        addr.isPrimary = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setAddresses(updated);
  };
  
  const addImportantDate = () => {
    const firstDateType = dateTypesQuery.data?.[0]?.name || "";
    setImportantDates([...importantDates, { type: firstDateType, date: "" }]);
  };
  
  const removeImportantDate = (index: number) => {
    setImportantDates(importantDates.filter((_, i) => i !== index));
  };
  
  const updateImportantDate = (index: number, field: "type" | "date", value: string) => {
    const updated = [...importantDates];
    updated[index] = { ...updated[index], [field]: value };
    setImportantDates(updated);
  };
  
  const addComment = () => {
    const firstOption = commentOptionsQuery.data?.[0]?.option || "Other";
    setComments([...comments, { option: firstOption, customText: "" }]);
  };
  
  const removeComment = (index: number) => {
    setComments(comments.filter((_, i) => i !== index));
  };
  
  const updateComment = (index: number, field: "option" | "customText", value: string) => {
    const updated = [...comments];
    updated[index] = { ...updated[index], [field]: value };
    setComments(updated);
  };
  
  // Label handlers
  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter(l => l !== label));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };
  
  const handleSaveLabels = async () => {
    try {
      await updateLabelsMutation.mutateAsync({
        contactId: contact.id,
        labels: selectedLabels,
      });
      toast.success("Labels updated successfully");
    } catch (error) {
      toast.error("Failed to update labels");
      console.error(error);
    }
  };
  
  // Document upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    
    setUploadingDocument(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await uploadDocumentMutation.mutateAsync({
          contactId: contact.id,
          fileName: selectedFile.name,
          fileData: base64,
          mimeType: selectedFile.type,
        });
        toast.success("Document uploaded successfully");
        setSelectedFile(null);
        documentsQuery.refetch();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploadingDocument(false);
    }
  };
  
  const handleDeleteDocument = async (documentId: number) => {
    try {
      await deleteDocumentMutation.mutateAsync({ documentId });
      toast.success("Document deleted successfully");
      documentsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    // Validate important dates
    const validDates = importantDates.filter(d => d.type && d.date);
    
    // Validate comments
    const validComments = comments.filter(c => {
      if (c.option === "Other") {
        return c.customText && c.customText.trim();
      }
      return c.option;
    });


    
    setSaving(true);
    try {
      // Validate addresses - must have formattedValue
      const validAddresses = addresses.filter(a => a.formattedValue.trim());
      
      await onSave({
        name: name.trim(),
        email: email.trim(),
        address: address.trim(), // Keep legacy field for backward compatibility
        addresses: validAddresses.length > 0 ? validAddresses : undefined,
        phoneNumbers: phoneNumbers.filter(p => p.value.trim()),
        importantDates: validDates,
        comments: validComments,
      });
      
      // Save labels separately
      await handleSaveLabels();
      
      toast.success("Contact updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update contact");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information. Changes will be synced back to Google Contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm !font-bold">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm !font-bold">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold">Addresses</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAddress}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Address
              </Button>
            </div>

            {addresses.map((addr, index) => (
              <div key={index} className="flex gap-2 items-start border rounded-md p-3">
                <div className="flex-1 space-y-2">
                  <AddressAutocomplete
                    value={addr.formattedValue}
                    onChange={(value) => updateAddress(index, "formattedValue", value)}
                    placeholder="Start typing address..."
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={addr.type}
                      onChange={(e) => updateAddress(index, "type", e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="home">🏠 Home</option>
                      <option value="work">🏢 Work</option>
                      <option value="other">📍 Other</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={addr.isPrimary}
                        onChange={(e) => updateAddress(index, "isPrimary", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-muted-foreground">Primary</span>
                    </label>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAddress(index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {addresses.length === 0 && (
              <p className="text-sm text-muted-foreground">No addresses added</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold">Phone Numbers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhoneNumber}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Phone
              </Button>
            </div>

            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    value={phone.value}
                    onChange={(e) => updatePhoneNumber(index, "value", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <select
                  value={phone.label}
                  onChange={(e) => updatePhoneNumber(index, "label", e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="mobile">Mobile</option>
                  <option value="work">Work</option>
                  <option value="home">Home</option>
                  <option value="other">Other</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhoneNumber(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {phoneNumbers.length === 0 && (
              <p className="text-sm text-muted-foreground">No phone numbers added</p>
            )}
          </div>
          
          {/* Important Dates Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold flex items-center gap-2">
                <CalendarIconLucide className="h-4 w-4" />
                Important Dates
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImportantDate}
                disabled={!dateTypesQuery.data || dateTypesQuery.data.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Date
              </Button>
            </div>
            
            {!dateTypesQuery.data || dateTypesQuery.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No date types configured. Add date types in Settings first.
              </p>
            ) : (
              <>
                {importantDates.map((date, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Select
                      value={date.type}
                      onValueChange={(value) => updateImportantDate(index, "type", value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {dateTypesQuery.data?.map((dateType) => (
                          <SelectItem key={dateType.id} value={dateType.name}>
                            {dateType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="date"
                      value={date.date || ""}
                      onChange={(e) => updateImportantDate(index, "date", e.target.value)}
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImportantDate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {importantDates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No important dates added</p>
                )}
              </>
            )}
          </div>
          
          {/* Comments Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm !font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addComment}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Comment
              </Button>
            </div>
            
            {comments.map((comment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2 items-start">
                  <Select
                    value={comment.option}
                    onValueChange={(value) => updateComment(index, "option", value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      {commentOptionsQuery.data?.map((option) => (
                        <SelectItem key={option.id} value={option.option}>
                          {option.option}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeComment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {comment.option === "Other" && (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={comment.customText || ""}
                      onChange={(e) => updateComment(index, "customText", e.target.value)}
                      placeholder="Enter custom comment"
                      className="ml-0 flex-1"
                    />
                    <EmojiPickerButton
                      onEmojiSelect={(emoji) => {
                        const currentText = comment.customText || "";
                        updateComment(index, "customText", currentText + emoji);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No comments added</p>
            )}
          </div>
          
          {/* Labels Section */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm !font-bold flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Labels
            </Label>
            <div className="flex flex-wrap gap-2">
              {allLabelsQuery.data && allLabelsQuery.data.length > 0 ? (
                allLabelsQuery.data.map((labelObj: { resourceName: string; name: string; memberCount?: number }) => (
                  <Button
                    key={labelObj.resourceName}
                    type="button"
                    variant={selectedLabels.includes(labelObj.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLabel(labelObj.name)}
                    className="h-8"
                  >
                    {labelObj.name}
                    {selectedLabels.includes(labelObj.name) && (
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No labels available</p>
              )}
            </div>
            {selectedLabels.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedLabels.length} label{selectedLabels.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          
          {/* Documents Section */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm !font-bold flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Documents
            </Label>
            
            {/* Upload Document */}
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="flex-1"
                  disabled={uploadingDocument}
                />
                <Button
                  type="button"
                  onClick={handleUploadDocument}
                  disabled={!selectedFile || uploadingDocument}
                  size="sm"
                >
                  {uploadingDocument ? (
                    <>
                      <Upload className="h-4 w-4 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Documents List */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {documentsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              ) : documentsQuery.data && documentsQuery.data.length > 0 ? (
                documentsQuery.data.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{doc.fileName}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete Document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
