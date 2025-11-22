# Contact Route Mapper - User Guide

## Overview

Contact Route Mapper is a web application that creates optimized driving routes from your Gmail contacts. Perfect for sales professionals, service providers, real estate agents, and anyone who needs to visit multiple locations efficiently.

## Features

✅ **Gmail Integration** - Sync contacts directly from your Google account  
✅ **Smart Route Optimization** - Automatically finds the most efficient order  
✅ **Interactive Maps** - Visual route display with turn-by-turn directions  
✅ **Easy Sharing** - Share routes via link or open directly in Google Maps  
✅ **Mobile Friendly** - Works on desktop and mobile browsers  

---

## Getting Started

### 1. Sign In

Visit the application URL and click **"Sign in to Get Started"**. You'll be authenticated using Manus OAuth.

### 2. Sync Your Contacts

On the home page, click the **"Sync Contacts"** button. This will:

1. Redirect you to Google's authorization page
2. Ask for permission to read your contacts (read-only access)
3. Import all contacts that have addresses
4. Cache them in the database for faster access

**Note:** Only contacts with valid addresses will be imported.

### 3. Create a Route

#### Step 1: Select Contacts
- Browse your synced contacts in the left panel
- Click the checkbox next to each contact you want to visit
- You need at least **2 contacts** to create a route

#### Step 2: Name Your Route
- Enter a descriptive name (e.g., "Client Visits - Monday")
- This helps you identify routes later

#### Step 3: Generate
- Click **"Create Route"** button
- The app will:
  - Calculate the optimal order to visit all locations
  - Compute total distance and estimated time
  - Generate an interactive map with the route

### 4. View Your Route

After creating a route, you'll see:

**Map View**
- Interactive Google Map showing your route
- Blue polyline connecting all waypoints
- Numbered markers for each stop

**Route Details**
- Total distance (in kilometers)
- Estimated driving time (in minutes)
- Number of stops

**Waypoints List**
- Ordered list of stops (optimized)
- Contact names and addresses
- Position numbers

### 5. Share Your Route

You have two sharing options:

#### Option 1: Copy Share Link
- Click **"Copy Link"** button
- Share the URL with anyone
- They can view the route without logging in

#### Option 2: Open in Google Maps
- Click **"Open in Google Maps"** button
- Opens the route in Google Maps app/website
- Ready for immediate navigation
- Works on mobile devices

---

## Tips & Best Practices

### Route Planning

**Optimal Number of Stops**
- Desktop: Up to 9 waypoints for Google Maps URLs
- Mobile: Up to 3 waypoints for Google Maps URLs
- App display: Unlimited waypoints

**Address Quality**
- Ensure contacts have complete addresses
- Include street, city, state, and zip code
- Google Maps works best with detailed addresses

### Contact Management

**Refreshing Contacts**
- Click **"Refresh"** to re-sync from Gmail
- Updates are cached for faster loading
- Useful when you add new contacts

**Privacy**
- Contact names are stored in the database
- Addresses are used for route calculation
- No data is shared without your permission

### Route Organization

**Naming Convention**
- Use descriptive names: "Monday Sales Calls"
- Include dates: "Property Showings - Jan 15"
- Add context: "North Region Deliveries"

**Saved Routes**
- All routes are saved automatically
- Access them from the "Your Routes" panel
- Click any route to view details

---

## Common Use Cases

### Sales Professionals
1. Sync contacts with client addresses
2. Select clients to visit this week
3. Generate optimized route
4. Share with team members
5. Navigate using Google Maps

### Service Providers
1. Import customer addresses
2. Plan daily service routes
3. Minimize driving time
4. Update routes as needed
5. Track completed visits

### Real Estate Agents
1. Add property addresses to contacts
2. Create showing routes
3. Share with clients
4. Optimize for time efficiency
5. Navigate between properties

### Event Planning
1. Sync venue contacts
2. Plan site visit routes
3. Share with team
4. Calculate travel time
5. Coordinate schedules

---

## Troubleshooting

### Contacts Not Syncing

**Problem:** "Sync Contacts" doesn't work  
**Solutions:**
- Check Google OAuth permissions
- Ensure contacts have addresses
- Try refreshing the page
- Clear browser cache

### Route Creation Fails

**Problem:** "Failed to create route" error  
**Solutions:**
- Verify at least 2 contacts selected
- Check addresses are valid
- Ensure Google Maps API key is configured
- Try with fewer waypoints

### Map Not Displaying

**Problem:** Map shows blank or loading  
**Solutions:**
- Check internet connection
- Verify Google Maps API key
- Refresh the page
- Try a different browser

### Sharing Not Working

**Problem:** Share link doesn't open  
**Solutions:**
- Ensure route is set to public
- Copy the full URL
- Check recipient has internet access
- Try opening in incognito mode

---

## Technical Details

### APIs Used

**Google People API**
- Scope: `contacts.readonly`
- Purpose: Fetch contact addresses
- Permission: Read-only access

**Google Maps Routes API**
- Purpose: Calculate optimized routes
- Features: Traffic-aware routing
- Optimization: Automatic waypoint ordering

**Google Maps JavaScript API**
- Purpose: Display interactive maps
- Features: Directions rendering
- Libraries: Marker, Directions

### Data Storage

**Database Tables**
- `routes`: Stores route metadata
- `route_waypoints`: Individual stops
- `cached_contacts`: Synced contacts
- `users`: User authentication

**Privacy**
- All data is encrypted
- Contacts are cached locally
- Share links can be private or public
- No data sold to third parties

### Browser Compatibility

**Supported Browsers**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Support**
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

---

## Frequently Asked Questions

### Q: Is my contact data safe?

**A:** Yes. We only request read-only access to your contacts. Data is stored securely in an encrypted database and never shared without your permission.

### Q: Can I use this offline?

**A:** No. The app requires internet connection to sync contacts and calculate routes using Google's APIs.

### Q: How many contacts can I sync?

**A:** Unlimited. The app will sync all contacts that have addresses.

### Q: How many waypoints can a route have?

**A:** The app supports unlimited waypoints. However, Google Maps URLs are limited to 9 waypoints on desktop and 3 on mobile.

### Q: Can I edit a route after creating it?

**A:** Currently, routes cannot be edited. You can create a new route with different selections.

### Q: Do shared routes expire?

**A:** No. Share links remain active indefinitely unless you delete the route.

### Q: Can I export routes to GPS devices?

**A:** Export to GPX and KML formats is planned for a future update.

### Q: Does this work internationally?

**A:** Yes. Google Maps supports addresses worldwide.

---

## Support

For technical issues, feature requests, or questions:

1. Check this guide first
2. Review the troubleshooting section
3. Contact your system administrator
4. Submit feedback at https://help.manus.im

---

## Version History

**v1.0.0** - Initial Release
- Gmail contact sync
- Route optimization
- Interactive maps
- Share functionality
- Mobile support

---

## Credits

Built with:
- React 19
- Google Maps API
- Google People API
- tRPC
- Tailwind CSS
- Drizzle ORM

Powered by Manus Platform
