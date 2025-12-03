import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAllAddresses, getAddressTypeIcon, getAddressTypeLabel } from "@/lib/addressHelpers";
import type { ContactAddress } from "@/lib/addressHelpers";

interface AddressSelectorProps {
  contactName: string;
  addressesJson: string | null;
  open: boolean;
  onSelect: (address: ContactAddress) => void;
  onCancel: () => void;
}

export function AddressSelector({ contactName, addressesJson, open, onSelect, onCancel }: AddressSelectorProps) {
  const addresses = getAllAddresses(addressesJson);

  if (addresses.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Address for {contactName}</DialogTitle>
          <DialogDescription>
            This contact has multiple addresses. Which one would you like to visit?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {addresses.map((addr, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => onSelect(addr)}
            >
              <div className="flex items-start gap-3 w-full text-left">
                <span className="text-2xl mt-0.5">{getAddressTypeIcon(addr.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">
                      {getAddressTypeLabel(addr.type)}
                    </span>
                    {addr.isPrimary && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-words">
                    {addr.formattedValue}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
