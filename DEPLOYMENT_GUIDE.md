# Routie Roo - Deployment Guide for Alternative Platforms

**Date:** November 24, 2025  
**Purpose:** Deploy Routie Roo to alternative hosting platforms if migrating from Manus

---

## Overview

This guide provides step-by-step instructions for deploying Routie Roo to popular hosting platforms. The application is a full-stack TypeScript application built with React, Express, tRPC, and MySQL/TiDB, making it compatible with most modern hosting providers.

---

## Platform Comparison

| Platform | Best For | Pricing | Database | Deployment | OAuth Support |
|----------|----------|---------|----------|------------|---------------|
| **Vercel** | Frontend-focused apps | Free tier available | External required | Git push | ✅ Full |
| **Railway** | Full-stack apps | $5/month + usage | Built-in PostgreSQL/MySQL | Git push | ✅ Full |
| **Render** | Simple full-stack | Free tier available | Built-in PostgreSQL | Git push | ✅ Full |
| **Fly.io** | Docker apps | Free tier available | External or built-in | CLI deploy | ✅ Full |
| **DigitalOcean App Platform** | Managed apps | $5/month + | Built-in databases | Git push | ✅ Full |
| **AWS (EC2 + RDS)** | Enterprise/custom | Pay-as-you-go | RDS MySQL | Manual/CI/CD | ✅ Full |
| **Heroku** | Quick prototypes | $7/month + | Add-on databases | Git push | ✅ Full |

**Recommendation:** Railway or Render for easiest migration with built-in database support.

---

## Option 1: Deploy to Railway (Recommended)

Railway provides the closest experience to Manus with built-in database support and simple Git-based deployment.

### Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Your Routie Roo source code in a Git repository

### Step 1: Push Code to GitHub

```bash
# Initialize git repository
cd contact-route-mapper
git init
git add .
git commit -m "Initial commit - Routie Roo"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/routie-roo.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `routie-roo` repository
5. Railway will detect the Node.js project automatically

### Step 3: Add MySQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add MySQL"**
2. Railway will provision a MySQL database
3. Connection details will be automatically added as environment variables

### Step 4: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
# Database (auto-provided by Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# Google APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_key_here

# OAuth Configuration
OAUTH_SERVER_URL=https://your-app.railway.app
VITE_OAUTH_PORTAL_URL=https://your-app.railway.app

# App Configuration
VITE_APP_TITLE=Routie Roo
VITE_APP_LOGO=/logo.png
NODE_ENV=production
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Configure Build Settings

Railway should auto-detect settings, but verify:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Root Directory:** `/` (project root)

### Step 6: Deploy

1. Click **"Deploy"** in Railway dashboard
2. Railway will build and deploy your app
3. You'll get a URL like `https://routie-roo.railway.app`

### Step 7: Run Database Migrations

After first deployment:

1. Open Railway **"Terminal"** tab
2. Run migrations:
```bash
pnpm db:push
```

### Step 8: Import Data (Optional)

If migrating from Manus:

1. Export data from Manus (see DATABASE_EXPORT_GUIDE.md)
2. Use Railway's MySQL client or import script
3. Run the import script from Step 7 in Database Export Guide

### Step 9: Configure Google OAuth

1. Go to https://console.cloud.google.com
2. Update OAuth redirect URIs to include:
   - `https://your-app.railway.app/api/oauth/callback`
   - `https://your-app.railway.app/api/oauth/google/calendar-callback`
3. Update environment variables in Railway with new OAuth credentials

### Cost Estimate

- **Free Tier:** $5 free credit/month
- **Typical Usage:** $10-20/month (app + database)
- **Scaling:** Automatic, pay for what you use

---

## Option 2: Deploy to Render

Render offers a similar experience with free tier options.

### Step 1: Push Code to GitHub

Same as Railway Step 1.

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** routie-roo
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Instance Type:** Free or Starter ($7/month)

### Step 3: Add PostgreSQL Database

Render doesn't offer MySQL, so you'll need to:

**Option A: Use External MySQL (PlanetScale, Aiven)**
1. Sign up for PlanetScale (free tier)
2. Create database
3. Get connection string
4. Add to Render environment variables

**Option B: Migrate to PostgreSQL**
1. Create PostgreSQL database in Render
2. Update Drizzle config to use PostgreSQL
3. Update schema imports

