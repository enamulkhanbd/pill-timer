import { createClient } from 'npm:@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  person_name?: string;
  dosage?: string;
  time: string;
  frequency?: string;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicationLog {
  id?: string;
  medication_id: string;
  user_id: string;
  taken_at: string;
  scheduled_time: string;
  marked_by?: string;
  created_at?: string;
}

// Initialize database tables
export const initializeTables = async () => {
  try {
    // Check if medications table exists by trying to query it
    const { data: medicationsCheck, error: medError } = await supabase
      .from('medications')
      .select('id')
      .limit(1);

    // Check if medication_logs table exists
    const { data: logsCheck, error: logsError } = await supabase
      .from('medication_logs')
      .select('id')
      .limit(1);

    // If either table has a PGRST205 error, tables don't exist
    if (medError?.code === 'PGRST205' || logsError?.code === 'PGRST205') {
      console.log('⚠️ Tables not found (this is expected on first run):', { medError, logsError });
      return { 
        success: false, 
        isSetup: false,
        error: 'Tables not found. Please run the SQL setup script.' 
      };
    }

    // If there are other errors, report them
    if (medError || logsError) {
      console.error('Database error:', { medError, logsError });
      return { 
        success: false, 
        isSetup: false,
        error: medError?.message || logsError?.message || 'Unknown error' 
      };
    }

    console.log('Database tables checked successfully');
    return { success: true, isSetup: true };
  } catch (error) {
    console.error('Error checking tables:', error)
    return { success: false, isSetup: false, error: String(error) };
  }
};

// Create database tables automatically
export const createTablesAutomatically = async () => {
  try {
    console.log('🔨 Checking database setup...');
    
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL environment variable not found');
    }
    
    // Parse connection string to get credentials
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const client = new Client(dbUrl);
    
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if tables already exist
    const tablesCheck = await client.queryArray<[boolean, boolean]>(`
      SELECT 
        EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medications') as medications_exists,
        EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medication_logs') as logs_exists;
    `);
    
    const [medicationsExists, logsExists] = tablesCheck.rows[0];
    
    if (medicationsExists && logsExists) {
      console.log('✅ Database tables already exist - skipping creation');
      await client.end();
      return { 
        success: true, 
        message: 'Database tables already exist',
        alreadySetup: true 
      };
    }
    
    console.log('⚙️ Tables need to be created. Starting setup...');
    
    // Execute all statements in a transaction
    try {
      await client.queryArray('BEGIN');
      console.log('✅ Started transaction');
      
      // Create medications table
      console.log('⚙️ Creating medications table...');
      await client.queryArray(`
        CREATE TABLE IF NOT EXISTS public.medications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          person_name TEXT,
          dosage TEXT,
          time TEXT NOT NULL,
          frequency TEXT,
          duration_days INTEGER,
          start_date TIMESTAMPTZ,
          end_date TIMESTAMPTZ,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Medications table created');

      // Create medication_logs table
      console.log('⚙️ Creating medication_logs table...');
      await client.queryArray(`
        CREATE TABLE IF NOT EXISTS public.medication_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          scheduled_time TEXT NOT NULL,
          marked_by TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Medication_logs table created');

      // Create indexes for better performance
      console.log('⚙️ Creating indexes...');
      await client.queryArray('CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);');
      await client.queryArray('CREATE INDEX IF NOT EXISTS idx_medications_time ON public.medications(time);');
      await client.queryArray('CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON public.medication_logs(user_id);');
      await client.queryArray('CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);');
      await client.queryArray('CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON public.medication_logs(taken_at);');
      console.log('✅ Indexes created');

      // Enable Row Level Security
      console.log('⚙️ Enabling Row Level Security...');
      await client.queryArray('ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;');
      await client.queryArray('ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;');
      console.log('✅ RLS enabled');

      // Drop existing policies if they exist
      console.log('⚙️ Cleaning up old policies...');
      await client.queryArray('DROP POLICY IF EXISTS "Users can view their own medications" ON public.medications;');
      await client.queryArray('DROP POLICY IF EXISTS "Users can insert their own medications" ON public.medications;');
      await client.queryArray('DROP POLICY IF EXISTS "Users can update their own medications" ON public.medications;');
      await client.queryArray('DROP POLICY IF EXISTS "Users can delete their own medications" ON public.medications;');
      await client.queryArray('DROP POLICY IF EXISTS "Users can view their own logs" ON public.medication_logs;');
      await client.queryArray('DROP POLICY IF EXISTS "Users can insert their own logs" ON public.medication_logs;');
      await client.queryArray('DROP POLICY IF EXISTS "Users can delete their own logs" ON public.medication_logs;');
      console.log('✅ Old policies cleaned up');

      // Create RLS policies for medications
      console.log('⚙️ Creating RLS policies...');
      await client.queryArray(`
        CREATE POLICY "Users can view their own medications"
          ON public.medications FOR SELECT
          USING (auth.uid() = user_id);
      `);
      
      await client.queryArray(`
        CREATE POLICY "Users can insert their own medications"
          ON public.medications FOR INSERT
          WITH CHECK (auth.uid() = user_id);
      `);
      
      await client.queryArray(`
        CREATE POLICY "Users can update their own medications"
          ON public.medications FOR UPDATE
          USING (auth.uid() = user_id);
      `);
      
      await client.queryArray(`
        CREATE POLICY "Users can delete their own medications"
          ON public.medications FOR DELETE
          USING (auth.uid() = user_id);
      `);

      // Create RLS policies for medication_logs
      await client.queryArray(`
        CREATE POLICY "Users can view their own logs"
          ON public.medication_logs FOR SELECT
          USING (auth.uid() = user_id);
      `);
      
      await client.queryArray(`
        CREATE POLICY "Users can insert their own logs"
          ON public.medication_logs FOR INSERT
          WITH CHECK (auth.uid() = user_id);
      `);
      
      await client.queryArray(`
        CREATE POLICY "Users can delete their own logs"
          ON public.medication_logs FOR DELETE
          USING (auth.uid() = user_id);
      `);
      console.log('✅ RLS policies created');
      
      await client.queryArray('COMMIT');
      console.log('✅ Transaction committed');
      
    } catch (error: any) {
      await client.queryArray('ROLLBACK');
      console.log('❌ Transaction rolled back');
      throw error;
    }
    
    // Try to enable realtime (this might fail if already enabled, that's ok)
    try {
      console.log('⚙️ Enabling realtime subscriptions...');
      await client.queryArray('ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;');
      await client.queryArray('ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_logs;');
      console.log('✅ Realtime subscriptions enabled');
    } catch (error) {
      console.log('⚠️ Could not enable realtime (might already be enabled)');
    }
    
    await client.end();
    console.log('✅ Database setup complete!');
    
    return { 
      success: true, 
      isSetup: true,
      message: 'Tables created successfully!' 
    };
  } catch (error: any) {
    console.error('❌ Error creating tables:', error);
    return { 
      success: false, 
      isSetup: false,
      error: error.message || String(error),
      message: 'Failed to create tables. Error: ' + (error.message || String(error))
    };
  }
};

