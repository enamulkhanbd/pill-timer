# 🚀 Deployment Guide

## Step-by-Step Guide to Upload to GitHub

### 1️⃣ Initial Setup (One-time)

If you haven't already cloned the repository, do this first:

```bash
# Clone your empty repository
git clone https://github.com/enamulkhanbd/pill-timer.git
cd pill-timer
```

### 2️⃣ Copy All Files

Copy all the files from your current Figma Make project to the cloned repository folder. This includes:

**Essential Files:**
- `App.tsx` - Main application
- `main.tsx` - Entry point
- `index.html` - HTML template
- `package.json` - Dependencies
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript config
- `README.md` - Documentation
- `LICENSE` - MIT License
- `.gitignore` - Git ignore rules

**Folders:**
- `components/` - All UI components
- `styles/` - CSS files
- `public/` - Static assets

**PWA Files:**
- `manifest.json` - PWA configuration
- `sw.js` - Service Worker

### 3️⃣ Initialize and Push to GitHub

```bash
# Navigate to your project folder
cd pill-timer

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: Pill Timer v1.0 - Full medication management app"

# Add remote origin (if not already added)
git remote add origin https://github.com/enamulkhanbd/pill-timer.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4️⃣ Verify Upload

Go to your GitHub repository:
https://github.com/enamulkhanbd/pill-timer

You should see all your files uploaded!

---

## 🌐 Deploy to Production

### Option 1: Vercel (Recommended - Free & Easy)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up with your GitHub account

2. **Import Project**
   - Click "Add New Project"
   - Select your `pill-timer` repository
   - Click "Import"

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Your app will be live at `https://pill-timer.vercel.app`

### Option 2: Netlify (Alternative)

1. **Go to Netlify**
   - Visit https://netlify.com
   - Sign up with your GitHub account

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Select GitHub
   - Choose your `pill-timer` repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Deploy**
   - Click "Deploy site"
   - Your app will be live at `https://pill-timer.netlify.app`

### Option 3: GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   Add these scripts:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://enamulkhanbd.github.io/pill-timer"
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages
   - Source: `gh-pages` branch
   - Your app will be at `https://enamulkhanbd.github.io/pill-timer`

---

## 🔧 Environment Setup

### Prerequisites

Make sure you have these installed:
- Node.js v16 or higher
- npm v8 or higher
- Git

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 📝 Quick Commands Reference

```bash
# Clone repository
git clone https://github.com/enamulkhanbd/pill-timer.git

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

---

## 🆘 Troubleshooting

### Problem: "Permission denied" when pushing to GitHub

**Solution:** Set up SSH keys or use personal access token
```bash
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/enamulkhanbd/pill-timer.git
```

### Problem: Build fails on deployment

**Solution:** Check Node.js version
- Ensure Node.js 16+ is specified in deployment settings
- Add `"engines": { "node": ">=16.0.0" }` to package.json

### Problem: PWA not installing

**Solution:** 
- Ensure HTTPS is enabled (Vercel/Netlify provide this automatically)
- Check Service Worker registration in browser console
- Verify manifest.json is accessible

---

## 📱 Testing PWA Installation

### Desktop (Chrome/Edge)
1. Open the deployed app
2. Look for install icon in address bar
3. Click "Install"

### Mobile (Android Chrome)
1. Open the deployed app
2. Tap menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

### Mobile (iOS Safari)
1. Open the deployed app
2. Tap Share button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

---

## 🎯 Next Steps After Deployment

1. **Share your app:**
   - Copy the deployment URL
   - Share with friends/family for testing

2. **Monitor usage:**
   - Check Vercel/Netlify analytics
   - Monitor error logs

3. **Add custom domain (optional):**
   - Purchase a domain
   - Configure DNS settings in deployment platform

4. **Enable analytics (optional):**
   - Add Google Analytics
   - Track user engagement

---

## 📧 Need Help?

If you encounter any issues:
1. Check the GitHub Issues page
2. Review deployment platform documentation
3. Open a new issue with error details

Happy deploying! 🚀
