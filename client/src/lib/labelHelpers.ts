/**
 * Utility functions for working with contact labels
 */

/**
 * Check if a string starts with an emoji
 * Uses Unicode ranges for common emoji blocks
 */
export function startsWithEmoji(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  // Check for common emoji patterns and special characters
  // Covers most emoji ranges and special symbols like * ⭐ 🎯 etc.
  const firstChar = text.charCodeAt(0);
  
  // Special symbols often used as emoji-like prefixes (*, ⭐, etc.)
  if (firstChar === 42 || firstChar === 9733 || firstChar === 9734) return true; // * ★ ☆
  
  // Emoji ranges (simplified for ES5 compatibility)
  // Emoticons: 0x1F600-0x1F64F
  // Misc Symbols: 0x1F300-0x1F5FF
  // Transport: 0x1F680-0x1F6FF
  // Flags: 0x1F1E6-0x1F1FF
  // Dingbats: 0x2700-0x27BF
  if (firstChar >= 0x1F300 && firstChar <= 0x1F9FF) return true;
  if (firstChar >= 0x2700 && firstChar <= 0x27BF) return true;
  if (firstChar >= 0x2600 && firstChar <= 0x26FF) return true;
  
  // Check for surrogate pairs (emoji often use these)
  if (firstChar >= 0xD800 && firstChar <= 0xDBFF) {
    return true; // High surrogate, likely emoji
  }
  
  return false;
}

/**
 * Sort labels with emoji-prefixed labels first, then alphabetically
 * 
 * Sorting order:
 * 1. Labels starting with emoji (sorted alphabetically)
 * 2. Labels starting with text (sorted alphabetically)
 * 
 * Example:
 * Input: ["Zebra", "*Abundant", "Apple", "*Universal", "🎯 Target"]
 * Output: ["*Abundant", "*Universal", "🎯 Target", "Apple", "Zebra"]
 */
export function sortLabelsSmartly(labels: string[]): string[] {
  const emojiLabels: string[] = [];
  const textLabels: string[] = [];
  
  // Separate labels into emoji and text groups
  labels.forEach(label => {
    if (startsWithEmoji(label)) {
      emojiLabels.push(label);
    } else {
      textLabels.push(label);
    }
  });
  
  // Sort each group alphabetically (case-insensitive)
  emojiLabels.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  textLabels.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  
  // Emoji labels first, then text labels
  return [...emojiLabels, ...textLabels];
}

/**
 * Extract and sort unique labels from contacts
 * Filters out system labels and applies smart sorting
 */
export function extractAndSortLabels(contacts: Array<{ labels?: string | null }>): string[] {
  const labelSet = new Set<string>();
  
  contacts.forEach(contact => {
    if (!contact.labels) return;
    
    try {
      const labels = JSON.parse(contact.labels);
      labels
        .map((label: string) => {
          // Extract name from contactGroups/xxx format
          if (label.startsWith('contactGroups/')) {
            return label.split('/').pop() || '';
          }
          return label;
        })
        .filter((label: string) => {
          const lower = label.toLowerCase();
          // Filter out system labels and hex IDs
          const isHexId = /^[0-9a-f]{12,}$/i.test(label);
          return lower !== 'mycontacts' && lower !== 'starred' && label.trim() !== '' && !isHexId;
        })
        .forEach((label: string) => labelSet.add(label));
    } catch (e) {
      // Ignore parse errors
    }
  });
  
  return sortLabelsSmartly(Array.from(labelSet));
}