### Step 4: Configure Environment Variables

In Render dashboard, add the same environment variables as Railway.

### Step 5: Deploy

Render will automatically deploy on git push to main branch.

### Cost Estimate

- **Free Tier:** Available (with limitations)
- **Starter:** $7/month + database costs
- **Database:** $7/month for PostgreSQL

---

## Option 3: Deploy to Vercel + PlanetScale

Vercel is excellent for frontend but requires external database.

### Step 1: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd contact-route-mapper
vercel
```

Follow prompts to link GitHub and deploy.

### Step 2: Deploy Backend Separately

Vercel Serverless Functions have limitations for tRPC. Options:

**Option A: Use Vercel Serverless Functions**
- Requires refactoring server code
- Limited to 10s execution time (Hobby plan)

**Option B: Deploy Backend to Railway/Render**
- Keep frontend on Vercel
- Backend on Railway
- Update API URLs in frontend

### Step 3: Add PlanetScale Database

1. Sign up at https://planetscale.com
2. Create database
3. Get connection string
4. Add to environment variables

### Cost Estimate

- **Vercel:** Free for hobby projects
- **PlanetScale:** Free tier (1 database)
- **Total:** $0-20/month depending on usage

---

## Option 4: Self-Host on VPS (DigitalOcean, Linode, AWS EC2)

For maximum control and cost efficiency at scale.

### Step 1: Provision VPS

**DigitalOcean Droplet:**
- Size: 2 GB RAM / 2 vCPUs ($18/month)
- OS: Ubuntu 22.04 LTS
- Add managed MySQL database ($15/month)

### Step 2: Install Dependencies

```bash
# SSH into server
ssh root@your-server-ip

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/routie-roo.git
cd routie-roo

# Install dependencies
pnpm install

# Build application
pnpm build

# Set environment variables
nano .env
# (paste environment variables)

# Run migrations
pnpm db:push

# Start with PM2
pm2 start "pnpm start" --name routie-roo
pm2 save
pm2 startup
```

### Step 4: Configure Nginx

```bash
# Install Nginx
apt-get install -y nginx

# Configure reverse proxy
nano /etc/nginx/sites-available/routie-roo
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/routie-roo /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: Add SSL with Let's Encrypt

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### Step 6: Set Up MySQL Database

**Option A: Managed Database (Recommended)**
- Use DigitalOcean Managed MySQL
- Get connection string from dashboard
- Update DATABASE_URL in .env

**Option B: Self-Hosted MySQL**
```bash
apt-get install -y mysql-server
mysql_secure_installation
# Create database and user
```

### Cost Estimate

- **VPS:** $18/month (2GB RAM)
- **Managed MySQL:** $15/month
- **Domain:** $12/year
- **Total:** ~$33/month

---

## Option 5: Docker Deployment (Fly.io, AWS ECS, etc.)

For containerized deployment.

### Step 1: Create Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://user:password@db:3306/routieroo
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=routieroo
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Step 3: Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

### Cost Estimate

- **Fly.io:** Free tier available, ~$10-20/month for production
- **Database:** Add-on or external

---

## Environment Variables Reference

All platforms require these environment variables:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIza...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-...` |
| `JWT_SECRET` | Session secret (32+ chars) | Random hex string |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_TITLE` | Application title | `Routie Roo` |
| `VITE_APP_LOGO` | Logo URL | `/logo.png` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |

---

## Post-Deployment Checklist

After deploying to any platform:

### 1. Verify Deployment
- [ ] Application loads at deployment URL
- [ ] No console errors in browser
- [ ] API endpoints respond correctly

### 2. Configure OAuth
- [ ] Update Google OAuth redirect URIs
- [ ] Test login flow
- [ ] Verify contact sync works
- [ ] Test calendar integration

### 3. Import Data
- [ ] Export data from Manus (if migrating)
- [ ] Import contacts
- [ ] Import routes
- [ ] Verify data integrity

### 4. Test Core Features
- [ ] Contact management (list, search, edit)
- [ ] Route creation and optimization
- [ ] Map visualization
- [ ] Route execution tracking
- [ ] Route sharing (public links)
- [ ] Settings and preferences

### 5. Set Up Monitoring
- [ ] Configure error tracking (Sentry, LogRocket)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable application logs
- [ ] Set up database backups

