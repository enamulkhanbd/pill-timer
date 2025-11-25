# 🚀 Supabase Integration - Quick Reference

## 📁 Files Created

```
New Files:
├── /utils/
│   ├── api.tsx                  ← API client for backend calls
│   └── supabase/client.tsx      ← Supabase frontend client
│
├── /components/
│   ├── Auth.tsx                 ← Login/signup UI
│   └── DatabaseSetup.tsx        ← DB initialization guide
│
├── /supabase/functions/server/
│   ├── auth.tsx                 ← User authentication
│   ├── database.tsx             ← Database operations
│   └── index.tsx (UPDATED)      ← API endpoints
│
└── /docs/
    ├── SUPABASE_README.md       ← Complete overview
    ├── SUPABASE_SETUP.md        ← Database setup SQL
    ├── INTEGRATION_GUIDE.md     ← Code integration steps
    ├── SUPABASE_CHECKLIST.md    ← Task checklist
    └── QUICK_REFERENCE.md       ← This file
```

---

## ⚡ 3-Step Quick Start

### 1️⃣ Run SQL (5 min)
```
1. Open: https://supabase.com/dashboard/project/rcnyrwziftitsalkxtrr
2. Go to: SQL Editor → New Query
3. Copy SQL from: /SUPABASE_SETUP.md
4. Click: "Run"
5. Enable: Database → Replication → medications & medication_logs
```

### 2️⃣ Update Code (30 min)
```
Follow: /INTEGRATION_GUIDE.md
Or use: /SUPABASE_CHECKLIST.md for step-by-step
```

### 3️⃣ Test & Deploy (15 min)
```
npm install
npm run dev
→ Test auth, medications, sync
→ Deploy to Vercel
→ Share with family!
```

---

## 🔑 Key Concepts

### How Family Sharing Works
```
1 Account = 1 Family
├── All family members use same login
├── Everyone sees same medications
├── Changes sync in real-time
└── No data conflicts
```

### Data Flow
```
Add Medication:
  User clicks Add
    ↓
  Form submitted
    ↓
  POST /medications
    ↓
  Saved to database
    ↓
  Realtime broadcast
    ↓
  All devices update instantly ✨
```

### Real-Time Sync
```
Device A          Supabase         Device B
   │                 │                │
   ├─ Change ──────►│                │
   │                 ├─ Broadcast ──►│
   │◄─ Confirm ─────┤                │
   │                 │                │
   Update UI         │           Update UI
```

---

## 🎯 API Endpoints

Base URL: `https://rcnyrwziftitsalkxtrr.supabase.co/functions/v1/make-server-4b5dbeea`

### Auth
```typescript
// Sign up (server)
POST /auth/signup
Body: { email, password, name }

// Sign in (Supabase Auth directly)
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()
```

### Medications
```typescript
// Get all
GET /medications
Headers: { Authorization: "Bearer {token}" }

// Add
POST /medications
Body: { name, time, dosage, person_name, duration_days, ... }

// Update
PUT /medications/:id
Body: { name, time, ... }

// Delete
DELETE /medications/:id
```

### Logs
```typescript
// Get today's logs
GET /logs/today?date=2024-01-01

// Mark as taken
POST /logs
Body: { medication_id, scheduled_time, marked_by }

// Unmark
DELETE /logs/:medicationId?date=2024-01-01
```

---

## 📝 Code Snippets

### Load Medications
```typescript
const loadMedications = async () => {
  const { medications } = await api.getMedications();
  const { logs } = await api.getTodayLogs();
  
  const medsWithStatus = medications.map(med => ({
    ...med,
    taken: logs.some(log => log.medication_id === med.id),
  }));
  
  setMedications(medsWithStatus);
};
```

### Add Medication
```typescript
const addMedication = async (medication) => {
  const { medication: saved } = await api.addMedication(medication);
  setMedications([...medications, saved]);
  toast.success('Added!');
};
```

### Mark as Taken
```typescript
const toggleTaken = async (id) => {
  const med = medications.find(m => m.id === id);
  
  if (!med.taken) {
    await api.markAsTaken(id, med.time, userName);
    setMedications(meds => meds.map(m => 
      m.id === id ? { ...m, taken: true } : m
    ));
  } else {
    await api.unmarkAsTaken(id);
    setMedications(meds => meds.map(m => 
      m.id === id ? { ...m, taken: false } : m
    ));
  }
};
```

### Real-Time Subscription
```typescript
useEffect(() => {
  if (!user) return;
  
  const channel = supabase
    .channel('medications_channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'medications' },
      () => loadMedications()
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}, [user]);
```

