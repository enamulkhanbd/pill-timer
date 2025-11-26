# Pill Timer - Supabase Integration Guide

## 🎯 What's Been Set Up

Your Pill Timer app is now connected to Supabase with:

### ✅ Backend Infrastructure
- **Supabase Client** (`/utils/supabase/client.tsx`) - Frontend Supabase connection
- **API Client** (`/utils/api.tsx`) - HTTP API calls to backend
- **Auth Module** (`/supabase/functions/server/auth.tsx`) - User authentication
- **Database Module** (`/supabase/functions/server/database.tsx`) - CRUD operations
- **Server API** (`/supabase/functions/server/index.tsx`) - REST API endpoints
- **Auth UI** (`/components/Auth.tsx`) - Login/signup interface
- **Setup UI** (`/components/DatabaseSetup.tsx`) - Database initialization guide

### 📡 API Endpoints Available

All endpoints are prefixed with: `https://rcnyrwziftitsalkxtrr.supabase.co/functions/v1/make-server-4b5dbeea`

#### Authentication
- `POST /auth/signup` - Create new account
- (Sign in handled by Supabase Auth directly)

#### Medications
- `GET /medications` - Get all medications (requires auth)
- `POST /medications` - Add medication (requires auth)
- `PUT /medications/:id` - Update medication (requires auth)
- `DELETE /medications/:id` - Delete medication (requires auth)

#### Medication Logs
- `GET /logs/today?date=YYYY-MM-DD` - Get today's logs (requires auth)
- `POST /logs` - Mark medication as taken (requires auth)
- `DELETE /logs/:medicationId?date=YYYY-MM-DD` - Unmark medication (requires auth)

## 🔄 Migration Strategy

You have two options:

### Option A: Big Bang Migration (Recommended)
Replace the entire App.tsx with Supabase-integrated version

**Pros:**
- Clean implementation
- All features work with Supabase from day 1
- Easier to maintain

**Cons:**
- More initial work
- Need to test thoroughly

### Option B: Gradual Migration
Keep localStorage, add Supabase alongside, migrate piece by piece

**Pros:**
- Less risky
- Can test incrementally

**Cons:**
- More complex code
- Temporary dual data storage

## 🚀 Quick Start Implementation

### Step 1: Set Up Database

Run the SQL from `/SUPABASE_SETUP.md` in your Supabase SQL Editor.

### Step 2: Update App.tsx Structure

Add these imports at the top:

```typescript
import { supabase } from './utils/supabase/client.tsx';
import { api } from './utils/api.tsx';
import { Auth } from './components/Auth.tsx';
import { DatabaseSetup } from './components/DatabaseSetup.tsx';
```

### Step 3: Add Auth State

Add to your state declarations:

```typescript
const [user, setUser] = useState<any>(null);
const [session, setSession] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [authError, setAuthError] = useState<string | null>(null);
const [setupComplete, setSetupComplete] = useState(false);
```

### Step 4: Check Auth on Mount

Replace the localStorage useEffect with:

