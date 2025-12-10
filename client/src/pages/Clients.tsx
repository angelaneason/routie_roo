import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, DollarSign, User } from "lucide-react";
import { toast } from "sonner";

type BillingModel = "mileage" | "flat_fee" | "hourly";

interface ClientFormData {
  id?: number;
  routeHolderId: number;
  clientName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  billingModel: BillingModel;
  mileageRate: string; // Display as dollars
  flatFeeAmount: string; // Display as dollars
  hourlyRate: string; // Display as dollars
  paymentTerms: string;
  notes: string;
}

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientFormData | null>(null);
  const [selectedRouteHolder, setSelectedRouteHolder] = useState<number | "all">("all");

  const utils = trpc.useUtils();

  // Fetch data
  const { data: clients = [], isLoading: clientsLoading } = trpc.billing.clients.list.useQuery();
  const { data: routeHolders = [], isLoading: holdersLoading } = trpc.routeHolders.list.useQuery();

  // Mutations
  const createMutation = trpc.billing.clients.create.useMutation({
    onSuccess: () => {
      utils.billing.clients.list.invalidate();
      toast.success("Client created successfully");
      setIsDialogOpen(false);
      setEditingClient(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create client");
    },
  });

  const updateMutation = trpc.billing.clients.update.useMutation({
    onSuccess: () => {
      utils.billing.clients.list.invalidate();
      toast.success("Client updated successfully");
      setIsDialogOpen(false);
      setEditingClient(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client");
    },
  });

  const deleteMutation = trpc.billing.clients.delete.useMutation({
    onSuccess: () => {
      utils.billing.clients.list.invalidate();
      toast.success("Client deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete client");
    },
  });

  // Filter clients by route holder
  const filteredClients = selectedRouteHolder === "all"
    ? clients
    : clients.filter(c => c.routeHolderId === selectedRouteHolder);

  // Form handlers
  const handleOpenDialog = (client?: typeof clients[0]) => {
    if (client) {
      setEditingClient({
        id: client.id,
        routeHolderId: client.routeHolderId,
        clientName: client.clientName,
        contactName: client.contactName || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        billingModel: client.billingModel,
        mileageRate: client.mileageRate ? (client.mileageRate / 100).toFixed(2) : "",
        flatFeeAmount: client.flatFeeAmount ? (client.flatFeeAmount / 100).toFixed(2) : "",
        hourlyRate: client.hourlyRate ? (client.hourlyRate / 100).toFixed(2) : "",
        paymentTerms: client.paymentTerms || "Net 30",
        notes: client.notes || "",
      });
    } else {
      setEditingClient({
        routeHolderId: routeHolders[0]?.id || 0,
        clientName: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        billingModel: "mileage",
        mileageRate: "0.65",
        flatFeeAmount: "50.00",
        hourlyRate: "35.00",
        paymentTerms: "Net 30",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const data = {
      routeHolderId: editingClient.routeHolderId,
      clientName: editingClient.clientName,
      contactName: editingClient.contactName || undefined,
      email: editingClient.email || undefined,
      phone: editingClient.phone || undefined,
      address: editingClient.address || undefined,
      billingModel: editingClient.billingModel,
      mileageRate: editingClient.mileageRate ? Math.round(parseFloat(editingClient.mileageRate) * 100) : undefined,
      flatFeeAmount: editingClient.flatFeeAmount ? Math.round(parseFloat(editingClient.flatFeeAmount) * 100) : undefined,
      hourlyRate: editingClient.hourlyRate ? Math.round(parseFloat(editingClient.hourlyRate) * 100) : undefined,
      paymentTerms: editingClient.paymentTerms || undefined,
      notes: editingClient.notes || undefined,
    };

    if (editingClient.id) {
      updateMutation.mutate({ id: editingClient.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getBillingModelLabel = (model: BillingModel) => {
    switch (model) {
      case "mileage": return "Mileage";
      case "flat_fee": return "Flat Fee";
      case "hourly": return "Hourly";
    }
  };

  const getRouteHolderName = (id: number) => {
    return routeHolders.find(h => h.id === id)?.name || "Unknown";
  };

  if (clientsLoading || holdersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Billing Clients</h1>
          <p className="text-muted-foreground">Manage clients and billing configurations</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Route Holder Filter */}
      <div className="mb-6 flex items-center gap-4">
        <Label>Filter by Route Holder:</Label>
        <Select
          value={selectedRouteHolder.toString()}
          onValueChange={(value) => setSelectedRouteHolder(value === "all" ? "all" : parseInt(value))}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Route Holders</SelectItem>
            {routeHolders.map((holder) => (
              <SelectItem key={holder.id} value={holder.id.toString()}>
                {holder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
          <p className="text-muted-foreground mb-4">
            {selectedRouteHolder === "all" 
              ? "Add your first billing client to get started"
              : "No clients for this route holder"}
          </p>
          {selectedRouteHolder === "all" && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Route Holder</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Billing Model</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <User className="w-3 h-3 mr-1" />
                      {getRouteHolderName(client.routeHolderId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {client.contactName && <div>{client.contactName}</div>}
                      {client.email && <div className="text-muted-foreground">{client.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{getBillingModelLabel(client.billingModel)}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.billingModel === "mileage" && formatCurrency(client.mileageRate) + "/mi"}
                    {client.billingModel === "flat_fee" && formatCurrency(client.flatFeeAmount) + "/route"}
                    {client.billingModel === "hourly" && formatCurrency(client.hourlyRate) + "/hr"}
                  </TableCell>
                  <TableCell>{client.paymentTerms}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(client)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient?.id ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription>
              Configure billing information for this client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Route Holder */}
            <div className="space-y-2">
              <Label htmlFor="routeHolder">Route Holder *</Label>
              <Select
                value={editingClient?.routeHolderId.toString()}
                onValueChange={(value) =>
                  setEditingClient(prev => prev ? { ...prev, routeHolderId: parseInt(value) } : null)
                }
              >
                <SelectTrigger id="routeHolder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {routeHolders.map((holder) => (
                    <SelectItem key={holder.id} value={holder.id.toString()}>
                      {holder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={editingClient?.clientName || ""}
                onChange={(e) =>
                  setEditingClient(prev => prev ? { ...prev, clientName: e.target.value } : null)
                }
                placeholder="ABC Home Health"
                required
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={editingClient?.contactName || ""}
                  onChange={(e) =>
                    setEditingClient(prev => prev ? { ...prev, contactName: e.target.value } : null)
                  }
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingClient?.phone || ""}
                  onChange={(e) =>
                    setEditingClient(prev => prev ? { ...prev, phone: e.target.value } : null)
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editingClient?.email || ""}
                onChange={(e) =>
                  setEditingClient(prev => prev ? { ...prev, email: e.target.value } : null)
                }
                placeholder="billing@abchomehealth.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Billing Address</Label>
              <Textarea
                id="address"
                value={editingClient?.address || ""}
                onChange={(e) =>
                  setEditingClient(prev => prev ? { ...prev, address: e.target.value } : null)
                }
                placeholder="123 Main St, City, State ZIP"
                rows={2}
              />
            </div>

            {/* Billing Model */}
            <div className="space-y-2">
              <Label htmlFor="billingModel">Billing Model *</Label>
              <Select
                value={editingClient?.billingModel}
                onValueChange={(value: BillingModel) =>
                  setEditingClient(prev => prev ? { ...prev, billingModel: value } : null)
                }
              >
                <SelectTrigger id="billingModel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mileage">Mileage (per mile)</SelectItem>
                  <SelectItem value="flat_fee">Flat Fee (per route)</SelectItem>
                  <SelectItem value="hourly">Hourly (per hour)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Rates */}
            {editingClient?.billingModel === "mileage" && (
              <div className="space-y-2">
                <Label htmlFor="mileageRate">Mileage Rate ($/mile) *</Label>
                <Input
                  id="mileageRate"
                  type="number"
                  step="0.01"
                  value={editingClient.mileageRate}
                  onChange={(e) =>
                    setEditingClient(prev => prev ? { ...prev, mileageRate: e.target.value } : null)
                  }
                  placeholder="0.65"
                  required
                />
              </div>
            )}

            {editingClient?.billingModel === "flat_fee" && (
              <div className="space-y-2">
                <Label htmlFor="flatFeeAmount">Flat Fee Amount ($) *</Label>
                <Input
                  id="flatFeeAmount"
                  type="number"
                  step="0.01"
                  value={editingClient.flatFeeAmount}
                  onChange={(e) =>
                    setEditingClient(prev => prev ? { ...prev, flatFeeAmount: e.target.value } : null)
                  }
                  placeholder="50.00"
                  required
                />
              </div>
            )}

            {editingClient?.billingModel === "hourly" && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($/hour) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={editingClient.hourlyRate}
                  onChange={(e) =>
                    setEditingClient(prev => prev ? { ...prev, hourlyRate: e.target.value } : null)
                  }
                  placeholder="35.00"
                  required
                />
              </div>
            )}

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={editingClient?.paymentTerms || ""}
                onChange={(e) =>
                  setEditingClient(prev => prev ? { ...prev, paymentTerms: e.target.value } : null)
                }
                placeholder="Net 30"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editingClient?.notes || ""}
                onChange={(e) =>
                  setEditingClient(prev => prev ? { ...prev, notes: e.target.value } : null)
                }
                placeholder="Additional notes about this client"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingClient?.id ? "Update Client" : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
