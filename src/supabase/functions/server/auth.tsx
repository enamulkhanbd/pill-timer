import { createClient } from 'npm:@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Verify user from access token
export const verifyUser = async (authHeader: string | null) => {
  console.log('🔐 Verifying user with auth header:', authHeader ? 'Present (Bearer ...)' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid Authorization header format');
    return { user: null, error: 'Missing or invalid Authorization header' };
  }

  const accessToken = authHeader.split(' ')[1];
  console.log('🔑 Extracted access token (first 20 chars):', accessToken?.substring(0, 20) + '...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      return { user: null, error: 'Unauthorized' };
    }
    
    if (!user) {
      console.error('❌ No user returned from Supabase');
      return { user: null, error: 'Unauthorized' };
    }
    
    console.log('✅ User verified successfully:', user.id, user.email);
    return { user, error: null };
  } catch (err) {
    console.error('❌ Error verifying user:', err);
    return { user: null, error: 'Authentication error' };
  }
};

// Sign up new user
export const signUpUser = async (email: string, password: string, name?: string) => {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error('Error signing up user:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Sign up error:', err);
    return { data: null, error: 'Failed to create user' };
  }
};