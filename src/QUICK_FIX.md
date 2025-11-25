# 🚨 QUICK FIX - Database Table Not Found

## The Error You're Seeing

```
Error: Could not find the table 'public.medications' in the schema cache
PGRST205
```

**This means:** The database tables haven't been created yet!

---

## ✅ Solution (5 Minutes)

### **Step 1: Copy SQL Script**

Open the file `/STEP_1_SQL.sql` in this project and copy ALL the code.

**OR** Copy this SQL directly:

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

### **Step 2: Open Supabase SQL Editor**

Click this link (opens in new tab):
👉 https://supabase.com/dashboard/project/rcnyrwziftitsalkxtrr/sql/new

### **Step 3: Paste and Run**

1. Paste the SQL you copied in Step 1
2. Click the **"RUN"** button (or press `Cmd`+`Enter` on Mac / `Ctrl`+`Enter` on Windows)
3. Wait for "Success" message

### **Step 4: Verify Tables Created**

1. In Supabase Dashboard, click **"Database"** in left sidebar
2. Click **"Tables"**
3. You should now see:
   - ✅ `medications` table
   - ✅ `medication_logs` table

### **Step 5: Enable Real-time (Optional)**

1. Click **"Database"** → **"Replication"**
2. Find `medications` → Toggle **ON**
3. Find `medication_logs` → Toggle **ON**

### **Step 6: Refresh Your App**

Go back to your Pill Timer app and refresh the page (F5 or Cmd+R).

✅ **The errors should be gone!**

---

## 🎉 Now You Can:

- ✅ Sign up / Log in
- ✅ Add medications with person names
- ✅ Mark as taken
- ✅ See real-time sync across devices

---

## 🐛 Still Having Issues?

### Error: "Invalid login credentials"
- **Cause:** You tried to log in before creating an account
- **Fix:** Click "Sign Up" instead and create a new account first

### Error: "Failed to fetch medications"
- **Cause:** Tables still not created
- **Fix:** Double-check you ran the SQL in Supabase Dashboard (steps above)

### Error: Real-time not working
- **Cause:** Replication not enabled
- **Fix:** Go to Database → Replication and toggle ON for both tables

---

## 💡 Why Did This Happen?

The Supabase backend setup requires you to create the database tables manually. This is a one-time setup step that Supabase requires for security reasons.

Once you've run the SQL once, you'll never need to do it again! Your tables are permanent.

---

## 📖 Full Guide

For more detailed instructions, see `/SETUP_INSTRUCTIONS.md`

---

**Need more help?** Check the browser console (F12) for specific error messages.
