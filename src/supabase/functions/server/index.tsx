import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as auth from "./auth.tsx";
import * as db from "./database.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-4b5dbeea/health", async (c) => {
  try {
    // Check if tables exist by querying them
    const result = await db.initializeTables();
    
    if (result.isSetup) {
      return c.json({ 
        status: "ok", 
        isSetup: true,
        message: "Database tables are ready" 
      });
    } else {
      return c.json({ 
        status: "setup_required", 
        isSetup: false,
        message: result.error || "Database tables not found. Please run the SQL setup script."
      }, 200); // Return 200 so frontend can read the response
    }
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({ 
      status: "error", 
      isSetup: false,
      message: "Database tables not found. Please run the SQL setup script.",
      error: String(error)
    }, 200); // Return 200 so frontend can read the response
  }
});

// Check database setup status
app.get("/make-server-4b5dbeea/check-setup", async (c) => {
  try {
    console.log('🔍 Checking database setup status...');
    const result = await db.checkDatabaseSetup();
    console.log('📊 Check result:', result);
    return c.json(result);
  } catch (error) {
    console.error('❌ Error checking setup:', error);
    return c.json({ 
      success: false,
      isSetup: false,
      error: String(error)
    });
  }
});

// Initialize database tables
app.post("/make-server-4b5dbeea/init", async (c) => {
  try {
    console.log('🚀 Attempting to create tables automatically...');
    const result = await db.createTablesAutomatically();
    
    if (result.success) {
      console.log('✅ Tables created successfully!');
      return c.json(result);
    } else {
      console.error('❌ Failed to create tables:', result.error);
      return c.json(result, 500);
    }
  } catch (error) {
    console.error('❌ Error in init endpoint:', error);
    return c.json({ 
      success: false, 
      error: String(error),
      message: 'Failed to initialize database'
    }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-4b5dbeea/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    const { data, error } = await auth.signUpUser(email, password, name);
    
    if (error) {
      return c.json({ error }, 400);
    }
    
    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      user: data.user 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Get all medications (requires auth)
app.get("/make-server-4b5dbeea/medications", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      console.error('❌ Auth error in getMedications:', authError);
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    console.log(`📊 Fetching medications for user: ${user.id}`);
    
    // Get the date to check for taken status (defaults to today)
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];
    const dateStart = date + 'T00:00:00.000Z';
    const dateEnd = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString();
    
    console.log(`📅 Checking taken status for date range: ${dateStart} to ${dateEnd}`);
    
    // Get medications and their logs for today
    const { data: medications, error: medError } = await db.getMedications(user.id);
    
    if (medError) {
      console.error('❌ Database error:', medError);
      return c.json({ error: 'Failed to fetch medications', details: medError.message }, 500);
    }
    
    // Get today's logs
    const { data: logs, error: logsError } = await db.getTodayLogs(user.id, dateStart);
    
    if (logsError) {
      console.error('❌ Error fetching logs:', logsError);
      return c.json({ error: 'Failed to fetch logs', details: logsError.message }, 500);
    }
    
    console.log(`✅ Found ${medications?.length || 0} medications and ${logs?.length || 0} logs`);
    
    // Merge medications with their taken status
    const medicationsWithStatus = medications?.map(med => {
      const log = logs?.find(l => l.medication_id === med.id);
      return {
        ...med,
        taken: !!log,
        takenAt: log?.taken_at,
        markedBy: log?.marked_by
      };
    }) || [];
    
    console.log(`📋 Medications with status:`, medicationsWithStatus);
    
    return c.json({ medications: medicationsWithStatus, success: true });
  } catch (error) {
    console.error('❌ Error fetching medications:', error);
    return c.json({ error: 'Failed to fetch medications' }, 500);
  }
});

// Add medication (requires auth)
app.post("/make-server-4b5dbeea/medications", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const medication = await c.req.json();
    
    if (!medication.name || !medication.time) {
      return c.json({ error: 'Name and time are required' }, 400);
    }
    
    const { data, error } = await db.addMedication({
      ...medication,
      user_id: user.id,
    });
    
    if (error) {
      return c.json({ error: 'Failed to add medication' }, 500);
    }
    
    return c.json({ medication: data });
  } catch (error) {
    console.error('Error adding medication:', error);
    return c.json({ error: 'Failed to add medication' }, 500);
  }
});

// Update medication (requires auth)
app.put("/make-server-4b5dbeea/medications/:id", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      console.error('❌ Auth error in updateMedication:', authError);
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    console.log('📝 Updating medication:', id, 'Updates:', updates);
    
    const { data, error } = await db.updateMedication(id, user.id, updates);
    
    if (error) {
      console.error('❌ Database error updating medication:', error);
      return c.json({ error: 'Failed to update medication', details: error.message }, 500);
    }
    
    console.log('✅ Medication updated successfully:', data);
    return c.json({ medication: data });
  } catch (error) {
    console.error('❌ Error updating medication:', error);
    return c.json({ error: 'Failed to update medication', details: String(error) }, 500);
  }
});

// Delete medication (requires auth)
app.delete("/make-server-4b5dbeea/medications/:id", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const id = c.req.param('id');
    
    const { error } = await db.deleteMedication(id, user.id);
    
    if (error) {
      return c.json({ error: 'Failed to delete medication' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting medication:', error);
    return c.json({ error: 'Failed to delete medication' }, 500);
  }
});

// Get today's logs (requires auth)
app.get("/make-server-4b5dbeea/logs/today", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];
    const { data, error } = await db.getTodayLogs(user.id, date + 'T00:00:00.000Z');
    
    if (error) {
      return c.json({ error: 'Failed to fetch logs' }, 500);
    }
    
    return c.json({ logs: data || [] });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

// Mark medication as taken (requires auth)
app.post("/make-server-4b5dbeea/logs", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      console.error('❌ Auth error in markAsTaken:', authError);
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const log = await c.req.json();
    console.log('📝 Marking medication as taken:', { userId: user.id, log });
    
    if (!log.medication_id || !log.scheduled_time) {
      console.error('❌ Missing required fields:', log);
      return c.json({ error: 'Medication ID and scheduled time are required' }, 400);
    }
    
    const { data, error } = await db.addMedicationLog({
      ...log,
      user_id: user.id,
      taken_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error('❌ Database error:', error);
      return c.json({ error: 'Failed to mark medication as taken', details: error.message }, 500);
    }
    
    console.log('✅ Medication marked as taken:', data);
    return c.json({ log: data, success: true });
  } catch (error) {
    console.error('❌ Error marking medication as taken:', error);
    return c.json({ error: 'Failed to mark medication as taken' }, 500);
  }
});

// Unmark medication as taken (requires auth)
app.delete("/make-server-4b5dbeea/logs/:medicationId", async (c) => {
  try {
    const { user, error: authError } = await auth.verifyUser(c.req.header('Authorization'));
    
    if (authError || !user) {
      return c.json({ error: authError || 'Unauthorized' }, 401);
    }
    
    const medicationId = c.req.param('medicationId');
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];
    
    const { error } = await db.deleteTodayLog(medicationId, user.id, date + 'T00:00:00.000Z');
    
    if (error) {
      return c.json({ error: 'Failed to unmark medication' }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error unmarking medication:', error);
    return c.json({ error: 'Failed to unmark medication' }, 500);
  }
});

Deno.serve(app.fetch);