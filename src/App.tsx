import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Trash2, Activity, X, Pencil, Copy, MoreVertical, SlidersHorizontal, Bell, BellOff, Download } from 'lucide-react';
import { toast, Toaster } from 'sonner@2.0.3';

// Types
interface Medication {
  id: string;
  name: string;
  time: string;
  dosage?: string;
  taken: boolean;
  daysNeeded?: number;
  startDate?: string;
  endDate?: string;
}

interface AppData {
  medications: Medication[];
  lastOpenedDate: string;
}

// Reusable UI Components (shadcn/ui inspired)
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
}> = ({ children, onClick, variant = 'primary', size = 'md', className = '', type = 'button' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95';
  
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}> = ({ type = 'text', placeholder, value, onChange, required = false, className = '' }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${className}`}
    />
  );
};

const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-4 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', time: '', dosage: '', daysNeeded: '' });
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'status'>('time');
  const [showCompleted, setShowCompleted] = useState(true);
  const [durationMode, setDurationMode] = useState<'days' | 'dateRange'>('days');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  // const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  // const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  // const [showNotificationHelp, setShowNotificationHelp] = useState(false);
  
  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }
  }, []);
  
  // Add PWA meta tags
  useEffect(() => {
    // Set theme color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', '#0f172a');
    
    // Set viewport for mobile
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.setAttribute('name', 'viewport');
      document.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    
    // Set apple mobile web app capable
    let metaApple = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!metaApple) {
      metaApple = document.createElement('meta');
      metaApple.setAttribute('name', 'apple-mobile-web-app-capable');
      document.head.appendChild(metaApple);
    }
    metaApple.setAttribute('content', 'yes');
    
    // Set apple status bar style
    let metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatus) {
      metaAppleStatus = document.createElement('meta');
      metaAppleStatus.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(metaAppleStatus);
    }
    metaAppleStatus.setAttribute('content', 'black-translucent');
    
    // Set manifest link
    let linkManifest = document.querySelector('link[rel="manifest"]');
    if (!linkManifest) {
      linkManifest = document.createElement('link');
      linkManifest.setAttribute('rel', 'manifest');
      document.head.appendChild(linkManifest);
    }
    linkManifest.setAttribute('href', '/manifest.json');
    
    // Set page title
    document.title = 'Pill Timer';
  }, []);
  
  // Initialize and handle date-based reset
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('pillpal-data');
    
    if (stored) {
      const data: AppData = JSON.parse(stored);
      
      // Reset if it's a new day
      if (data.lastOpenedDate !== today) {
        const resetMeds = data.medications.map(med => ({ ...med, taken: false }));
        setMedications(resetMeds);
        saveToStorage(resetMeds);
      } else {
        setMedications(data.medications);
      }
    } else {
      // Add sample medications for testing
      const sampleMeds: Medication[] = [
        {
          id: '1',
          name: 'Aspirin',
          time: '08:00',
          dosage: '500mg',
          taken: false,
          daysNeeded: 30,
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
          id: '2',
          name: 'Vitamin D',
          time: '09:30',
          dosage: '1000 IU',
          taken: false,
          daysNeeded: 90,
          startDate: new Date(new Date().getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString(),
          endDate: new Date(new Date().getTime() + (80 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
          id: '3',
          name: 'Metformin',
          time: '12:30',
          dosage: '850mg',
          taken: true,
          daysNeeded: 60,
          startDate: new Date(new Date().getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString(),
          endDate: new Date(new Date().getTime() + (55 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
          id: '4',
          name: 'Lisinopril',
          time: '07:15',
          dosage: '10mg',
          taken: false,
        },
        {
          id: '5',
          name: 'Omega-3',
          time: '20:00',
          dosage: '1200mg',
          taken: false,
          daysNeeded: 45,
          startDate: new Date(new Date().getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString(),
          endDate: new Date(new Date().getTime() + (25 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
          id: '6',
          name: 'Amoxicillin',
          time: '14:45',
          dosage: '250mg',
          taken: false,
          daysNeeded: 7,
          startDate: new Date(new Date().getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
          endDate: new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
          id: '7',
          name: 'Ibuprofen',
          time: '18:30',
          dosage: '400mg',
          taken: true,
        },
      ];
      
      setMedications(sampleMeds);
      saveToStorage(sampleMeds);
    }
  }, []);
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
      if (isFilterOpen) {
        setIsFilterOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId, isFilterOpen]);
  
  // // Check notification permission on mount
  // useEffect(() => {
  //   if ('Notification' in window) {
  //     setNotificationPermission(Notification.permission);
  //     const savedPref = localStorage.getItem('notifications-enabled');
  //     if (savedPref === 'true' && Notification.permission === 'granted') {
  //       setNotificationsEnabled(true);
  //     }
  //   }
  // }, []);
  
  // // Request notification permission
  // const requestNotificationPermission = async () => {
  //   if (!('Notification' in window)) {
  //     alert('This browser does not support notifications');
  //     return;
  //   }
  //   
  //   const permission = await Notification.requestPermission();
  //   setNotificationPermission(permission);
  //   
  //   if (permission === 'granted') {
  //     setNotificationsEnabled(true);
  //     localStorage.setItem('notifications-enabled', 'true');
  //   }
  // };
  
  // // Toggle notifications
  // const toggleNotifications = async () => {
  //   if (!notificationsEnabled) {
  //     if (notificationPermission !== 'granted') {
  //       await requestNotificationPermission();
  //       if (Notification.permission === 'granted') {
  //         toast.success('🔔 Notifications enabled successfully!', {
  //           description: 'You\'ll receive reminders 5 minutes before each medication',
  //           duration: 4000,
  //         });
  //       }
  //     } else {
  //       setNotificationsEnabled(true);
  //       localStorage.setItem('notifications-enabled', 'true');
  //       toast.success('🔔 Notifications enabled successfully!', {
  //         description: 'You\'ll receive reminders 5 minutes before each medication',
  //         duration: 4000,
  //       });
  //     }
  //   } else {
  //     setNotificationsEnabled(false);
  //     localStorage.setItem('notifications-enabled', 'false');
  //     toast.info('Notifications disabled', {
  //       description: 'You won\'t receive medication reminders',
  //       duration: 3000,
  //     });
  //   }
  // };
  
  // // Test notification function
  // const sendTestNotification = async () => {
  //   if (notificationPermission !== 'granted') {
  //     toast.error('Notifications not allowed', {
  //       description: 'Please enable notifications first',
  //       duration: 3000,
  //     });
  //     return;
  //   }
  //   
  //   try {
  //     // Use Service Worker for notifications (required for PWA on Android)
  //     if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  //       const registration = await navigator.serviceWorker.ready;
  //       await registration.showNotification('💊 Pill Timer - Test', {
  //         body: 'Notifications are working! You\'ll receive reminders 5 minutes before each medication.',
  //         vibrate: [200, 100, 200],
  //         tag: 'test-notification',
  //         requireInteraction: false,
  //       });
  //       
  //       toast.success('Test notification sent!', {
  //         description: 'Check your notification tray',
  //         duration: 3000,
  //       });
  //     } else {
  //       // Fallback to regular Notification API
  //       new Notification('💊 Pill Timer - Test', {
  //         body: 'Notifications are working! You\'ll receive reminders 5 minutes before each medication.',
  //         requireInteraction: false,
  //         vibrate: [200, 100, 200],
  //       });
  //       
  //       toast.success('Test notification sent!', {
  //         description: 'Check your notification tray',
  //         duration: 3000,
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Notification error:', error);
  //     toast.error('Notification failed', {
  //       description: error instanceof Error ? error.message : 'Service Worker may not be ready. Try refreshing the app.',
  //       duration: 5000,
  //     });
  //   }
  // };
  
  // // Check for upcoming medications and send notifications
  // useEffect(() => {
  //   if (!notificationsEnabled || notificationPermission !== 'granted') return;
  //   
  //   const checkMedications = async () => {
  //     const now = new Date();
  //     const currentHours = now.getHours();
  //     const currentMinutes = now.getMinutes();
  //     
  //     for (const med of medications) {
  //       if (med.taken) continue; // Skip if already taken
  //       
  //       const [medHours, medMinutes] = med.time.split(':').map(Number);
  //       
  //       // Calculate time difference in minutes
  //       const medTimeInMinutes = medHours * 60 + medMinutes;
  //       const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  //       const timeDiff = medTimeInMinutes - currentTimeInMinutes;
  //       
  //       // Notify 5 minutes before
  //       if (timeDiff === 5) {
  //         try {
  //           // Use Service Worker for notifications (better for PWA)
  //           if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  //             const registration = await navigator.serviceWorker.ready;
  //             await registration.showNotification('💊 Pill Timer Reminder', {
  //               body: `Time to take ${med.name}${med.dosage ? ` (${med.dosage})` : ''} in 5 minutes`,
  //               vibrate: [200, 100, 200],
  //               tag: `med-${med.id}`, // Prevent duplicate notifications
  //               requireInteraction: false,
  //             });
  //           } else {
  //             // Fallback to regular Notification API
  //             new Notification('💊 Pill Timer Reminder', {
  //               body: `Time to take ${med.name}${med.dosage ? ` (${med.dosage})` : ''} in 5 minutes`,
  //               tag: med.id,
  //               requireInteraction: false,
  //               vibrate: [200, 100, 200],
  //             });
  //           }
  //         } catch (error) {
  //           console.error('Failed to send notification for', med.name, error);
  //         }
  //       }
  //     }
  //   };
  //   
  //   // Check every minute
  //   const interval = setInterval(checkMedications, 60000);
  //   
  //   // Check immediately
  //   checkMedications();
  //   
  //   return () => clearInterval(interval);
  // }, [medications, notificationsEnabled, notificationPermission]);
  
  const saveToStorage = (meds: Medication[]) => {
    const data: AppData = {
      medications: meds,
      lastOpenedDate: new Date().toDateString(),
    };
    localStorage.setItem('pillpal-data', JSON.stringify(data));
  };
  
  const addMedication = (e: React.FormEvent) => {
    e.preventDefault();
    
    let daysNeeded: number | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    // Mode 1: User entered days - convert to date range
    if (durationMode === 'days' && newMed.daysNeeded) {
      daysNeeded = parseInt(newMed.daysNeeded);
      startDate = new Date().toISOString();
      endDate = new Date(new Date().getTime() + (daysNeeded * 24 * 60 * 60 * 1000)).toISOString();
    } 
    // Mode 2: User entered date range - convert to days
    else if (durationMode === 'dateRange' && dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysNeeded = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      startDate = start.toISOString();
      endDate = end.toISOString();
    }
    
    const medication: Medication = {
      id: Date.now().toString(),
      name: newMed.name,
      time: newMed.time,
      dosage: newMed.dosage,
      taken: false,
      daysNeeded,
      startDate,
      endDate,
    };
    
    const updated = [...medications, medication];
    setMedications(updated);
    saveToStorage(updated);
    
    setNewMed({ name: '', time: '', dosage: '', daysNeeded: '' });
    setDateRange({ startDate: '', endDate: '' });
    setDurationMode('days');
    setIsAddModalOpen(false);
  };
  
  const editMedication = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMed) return;
    
    let daysNeeded: number | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    // Mode 1: User entered days - convert to date range
    if (durationMode === 'days' && newMed.daysNeeded) {
      daysNeeded = parseInt(newMed.daysNeeded);
      startDate = new Date().toISOString();
      endDate = new Date(new Date().getTime() + (daysNeeded * 24 * 60 * 60 * 1000)).toISOString();
    } 
    // Mode 2: User entered date range - convert to days
    else if (durationMode === 'dateRange' && dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysNeeded = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      startDate = start.toISOString();
      endDate = end.toISOString();
    }
    
    const updated = medications.map(med =>
      med.id === editingMed.id
        ? { 
            ...med, 
            name: newMed.name, 
            time: newMed.time, 
            dosage: newMed.dosage,
            daysNeeded,
            startDate,
            endDate,
          }
        : med
    );
    setMedications(updated);
    saveToStorage(updated);
    
    setNewMed({ name: '', time: '', dosage: '', daysNeeded: '' });
    setDateRange({ startDate: '', endDate: '' });
    setDurationMode('days');
    setEditingMed(null);
  };
  
  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setNewMed({ name: med.name, time: med.time, dosage: med.dosage || '', daysNeeded: med.daysNeeded ? med.daysNeeded.toString() : '' });
    
    // If medication has date range data, populate it and switch to date range mode
    if (med.startDate && med.endDate) {
      const startDate = new Date(med.startDate).toISOString().split('T')[0];
      const endDate = new Date(med.endDate).toISOString().split('T')[0];
      setDateRange({ startDate, endDate });
      // Optionally set mode to dateRange if user prefers to see the dates
      // Comment out the line below if you want to default to "days" view
      setDurationMode('dateRange');
    }
  };
  
  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingMed(null);
    setNewMed({ name: '', time: '', dosage: '', daysNeeded: '' });
    setDateRange({ startDate: '', endDate: '' });
    setDurationMode('days');
  };
  
  const toggleTaken = (id: string) => {
    const updated = medications.map(med =>
      med.id === id ? { ...med, taken: !med.taken } : med
    );
    setMedications(updated);
    saveToStorage(updated);
  };
  
  const deleteMedication = (id: string) => {
    const updated = medications.filter(med => med.id !== id);
    setMedications(updated);
    saveToStorage(updated);
  };
  
  const duplicateMedication = (med: Medication) => {
    const duplicated: Medication = {
      ...med,
      id: Date.now().toString(),
      taken: false,
      startDate: med.daysNeeded ? new Date().toISOString() : med.startDate,
      endDate: med.daysNeeded ? new Date(new Date().getTime() + (med.daysNeeded * 24 * 60 * 60 * 1000)).toISOString() : med.endDate,
    };
    
    const updated = [...medications, duplicated];
    setMedications(updated);
    saveToStorage(updated);
  };
  
  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  // Calculate progress
  const takenCount = medications.filter(m => m.taken).length;
  const totalCount = medications.length;
  const progress = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;
  
  // Helper function to calculate days remaining
  const getDaysRemaining = (med: Medication) => {
    if (!med.daysNeeded || !med.startDate) return null;
    
    const start = new Date(med.startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = med.daysNeeded - daysElapsed;
    
    return {
      daysElapsed,
      daysRemaining: Math.max(0, daysRemaining),
      daysNeeded: med.daysNeeded,
      progress: Math.min(100, (daysElapsed / med.daysNeeded) * 100),
      isComplete: daysRemaining <= 0
    };
  };
  
  // Sort medications by time
  const sortedMedications = [...medications].sort((a, b) => {
    if (sortBy === 'time') return a.time.localeCompare(b.time);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'status') return a.taken ? 1 : -1;
    return 0;
  }).filter(med => showCompleted || !med.taken);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        expand={false}
        richColors
        closeButton
      />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900">Pill Timer</h1>
                <p className="text-slate-500">{getGreeting()}</p>
              </div>
            </div>
            
            {/* Notification Toggle */}
            {/* <button
              onClick={toggleNotifications}
              className={`p-2.5 rounded-xl transition-colors ${
                notificationsEnabled
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
              title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
            >
              {notificationsEnabled ? (
                <Bell className="w-5 h-5" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </button> */}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8 pb-24">
        {/* Notification Help Banner - Show when notifications are NOT enabled but available */}
        {/* {!notificationsEnabled && 'Notification' in window && (
          <Card className="p-4 mb-6 bg-blue-50 border border-blue-100">
            <div className="flex gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-blue-900 mb-1">Enable Notifications</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Get reminded 5 minutes before each medication time. 
                </p>
                <div className="text-blue-600 text-sm space-y-2">
                  <p><strong>📱 On Mobile:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Tap the bell icon above</li>
                    <li>Allow notifications when prompted</li>
                    <li>Keep this tab/app open for timely alerts</li>
                    <li>For best results, add to home screen (Install as App)</li>
                  </ol>
                  <p className="mt-3"><strong>💡 Tip:</strong> Install as a PWA for background notifications even when browser is minimized!</p>
                </div>
                <Button
                  onClick={toggleNotifications}
                  variant="primary"
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Now
                </Button>
              </div>
              <button
                onClick={(e) => {
                  e.currentTarget.parentElement?.parentElement?.remove();
                }}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </Card>
        )} */}
        
        {/* Progress Card */}
        <Card className="p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-900">Daily Progress</h3>
              <p className="text-slate-500">
                {takenCount} of {totalCount} medications taken
              </p>
            </div>
            <div className="text-slate-900">
              {Math.round(progress)}%
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Test Notification Button - Only show when notifications are enabled */}
          {/* {notificationsEnabled && (
            <Button
              onClick={sendTestNotification}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          )} */}
        </Card>
        
        {/* Medications List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-slate-900">Today's Schedule</h2>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">{sortedMedications.length} items</span>
            
            {/* Sort/Filter Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterOpen(!isFilterOpen);
                }}
                className="p-2 rounded-lg hover:bg-white transition-colors border border-slate-200"
              >
                <SlidersHorizontal className="w-5 h-5 text-slate-600" />
              </button>
              
              {/* Filter Dropdown */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10 animate-fadeIn">
                  {/* Sort By Section */}
                  <div className="px-4 py-2">
                    <p className="text-slate-500 mb-2">Sort by</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setSortBy('time');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                          sortBy === 'time'
                            ? 'bg-slate-900 text-white'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        Time (Upcoming)
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('name');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                          sortBy === 'name'
                            ? 'bg-slate-900 text-white'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        Name (A-Z)
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('status');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                          sortBy === 'status'
                            ? 'bg-slate-900 text-white'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        Status (Unchecked First)
                      </button>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-slate-200 my-2" />
                  
                  {/* Show/Hide Completed */}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-slate-700">Show Completed</span>
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          showCompleted ? 'bg-green-500' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 mt-0.5 ${
                            showCompleted ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {sortedMedications.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="inline-flex p-4 bg-slate-50 rounded-2xl mb-4">
              <Pill className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-2">No medications scheduled</p>
            <p className="text-slate-400">
              Tap the + button to add your first medication
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedMedications.map((med) => {
              const daysInfo = getDaysRemaining(med);
              
              return (
              <Card
                key={med.id}
                className={`p-4 shadow-sm transition-all duration-300 ${
                  med.taken ? 'bg-slate-50 opacity-60' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaken(med.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      med.taken
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {med.taken && <Check className="w-4 h-4 text-white" />}
                  </button>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-slate-900 ${
                        med.taken ? 'line-through' : ''
                      }`}
                    >
                      {med.name}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{med.time}</span>
                      {med.dosage && (
                        <>
                          <span>•</span>
                          <span>{med.dosage}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Three-Dot Context Menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === med.id ? null : med.id);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-slate-500" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === med.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 animate-fadeIn">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(med);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-700">Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateMedication(med);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-blue-500" />
                          <span className="text-slate-700">Duplicate</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMedication(med.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span className="text-red-600">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Days Remaining Section */}
                {daysInfo && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          daysInfo.isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-slate-600">
                          {daysInfo.isComplete ? (
                            'Treatment Complete'
                          ) : (
                            `${daysInfo.daysRemaining} day${daysInfo.daysRemaining !== 1 ? 's' : ''} remaining`
                          )}
                        </span>
                      </div>
                      <span className="text-slate-400">
                        {daysInfo.daysElapsed}/{daysInfo.daysNeeded} days
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          daysInfo.isComplete
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        style={{ width: `${daysInfo.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 right-8 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800 active:scale-95 transition-all duration-200 hover:shadow-3xl"
      >
        <Plus className="w-6 h-6" />
      </button>
      
      {/* Add/Edit Medication Modal */}
      <Modal
        isOpen={isAddModalOpen || editingMed !== null}
        onClose={closeModal}
        title={editingMed ? "Edit Medication" : "Add Medication"}
      >
        <form onSubmit={editingMed ? editMedication : addMedication} className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">
              Medication Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Aspirin"
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-slate-700 mb-2">
              Time
            </label>
            <Input
              type="time"
              value={newMed.time}
              onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-slate-700 mb-2">
              Dosage <span className="text-slate-400">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., 500mg"
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
            />
          </div>
          
          {/* Duration Section */}
          <div>
            <label className="block text-slate-700 mb-3">
              Treatment Duration <span className="text-slate-400">(optional)</span>
            </label>
            
            {/* Duration Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setDurationMode('days')}
                className={`flex-1 px-4 py-2.5 rounded-xl transition-all ${ 
                  durationMode === 'days'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Days
              </button>
              <button
                type="button"
                onClick={() => setDurationMode('dateRange')}
                className={`flex-1 px-4 py-2.5 rounded-xl transition-all ${
                  durationMode === 'dateRange'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Date Range
              </button>
            </div>
            
            {/* Days Input */}
            {durationMode === 'days' && (
              <Input
                type="number"
                placeholder="e.g., 30"
                value={newMed.daysNeeded}
                onChange={(e) => setNewMed({ ...newMed, daysNeeded: e.target.value })}
              />
            )}
            
            {/* Date Range Inputs */}
            {durationMode === 'dateRange' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 mb-1.5">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {editingMed ? "Save Changes" : "Add Medication"}
            </Button>
          </div>
        </form>
      </Modal>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}