// Check if database tables exist
export const checkDatabaseSetup = async () => {
  try {
    console.log('🔍 Checking if database tables exist...');
    
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    
    if (!dbUrl) {
      console.error('❌ SUPABASE_DB_URL not found');
      return { 
        success: false, 
        isSetup: false,
        error: 'Database URL not configured'
      };
    }
    
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const client = new Client(dbUrl);
    
    try {
      await client.connect();
      console.log('✅ Connected to database');
      
      // Check both tables in a single query
      const result = await client.queryArray<[boolean, boolean]>(`
        SELECT 
          EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medications') as medications_exists,
          EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'medication_logs') as logs_exists;
      `);
      
      const [medicationsExists, logsExists] = result.rows[0];
      
      await client.end();
      
      const isSetup = medicationsExists && logsExists;
      
      console.log(`📊 Tables status: medications=${medicationsExists}, logs=${logsExists}`);
      console.log(`✅ Database is ${isSetup ? 'READY' : 'NOT READY'}`);
      
      return { 
        success: true, 
        isSetup,
        medicationsExists,
        logsExists,
        needsSetup: !isSetup
      };
    } catch (error: any) {
      await client.end();
      console.error('❌ Error checking database:', error);
      return { 
        success: false, 
        isSetup: false,
        error: error.message || String(error)
      };
    }
  } catch (error: any) {
    console.error('❌ Error in checkDatabaseSetup:', error);
    return { 
      success: false, 
      isSetup: false,
      error: error.message || String(error)
    };
  }
};

// Get all medications for a user
export const getMedications = async (userId: string) => {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .order('time', { ascending: true });

  if (error) {
    console.error('Error getting medications:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Add new medication
export const addMedication = async (medication: Medication) => {
  // Remove person_name from medication if it exists (for backwards compatibility with old schemas)
  // This allows the app to work with tables created before the family sharing feature
  const { person_name, ...safeMedication } = medication as any;
  
  console.log('📝 Adding medication (person_name removed for compatibility):', safeMedication);
  
  const { data, error } = await supabase
    .from('medications')
    .insert([{
      ...safeMedication,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding medication:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Update medication
export const updateMedication = async (id: string, userId: string, updates: Partial<Medication>) => {
  // Remove person_name from updates if it exists (for backwards compatibility with old schemas)
  // This allows the app to work with tables created before the family sharing feature
  const { person_name, ...safeUpdates } = updates as any;
  
  // Build the update object with only the fields that exist in the original schema
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  
  // Add fields that exist in the original schema
  if (safeUpdates.name !== undefined) updateData.name = safeUpdates.name;
  if (safeUpdates.time !== undefined) updateData.time = safeUpdates.time;
  if (safeUpdates.dosage !== undefined) updateData.dosage = safeUpdates.dosage;
  if (safeUpdates.duration_days !== undefined) updateData.duration_days = safeUpdates.duration_days;
  if (safeUpdates.start_date !== undefined) updateData.start_date = safeUpdates.start_date;
  if (safeUpdates.end_date !== undefined) updateData.end_date = safeUpdates.end_date;
  
  console.log('📝 Update data (person_name removed for compatibility):', updateData);
  
  const { data, error } = await supabase
    .from('medications')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating medication:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Delete medication
export const deleteMedication = async (id: string, userId: string) => {
  // First delete all logs for this medication
  await supabase
    .from('medication_logs')
    .delete()
    .eq('medication_id', id)
    .eq('user_id', userId);

  // Then delete the medication
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting medication:', error);
    return { error };
  }

  return { error: null };
};

// Get medication logs for today
export const getTodayLogs = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('taken_at', date)
    .lt('taken_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error getting logs:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Add medication log (mark as taken)
export const addMedicationLog = async (log: MedicationLog) => {
  const { data, error } = await supabase
    .from('medication_logs')
    .insert([{
      ...log,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding medication log:', error);
    return { data: null, error };
  }

  return { data, error: null };
};

// Delete medication log (unmark as taken)
export const deleteTodayLog = async (medicationId: string, userId: string, date: string) => {
  const { error } = await supabase
    .from('medication_logs')
    .delete()
    .eq('medication_id', medicationId)
    .eq('user_id', userId)
    .gte('taken_at', date)
    .lt('taken_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error deleting log:', error);
    return { error };
  }

  return { error: null };
};