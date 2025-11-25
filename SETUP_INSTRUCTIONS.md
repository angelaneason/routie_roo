# Routie Roo - Setup Instructions (Git + Railway)

**Estimated Time:** 20-30 minutes  
**Difficulty:** Beginner-friendly  
**What You'll Get:** Full Git version control + Live deployment on Railway

---

## Overview

We're going to:
1. ✅ Set up Git on your computer
2. ✅ Create a GitHub repository
3. ✅ Push your code to GitHub (backup!)
4. ✅ Deploy to Railway
5. ✅ Configure environment variables
6. ✅ Test your live app

Let's get started!

---

## Part 1: Set Up Git (10 minutes)

### Step 1.1: Check if Git is Installed

Open your terminal (Mac/Linux) or Command Prompt (Windows) and run:

```bash
git --version
```

**If you see a version number** (like `git version 2.39.0`):
- ✅ Git is installed! Skip to Step 1.3

**If you see "command not found" or error:**
- ⏩ Continue to Step 1.2 to install Git

### Step 1.2: Install Git (if needed)

**On Mac:**
```bash
# Install Homebrew first (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git
```

**On Windows:**
- Download from: https://git-scm.com/download/win
- Run installer with default settings
- Restart terminal after installation

**On Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install git

# Fedora
sudo dnf install git
```

Verify installation:
```bash
git --version
```

### Step 1.3: Configure Git Identity

Tell Git who you are (this will be attached to your commits):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Replace with your actual name and email!**

Verify:
```bash
git config --list
```

You should see your name and email in the output.

---

## Part 2: Download and Prepare Your Code (5 minutes)

### Step 2.1: Download the Source Code

You should have already downloaded `routie-roo-source-code.tar.gz` from our earlier conversation.

### Step 2.2: Extract the Code

**On Mac/Linux:**
```bash
# Navigate to where you downloaded the file
cd ~/Downloads

# Extract
tar -xzf routie-roo-source-code.tar.gz

# Move to a good location (e.g., your projects folder)
mv contact-route-mapper ~/Projects/routie-roo
cd ~/Projects/routie-roo
```

**On Windows:**
- Right-click `routie-roo-source-code.tar.gz`
- Select "Extract All..."
- Move extracted folder to `C:\Projects\routie-roo`
- Open Command Prompt and run:
  ```bash
  cd C:\Projects\routie-roo
  ```

### Step 2.3: Initialize Git Repository

```bash
# Make sure you're in the project directory
pwd  # Should show: .../routie-roo (or contact-route-mapper)

# Initialize Git
git init

# Check status
git status
```

You should see a list of "Untracked files" - that's your code!

### Step 2.4: Make Your First Commit

```bash
# Add all files to Git
git add .

# Create your first commit
git commit -m "Initial commit - Routie Roo v1.0"
```

**Success!** You now have version control locally.

---

## Part 3: Create GitHub Repository (5 minutes)

### Step 3.1: Create GitHub Account (if needed)

If you don't have a GitHub account:
1. Go to https://github.com
2. Click "Sign up"
3. Follow the registration process
4. Verify your email

### Step 3.2: Create New Repository

1. **Log in to GitHub**
2. **Click the "+" icon** in top right
3. **Select "New repository"**

4. **Configure repository:**
   - **Repository name:** `routie-roo`
   - **Description:** "Route planning and execution platform"
   - **Visibility:** 
     - ✅ **Private** (recommended - keeps your code private)
     - ⬜ Public (anyone can see your code)
   - **DO NOT check these boxes:**
     - ⬜ Add a README file
     - ⬜ Add .gitignore
     - ⬜ Choose a license
   
   (We already have these files!)

5. **Click "Create repository"**

### Step 3.3: Connect Local Repository to GitHub

GitHub will show you commands. **Copy the commands under "push an existing repository":**

They should look like this (but with YOUR username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/routie-roo.git
git branch -M main
git push -u origin main
```

**Run these commands in your terminal** (in your project directory).

**You may be asked to log in to GitHub:**
- Enter your GitHub username
- Enter your GitHub password (or personal access token)

**Success!** Your code is now on GitHub. Refresh the GitHub page to see your code.

---

## Part 4: Deploy to Railway (10 minutes)

### Step 4.1: Create Railway Account

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. Complete signup

### Step 4.2: Create New Project

1. **Click "New Project"** in Railway dashboard
2. **Select "Deploy from GitHub repo"**
3. **Choose your `routie-roo` repository**
4. Railway will start deploying automatically

**Wait 2-3 minutes** for initial deployment.

