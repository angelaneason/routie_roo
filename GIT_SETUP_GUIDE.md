# Routie Roo - Git Repository Setup Guide

**Date:** November 24, 2025  
**Purpose:** Set up version control for Routie Roo with Git and GitHub

---

## Why Use Git?

Version control with Git provides essential benefits for your Routie Roo project. Git enables you to track every change made to your codebase, creating a complete history that allows you to understand what changed, when it changed, and why. This historical record becomes invaluable when you need to investigate bugs or understand the evolution of features.

Beyond simple tracking, Git serves as a robust backup system. By pushing your code to remote repositories like GitHub, you create off-site backups that protect against local machine failures. This redundancy ensures your work remains safe even in the event of hardware problems or accidental deletions.

Collaboration becomes seamless with Git. Multiple developers can work on different features simultaneously without interfering with each other's work. The branching model allows team members to experiment freely, knowing they can merge successful changes or discard failed experiments without affecting the main codebase.

Finally, Git integrates naturally with modern deployment workflows. Most hosting platforms like Railway, Vercel, and Render automatically deploy your application whenever you push changes to specific branches. This continuous deployment capability streamlines your development process and reduces manual deployment overhead.

---

## Prerequisites

Before setting up Git for Routie Roo, ensure you have the necessary tools and accounts. You will need Git installed on your local machine (download from https://git-scm.com if needed), a GitHub account (sign up at https://github.com if you don't have one), and your Routie Roo source code downloaded and extracted to a local directory.

---

## Step 1: Initialize Local Git Repository

Navigate to your Routie Roo project directory and initialize a Git repository. This creates a `.git` folder that will track all changes to your project.

```bash
cd /path/to/contact-route-mapper
git init
```

You should see output confirming the initialization:
```
Initialized empty Git repository in /path/to/contact-route-mapper/.git/
```

---

## Step 2: Configure Git Identity

Set your name and email for Git commits. This information will be attached to every commit you make, providing attribution and contact information.

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Verify your configuration:
```bash
git config --list
```

---

## Step 3: Create .gitignore File

The `.gitignore` file tells Git which files and directories to exclude from version control. This is crucial for keeping sensitive information and unnecessary files out of your repository.

Create `.gitignore` in your project root:

```bash
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/

# Environment variables (IMPORTANT: Never commit secrets!)
.env
.env.local
.env.production
.env.development

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp

# Database exports (may contain sensitive data)
*.sql
database-export.json
routie-roo-database-export.json

# OS files
Thumbs.db
.DS_Store

# Drizzle
drizzle/

# TypeScript
*.tsbuildinfo

# Misc
.cache/
.parcel-cache/
```

**Important:** The `.env` file contains sensitive API keys and secrets. Never commit it to version control. Instead, use `.env.example` as a template.

---

## Step 4: Create .env.example Template

Create a template file that shows which environment variables are needed without exposing actual values:

```bash
# Copy your .env to .env.example and replace values with placeholders
cp .env .env.example
```

Edit `.env.example` to remove actual secrets:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Google APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_random_secret_key_here

# OAuth Configuration
OAUTH_SERVER_URL=https://your-app-url.com
VITE_OAUTH_PORTAL_URL=https://your-app-url.com

# App Configuration
VITE_APP_TITLE=Routie Roo
VITE_APP_LOGO=/logo.png
NODE_ENV=production
```

This template helps other developers (or future you) understand what environment variables are required without exposing sensitive credentials.

---

## Step 5: Make Initial Commit

Add all files to Git staging area and create your first commit:

```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Routie Roo v1.0

- Complete route planning and execution platform
- 21,400+ lines of code
- 87 passing tests
- Full feature set: contacts, routes, optimization, execution tracking
- Database schema with 10 tables
- 53+ tRPC API procedures
- React frontend with 50+ components
- Comprehensive documentation"
```

This creates a snapshot of your entire project at this point in time. The detailed commit message helps you understand what this version represents.

---

## Step 6: Create GitHub Repository

Now you'll create a remote repository on GitHub to store your code in the cloud.

### Option A: Via GitHub Website (Recommended for Beginners)

1. Go to https://github.com and log in
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Configure your repository:
   - **Repository name:** `routie-roo`
   - **Description:** "Route planning and execution platform for delivery drivers and field service teams"
   - **Visibility:** Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)
5. Click **"Create repository"**

### Option B: Via GitHub CLI

If you have GitHub CLI installed:

```bash
gh repo create routie-roo --private --source=. --remote=origin --push
```

This creates the repository and pushes your code in one command.

---

## Step 7: Connect Local Repository to GitHub

Link your local repository to the GitHub remote:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/routie-roo.git

# Verify remote was added
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/routie-roo.git (fetch)
origin  https://github.com/YOUR_USERNAME/routie-roo.git (push)
```

---

## Step 8: Push Code to GitHub

Upload your local repository to GitHub:

```bash
# Rename default branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

The `-u` flag sets up tracking so future pushes can simply use `git push`.

---

## Step 9: Set Up Branch Protection (Recommended)

Protect your main branch from accidental force pushes or deletions:

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Click **"Add rule"** under "Branch protection rules"
4. Configure:
   - **Branch name pattern:** `main`
   - ✅ **Require pull request reviews before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
5. Click **"Create"**

This prevents direct pushes to main, requiring all changes to go through pull requests.

---

## Git Workflow for Development

### Creating a Feature Branch

When adding new features, create a separate branch:

```bash
# Create and switch to new branch
git checkout -b feature/add-route-templates

# Or use the newer syntax
git switch -c feature/add-route-templates
```

### Making Changes

As you work, commit changes regularly:

```bash
# Check what files changed
git status

# Add specific files
git add client/src/pages/RouteTemplates.tsx
git add server/routers.ts

# Or add all changed files
git add .

# Commit with descriptive message
git commit -m "Add route templates feature

- Create RouteTemplates page component
- Add templates CRUD procedures
- Implement template selection in route creation
- Add tests for template functionality"

# Push branch to GitHub
git push -u origin feature/add-route-templates
```

### Creating a Pull Request

1. Go to your GitHub repository
2. Click **"Pull requests"** → **"New pull request"**
3. Select your feature branch
4. Add title and description
5. Click **"Create pull request"**
6. Review changes and merge when ready

### Merging and Cleanup

After merging your pull request:

```bash
# Switch back to main branch
git checkout main

# Pull latest changes
git pull origin main

# Delete local feature branch
git branch -d feature/add-route-templates

# Delete remote feature branch
git push origin --delete feature/add-route-templates
```

---

## Common Git Commands Reference

### Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View history with graph
git log --graph --oneline --all

# View changes in a specific commit
git show COMMIT_HASH
```

### Checking Status

```bash
# See what files changed
git status

# See detailed changes
git diff

# See staged changes
git diff --staged
```

### Undoing Changes

```bash
# Discard changes in working directory
git checkout -- filename

# Unstage a file
git reset HEAD filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
```

### Branching

```bash
# List all branches
git branch

# Create new branch
git branch feature-name

# Switch to branch
git checkout feature-name

# Create and switch in one command
git checkout -b feature-name

# Delete branch
git branch -d feature-name

# Force delete branch
git branch -D feature-name
```

### Remote Operations

```bash
# View remotes
git remote -v

# Fetch changes from remote
git fetch origin

# Pull changes from remote
git pull origin main

# Push changes to remote
git push origin main

# Push all branches
git push --all origin
```

---

## Commit Message Best Practices

Good commit messages make your project history understandable and useful. Follow these guidelines for clear, informative commits.

### Format

```
Short summary (50 characters or less)

Detailed explanation of what changed and why. Wrap at 72 characters.
Include context that helps future developers understand the reasoning
behind the change.

- Bullet points for multiple changes
- Keep each point focused and clear
- Reference issue numbers if applicable (#123)
```

### Examples

**Good commit messages:**

```
Fix geocoding error in shared route execution

Shared routes were failing to render maps when waypoints had null
coordinates. Added filtering to skip waypoints without lat/lng and
display warning banner to users.

- Filter waypoints with missing coordinates before map rendering
- Add warning banner when some waypoints can't be displayed
- Update tests to cover null coordinate handling

Fixes #42
```

```
Add route re-optimization feature

Implements incremental optimization that finds optimal positions for
newly added stops while preserving manually reordered existing stops.

- Add reoptimizeRoute tRPC procedure
- Implement insertion point algorithm
- Add UI button with loading state
- Write 4 unit tests covering edge cases

Closes #38
```

**Bad commit messages:**

```
fix bug
```

```
update files
```

```
WIP
```

These provide no context about what changed or why, making the history useless for future reference.

---

## Handling Sensitive Data

Accidentally committing secrets to Git is a common and serious mistake. Follow these practices to keep your credentials safe.

### Prevention

The best approach is preventing secrets from ever entering your repository. Use environment variables for all sensitive data, add `.env` to `.gitignore` before your first commit, and use `.env.example` as a template with placeholder values. Never hardcode API keys, passwords, or tokens in your source code.

### If You Accidentally Commit Secrets

If secrets do make it into a commit, act quickly to minimize exposure:

1. **Immediately revoke the compromised credentials**
   - Regenerate API keys
   - Change passwords
   - Revoke OAuth tokens

2. **Remove from Git history**
   ```bash
   # Remove file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push to remote
   git push origin --force --all
   ```

3. **Alternative: Use BFG Repo-Cleaner**
   ```bash
   # Install BFG
   brew install bfg  # Mac
   # or download from https://rtyley.github.io/bfg-repo-cleaner/
   
   # Remove sensitive file
   bfg --delete-files .env
   
   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Verify secrets are removed**
   ```bash
   git log --all --full-history -- .env
   ```

Remember: Once pushed to GitHub, assume the secrets are compromised even after removal. Always regenerate credentials.

---

## Collaborating with Others

When working with a team, establish clear workflows and communication practices.

### Adding Collaborators

1. Go to your GitHub repository
2. Click **Settings** → **Collaborators**
3. Click **"Add people"**
4. Enter GitHub username or email
5. Select permission level (Read, Write, or Admin)

### Code Review Process

Implement a code review workflow to maintain quality. All changes should go through pull requests, with at least one team member reviewing before merging. Reviewers should check for code quality, test coverage, documentation updates, and potential security issues. Use GitHub's review features to request changes, approve, or comment on specific lines.

### Resolving Merge Conflicts

Conflicts occur when two people edit the same lines. Git will mark conflicts in your files:

```javascript
<<<<<<< HEAD
const distanceUnit = 'km';
=======
const distanceUnit = 'miles';
>>>>>>> feature-branch
```

To resolve:

1. Open the conflicted file
2. Decide which version to keep (or combine both)
3. Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Save the file
5. Stage and commit:
   ```bash
   git add conflicted-file.ts
   git commit -m "Resolve merge conflict in distance unit"
   ```

---

## Backup Strategy

Git provides excellent version control, but you should maintain multiple backup locations for critical projects.

### Multiple Remotes

Add backup remotes beyond GitHub:

```bash
# Add GitLab as backup
git remote add gitlab https://gitlab.com/YOUR_USERNAME/routie-roo.git

# Add Bitbucket as backup
git remote add bitbucket https://bitbucket.org/YOUR_USERNAME/routie-roo.git

# Push to all remotes
git push origin main
git push gitlab main
git push bitbucket main
```

### Automated Backups

Set up a cron job to push to multiple remotes daily:

```bash
#!/bin/bash
# backup-git.sh

cd /path/to/routie-roo
git push origin main
git push gitlab main
git push bitbucket main
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-git.sh
```

### Local Backups

Keep local backups separate from your working directory:

```bash
# Create bare repository backup
git clone --mirror https://github.com/YOUR_USERNAME/routie-roo.git routie-roo-backup.git

# Update backup
cd routie-roo-backup.git
git fetch --all
```

---

## Git Hooks for Automation

Git hooks run scripts automatically at certain points in the Git workflow. They help enforce quality standards and automate repetitive tasks.

### Pre-commit Hook

Prevent commits with linting errors or failing tests:

```bash
# Create .git/hooks/pre-commit
#!/bin/bash

echo "Running pre-commit checks..."

# Run linter
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Fix errors before committing."
  exit 1
fi

# Run tests
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Fix tests before committing."
  exit 1
fi

echo "✅ All checks passed!"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Pre-push Hook

Prevent pushing to main branch directly:

```bash
# Create .git/hooks/pre-push
#!/bin/bash

current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

if [ "$current_branch" = "main" ]; then
  echo "❌ Direct push to main branch is not allowed."
  echo "Please create a feature branch and submit a pull request."
  exit 1
fi

exit 0
```

### Using Husky (Recommended)

Husky makes Git hooks easier to manage and share with your team:

```bash
# Install Husky
pnpm add -D husky

# Initialize Husky
pnpm exec husky init

# Add pre-commit hook
echo "pnpm lint && pnpm test" > .husky/pre-commit

# Add pre-push hook
echo "pnpm test" > .husky/pre-push
```

Husky hooks are committed to the repository, so all team members use the same checks.

---

## Advanced Git Techniques

### Rebasing

Rebasing rewrites commit history to create a cleaner, linear history:

```bash
# Rebase feature branch onto main
git checkout feature-branch
git rebase main

# Interactive rebase to squash commits
git rebase -i HEAD~3
```

**Warning:** Never rebase commits that have been pushed to shared branches.

### Cherry-picking

Apply specific commits from one branch to another:

```bash
# Apply commit from feature branch to main
git checkout main
git cherry-pick COMMIT_HASH
```

### Stashing

Temporarily save changes without committing:

```bash
# Stash current changes
git stash

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{2}
```

### Submodules

Include other Git repositories within your project:

```bash
# Add submodule
git submodule add https://github.com/user/repo.git path/to/submodule

# Clone repository with submodules
git clone --recursive https://github.com/YOUR_USERNAME/routie-roo.git

# Update submodules
git submodule update --remote
```

---

## Troubleshooting Common Issues

### "Permission denied (publickey)"

This error occurs when GitHub can't authenticate your SSH key. Solutions include using HTTPS instead of SSH (`https://github.com/user/repo.git`), setting up SSH keys (follow GitHub's SSH key guide), or using GitHub CLI for authentication (`gh auth login`).

