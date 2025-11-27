import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface PhoneNumber {
  value: string;
  label: string;
}

interface ContactEditDialogProps {
  contact: {
    id: number;
    name: string | null;
    email: string | null;
    address: string | null;
    phoneNumbers: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    email: string;
    address: string;
    phoneNumbers: PhoneNumber[];
  }) => Promise<void>;
}

export function ContactEditDialog({ contact, open, onOpenChange, onSave }: ContactEditDialogProps) {
  const initialPhones: PhoneNumber[] = contact.phoneNumbers 
    ? JSON.parse(contact.phoneNumbers) 
    : [];
    
  const [name, setName] = useState(contact.name || "");
  const [email, setEmail] = useState(contact.email || "");
  const [address, setAddress] = useState(contact.address || "");
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>(initialPhones);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        address: address.trim(),
        phoneNumbers: phoneNumbers.filter(p => p.value.trim()),
      });
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Phone Numbers</Label>
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