```typescript
useEffect(() => {
  // Check auth status
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      
      if (session) {
        // Load medications from Supabase
        await loadMedications();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  initAuth();

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    setUser(session?.user || null);
    
    if (session) {
      loadMedications();
    } else {
      setMedications([]);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

### Step 5: Load Medications from Supabase

Replace `saveToStorage` and add this function:

```typescript
const loadMedications = async () => {
  try {
    const { medications: serverMeds } = await api.getMedications();
    const { logs } = await api.getTodayLogs();
    
    // Merge medications with today's logs
    const medsWithStatus = serverMeds.map((med: any) => ({
      id: med.id,
      name: med.name,
      time: med.time,
      dosage: med.dosage,
      taken: logs.some((log: any) => log.medication_id === med.id),
      daysNeeded: med.duration_days,
      startDate: med.start_date,
      endDate: med.end_date,
      personName: med.person_name, // NEW: For family tracking
    }));
    
    setMedications(medsWithStatus);
  } catch (error) {
    console.error('Error loading medications:', error);
    toast.error('Failed to load medications');
  }
};
```

### Step 6: Update Add Medication

Replace `addMedication` with:

```typescript
const addMedication = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    let daysNeeded: number | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    // ... (keep your existing duration calculation logic)
    
    const medication = {
      id: crypto.randomUUID(), // Generate UUID
      name: newMed.name,
      time: newMed.time,
      dosage: newMed.dosage,
      person_name: newMed.personName, // NEW: Add person name
      duration_days: daysNeeded,
      start_date: startDate,
      end_date: endDate,
    };
    
    // Save to Supabase
    const { medication: savedMed } = await api.addMedication(medication);
    
    // Update local state
    setMedications([...medications, { ...savedMed, taken: false }]);
    
    // Reset form
    setNewMed({ name: '', time: '', dosage: '', daysNeeded: '', personName: '' });
    setDateRange({ startDate: '', endDate: '' });
    setDurationMode('days');
    setIsAddModalOpen(false);
    
    toast.success('Medication added!');
  } catch (error) {
    console.error('Error adding medication:', error);
    toast.error('Failed to add medication');
  }
};
```

### Step 7: Update Toggle Taken

Replace the toggle function with:

```typescript
const toggleTaken = async (id: string) => {
  const medication = medications.find(m => m.id === id);
  if (!medication) return;
  
  try {
    if (!medication.taken) {
      // Mark as taken
      await api.markAsTaken(id, medication.time, user?.user_metadata?.name);
      
      // Update local state
      setMedications(medications.map(m =>
        m.id === id ? { ...m, taken: true } : m
      ));
      
      toast.success(`${medication.name} marked as taken!`);
    } else {
      // Unmark as taken
      await api.unmarkAsTaken(id);
      
      // Update local state
      setMedications(medications.map(m =>
        m.id === id ? { ...m, taken: false } : m
      ));
      
      toast.success(`${medication.name} unmarked`);
    }
  } catch (error) {
    console.error('Error toggling taken status:', error);
    toast.error('Failed to update status');
  }
};
```

### Step 8: Update Delete Medication

```typescript
const deleteMedication = async (id: string) => {
  try {
    await api.deleteMedication(id);
    setMedications(medications.filter(m => m.id !== id));
    toast.success('Medication deleted');
  } catch (error) {
    console.error('Error deleting medication:', error);
    toast.error('Failed to delete medication');
  }
};
```

### Step 9: Add Real-Time Sync

Add this useEffect for real-time updates:

```typescript
useEffect(() => {
  if (!user) return;
  
  // Subscribe to medication changes
  const medicationChannel = supabase
    .channel('medications_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'medications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('Medication changed:', payload);
        // Reload medications when changes occur
        loadMedications();
      }
    )
    .subscribe();
  
  // Subscribe to log changes
  const logsChannel = supabase
    .channel('logs_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'medication_logs',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('Log changed:', payload);
        // Reload medications to update taken status
        loadMedications();
      }
    )
    .subscribe();
  
  return () => {
    medicationChannel.unsubscribe();
    logsChannel.unsubscribe();
  };
}, [user]);
```

### Step 10: Add Auth Handlers

```typescript
const handleLogin = async (email: string, password: string) => {
  setAuthError(null);
  setLoading(true);
  
  try {
    await api.signIn(email, password);
    toast.success('Welcome back!');
  } catch (error: any) {
    console.error('Login error:', error);
    setAuthError(error.message);
    toast.error('Login failed');
  } finally {
    setLoading(false);
  }
};

const handleSignUp = async (email: string, password: string, name: string) => {
  setAuthError(null);
  setLoading(true);
  
  try {
    await api.signUp(email, password, name);
    // Auto sign in after signup
    await api.signIn(email, password);
    toast.success('Account created successfully!');
  } catch (error: any) {
    console.error('Signup error:', error);
    setAuthError(error.message);
    toast.error('Signup failed');
  } finally {
    setLoading(false);
  }
};