### "Merge conflict in..."

Conflicts happen when the same lines are edited in different branches. Resolve by opening the conflicted file, choosing which changes to keep, removing conflict markers, staging the file with `git add`, and committing the resolution.

### "Your branch is ahead of 'origin/main' by X commits"

Your local branch has commits not yet pushed to GitHub. Push your changes with `git push origin main`, or if the remote has changes you don't have, pull first with `git pull origin main` then push.

### "fatal: refusing to merge unrelated histories"

This occurs when trying to merge branches with no common ancestor. Force the merge with `git pull origin main --allow-unrelated-histories`, then resolve any conflicts.

### Large files causing push to fail

GitHub has a 100MB file size limit. For large files, use Git LFS (Large File Storage):

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.psd"
git lfs track "*.mp4"

# Add .gitattributes
git add .gitattributes

# Commit and push
git commit -m "Add Git LFS tracking"
git push
```

---

## Conclusion

Setting up Git and GitHub for Routie Roo provides essential version control, backup, and collaboration capabilities. By following this guide, you have established a professional development workflow that protects your code, enables team collaboration, and integrates seamlessly with modern deployment platforms.

Remember to commit frequently with descriptive messages, never commit sensitive data, use branches for new features, and maintain backups across multiple locations. These practices will serve you well as your project grows and evolves.

---

## Quick Reference Card

```bash
# Initial Setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/user/repo.git
git push -u origin main

# Daily Workflow
git status                    # Check what changed
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push                      # Push to GitHub

# Branching
git checkout -b feature-name  # Create and switch to branch
git checkout main             # Switch to main branch
git merge feature-name        # Merge branch into current branch

# Syncing
git pull                      # Pull latest changes
git fetch                     # Fetch without merging

# Undoing
git checkout -- file          # Discard changes
git reset HEAD file           # Unstage file
git revert COMMIT_HASH        # Revert commit
```

---

*This guide provides comprehensive Git setup and workflow instructions for Routie Roo. For more advanced Git techniques, refer to the official Git documentation at https://git-scm.com/doc.*
