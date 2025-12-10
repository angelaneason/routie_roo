import React from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function ClientBillingSettings() {
  const [selectedClient, setSelectedClient] = React.useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [rates, setRates] = React.useState<Record<string, string>>({});

  const clientsQuery = trpc.billing.clients.list.useQuery();
  const stopTypesQuery = trpc.stopTypes.list.useQuery();
  const ratesQuery = trpc.billing.clients.getRates.useQuery(
    { clientLabel: selectedClient || "" },
    { enabled: !!selectedClient }
  );

  const updateRatesMutation = trpc.billing.clients.updateRates.useMutation({
    onSuccess: () => {
      toast.success("Billing rates updated! 🦘");
      ratesQuery.refetch();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update rates: ${error.message}`);
    },
  });

  const handleEditClient = (clientLabel: string) => {
    setSelectedClient(clientLabel);
    setEditDialogOpen(true);
    
    // Load existing rates
    const existingRates = ratesQuery.data || [];
    const ratesMap: Record<string, string> = {};
    existingRates.forEach(rate => {
      ratesMap[rate.stopType] = (rate.rate / 100).toFixed(2);
    });
    setRates(ratesMap);
  };

  const handleSaveRates = () => {
    if (!selectedClient) return;

    const ratesArray = Object.entries(rates)
      .filter(([_, value]) => value && parseFloat(value) > 0)
      .map(([stopType, value]) => ({
        stopType,
        rate: Math.round(parseFloat(value) * 100), // Convert to cents
      }));

    updateRatesMutation.mutate({
      clientLabel: selectedClient,
      rates: ratesArray,
    });
  };

  React.useEffect(() => {
    if (ratesQuery.data && selectedClient) {
      const ratesMap: Record<string, string> = {};
      ratesQuery.data.forEach(rate => {
        ratesMap[rate.stopType] = (rate.rate / 100).toFixed(2);
      });
      setRates(ratesMap);
    }
  }, [ratesQuery.data, selectedClient]);

  if (clientsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const clients = clientsQuery.data || [];
  const stopTypes = stopTypesQuery.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Client Billing Rates
        </CardTitle>
        <CardDescription>
          Set billing rates for each client label and stop type. Rates are charged per visit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No client labels found. Add colored labels in the Label Colors tab first.
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: client.color || "#666" }}
                  />
                  <span className="font-medium">{client.label}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClient(client.label)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Set Rates
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set Billing Rates for {selectedClient}</DialogTitle>
              <DialogDescription>
                Enter the rate (in dollars) for each stop type. Leave blank or $0 for stop types you don't bill.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {stopTypes.map((stopType) => (
                <div key={stopType.id} className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor={`rate-${stopType.id}`} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: stopType.color || "#000" }}
                    />
                    {stopType.name}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id={`rate-${stopType.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={rates[stopType.name] || ""}
                      onChange={(e) =>
                        setRates({ ...rates, [stopType.name]: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRates} disabled={updateRatesMutation.isPending}>
                {updateRatesMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Rates
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