### Auth Check
```typescript
useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session) await loadMedications();
    setLoading(false);
  };
  
  init();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user || null);
      if (session) loadMedications();
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

---

## 🗄️ Database Schema

### medications
```sql
id              UUID (PK)
user_id         UUID
name            TEXT
person_name     TEXT          ← NEW for family
dosage          TEXT
time            TEXT
frequency       TEXT
duration_days   INTEGER
start_date      TIMESTAMP
end_date        TIMESTAMP
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### medication_logs
```sql
id              UUID (PK)
medication_id   UUID (FK)
user_id         UUID
taken_at        TIMESTAMP
scheduled_time  TEXT
marked_by       TEXT          ← NEW: who marked it
created_at      TIMESTAMP
```

---

## 🔐 Security (RLS)

```sql
-- Users can only access their own data
CREATE POLICY "view_own" ON medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Same for medication_logs table
```

Result:
- ✅ Family with shared account sees same data
- ✅ Different families can't see each other
- ✅ Secure at database level

---

## ✅ Testing Checklist

### Must Test
- [ ] Sign up new account
- [ ] Sign in existing account
- [ ] Add medication
- [ ] Mark as taken
- [ ] Open in 2 browsers → changes sync
- [ ] Refresh page → stay logged in
- [ ] Sign out → return to auth screen

### Should Test
- [ ] Edit medication
- [ ] Delete medication
- [ ] Unmark as taken
- [ ] Add person name
- [ ] Test on mobile
- [ ] Test offline (should queue)

---

## 🎨 New UI Features

### Person Name Field
```typescript
// In medication form:
<Input
  placeholder="e.g., John, Sarah, Mom"
  value={newMed.personName}
  onChange={(e) => setNewMed({ ...newMed, personName: e.target.value })}
/>
```

### Display Person Name
```typescript
// In medication card:
<h3>{med.person_name ? `${med.person_name}'s ${med.name}` : med.name}</h3>
```

### Show Who Marked
```typescript
// In log display:
<p>Marked by {log.marked_by} at {formatTime(log.taken_at)}</p>
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Not authenticated" | Check Authorization header has Bearer token |
| Medications not loading | Check browser console for errors |
| Real-time not working | Enable Replication in Supabase Dashboard |
| Database errors | Verify SQL ran successfully |
| Can't sign in | Check email/password, see Supabase Auth logs |

---

## 📊 Monitoring

### Supabase Dashboard
```
https://supabase.com/dashboard/project/rcnyrwziftitsalkxtrr

Key Sections:
├── Database → Tables (view data)
├── Database → Logs (SQL errors)
├── Authentication → Users (registered users)
├── Authentication → Logs (login attempts)
├── Functions → Logs (API errors)
└── API → Logs (request logs)
```

### Browser Console
```javascript
// Enable verbose logging
localStorage.setItem('supabase.debug', 'true');

// Check session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check medications
const { data } = await supabase
  .from('medications')
  .select('*');
console.log('Medications:', data);
```

---

## 💡 Pro Tips

### Family Setup
```
1. Create account with family email
2. Share login with all family members
3. Add medication for each person with person_name
4. Everyone logs in with same credentials
5. Real-time sync keeps everyone updated
```

### Person Name Convention
```
Use first names:
✅ "John", "Sarah", "Mom", "Dad"
❌ "John Smith", "sarah@email.com"

Display format:
✅ "John's Blood Pressure"
✅ "Sarah's Vitamin D"
✅ "Mom's Insulin"
```

### Offline Support (Future)
```typescript
// Queue changes when offline
if (!navigator.onLine) {
  queuedChanges.push({ type: 'add', data: medication });
  localStorage.setItem('queue', JSON.stringify(queuedChanges));
}

// Sync when back online
window.addEventListener('online', () => {
  syncQueuedChanges();
});
```

---

## 📚 Full Documentation

For complete details, see:

- **Overview:** `/SUPABASE_README.md` (architecture, features, testing)
- **Setup:** `/SUPABASE_SETUP.md` (SQL scripts, configuration)
- **Integration:** `/INTEGRATION_GUIDE.md` (step-by-step code changes)
- **Checklist:** `/SUPABASE_CHECKLIST.md` (task-by-task progress)
- **This File:** `/QUICK_REFERENCE.md` (quick lookups)

---

## 🎉 Success!

When everything works:

✅ Family members can log in together
✅ Medications sync in real-time
✅ Everyone sees who took what
✅ Data backed up in cloud
✅ Works on all devices

**You did it!** 🎊

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/rcnyrwziftitsalkxtrr
- **Supabase Docs:** https://supabase.com/docs
- **Auth Guide:** https://supabase.com/docs/guides/auth
- **Realtime Guide:** https://supabase.com/docs/guides/realtime
- **Support:** https://discord.supabase.com

---

**Last Updated:** November 25, 2024
**Version:** 1.0.0
**Status:** Ready for Integration ✅
