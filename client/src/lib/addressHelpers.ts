/**
 * Address helper functions for handling multiple addresses per contact
 */

export interface ContactAddress {
  type: string;
  formattedValue: string;
  isPrimary: boolean;
  latitude: string | null;
  longitude: string | null;
}

/**
 * Get the primary address from a contact's addresses array
 * Priority: primary flag > home > work > first available
 */
export function getPrimaryAddress(addressesJson: string | null): ContactAddress | null {
  if (!addressesJson) return null;
  
  try {
    const addresses: ContactAddress[] = JSON.parse(addressesJson);
    if (!addresses || addresses.length === 0) return null;
    
    // Find primary address
    const primary = addresses.find(a => a.isPrimary);
    if (primary) return primary;
    
    // Find home address
    const home = addresses.find(a => a.type === 'home');
    if (home) return home;
    
    // Find work address
    const work = addresses.find(a => a.type === 'work');
    if (work) return work;
    
    // Return first address
    return addresses[0] || null;
  } catch (e) {
    console.error('Failed to parse addresses:', e);
    return null;
  }
}

/**
 * Get all addresses from a contact
 */
export function getAllAddresses(addressesJson: string | null): ContactAddress[] {
  if (!addressesJson) return [];
  
  try {
    const addresses: ContactAddress[] = JSON.parse(addressesJson);
    return addresses || [];
  } catch (e) {
    console.error('Failed to parse addresses:', e);
    return [];
  }
}

/**
 * Get address type icon emoji
 */
export function getAddressTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'home':
      return '🏠';
    case 'work':
      return '🏢';
    case 'other':
      return '📍';
    default:
      return '📍';
  }
}

/**
 * Get address type label (capitalized)
 */
export function getAddressTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Check if contact has multiple addresses
 */
export function hasMultipleAddresses(addressesJson: string | null): boolean {
  const addresses = getAllAddresses(addressesJson);
  return addresses.length > 1;
}
