import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, CheckCircle, Clock, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Billing() {
  const [selectedRouteHolder, setSelectedRouteHolder] = useState<number | "all">("all");
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; recordId?: number }>({ open: false });
  const [paymentMethod, setPaymentMethod] = useState("");

  const utils = trpc.useUtils();

  // Fetch data
  const { data: billingRecords = [], isLoading: recordsLoading } = trpc.billing.records.list.useQuery();
  const { data: routeHolders = [], isLoading: holdersLoading } = trpc.billing.clients.list.useQuery();
  const { data: clients = [] } = trpc.billing.clients.list.useQuery();

  // Mutations
  const markPaidMutation = trpc.billing.records.markPaid.useMutation({
    onSuccess: () => {
      utils.billing.records.list.invalidate();
      toast.success("Payment recorded successfully");
      setPaymentDialog({ open: false });
      setPaymentMethod("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const generateInvoiceMutation = trpc.billing.records.generateInvoice.useMutation({
    onSuccess: (data) => {
      utils.billing.records.list.invalidate();
      toast.success(`Invoice ${data.invoiceNumber} generated`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate invoice");
    },
  });

  // Filter records by route holder
  const filteredRecords = selectedRouteHolder === "all"
    ? billingRecords
    : billingRecords.filter(r => r.routeHolderId === selectedRouteHolder);

  // Get unique route holders from billing records
  const uniqueRouteHolders = Array.from(
    new Set(billingRecords.map(r => r.routeHolderId))
  ).map(id => {
    const record = billingRecords.find(r => r.routeHolderId === id);
    return { id, name: record ? getRouteHolderName(id) : "Unknown" };
  });

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const getBillingModelLabel = (model: string) => {
    switch (model) {
      case "mileage": return "Mileage";
      case "flat_fee": return "Flat Fee";
      case "per_visit": return "Per Visit";
      case "hourly": return "Hourly";
      default: return model;
    }
  };

  const getClientName = (clientId: number) => {
    return clients.find(c => c.id === clientId)?.clientName || "Unknown Client";
  };

  const getRouteHolderName = (routeHolderId: number) => {
    // Find client with this route holder to get the name
    const client = clients.find(c => c.routeHolderId === routeHolderId);
    if (client) {
      // Get route holder details from the route holders list
      const holder = routeHolders.find(h => h.routeHolderId === routeHolderId);
      return holder ? `Route Holder ${routeHolderId}` : "Unknown";
    }
    return "Unknown";
  };

  const handleMarkPaid = () => {
    if (!paymentDialog.recordId || !paymentMethod) return;
    
    markPaidMutation.mutate({
      id: paymentDialog.recordId,
      paymentMethod,
      paidAt: new Date(),
    });
  };

  const handleGenerateInvoice = (recordId: number) => {
    generateInvoiceMutation.mutate({ id: recordId });
  };

  const handleDownloadInvoice = (record: typeof billingRecords[0]) => {
    // TODO: Implement PDF generation in next phase
    toast.info("Invoice download will be available soon");
  };

  // Calculate totals
  const totalBilled = filteredRecords.reduce((sum, r) => sum + (r.calculatedAmount || 0), 0);
  const totalPaid = filteredRecords.filter(r => r.paidAt).reduce((sum, r) => sum + (r.calculatedAmount || 0), 0);
  const totalUnpaid = totalBilled - totalPaid;

  if (recordsLoading || holdersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading billing records...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Billing Records</h1>
          <p className="text-muted-foreground">View and manage billing for completed visits</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Billed</div>
          <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Outstanding</div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalUnpaid)}</div>
        </div>
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
            {uniqueRouteHolders.map((holder) => (
              <SelectItem key={holder.id} value={holder.id.toString()}>
                {holder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Billing Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No billing records yet</h3>
          <p className="text-muted-foreground">
            {selectedRouteHolder === "all"
              ? "Billing records will appear here when visits are completed"
              : "No billing records for this route holder"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-sm">
                    {record.invoiceNumber || (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => handleGenerateInvoice(record.id)}
                      >
                        Generate
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(record.visitDate)}</TableCell>
                  <TableCell className="font-medium">{record.contactName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.visitType || "Visit"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{record.routeName}</TableCell>
                  <TableCell>{getClientName(record.clientId)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getBillingModelLabel(record.billingModel)}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(record.calculatedAmount)}</TableCell>
                  <TableCell>
                    {record.paidAt ? (
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Unpaid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {record.invoiceNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(record)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {!record.paidAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentDialog({ open: true, recordId: record.id })}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mark Paid Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter payment details to mark this invoice as paid
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={!paymentMethod || markPaidMutation.isPending}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
