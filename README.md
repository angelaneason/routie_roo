# Routie Roo

**Route planning and execution platform for delivery drivers and field service teams**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-87%20passing-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

---

## Overview

Routie Roo is a comprehensive route planning and execution platform designed for delivery drivers, field service teams, and anyone who needs to visit multiple locations efficiently. It combines contact management, intelligent route optimization, real-time execution tracking, and collaborative features into a single, easy-to-use application.

### Key Features

- **Contact Management** - Import, sync, and manage contacts with addresses
- **Route Optimization** - AI-powered route planning using Google Maps
- **Real-Time Tracking** - Track route execution with status updates
- **Route Sharing** - Share routes with drivers via public links
- **Organization** - Folders, calendars, and custom stop types
- **Mobile-Friendly** - Responsive design works on all devices

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Express 4, tRPC 11, Node.js 22
- **Database:** MySQL 8.0 / TiDB (via Drizzle ORM)
- **Maps:** Google Maps API (Directions, Geocoding, Visualization)
- **Testing:** Vitest (87 tests)
- **Deployment:** Railway (recommended)

---

## Quick Start

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm (latest version)
- MySQL 8.0+ database
- Google Maps API key
- Google OAuth credentials (for contact sync)

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/routie-roo.git
cd routie-roo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## Environment Variables

Required environment variables (see `.env.example` for template):

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | MySQL connection string | Railway MySQL or your DB host |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | [Google Cloud Console](https://console.cloud.google.com) |
| `JWT_SECRET` | Session secret (32+ chars) | Generate with crypto |
| `OAUTH_SERVER_URL` | Your app URL | Your deployment URL |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL | Same as OAUTH_SERVER_URL |

### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Project Structure

```
routie-roo/
├── client/              # React frontend
│   ├── public/          # Static assets
│   └── src/
│       ├── pages/       # Page components
│       ├── components/  # Reusable components
│       ├── hooks/       # Custom React hooks
│       └── lib/         # Utilities and tRPC client
├── server/              # Express backend
│   ├── _core/           # Framework code (don't edit)
│   ├── routers.ts       # tRPC API procedures
│   └── db.ts            # Database queries
├── drizzle/             # Database schema
│   └── schema.ts        # Table definitions
├── shared/              # Shared types and constants
└── tests/               # Unit tests (*.test.ts)
```

---

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests
pnpm lint         # Run linter
pnpm db:push      # Push schema changes to database
pnpm db:studio    # Open database GUI
```

---

## Deployment

### Deploy to Railway (Recommended)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/routie-roo.git
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Add MySQL database**
   - Click "New" → "Database" → "Add MySQL"
   - Railway will auto-configure DATABASE_URL

4. **Set environment variables**
   - Add all variables from `.env.example`
   - Railway dashboard → Variables tab

5. **Deploy**
   - Railway auto-deploys on git push
   - Get your URL from Railway dashboard

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions and alternative platforms.

---

## Documentation

- **[Complete Specification](./ROUTIE_ROO_COMPLETE_SPEC.md)** - Full technical specification
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Deploy to Railway, Render, Vercel, etc.
- **[Database Export Guide](./DATABASE_EXPORT_GUIDE.md)** - Backup and migration
- **[Git Setup Guide](./GIT_SETUP_GUIDE.md)** - Version control setup
- **[User Guide](./USER_GUIDE.md)** - End-user documentation

---

## Features

### Contact Management
- Import contacts from CSV
- Sync with Google Contacts (OAuth required)
- Search and filter by name, phone, address, labels
- Edit contact details
- Toggle active/inactive status
- Call or text directly from app

### Route Planning
- Select contacts for route
- Automatic route optimization
- Manual waypoint reordering
- Custom starting points
- Scheduled dates
- Route folders and calendars
- Route notes

### Route Execution
- Real-time status tracking (pending/complete/missed)
- Mark stops complete with timestamps
- Reschedule missed stops
- Add execution notes
- Bulk status updates
- Progress tracking

### Route Sharing
- Generate public share links
- Driver access without login
- Update status from shared view
- Revoke access anytime

### Organization
- Create folders for routes
- Calendar assignments
- Custom stop types with colors
- Saved starting points
- Auto-archive completed routes

---

## API Documentation

Routie Roo uses tRPC for type-safe API calls. All procedures are defined in `server/routers.ts`.

### Example: List Routes

```typescript
// Frontend
const { data: routes } = trpc.routes.list.useQuery();

// Backend procedure
routes: router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserRoutes(ctx.user.id);
  }),
})
```

See [ROUTIE_ROO_COMPLETE_SPEC.md](./ROUTIE_ROO_COMPLETE_SPEC.md) for complete API reference.

---

## Database Schema

10 tables powered by Drizzle ORM:

- `users` - User accounts and preferences
- `cached_contacts` - Contact information
- `routes` - Route metadata
- `route_waypoints` - Individual stops
- `folders` - Route organization
- `calendars` - Calendar assignments
- `stop_types` - Custom stop categories
- `saved_starting_points` - Saved locations
- `route_notes` - Collaborative notes

See [drizzle/schema.ts](./drizzle/schema.ts) for complete schema.

---

## Testing

87 unit tests covering:

- Authentication and authorization
- Contact management (CRUD, sync, import)
- Route creation and validation
- Route optimization algorithms
- Route execution tracking
- Route sharing (public access)
- Route notes (collaborative features)
- Distance conversion
- Starting points management
- Archive functionality

```bash
# Run all tests
pnpm test

# Test output
Test Files  19 passed (19)
Tests       87 passed (87)
Duration    3.46s
```

---

## Contributing

This is a proprietary project. For feature requests or bug reports, please contact the project owner.

---

## Known Issues

### Critical
- ⚠️ Google People API OAuth not configured (contact sync blocked)
- ⚠️ Google Calendar API OAuth not configured (calendar integration blocked)

**Workaround:** Deploy to Railway/Render where you can configure OAuth yourself.

### Minor
- Starting point markers still numbered (should be anchors)
- GPX/KML export not implemented (planned)
- Bulk operations not available (planned)

See [todo.md](./todo.md) for complete list.

---

## Roadmap

### Short-term (Next Month)
- [ ] Resolve Google OAuth configuration
- [ ] Add route templates feature
- [ ] Implement GPX/KML export
- [ ] Add bulk contact operations

### Medium-term (Next Quarter)
- [ ] Mobile app (React Native)
- [ ] Real-time route tracking
- [ ] Team collaboration features
- [ ] Advanced analytics

### Long-term (Next Year)
- [ ] AI-powered route suggestions
- [ ] Integration with CRM systems
- [ ] Multi-language support
- [ ] Offline mode

---

## Support

- **Documentation:** See docs folder
- **Issues:** Contact project owner
- **Email:** [Your email]

---

## License

Proprietary - All rights reserved

---

## Acknowledgments

Built with:
- [React](https://react.dev) - UI framework
- [tRPC](https://trpc.io) - Type-safe APIs
- [Drizzle ORM](https://orm.drizzle.team) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - Component library
- [Google Maps](https://developers.google.com/maps) - Mapping services

---

**Made with ❤️ for delivery drivers and field service teams**
