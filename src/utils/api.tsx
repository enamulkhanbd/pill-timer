import { projectId, publicAnonKey } from './supabase/info.tsx';
import { supabase } from './supabase/client.tsx';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4b5dbeea`;

// Helper to get auth header
const getAuthHeader = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No session found when getting auth header');
      throw new Error('Not authenticated - please log in again');
    }
    console.log('✅ Got auth token for request');
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('❌ Error getting auth header:', error);
    throw error;
  }
};

// API Client
export const api = {
  // Auth
  async signUp(email: string, password: string, name?: string) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }
    
    return response.json();
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return session;
  },

  // Medications
  async getMedications() {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/medications`, {
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch medications');
    }
    
    return response.json();
  },

  async addMedication(medication: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/medications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(medication),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add medication');
    }
    
    return response.json();
  },

  async updateMedication(id: string, updates: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Update medication error response:', error);
      throw new Error(error.details || error.error || 'Failed to update medication');
    }
    
    return response.json();
  },

  async deleteMedication(id: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete medication');
    }
    
    return response.json();
  },

  // Logs
  async getTodayLogs(date?: string) {
    const headers = await getAuthHeader();
    const queryDate = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/logs/today?date=${queryDate}`, {
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch logs');
    }
    
    return response.json();
  },

  async markAsTaken(medicationId: string, scheduledTime: string, markedBy?: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        medication_id: medicationId,
        scheduled_time: scheduledTime,
        marked_by: markedBy,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark as taken');
    }
    
    return response.json();
  },

  async unmarkAsTaken(medicationId: string, date?: string) {
    const headers = await getAuthHeader();
    const queryDate = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/logs/${medicationId}?date=${queryDate}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unmark');
    }
    
    return response.json();
  },

  // Initialize database
  async initializeDatabase() {
    const response = await fetch(`${API_BASE_URL}/init`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initialize database');
    }
    
    return response.json();
  },

  // Check if database is set up
  async checkDatabaseSetup() {
    try {
      const response = await fetch(`${API_BASE_URL}/check-setup`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('❌ Check setup response not OK:', response.status);
        return { success: false, isSetup: false, error: 'Failed to check setup' };
      }
      
      return response.json();
    } catch (error) {
      console.error('❌ Error checking database setup:', error);
      return { success: false, isSetup: false, error: String(error) };
    }
  },
};