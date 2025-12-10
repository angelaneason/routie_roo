# Label Color Logic Documentation

## Overview
This document explains how label colors are applied to map markers and waypoint displays throughout the Contact Route Mapper application.

## Core Principle: Client Labels Take Priority

**Client labels are any labels with assigned colors in the `label_colors` table.**  
**Regular labels (like grouping labels) don't have colors assigned.**

### What are Client Labels?
- Labels that have a color assigned in Settings → Label Colors
- Examples: *Abundant (blue), *Applesoft (green), *DeltaCare (purple)
- Used for billing and client identification
- **Always display first** in label lists and as marker colors

### What are Regular Labels?
- Labels without assigned colors
- Examples: ♾️PT/Randy.Harms, Team A, Region North
- Used for grouping and organization
- Display after client labels in sorted order

## Map Marker Color Priority

When a contact has both:
- A client label with assigned color (e.g., *Abundant = blue)
- A stop type with a color (e.g., Visit = indigo)

The marker will display:
- **Fill (center)**: First client label color (blue)
- **Stroke (border)**: Stop type color (indigo)
- **Stroke weight**: 4px (thicker to show both colors clearly)

If no client labels exist:
- **Fill (center)**: Stop type color
- **Stroke (border)**: White
- **Stroke weight**: 2px

## Label Display Order

On contact cards and waypoint cards, labels are sorted:
1. **Client labels first** (labels with assigned colors)
2. **Regular labels second** (labels without colors)

This ensures billing-related client labels are always prominently displayed.

## Implementation Locations

### RouteDetail.tsx (Authenticated View)
- **Line ~431-458**: Main route polyline marker colors
- **Line ~557-583**: Single-stop route marker colors  
- **Line ~625-652**: Last waypoint marker colors (single-stop routes)

### SharedRouteExecution.tsx (Public/Shared View)
- **Line ~139-166**: Shared route marker colors

### SortableWaypointItem.tsx (Waypoint Cards)
- **Line ~180-188**: Label sorting logic (client labels first)

## Simplified Logic Flow

```typescript
// 1. Start with stop type color as default
let fillColor = stopColor;
let strokeColor = "white";
let strokeWeight = 2;

// 2. IMPORTANT: Client labels are any labels with assigned colors in label_colors table.
//    Regular labels (like grouping labels) don't have colors assigned.
//    Priority: Use first colored label (client label) as marker fill, stop type as border.
if (waypoint.contactLabels && labelColorsQuery.data) {
  const labels = JSON.parse(waypoint.contactLabels);
  const normalizeLabel = (label: string) => label.replace(/^\*/, '').toLowerCase().trim();
  
  // 3. Find labels that have assigned colors (these are client labels)
  const labelsWithColors = labels.filter((label: string) => 
    labelColorsQuery.data.some(lc => normalizeLabel(lc.labelName) === normalizeLabel(label))
  );
  
  // 4. Use first colored label (all colored labels are client labels)
  if (labelsWithColors.length > 0) {
    const labelColor = labelColorsQuery.data.find(lc => 
      normalizeLabel(lc.labelName) === normalizeLabel(labelsWithColors[0])
    );
    if (labelColor) {
      fillColor = labelColor.color; // client label color in center
      strokeColor = stopColor; // stop type color as border
      strokeWeight = 4; // thicker border to show both colors
    }
  }
}
```

## Label Sorting Logic

```typescript
// Sort labels: client labels (with colors) first, then regular labels
const sortedLabels = labelColors ? filteredLabels.sort((a, b) => {
  const normalizeLabel = (label: string) => label.replace(/^\*/, '').toLowerCase().trim();
  const aHasColor = labelColors.some(lc => normalizeLabel(lc.labelName) === normalizeLabel(a));
  const bHasColor = labelColors.some(lc => normalizeLabel(lc.labelName) === normalizeLabel(b));
  if (aHasColor && !bHasColor) return -1;
  if (!aHasColor && bHasColor) return 1;
  return 0;
}) : filteredLabels;
```

## Label Normalization
Labels are normalized before matching:
- Remove `*` prefix (Google Contacts system prefix)
- Convert to lowercase
- Trim whitespace

This ensures `"*Abundant"` matches `"*abundant"` or `"Abundant"`.

## Visual Result
- **Marker center**: Client label color (e.g., blue for "*Abundant")
- **Marker border**: Stop type color (e.g., indigo for "visit")
- **Border thickness**: 4px (thicker to make both colors visible)
- **Label order**: Client labels appear first in all label lists

## Maintenance Notes
⚠️ **IMPORTANT**: When updating marker rendering logic, update **ALL THREE** files:
1. RouteDetail.tsx (3 locations for different marker types)
2. SharedRouteExecution.tsx
3. SortableWaypointItem.tsx (for label display order)

The logic must remain identical to ensure consistent behavior across all route views.