### Step 4.3: Add MySQL Database

1. **In your Railway project**, click **"New"**
2. **Select "Database"** → **"Add MySQL"**
3. Railway will provision a MySQL database
4. **Wait 1-2 minutes** for database to be ready

### Step 4.4: Configure Environment Variables

1. **Click on your web service** (the one that says "routie-roo")
2. **Go to "Variables" tab**
3. **Click "Add Variable"** and add these one by one:

**Required Variables:**

```bash
# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Google OAuth (for contact sync)
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# JWT Secret (generate a random string)
JWT_SECRET=your_random_secret_minimum_32_characters

# App Configuration
VITE_APP_TITLE=Routie Roo
VITE_APP_LOGO=/logo.png
NODE_ENV=production
```

**To generate JWT_SECRET:**

Open a new terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your JWT_SECRET.

**Note:** DATABASE_URL is automatically set by Railway when you added MySQL. You don't need to add it manually.

### Step 4.5: Get Your Railway URL

1. **Go to "Settings" tab** in your web service
2. **Scroll to "Domains"**
3. **Click "Generate Domain"**
4. Railway will give you a URL like: `https://routie-roo-production-abc123.up.railway.app`

**Copy this URL!** You'll need it for the next step.

### Step 4.6: Add OAuth URLs

Go back to **"Variables" tab** and add:

```bash
OAUTH_SERVER_URL=https://your-app-url.up.railway.app
VITE_OAUTH_PORTAL_URL=https://your-app-url.up.railway.app
```

**Replace with your actual Railway URL from Step 4.5!**

### Step 4.7: Redeploy

After adding environment variables:

1. **Go to "Deployments" tab**
2. **Click the three dots** on the latest deployment
3. **Select "Redeploy"**

Wait 2-3 minutes for redeployment.

### Step 4.8: Run Database Migrations

1. **In Railway dashboard**, click on your web service
2. **Go to "Settings" tab**
3. **Scroll to "Deploy Logs"** (or click "View Logs")
4. **Look for the "Console" or "Shell" option**

If Railway doesn't have a built-in shell, you'll need to run migrations locally:

```bash
# In your local terminal
# First, get the DATABASE_URL from Railway Variables tab
export DATABASE_URL="mysql://user:password@host:port/database"

# Run migrations
pnpm db:push
```

---

## Part 5: Configure Google OAuth (10 minutes)

Now that you have your Railway URL, you can configure Google OAuth yourself!

### Step 5.1: Go to Google Cloud Console

1. Visit https://console.cloud.google.com
2. Log in with your Google account

### Step 5.2: Create or Select Project

1. **Click the project dropdown** (top left, next to "Google Cloud")
2. **Click "New Project"**
   - **Project name:** Routie Roo
   - **Click "Create"**
3. **Wait for project creation**, then select it

### Step 5.3: Enable Required APIs

1. **Go to "APIs & Services" → "Library"**
2. **Search for and enable these APIs:**
   - ✅ Google Maps JavaScript API
   - ✅ Google Maps Directions API
   - ✅ Google Maps Geocoding API
   - ✅ Google People API
   - ✅ Google Calendar API

Click "Enable" for each one.

### Step 5.4: Create OAuth Credentials

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "OAuth client ID"**
3. **If prompted**, configure OAuth consent screen:
   - **User Type:** External
   - **App name:** Routie Roo
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **Click "Save and Continue"**
   - **Scopes:** Add these scopes:
     - `https://www.googleapis.com/auth/contacts.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
   - **Click "Save and Continue"**
   - **Test users:** Add your email
   - **Click "Save and Continue"**

4. **Now create OAuth client ID:**
   - **Application type:** Web application
   - **Name:** Routie Roo Web Client
   - **Authorized redirect URIs:** Add these:
     - `https://your-railway-url.up.railway.app/api/oauth/callback`
     - `https://your-railway-url.up.railway.app/api/oauth/google/calendar-callback`
   
   **Replace with your actual Railway URL!**

5. **Click "Create"**
6. **Copy your Client ID and Client Secret**

### Step 5.5: Update Railway Environment Variables

1. **Go back to Railway dashboard**
2. **Variables tab**
3. **Update these variables** with your new credentials:
   - `GOOGLE_CLIENT_ID` = (paste your Client ID)
   - `GOOGLE_CLIENT_SECRET` = (paste your Client Secret)

4. **Redeploy** (Deployments tab → three dots → Redeploy)

---

## Part 6: Test Your App (5 minutes)

### Step 6.1: Visit Your Live App

