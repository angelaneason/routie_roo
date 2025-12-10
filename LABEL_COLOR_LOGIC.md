# Label Color Logic Documentation

## Overview
Map markers in route views display label colors to help visually identify contacts by their Google Contacts labels.

## Problem
Contacts often have multiple labels:
- **Grouping labels** (e.g., "♾️PT/Randy.Harms" in gray) - used to organize contacts by route holder
- **Classification labels** (e.g., "*Abundant", "*Applesoft") - used to categorize contacts by type/client

The original logic only showed label colors when a contact had **exactly ONE** colored label, which meant contacts with multiple labels always showed the default blue stop type color.

## Solution
The improved logic:
1. Finds all labels that have assigned colors
2. **Prioritizes non-gray labels** (gray is typically used for grouping, not classification)
3. Uses the **first non-gray label color** as the marker fill color
4. Shows the **stop type color as a thicker border** to display both pieces of information

## Implementation
This logic is implemented in **TWO** places (both must be kept in sync):

### 1. RouteDetail.tsx (lines ~430-460 and ~550-590)
- Regular authenticated route view
- Used when viewing routes from the dashboard

### 2. SharedRouteExecution.tsx (lines ~130-170)
- Shared/public route execution view
- Used when viewing routes via share link

## Code Pattern
```typescript
// Helper to normalize label names (remove * prefix, lowercase)
const normalizeLabel = (label: string) => label.replace(/^\*/, '').toLowerCase().trim();

// Find labels that have assigned colors
const labelsWithColors = labels.filter((label: string) => 
  labelColors.some(lc => normalizeLabel(lc.labelName) === normalizeLabel(label))
);

// Use first non-gray label color
if (labelsWithColors.length > 0) {
  const nonGrayLabel = labelsWithColors.find((label: string) => {
    const lc = labelColors.find(lc => normalizeLabel(lc.labelName) === normalizeLabel(label));
    return lc && lc.color.toLowerCase() !== '#808080' && lc.color.toLowerCase() !== '#gray';
  });
  
  const labelToUse = nonGrayLabel || labelsWithColors[0];
  const labelColor = labelColors.find(lc => normalizeLabel(lc.labelName) === normalizeLabel(labelToUse));
  if (labelColor) {
    fillColor = labelColor.color; // label color in center
    strokeColor = stopColor; // stop type color as border
    strokeWeight = 4; // thicker border to show both colors
  }
}
```

## Label Normalization
Labels are normalized before matching:
- Remove `*` prefix (Google Contacts system prefix)
- Convert to lowercase
- Trim whitespace

This ensures `"*Abundant"` matches `"*abundant"` or `"Abundant"`.

## Visual Result
- **Marker center**: Label color (e.g., pink for "*Abundant", red for "*Applesoft")
- **Marker border**: Stop type color (e.g., blue for "visit", green for "pickup")
- **Border thickness**: 4px (thicker to make both colors visible)

## Maintenance Notes
⚠️ **IMPORTANT**: When updating marker rendering logic, update **BOTH** files:
1. RouteDetail.tsx
2. SharedRouteExecution.tsx

The logic must remain identical to ensure consistent behavior across all route views.
