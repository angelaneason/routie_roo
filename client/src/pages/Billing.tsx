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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const [selectedClient, setSelectedClient] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");

  const utils = trpc.useUtils();

  // Fetch data
  const { data: billingRecords = [], isLoading: recordsLoading } = trpc.billing.records.list.useQuery({
    clientLabel: selectedClient !== "all" ? selectedClient : undefined,
    status: selectedStatus !== "all" ? (selectedStatus as "completed" | "missed" | "rescheduled") : undefined,
  });
  const { data: summaryData = [], isLoading: summaryLoading } = trpc.billing.records.summary.useQuery();
  const { data: clients = [] } = trpc.billing.clients.list.useQuery();

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "missed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Missed</Badge>;
      case "rescheduled":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const totalBilled = summaryData.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCompleted = summaryData.reduce((sum, s) => sum + s.completedCount, 0);
  const totalMissed = summaryData.reduce((sum, s) => sum + s.missedCount, 0);

  if (recordsLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Track visits and billing by client</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
            <p className="text-xs text-muted-foreground">From completed visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompleted}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed Visits</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMissed}</div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Summary */}
      {summaryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary by Client</CardTitle>
            <CardDescription>Billing breakdown for each client label</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Missed</TableHead>
                  <TableHead className="text-right">Rescheduled</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map((summary) => {
                  const client = clients.find(c => c.label === summary.clientLabel);
                  return (
                    <TableRow key={summary.clientLabel}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {client && (
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: client.color || "#666" }}
                            />
                          )}
                          {summary.clientLabel}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{summary.completedCount}</TableCell>
                      <TableCell className="text-right">{summary.missedCount}</TableCell>
                      <TableCell className="text-right">{summary.rescheduledCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(summary.totalAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Records</CardTitle>
          <CardDescription>Detailed list of all visits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Filter by Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.label}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: client.color || "#666" }}
                        />
                        {client.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Records Table */}
          {billingRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No billing records found
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Stop Type</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Route Holder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingRecords.map((record) => {
                    const client = clients.find(c => c.label === record.clientLabel);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {client && (
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: client.color || "#666" }}
                              />
                            )}
                            <span className="font-medium">{record.clientLabel || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.contactName}</TableCell>
                        <TableCell>{record.visitType || "Visit"}</TableCell>
                        <TableCell>{formatDate(record.visitDate)}</TableCell>
                        <TableCell>{record.routeHolderName || "Unknown"}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.calculatedAmount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
