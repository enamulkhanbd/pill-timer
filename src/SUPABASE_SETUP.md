# Supabase Setup Guide for Pill Timer

## 🎯 Overview

This guide will help you set up Supabase backend for family medication tracking with real-time sync.

## 📋 Prerequisites

- Supabase project already connected via Figma Make
- Project ID: `rcnyrwziftitsalkxtrr`
- Public Anon Key: Already configured

## 🗄️ Database Setup

### Step 1: Create Tables

Go to your Supabase Dashboard → SQL Editor → New Query and run:

```sql
-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  person_name TEXT,
  dosage TEXT,
  time TEXT NOT NULL,
  frequency TEXT,
  duration_days INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication_logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_time TEXT NOT NULL,
  marked_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON medication_logs(taken_at);

-- Enable Row Level Security
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for medications table
CREATE POLICY "Users can view their own medications"
  ON medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medications"
  ON medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications"
  ON medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications"
  ON medications FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for medication_logs table
CREATE POLICY "Users can view their own logs"
  ON medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
  ON medication_logs FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 2: Enable Realtime (Optional but Recommended)

1. Go to Database → Replication
2. Enable replication for:
   - `medications` table
   - `medication_logs` table

This enables real-time sync across all family devices!

## 👤 Authentication Setup

### Email Authentication (Already Enabled)

Email authentication is enabled by default in Supabase. No additional setup needed!

### Optional: Social Login (Google, Apple, etc.)

If you want family members to sign in with Google/Apple:

1. Go to Authentication → Providers
2. Enable desired providers (Google, Apple, etc.)
3. Follow Supabase documentation for OAuth setup:
   - Google: https://supabase.com/docs/guides/auth/social-login/auth-google
   - Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple

⚠️ **Note:** Email confirmation is disabled by default (set to `email_confirm: true` in signup) since you haven't configured an email server. This is fine for personal/family use.

## 🔐 Row Level Security (RLS)

The SQL script above enables RLS to ensure:
- Users can only see their own medications
- Users can only modify their own data
- Family members sharing one account see the same data

## 🚀 How Family Sharing Works

### Option 1: Shared Account (Recommended for Families)

1. Create ONE account (e.g., `smith_family@email.com`)
2. Share login credentials with family members
3. Everyone uses the same login
4. All family members see the same medications
5. Real-time sync when anyone marks medication as taken

**Benefits:**
- Simple setup
- True real-time sync
- Everyone sees the same data
- Perfect for families

### Option 2: Multiple Accounts with Future Sharing (Advanced)

For more complex scenarios, you could build:
- Individual accounts for each family member
- "Family groups" table to link accounts
- Shared medications across family group
- Individual + shared medication views

⚠️ **Note:** Option 2 requires additional development. Start with Option 1!

## 📱 Testing

### Create Test Account

```typescript
// Use the app's Sign Up form or call API directly
POST /make-server-4b5dbeea/auth/signup
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Test Family"
}
```

### Test Real-Time Sync

1. Open app in two different browsers/devices
2. Log in with same account
3. Add medication on Device 1
4. See it appear on Device 2 instantly!
5. Mark as taken on Device 2
6. See status update on Device 1 instantly!

## 🔧 Troubleshooting

### Issue: Can't see medications after adding them

**Solution:** 
- Check browser console for errors
- Verify RLS policies are created
- Ensure user_id matches authenticated user

### Issue: Real-time updates not working

**Solution:**
- Enable Replication for tables in Database → Replication
- Check browser console for WebSocket errors
- Verify publicAnonKey has replication permissions

### Issue: Authentication errors

**Solution:**
- Check that user is logged in (session exists)
- Verify Authorization header is sent with requests
- Check Edge Function logs in Supabase Dashboard

## 📊 Monitoring

### View Logs

1. **Edge Functions:** Functions → server → Logs
2. **Database:** Database → Logs
3. **Authentication:** Authentication → Logs

### Check Usage

- Database → Database Settings → Usage
- Free tier: 500MB database, 2GB bandwidth
- Monitor to ensure you stay within limits

## 🎉 You're Done!

Your Pill Timer app is now connected to Supabase with:
- ✅ User authentication
- ✅ Cloud database
- ✅ Real-time sync
- ✅ Family sharing
- ✅ Secure Row Level Security

Create an account and start tracking your family's medications!

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