Open your Railway URL in a browser:
```
https://your-app-url.up.railway.app
```

### Step 6.2: Test Key Features

1. **Log in** (should work with Google OAuth now!)
2. **Try syncing contacts** (should work now!)
3. **Create a test route**
4. **Check if map loads**
5. **Test route optimization**

### Step 6.3: Import Your Data (Optional)

If you want to import your contacts and routes from Manus:

1. **Export from Manus** (follow DATABASE_EXPORT_GUIDE.md)
2. **Import to Railway database**:
   - Use Railway's MySQL client
   - Or use a database tool like MySQL Workbench
   - Connect with the DATABASE_URL from Railway Variables

---

## Part 7: Set Up Continuous Deployment (2 minutes)

Good news: **This is already done!**

Railway automatically deploys when you push to GitHub. Here's how it works:

### Make a Change

```bash
# Edit a file (e.g., change app title)
nano client/src/const.ts

# Commit the change
git add .
git commit -m "Update app title"

# Push to GitHub
git push
```

**Railway automatically:**
1. Detects the push
2. Builds your app
3. Deploys the new version
4. Updates your live site

**No manual deployment needed!**

---

## Troubleshooting

### "Permission denied (publickey)"

**Problem:** Can't push to GitHub

**Solution:** Use HTTPS instead of SSH:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/routie-roo.git
```

### "Build failed" on Railway

**Problem:** Deployment fails

**Solution:**
1. Check Railway logs (Deployments → View Logs)
2. Verify all environment variables are set
3. Make sure DATABASE_URL is present
4. Try redeploying

### "Database connection failed"

**Problem:** App can't connect to database

**Solution:**
1. Verify MySQL database is running in Railway
2. Check DATABASE_URL is set correctly
3. Run `pnpm db:push` to create tables

### OAuth redirect error

**Problem:** "redirect_uri_mismatch" during login

**Solution:**
1. Verify redirect URIs in Google Cloud Console match your Railway URL exactly
2. Make sure OAUTH_SERVER_URL in Railway matches your Railway URL
3. Clear browser cookies and try again

---

## Next Steps

### Immediate
- ✅ Bookmark your Railway dashboard
- ✅ Bookmark your GitHub repository
- ✅ Save your Google Cloud Console project link
- ✅ Test all features thoroughly

### This Week
- 📝 Add your first feature (I can help!)
- 📝 Invite team members to GitHub repo
- 📝 Set up database backups
- 📝 Configure custom domain (optional)

### Ongoing
- 🔄 Push changes to GitHub regularly
- 🔄 Monitor Railway usage and costs
- 🔄 Keep documentation updated
- 🔄 Request new features (I'll build them!)

---

## Quick Reference

### Daily Development Workflow

```bash
# 1. Make changes to code
# (edit files in your editor)

# 2. Test locally
pnpm dev

# 3. Commit changes
git add .
git commit -m "Description of what you changed"

# 4. Push to GitHub
git push

# 5. Railway auto-deploys!
# Check Railway dashboard for deployment status
```

### Useful Commands

```bash
# Check Git status
git status

# View commit history
git log --oneline

# Pull latest changes
git pull

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main

# View Railway logs
# (Use Railway dashboard → Deployments → View Logs)
```

---

## Cost Breakdown

### Railway Costs

- **Free tier:** $5 credit/month
- **Typical usage:** $10-20/month
  - Web service: $5-10/month
  - MySQL database: $5-10/month
- **Scaling:** Automatic, pay for what you use

### Compared to Manus

- **Manus Pro:** $199/month
- **Railway:** $10-20/month
- **Savings:** ~$180/month 💰

---

## Support

**If you get stuck:**

1. **Check the troubleshooting section** above
2. **Review the full guides:**
   - GIT_SETUP_GUIDE.md
   - DEPLOYMENT_GUIDE.md
3. **Ask me for help!** I'm here to assist

**Remember:** I can still help you build features, fix bugs, and improve the app even though it's on Railway now!

---

## Success Checklist

Before you're done, verify:

- [ ] Git is installed and configured
- [ ] Code is pushed to GitHub
- [ ] Railway project is created
- [ ] MySQL database is added
- [ ] All environment variables are set
- [ ] Google OAuth is configured
- [ ] App is live and accessible
- [ ] You can log in
- [ ] Contact sync works
- [ ] Routes can be created
- [ ] Maps load correctly

**If all boxes are checked: 🎉 Congratulations! You're all set!**

---

*Need help with any step? Just ask! I'm here to guide you through the entire process.*