### 6. Configure Domain (Optional)
- [ ] Purchase custom domain
- [ ] Update DNS records
- [ ] Configure SSL certificate
- [ ] Update OAuth redirect URIs

### 7. Optimize Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Set up database connection pooling

---

## Troubleshooting Common Issues

### Database Connection Fails

**Symptoms:** Application crashes on startup, "Database unavailable" errors

**Solutions:**
- Verify DATABASE_URL format: `mysql://user:password@host:port/database`
- Check database is running and accessible
- Verify firewall rules allow connections
- Test connection with MySQL client

### OAuth Redirect Mismatch

**Symptoms:** "redirect_uri_mismatch" error during login

**Solutions:**
- Update Google OAuth console with new redirect URIs
- Ensure OAUTH_SERVER_URL matches deployment URL
- Check for http vs https mismatch
- Clear browser cookies and try again

### Build Fails

**Symptoms:** Deployment fails during build step

**Solutions:**
- Check build logs for specific errors
- Verify all dependencies are in package.json
- Ensure Node.js version is 22+
- Try building locally first: `pnpm build`

### Environment Variables Not Loading

**Symptoms:** Application uses default values, features don't work

**Solutions:**
- Verify variables are set in platform dashboard
- Check variable names match exactly (case-sensitive)
- Restart application after adding variables
- Use platform CLI to verify: `railway variables` or `vercel env pull`

### High Memory Usage

**Symptoms:** Application crashes with out-of-memory errors

**Solutions:**
- Increase instance size (2GB+ RAM recommended)
- Optimize database queries (add indexes)
- Enable connection pooling
- Monitor memory usage and scale accordingly

---

## Migration Checklist

When migrating from Manus to another platform:

### Before Migration

- [ ] Export all database data
- [ ] Download source code
- [ ] Document current environment variables
- [ ] Test application locally
- [ ] Create backup of everything

### During Migration

- [ ] Set up new hosting platform
- [ ] Configure database
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Run database migrations
- [ ] Import data

### After Migration

- [ ] Test all features thoroughly
- [ ] Update OAuth redirect URIs
- [ ] Update any external integrations
- [ ] Monitor for errors
- [ ] Keep Manus deployment running for 1-2 weeks as backup

### Decommission Old System

- [ ] Verify new system is stable
- [ ] Update DNS if using custom domain
- [ ] Revoke old OAuth credentials
- [ ] Delete Manus project (after final backup)

---

## Cost Comparison

### Monthly Costs by Platform

| Platform | App Hosting | Database | Total |
|----------|-------------|----------|-------|
| **Manus** | Included | Included | $199/month (Pro) |
| **Railway** | $5-10 | $10 | $15-20/month |
| **Render** | $7 | $7 | $14/month |
| **Vercel + PlanetScale** | Free | Free | $0-20/month |
| **DigitalOcean VPS** | $18 | $15 | $33/month |
| **Fly.io** | $10 | External | $20-30/month |

**Recommendation:** Railway or Render offer the best balance of ease-of-use and cost for Routie Roo.

---

## Support Resources

### Platform Documentation

- **Railway:** https://docs.railway.app
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **Fly.io:** https://fly.io/docs
- **DigitalOcean:** https://docs.digitalocean.com

### Community Support

- **Railway Discord:** https://discord.gg/railway
- **Render Community:** https://community.render.com
- **Vercel Discord:** https://vercel.com/discord

### Routie Roo Documentation

- **Complete Specification:** ROUTIE_ROO_COMPLETE_SPEC.md
- **Database Export Guide:** DATABASE_EXPORT_GUIDE.md
- **Git Setup Guide:** GIT_SETUP_GUIDE.md (coming next)

---

## Conclusion

Deploying Routie Roo to alternative platforms is straightforward thanks to its standard Node.js/MySQL stack. Railway and Render offer the smoothest migration path with built-in database support and Git-based deployment. For maximum control and cost efficiency at scale, self-hosting on a VPS is recommended.

Choose the platform that best fits your technical expertise, budget, and scaling requirements. All options support the full feature set of Routie Roo including Google OAuth integration.

---

*This deployment guide covers the most popular hosting platforms. For platform-specific questions, refer to their official documentation or community support channels.*
