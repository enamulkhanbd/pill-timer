import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { api } from '../utils/api.tsx';

interface DatabaseSetupProps {
  onComplete: () => void;
}

const setupSteps = [
  {
    title: 'Welcome to Pill Timer',
    description: 'Let\'s set up your family medication tracker in just a few steps.',
  },
  {
    title: 'Database Setup',
    description: 'We need to create database tables to store your medications and tracking logs.',
  },
  {
    title: 'Setup Complete!',
    description: '🎉 Your database is ready! You can now start tracking medications for your family.',
  },
];

export function DatabaseSetup({ onComplete }: DatabaseSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [checkingDatabase, setCheckingDatabase] = useState(true);
  const [databaseStatus, setDatabaseStatus] = useState<{
    medicationsExists: boolean;
    logsExists: boolean;
    needsSetup: boolean;
  } | null>(null);

  // Check database status on mount
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setCheckingDatabase(true);
    try {
      console.log('🔍 Checking database status...');
      const result = await api.checkDatabaseSetup();
      console.log('📊 Database status result:', result);
      
      if (result.success) {
        setDatabaseStatus({
          medicationsExists: result.medicationsExists || false,
          logsExists: result.logsExists || false,
          needsSetup: result.needsSetup || false,
        });
        
        // If database is already set up, skip to completion
        if (result.isSetup) {
          console.log('✅ Database already set up, completing setup...');
          setTimeout(() => {
            onComplete();
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ Error checking database status:', error);
    } finally {
      setCheckingDatabase(false);
    }
  };

  const handleCreateTables = async () => {
    setIsCreating(true);
    
    try {
      console.log('🔨 Creating tables automatically...');
      
      // Call the auto-create endpoint
      const result = await api.initializeDatabase();
      
      console.log('📊 Auto-create result:', result);
      
      if (result.success) {
        // Tables created successfully!
        console.log('✅ SUCCESS! Tables created, advancing to step 2');
        
        // Re-check database status to confirm
        await checkDatabaseStatus();
        
        setTimeout(() => {
          setIsCreating(false);
          setCurrentStep(2);
        }, 500);
      } else {
        // Auto-create failed, show error details
        console.error('❌ Auto-create failed:', result);
        setIsCreating(false);
        
        const errorMsg = result.error || result.message || 'Unknown error';
        alert(
          `⚠️ Automatic table creation failed\n\n` +
          `Error: ${errorMsg}\n\n` +
          `Please try one of these options:\n\n` +
          `1. REFRESH the page and try the button again\n` +
          `2. Manually run the SQL:\n` +
          `   • Copy the SQL code above\n` +
          `   • Open the SQL Editor (click the link)\n` +
          `   • Paste and click RUN\n` +
          `   • Come back and refresh the page`
        );
      }
    } catch (error: any) {
      console.error('❌ Error creating tables:', error);
      setIsCreating(false);
      
      alert(
        `❌ Failed to create tables\n\n` +
        `Error: ${error.message || String(error)}\n\n` +
        `Please try:\n` +
        `1. REFRESH the page and click the button again\n` +
        `2. Or manually run the SQL using the instructions above`
      );
    }
  };

  const step = setupSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2">Database Setup</h1>
          <p className="text-slate-600">Setting up Pill Timer for your family</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {setupSteps.map((_, index) => (
              <React.Fragment key={index}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < setupSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? 'bg-slate-900' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="text-center mb-8">
            <h2 className="text-slate-900 mb-3">{step.title}</h2>
            <p className="text-slate-600">{step.description}</p>
          </div>

          {/* SQL Instructions */}
          {currentStep === 1 && (
            <div className="mb-6">
              {/* Database Status Check */}
              {checkingDatabase ? (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-700">Checking database status...</p>
                  </div>
                </div>
              ) : databaseStatus ? (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-900 mb-3">
                    <strong>Database Status:</strong>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {databaseStatus.medicationsExists ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="text-slate-700">
                        Medications table: {databaseStatus.medicationsExists ? 'Found' : 'Not found'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {databaseStatus.logsExists ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="text-slate-700">
                        Medication logs table: {databaseStatus.logsExists ? 'Found' : 'Not found'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
              
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-slate-900 mb-2">
                      <strong>Automatic Setup:</strong> Click the button below to create the database tables
                    </p>
                    <p className="text-slate-600">
                      {databaseStatus?.needsSetup 
                        ? 'Tables need to be created. Click the button below to set them up automatically.'
                        : 'If automatic setup fails, you can run the SQL manually in your Supabase Dashboard.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && currentStep < setupSteps.length - 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isCreating}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl hover:bg-slate-200 transition-all duration-200 disabled:opacity-50"
              >
                Back
              </button>
            )}
            
            {currentStep === 0 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 active:scale-95"
              >
                Get Started
              </button>
            )}

            {currentStep === 1 && (
              <button
                onClick={handleCreateTables}
                disabled={isCreating}
                className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {isCreating ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Tables...
                  </span>
                ) : (
                  '🚀 Create Tables Automatically'
                )}
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={onComplete}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 active:scale-95"
              >
                Continue to App
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 mt-6">
          Need help? Check the Supabase documentation
        </p>
      </div>
    </div>
  );
};