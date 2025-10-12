# Deployment Guide: NeuroCanvas to Vercel & Supabase

## Prerequisites
- Your GitHub repository is now up to date with the latest changes
- You need a Vercel account (sign up at https://vercel.com)
- You need a Supabase account (sign up at https://supabase.com)
- You need a LiveKit account (sign up at https://livekit.io)

---

## Part 1: Supabase Setup

### 1. Create a New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Choose your organization
4. Fill in:
   - **Project Name**: `neurocanvas-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"** (this takes ~2 minutes)

### 2. Set Up the Database Schema
1. Once the project is created, go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy and paste the entire contents from your local file: `supabase/schema.sql`
4. Click **"Run"** to execute the SQL
5. Verify: Go to **Table Editor** and you should see these tables:
   - `users`
   - `maps`
   - `versions`
   - `templates`
   - `rooms`

### 3. Get Your Supabase Credentials
1. Go to **Project Settings** (gear icon at bottom left)
2. Click **API** section
3. Copy these values (you'll need them for Vercel):
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon public** key (under "Project API keys")
   - **service_role** key (keep this secret!)

### 4. Configure Authentication
1. Go to **Authentication** > **Providers** in the left sidebar
2. Enable **Email** provider (should be enabled by default)
3. Optional: Configure other providers (Google, GitHub, etc.)
4. Go to **Authentication** > **URL Configuration**
5. Add your site URL (you'll update this after Vercel deployment):
   - Site URL: `http://localhost:3000` (temporary)
   - Redirect URLs: `http://localhost:3000/auth/callback` (temporary)

---

## Part 2: LiveKit Setup (for Voice Calls)

### 1. Create a LiveKit Cloud Account
1. Go to https://cloud.livekit.io/
2. Sign up or log in
3. Create a new project

### 2. Get Your LiveKit Credentials
1. Go to your project settings
2. Copy these values:
   - **WebSocket URL** (e.g., wss://xxxxx.livekit.cloud)
   - **API Key**
   - **API Secret**

---

## Part 3: Vercel Deployment

### 1. Deploy the Client App
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** > **"Project"**
3. Import your GitHub repository: `autonomyowner/Travoicephase3`
4. Click **"Import"**

### 2. Configure Build Settings
When configuring the project:

**Framework Preset**: Next.js

**Root Directory**: Click **"Edit"** and enter:
```
apps/client
```

**Build Command**: (leave default)
```
npm run build
```

**Output Directory**: (leave default)
```
.next
```

**Install Command**: (leave default)
```
npm install
```

### 3. Add Environment Variables
Click on **"Environment Variables"** and add these:

#### Required Variables:

```bash
# Supabase (from Part 1, Step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LiveKit (from Part 2, Step 2)
NEXT_PUBLIC_LIVEKIT_URL=wss://xxxxx.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# API Base URL (Optional - for server API if deployed separately)
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

**Important Notes:**
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are server-side only
- For `NEXT_PUBLIC_API_BASE_URL`: Leave as localhost for now or deploy the server separately

### 4. Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (~2-5 minutes)
3. You'll get a deployment URL like: `https://your-project.vercel.app`

### 5. Update Supabase URLs
1. Go back to your Supabase Dashboard
2. Go to **Authentication** > **URL Configuration**
3. Update:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: Add these (one per line):
     ```
     https://your-project.vercel.app/auth/callback
     https://your-project.vercel.app/login
     https://your-project.vercel.app
     ```

---

## Part 4: Deploy the Server (Optional - for AI features)

### Option A: Deploy to Vercel as a separate project

1. Create a new Vercel project
2. Import the same GitHub repository
3. Set **Root Directory** to: `apps/server`
4. Add environment variables:
   ```bash
   # Supabase
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenRouter API (for AI)
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Port
   PORT=4000
   ```
5. Deploy and copy the URL
6. Go back to your **client** project on Vercel
7. Update the `NEXT_PUBLIC_API_BASE_URL` environment variable with the server URL
8. Redeploy the client

### Option B: Deploy to Railway, Render, or Fly.io

Similar steps, but configure the platform-specific settings accordingly.

---

## Part 5: Verify Deployment

### Test Core Features:

1. **Landing Page**: Visit `https://your-project.vercel.app`
   - Should load the homepage

2. **Authentication**:
   - Click "Sign Up" or "Login"
   - Create an account
   - Verify email authentication works

3. **Mind Maps**:
   - After login, test creating a mind map
   - Test voice-to-text features (if server is deployed)

4. **Voice Rooms**:
   - Go to "Rooms" page
   - Create a new room
   - Test joining the room
   - Test audio connection

5. **Database**:
   - Go to Supabase Dashboard > Table Editor
   - Check that data is being saved in tables

---

## Part 6: Custom Domain (Optional)

### Add a Custom Domain in Vercel:
1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your domain (e.g., `neurocanvas.com`)
4. Follow DNS configuration instructions
5. Update Supabase redirect URLs with the new domain

---

## Troubleshooting

### Build Fails:
- Check build logs in Vercel
- Ensure all environment variables are set
- Verify the root directory is correct: `apps/client`

### Authentication Issues:
- Verify Supabase URL and keys are correct
- Check that redirect URLs are properly configured in Supabase
- Ensure the Site URL matches your deployed domain

### LiveKit/Voice Issues:
- Verify LiveKit credentials are correct
- Check browser console for WebSocket errors
- Ensure LIVEKIT_API_SECRET is set (server-side only)

### Database Connection Issues:
- Check Supabase service status
- Verify the database schema was executed successfully
- Check that Row Level Security (RLS) policies are enabled

### API/Server Issues:
- Check that NEXT_PUBLIC_API_BASE_URL points to the correct server
- Verify server environment variables are set
- Check server logs for errors

---

## Post-Deployment Checklist

- [ ] Landing page loads
- [ ] Sign up/login works
- [ ] Email verification works
- [ ] Can create mind maps
- [ ] Can create voice rooms
- [ ] Voice calls work
- [ ] Data persists in Supabase
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up (Vercel Analytics)

---

## Environment Variables Reference

### Client (Vercel - apps/client):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_LIVEKIT_URL=wss://xxxxx.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_API_BASE_URL=https://your-server.vercel.app (optional)
```

### Server (if deployed separately):
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
PORT=4000
```

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **LiveKit Docs**: https://docs.livekit.io
- **Next.js Docs**: https://nextjs.org/docs

---

## Next Steps After Deployment

1. **Monitor Usage**: Set up Vercel Analytics
2. **Set Up Alerts**: Configure Supabase monitoring
3. **Backup Database**: Set up automated backups in Supabase
4. **Performance**: Optimize images and assets
5. **SEO**: Add metadata and sitemap
6. **Testing**: Run end-to-end tests on production
7. **Documentation**: Update README with live URL

---

**Congratulations! Your NeuroCanvas app is now live!** 🎉