const handleLogout = async () => {
  try {
    await api.signOut();
    setMedications([]);
    toast.success('Logged out');
  } catch (error) {
    console.error('Logout error:', error);
    toast.error('Logout failed');
  }
};
```

### Step 11: Update Main Return Statement

```typescript
// Show loading
if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

// Show auth screen if not logged in
if (!user) {
  return (
    <>
      <Auth
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        error={authError || undefined}
        loading={loading}
      />
      <Toaster position="top-center" richColors />
    </>
  );
}

// Show database setup on first run (optional - can skip this)
if (!setupComplete) {
  return (
    <>
      <DatabaseSetup onComplete={() => setSetupComplete(true)} />
      <Toaster position="top-center" richColors />
    </>
  );
}

// Show main app (your existing return statement)
return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    {/* Add logout button in header */}
    <header className="...">
      {/* ... existing header content ... */}
      <button
        onClick={handleLogout}
        className="text-slate-600 hover:text-slate-900"
      >
        Logout
      </button>
    </header>
    
    {/* ... rest of your existing app ... */}
  </div>
);
```

### Step 12: Add Person Name Field to Form

Update your medication form to include a person name field:

```typescript
<div>
  <label className="block text-slate-700 mb-2">
    Person Name (Optional)
  </label>
  <Input
    type="text"
    placeholder="e.g., John, Sarah, Mom"
    value={newMed.personName || ''}
    onChange={(e) => setNewMed({ ...newMed, personName: e.target.value })}
  />
  <p className="text-slate-500 mt-1">
    Track which family member this medication is for
  </p>
</div>
```

## 🧪 Testing Checklist

After implementation, test:

### Auth Flow
- [ ] Sign up with new account
- [ ] Sign out
- [ ] Sign in with existing account
- [ ] Wrong password shows error
- [ ] Session persists on page reload

### Medications
- [ ] Add new medication
- [ ] Edit medication
- [ ] Delete medication
- [ ] Mark as taken
- [ ] Unmark as taken

### Real-Time Sync
- [ ] Open app in two browsers with same account
- [ ] Add medication in Browser 1
- [ ] See it appear in Browser 2 instantly
- [ ] Mark as taken in Browser 2
- [ ] See status update in Browser 1 instantly

### Family Tracking
- [ ] Add medication with person name
- [ ] See person name displayed
- [ ] Multiple family members can mark medications
- [ ] Progress shows who took what

## 🐛 Common Issues & Solutions

### Issue: "Not authenticated" errors
**Solution:** Check that `Authorization` header is being sent with Bearer token

### Issue: Medications not syncing
**Solution:** Enable Replication in Supabase Dashboard → Database → Replication

### Issue: Real-time not working
**Solution:** Subscribe to channels after user is authenticated, not before

### Issue: Can't see other family member's changes
**Solution:** Make sure everyone is using the SAME account (same email/password)

## 📚 Next Steps

1. **Run the SQL** in Supabase Dashboard (from SUPABASE_SETUP.md)
2. **Implement the changes** above in App.tsx
3. **Test thoroughly** with multiple devices
4. **Deploy** and share with family!

## 💡 Enhancement Ideas

Once basic integration is working, consider adding:

- **User profile** with family member names
- **Medication history** (past 7/30 days)
- **Reminders** (push notifications)
- **Export data** (CSV/PDF reports)
- **Medication images** (using Supabase Storage)
- **Dosage tracking** (half pills, missed doses)
- **Doctor notes** (medication instructions)

---

**Need help?** Check the code in:
- `/utils/api.tsx` - API client examples
- `/components/Auth.tsx` - Auth UI reference
- `/supabase/functions/server/index.tsx` - API endpoints

Good luck! 🚀
