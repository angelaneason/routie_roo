import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettings() {
  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    taxId: "",
    invoicePrefix: "INV",
    invoiceFooter: "",
  });

  const { data: settings, isLoading } = trpc.billing.settings.get.useQuery();
  const updateMutation = trpc.billing.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setFormData({
        businessName: settings.businessName || "",
        businessAddress: settings.businessAddress || "",
        businessPhone: settings.businessPhone || "",
        businessEmail: settings.businessEmail || "",
        taxId: settings.taxId || "",
        invoicePrefix: settings.invoicePrefix || "INV",
        invoiceFooter: settings.invoiceFooter || "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Configure your business information for invoices</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              This information will appear on all generated invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="Your Business Name"
              />
            </div>

            {/* Business Address */}
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => handleChange("businessAddress", e.target.value)}
                placeholder="123 Main Street&#10;City, State ZIP"
                rows={3}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  value={formData.businessPhone}
                  onChange={(e) => handleChange("businessPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleChange("businessEmail", e.target.value)}
                  placeholder="billing@yourbusiness.com"
                />
              </div>
            </div>

            {/* Tax ID */}
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / EIN</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleChange("taxId", e.target.value)}
                placeholder="12-3456789"
              />
              <p className="text-sm text-muted-foreground">
                Your business tax identification number (optional)
              </p>
            </div>

            {/* Invoice Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Invoice Settings</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={formData.invoicePrefix}
                    onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                    placeholder="INV"
                    maxLength={20}
                  />
                  <p className="text-sm text-muted-foreground">
                    Prefix for invoice numbers (e.g., "INV" creates INV-1000, INV-1001, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceFooter">Invoice Footer</Label>
                  <Textarea
                    id="invoiceFooter"
                    value={formData.invoiceFooter}
                    onChange={(e) => handleChange("invoiceFooter", e.target.value)}
                    placeholder="Thank you for your business!&#10;Payment is due within 30 days."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Custom message to appear at the bottom of invoices
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
