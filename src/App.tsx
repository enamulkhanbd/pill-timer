import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pill,
  Plus,
  Check,
  Trash2,
  Activity,
  X,
  Pencil,
  Copy,
  MoreVertical,
  SlidersHorizontal,
  LogOut,
  Users,
} from "lucide-react";
import { toast, Toaster } from "sonner@2.0.3";
import { supabase } from "./utils/supabase/client.tsx";
import { api } from "./utils/api.tsx";
import { Auth } from "./components/Auth.tsx";
import { DatabaseSetup } from "./components/DatabaseSetup.tsx";
import { SetupBanner } from "./components/SetupBanner.tsx";

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
  personName?: string; // NEW: For family tracking
}

interface AppData {
  medications: Medication[];
  lastOpenedDate: string;
}

// Helper function to convert 24-hour time to 12-hour format (01 AM, 02 PM, etc.)
const formatTime = (time24: string): string => {
  if (!time24) return "";

  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24;

  const period = hours >= 12 ? "PM" : "AM";
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  return `${hours12.toString().padStart(2, "0")} ${period}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

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
    isComplete: daysRemaining <= 0,
  };
};

const getLocalDateString = () =>
  new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in device local time

const isActiveOnDate = (med: Medication, date: Date) => {
  if (!med.startDate || !med.endDate) return true;

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const start = new Date(med.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(med.endDate);
  end.setHours(0, 0, 0, 0);

  return checkDate >= start && checkDate <= end;
};

const getMedicationsForDate = (
  medications: Medication[],
  date: Date,
  showCompleted: boolean,
  sortBy: "time" | "name" | "status",
) => {
  let filtered = medications.filter((m) => isActiveOnDate(m, date));

  if (!showCompleted) {
    filtered = filtered.filter((m) => !m.taken);
  }

  return filtered.sort((a, b) => {
    if (sortBy === "time") {
      return a.time.localeCompare(b.time);
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "status") {
      return a.taken === b.taken ? 0 : a.taken ? 1 : -1;
    }
    return 0;
  });
};

// Reusable UI Components (shadcn/ui inspired)
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  const sizes = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
    lg: "px-6 py-3",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
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
}> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  className = "",
}) => {
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
}> = ({ children, className = "", onClick }) => {
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  // Database setup state
  const [isDatabaseSetup, setIsDatabaseSetup] = useState<
    boolean | null
  >(null);
  const [isCreatingTables, setIsCreatingTables] =
    useState(false);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(
    null,
  );

  // App state
  const [medications, setMedications] = useState<Medication[]>(
    [],
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    time: "",
    dosage: "",
    daysNeeded: "",
    personName: "",
  });
  const [editingMed, setEditingMed] =
    useState<Medication | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(
    null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "time" | "name" | "status"
  >("time");
  const [showCompleted, setShowCompleted] = useState(true);
  const [durationMode, setDurationMode] = useState<
    "days" | "dateRange"
  >("days");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const loadInFlight = useRef(false);

  // Check database setup on mount (before auth check)
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        console.log("🔍 Checking if database is set up...");
        const result = await api.checkDatabaseSetup();
        console.log("📊 Database check result:", result);

        if (result && typeof result.isSetup === "boolean") {
          if (!result.isSetup) {
            console.log(
              "❌ Database NOT set up - CREATING TABLES AUTOMATICALLY...",
            );

            // Automatically create tables
            try {
              console.log(
                "🚀 Auto-creating database tables...",
              );
              const createResult =
                await api.initializeDatabase();
              console.log("📊 Create result:", createResult);

              if (createResult.success) {
                console.log(
                  "✅ SUCCESS! Tables created automatically!",
                );
                toast.success(
                  "✅ Database tables created successfully!",
                );

                // Re-check to confirm
                const recheckResult =
                  await api.checkDatabaseSetup();
                setIsDatabaseSetup(recheckResult.isSetup);
              } else {
                console.error(
                  "❌ Auto-create failed:",
                  createResult.error,
                );
                toast.error(
                  "❌ Failed to create tables automatically",
                );
                // Show setup wizard as fallback
                setIsDatabaseSetup(false);
              }
            } catch (error) {
              console.error(
                "❌ Error auto-creating tables:",
                error,
              );
              toast.error("❌ Error creating tables");
              // Show setup wizard as fallback
              setIsDatabaseSetup(false);
            }
          } else {
            console.log(
              "✅ Database IS set up - proceeding to app",
            );
            setIsDatabaseSetup(true);
          }
        } else {
          console.error(
            "❌ Invalid response from checkDatabaseSetup:",
            result,
          );
          // Assume database is not set up if we get invalid response
          setIsDatabaseSetup(false);
        }
      } catch (error) {
        console.error(
          "❌ Error checking database setup:",
          error,
        );
        // On error, assume database is not set up and show setup wizard
        setIsDatabaseSetup(false);
      }
    };

    checkDatabase();
  }, []);

  // After database setup, check for existing session
  useEffect(() => {
    // Only check session if database is set up
    if (isDatabaseSetup !== true) {
      console.log(
        "⏸️ Skipping session check - database not set up yet",
      );
      return;
    }

    console.log("🔐 Checking for existing session...");
    checkSession();
  }, [isDatabaseSetup]);

  // Check for existing session
  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log("✅ Found existing session");
        setSession(session);
        setUser(session.user);
      } else {
        console.log("❌ No existing session found");
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Register Service Worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "✅ Service Worker registered successfully:",
              registration.scope,
            );
          })
          .catch((error) => {
            console.error(
              "❌ Service Worker registration failed:",
              error,
            );
          });
      });
    }
  }, []);

  // Add PWA meta tags
  useEffect(() => {
    // Set theme color
    let metaThemeColor = document.querySelector(
      'meta[name="theme-color"]',
    );
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#0f172a");

    // Set viewport for mobile
    let metaViewport = document.querySelector(
      'meta[name="viewport"]',
    );
    if (!metaViewport) {
      metaViewport = document.createElement("meta");
      metaViewport.setAttribute("name", "viewport");
      document.head.appendChild(metaViewport);
    }
    metaViewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    );

    // Set apple mobile web app capable
    let metaApple = document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]',
    );
    if (!metaApple) {
      metaApple = document.createElement("meta");
      metaApple.setAttribute(
        "name",
        "apple-mobile-web-app-capable",
      );
      document.head.appendChild(metaApple);
    }
    metaApple.setAttribute("content", "yes");

    // Set page title
    document.title = "Pill Timer";
  }, []);

  // Check auth status on mount
  useEffect(() => {
    // Only check auth if database is confirmed to be set up
    if (isDatabaseSetup !== true) return;

    const initAuth = async () => {
      try {
        console.log("🔐 Checking for existing session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        if (session) {
          console.log(
            "✅ User logged in:",
            session.user.email,
            "User ID:",
            session.user.id,
          );
          await loadMedications();
        } else {
          console.log("⚠️ No active session found");
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "🔄 Auth state changed:",
        event,
        session?.user?.email,
      );
      setSession(session);
      setUser(session?.user || null);

      if (session) {
        console.log("✅ User authenticated:", session.user.id);
        // Pass the session user directly to avoid race condition
        loadMedications(session.user);
      } else {
        console.log("⚠️ User logged out");
        setMedications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDatabaseSetup]);

  // Real-time subscriptions
  useEffect(() => {
    // Don't subscribe if database isn't set up or user not logged in
    if (!user || isDatabaseSetup !== true) return;

    // Subscribe to medication changes
    const medicationChannel = supabase
      .channel("medications_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Medication changed:", payload);
          loadMedications();
        },
      )
      .subscribe();

    // Subscribe to log changes
    const logsChannel = supabase
      .channel("logs_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medication_logs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Log changed:", payload);
          loadMedications();
        },
      )
      .subscribe();

    return () => {
      medicationChannel.unsubscribe();
      logsChannel.unsubscribe();
    };
  }, [user, isDatabaseSetup]);

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

    document.addEventListener("click", handleClickOutside);
    return () =>
      document.removeEventListener("click", handleClickOutside);
  }, [openMenuId, isFilterOpen]);

  // Load medications
  const loadMedications = async (userToLoad?: any) => {
    if (loadInFlight.current) {
      return;
    }

    // Use passed user or current user state
    const currentUser = userToLoad || user;

    // Don't try to load if database isn't set up
    if (isDatabaseSetup !== true) {
      console.log(
        "⏸️ Skipping medication load - database not set up yet",
      );
      return;
    }

    if (!currentUser) {
      console.log(
        "⏸️ Skipping medication load - no user logged in",
      );
      return;
    }

    try {
      loadInFlight.current = true;
      console.log(
        "🔄 Loading medications for user:",
        currentUser.id,
      );
      setLoading(true);
      const result = await api.getMedications(getLocalDateString());

      console.log("📊 API Response:", result);

      if (result.success && result.medications) {
        console.log(
          `✅ Loaded ${result.medications.length} medications:`,
          result.medications,
        );

        // Log the first medication to debug field mapping
        if (result.medications.length > 0) {
          console.log(
            "🔍 First medication raw data:",
            result.medications[0],
          );
        }

        // Map backend snake_case fields to frontend camelCase
        const mappedMedications = result.medications.map(
          (med: any) => ({
            id: med.id,
            name: med.name,
            time: med.time || med.scheduled_time, // Support both field names
            dosage: med.dosage,
            taken: med.taken,
            personName: med.person_name,
            daysNeeded: med.duration_days,
            startDate: med.start_date,
            endDate: med.end_date,
          }),
        );

        console.log(
          "🔍 First mapped medication:",
          mappedMedications[0],
        );

        setMedications(mappedMedications);
      } else {
        console.error(
          "❌ Error loading medications:",
          result.error,
        );
        toast.error(
          "Failed to load medications: " + result.error,
        );
      }
    } catch (error) {
      console.error("❌ Error loading medications:", error);
      toast.error("Failed to load medications");
    } finally {
      loadInFlight.current = false;
      setLoading(false);
    }
  };

  // Auth handlers
  const handleLogin = async (
    email: string,
    password: string,
  ) => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      await api.signIn(email, password);
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message);
      toast.error("Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    name: string,
  ) => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      await api.signUp(email, password, name);
      // Auto sign in after signup
      await api.signIn(email, password);
      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(error.message);
      toast.error("Signup failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.signOut();
      setMedications([]);
      toast.success("Logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const addMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let daysNeeded: number | undefined;
      let startDate: string | undefined;
      let endDate: string | undefined;

      // Mode 1: User entered days - convert to date range
      if (durationMode === "days" && newMed.daysNeeded) {
        daysNeeded = parseInt(newMed.daysNeeded);
        const todayLocal = getLocalDateString();
        const start = new Date(`${todayLocal}T00:00:00`);
        const end = new Date(
          start.getTime() + daysNeeded * 24 * 60 * 60 * 1000,
        );
        startDate = start.toISOString();
        endDate = end.toISOString();
      }
      // Mode 2: User entered date range - convert to days
      else if (
        durationMode === "dateRange" &&
        dateRange.startDate &&
        dateRange.endDate
      ) {
        const start = new Date(`${dateRange.startDate}T00:00:00`);
        const end = new Date(`${dateRange.endDate}T00:00:00`);
        const diffTime = Math.abs(
          end.getTime() - start.getTime(),
        );
        daysNeeded =
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const medication = {
        id: crypto.randomUUID(),
        name: newMed.name,
        time: newMed.time,
        dosage: newMed.dosage,
        person_name: newMed.personName,
        duration_days: daysNeeded,
        start_date: startDate,
        end_date: endDate,
      };

      // Save to Supabase
      const { medication: savedMed } =
        await api.addMedication(medication);

      // Update local state
      setMedications([
        ...medications,
        {
          id: savedMed.id,
          name: savedMed.name,
          time: savedMed.time,
          dosage: savedMed.dosage,
          taken: false,
          daysNeeded: savedMed.duration_days,
          startDate: savedMed.start_date,
          endDate: savedMed.end_date,
          personName: savedMed.person_name,
        },
      ]);

      // Reset form
      setNewMed({
        name: "",
        time: "",
        dosage: "",
        daysNeeded: "",
        personName: "",
      });
      setDateRange({ startDate: "", endDate: "" });
      setDurationMode("days");
      setIsAddModalOpen(false);

      toast.success("💊 Medication added!");
    } catch (error) {
      console.error("Error adding medication:", error);
      toast.error("Failed to add medication");
    }
  };

  const editMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMed) return;

    try {
      let daysNeeded: number | undefined;
      let startDate: string | undefined;
      let endDate: string | undefined;

      // Mode 1: User entered days - convert to date range
      if (durationMode === "days" && newMed.daysNeeded) {
        daysNeeded = parseInt(newMed.daysNeeded);
        const todayLocal = getLocalDateString();
        const start = new Date(`${todayLocal}T00:00:00`);
        startDate = start.toISOString();
        endDate = new Date(
          start.getTime() + daysNeeded * 24 * 60 * 60 * 1000,
        ).toISOString();
      }
      // Mode 2: User entered date range - convert to days
      else if (
        durationMode === "dateRange" &&
        dateRange.startDate &&
        dateRange.endDate
      ) {
        const start = new Date(`${dateRange.startDate}T00:00:00`);
        const end = new Date(`${dateRange.endDate}T00:00:00`);
        const diffTime = Math.abs(
          end.getTime() - start.getTime(),
        );
        daysNeeded =
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const updates = {
        name: newMed.name,
        time: newMed.time,
        dosage: newMed.dosage,
        person_name: newMed.personName,
        duration_days: daysNeeded,
        start_date: startDate,
        end_date: endDate,
      };

      console.log("📝 Sending updates to API:", updates);

      await api.updateMedication(editingMed.id, updates);

      // Update local state
      setMedications(
        medications.map((med) =>
          med.id === editingMed.id
            ? {
                ...med,
                name: newMed.name,
                time: newMed.time,
                dosage: newMed.dosage,
                personName: newMed.personName,
                daysNeeded,
                startDate,
                endDate,
              }
            : med,
        ),
      );

      setNewMed({
        name: "",
        time: "",
        dosage: "",
        daysNeeded: "",
        personName: "",
      });
      setDateRange({ startDate: "", endDate: "" });
      setDurationMode("days");
      setEditingMed(null);

      toast.success("✏️ Medication updated!");
    } catch (error: any) {
      console.error("❌ Error updating medication:", error);
      toast.error(
        `Failed to update: ${error.message || "Unknown error"}`,
      );
    }
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setNewMed({
      name: med.name,
      time: med.time,
      dosage: med.dosage || "",
      daysNeeded: med.daysNeeded
        ? med.daysNeeded.toString()
        : "",
      personName: med.personName || "",
    });

    // If medication has date range data, populate it and switch to date range mode
    if (med.startDate && med.endDate) {
      const startDate = new Date(med.startDate)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(med.endDate)
        .toISOString()
        .split("T")[0];
      setDateRange({ startDate, endDate });
      setDurationMode("dateRange");
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingMed(null);
    setNewMed({
      name: "",
      time: "",
      dosage: "",
      daysNeeded: "",
      personName: "",
    });
    setDateRange({ startDate: "", endDate: "" });
    setDurationMode("days");
  };

  const toggleTaken = async (id: string) => {
    const medication = medications.find((m) => m.id === id);
    if (!medication) return;

    try {
      console.log(
        `🔄 Toggling taken status for: ${medication.name} (ID: ${id})`,
      );

      if (!medication.taken) {
        // Mark as taken
        console.log("📝 Marking as taken...", {
          medicationId: id,
          scheduledTime: medication.time,
          markedBy:
            user?.user_metadata?.name || medication.personName,
        });

        const result = await api.markAsTaken(
          id,
          medication.time,
          user?.user_metadata?.name || medication.personName,
        );
        console.log("✅ Mark as taken result:", result);

        // Update local state
        setMedications(
          medications.map((m) =>
            m.id === id ? { ...m, taken: true } : m,
          ),
        );

        toast.success(`✓ ${medication.name} marked as taken!`);
      } else {
        // Unmark as taken
        console.log("🔙 Unmarking as taken...");
        const result = await api.unmarkAsTaken(id);
        console.log("✅ Unmark result:", result);

        // Update local state
        setMedications(
          medications.map((m) =>
            m.id === id ? { ...m, taken: false } : m,
          ),
        );

        toast.success(`${medication.name} unmarked`);
      }
    } catch (error: any) {
      console.error("❌ Error toggling taken status:", error);
      toast.error(
        `Failed to update status: ${error.message || "Unknown error"}`,
      );
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      await api.deleteMedication(id);
      setMedications(medications.filter((m) => m.id !== id));
      toast.success("🗑️ Medication deleted");
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast.error("Failed to delete medication");
    }
  };

  const duplicateMedication = async (med: Medication) => {
    try {
      const duplicated = {
        id: crypto.randomUUID(),
        name: med.name + " (Copy)",
        time: med.time,
        dosage: med.dosage,
        person_name: med.personName,
        duration_days: med.daysNeeded,
        start_date: med.daysNeeded
          ? new Date(`${getLocalDateString()}T00:00:00`).toISOString()
          : med.startDate,
        end_date: med.daysNeeded
          ? new Date(
              new Date(
                `${getLocalDateString()}T00:00:00`,
              ).getTime() +
                med.daysNeeded * 24 * 60 * 60 * 1000,
            ).toISOString()
          : med.endDate,
      };

      const { medication: savedMed } =
        await api.addMedication(duplicated);

      setMedications([
        ...medications,
        {
          id: savedMed.id,
          name: savedMed.name,
          time: savedMed.time,
          dosage: savedMed.dosage,
          taken: false,
          daysNeeded: savedMed.duration_days,
          startDate: savedMed.start_date,
          endDate: savedMed.end_date,
          personName: savedMed.person_name,
        },
      ]);

      toast.success("📋 Medication duplicated!");
    } catch (error) {
      console.error("Error duplicating medication:", error);
      toast.error("Failed to duplicate medication");
    }
  };

  // Get today's and tomorrow's medications
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const { takenCount, totalCount, progress } = useMemo(() => {
    const taken = medications.filter((m) => m.taken).length;
    const total = medications.length;
    return {
      takenCount: taken,
      totalCount: total,
      progress: total > 0 ? (taken / total) * 100 : 0,
    };
  }, [medications]);

  const todaysMedications = useMemo(
    () =>
      getMedicationsForDate(
        medications,
        today,
        showCompleted,
        sortBy,
      ),
    [medications, showCompleted, sortBy, today],
  );
  const tomorrowsMedications = useMemo(
    () =>
      getMedicationsForDate(
        medications,
        tomorrow,
        showCompleted,
        sortBy,
      ),
    [medications, showCompleted, sortBy, tomorrow],
  );

  // Show loading spinner
  if (authLoading || isDatabaseSetup === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup screen if database not set up
  if (isDatabaseSetup === false) {
    return (
      <>
        <DatabaseSetup
          onComplete={async () => {
            // Re-check database setup
            const result = await api.checkDatabaseSetup();
            setIsDatabaseSetup(result.isSetup);

            if (result.isSetup) {
              toast.success(" Database is ready!");
              // Reload the page to start fresh
              window.location.reload();
            }
          }}
        />
        <Toaster position="top-center" richColors />
      </>
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
          loading={authLoading}
        />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 rounded-xl">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900">Pill Timer</h1>
                <p className="text-slate-600">
                  Family Medication Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.user_metadata?.name && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-700">
                    {user.user_metadata.name}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Greeting & Progress */}
        <div className="mb-6">
          <h2 className="text-slate-900 mb-4">
            {getGreeting()}!
          </h2>

          <Card className="p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-700" />
                <span className="text-slate-900">
                  Today's Progress
                </span>
              </div>
              <span className="text-slate-700">
                {takenCount}/{totalCount}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-500 mt-2">
              {takenCount === totalCount && totalCount > 0
                ? "🎉 All medications taken!"
                : `${totalCount - takenCount} medication${totalCount - takenCount !== 1 ? "s" : ""} remaining`}
            </p>
          </Card>
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-slate-500">
            Medications Schedule
          </span>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-[Poppins]"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span className="text-slate-700">
                Sort & Filter
              </span>
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-10">
                <div className="mb-4">
                  <label className="block text-slate-700 mb-2">
                    Sort By
                  </label>
                  <div className="space-y-2">
                    {(["time", "name", "status"] as const).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => setSortBy(option)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            sortBy === option
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {option === "time"
                            ? "Time"
                            : option === "name"
                              ? "Name"
                              : "Status"}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCompleted}
                      onChange={(e) =>
                        setShowCompleted(e.target.checked)
                      }
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-slate-700">
                      Show completed
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-600">
              Loading medications...
            </p>
          </div>
        ) : medications.length === 0 ? (
          <Card className="p-12 text-center border border-slate-200">
            <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">
              No medications yet
            </p>
            <p className="text-slate-500 mb-6">
              Add your first medication to get started
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Medication
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Today's Schedule */}
            <div>
              <h3 className="text-slate-900 mb-3">
                Today's Schedule
              </h3>
              {todaysMedications.length === 0 ? (
                <Card className="p-6 text-center border border-slate-200">
                  <p className="text-slate-500">
                    No medications scheduled for today
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todaysMedications.map((med) => {
                    const daysInfo = getDaysRemaining(med);

                    return (
                      <Card
                        key={med.id}
                        className="p-4 border border-slate-200"
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleTaken(med.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all ${
                              med.taken
                                ? "bg-green-500 border-green-500"
                                : "border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            {med.taken && (
                              <Check className="w-5 h-5 text-white" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <h3
                                  className={`text-slate-900 ${med.taken ? "line-through opacity-50" : ""}`}
                                >
                                  {med.personName
                                    ? `${med.personName}'s ${med.name}`
                                    : med.name}
                                </h3>
                                {med.dosage && (
                                  <p className="text-slate-500">
                                    {med.dosage}
                                  </p>
                                )}
                              </div>

                              {/* Menu */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(
                                      openMenuId === med.id
                                        ? null
                                        : med.id,
                                    );
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <MoreVertical className="w-5 h-5 text-slate-500" />
                                </button>

                                {openMenuId === med.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10">
                                    <button
                                      onClick={() => {
                                        openEditModal(med);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Pencil className="w-4 h-4 text-slate-600" />
                                      <span className="text-slate-700">
                                        Edit
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        duplicateMedication(
                                          med,
                                        );
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Copy className="w-4 h-4 text-slate-600" />
                                      <span className="text-slate-700">
                                        Duplicate
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Delete ${med.name}?`,
                                          )
                                        ) {
                                          deleteMedication(
                                            med.id,
                                          );
                                        }
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                      <span className="text-red-600">
                                        Delete
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-500">
                              <span className="flex items-center gap-1">
                                🕐 {formatTime(med.time)}
                              </span>
                            </div>

                            {/* Progress bar for duration */}
                            {daysInfo && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-slate-600">
                                    {daysInfo.isComplete
                                      ? "Treatment Complete"
                                      : `${daysInfo.daysRemaining} day${daysInfo.daysRemaining !== 1 ? "s" : ""} remaining`}
                                  </span>
                                  <span className="text-slate-400">
                                    {daysInfo.daysElapsed}/
                                    {daysInfo.daysNeeded} days
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      daysInfo.isComplete
                                        ? "bg-gradient-to-r from-green-500 to-green-600"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600"
                                    }`}
                                    style={{
                                      width: `${daysInfo.progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tomorrow's Schedule */}
            <div>
              <h3 className="text-slate-900 mb-3">
                Tomorrow's Schedule
              </h3>
              {tomorrowsMedications.length === 0 ? (
                <Card className="p-6 text-center border border-slate-200">
                  <p className="text-slate-500">
                    No medications scheduled for tomorrow
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tomorrowsMedications.map((med) => {
                    const daysInfo = getDaysRemaining(med);

                    return (
                      <Card
                        key={med.id}
                        className="p-4 border border-slate-200 opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          {/* Disabled checkbox for tomorrow */}
                          <div className="flex-shrink-0 w-6 h-6 rounded-lg border-2 border-slate-200 bg-slate-50" />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-slate-700">
                                  {med.personName
                                    ? `${med.personName}'s ${med.name}`
                                    : med.name}
                                </h3>
                                {med.dosage && (
                                  <p className="text-slate-400">
                                    {med.dosage}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-400">
                              <span className="flex items-center gap-1">
                                🕐 {formatTime(med.time)}
                              </span>
                            </div>

                            {/* Progress bar for duration */}
                            {daysInfo && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-slate-500">
                                    {daysInfo.isComplete
                                      ? "Treatment Complete"
                                      : `${daysInfo.daysRemaining} day${daysInfo.daysRemaining !== 1 ? "s" : ""} remaining`}
                                  </span>
                                  <span className="text-slate-400">
                                    {daysInfo.daysElapsed}/
                                    {daysInfo.daysNeeded} days
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      daysInfo.isComplete
                                        ? "bg-gradient-to-r from-green-500 to-green-600"
                                        : "bg-gradient-to-r from-blue-500 to-blue-600"
                                    }`}
                                    style={{
                                      width: `${daysInfo.progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button - only show when medications exist */}
      {medications.length > 0 && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-8 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800 active:scale-95 transition-all duration-200 hover:shadow-3xl"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add/Edit Medication Modal */}
      <Modal
        isOpen={isAddModalOpen || editingMed !== null}
        onClose={closeModal}
        title={
          editingMed ? "Edit Medication" : "Add Medication"
        }
      >
        <form
          onSubmit={editingMed ? editMedication : addMedication}
          className="space-y-4"
        >
          <div>
            <label className="block text-slate-700 mb-2">
              Medication Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Aspirin"
              value={newMed.name}
              onChange={(e) =>
                setNewMed({ ...newMed, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2">
              Person Name (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., John, Sarah, Mom"
              value={newMed.personName}
              onChange={(e) =>
                setNewMed({
                  ...newMed,
                  personName: e.target.value,
                })
              }
            />
            <p className="text-slate-500 mt-1">
              Track which family member this medication is for
            </p>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">
              Time
            </label>
            <Input
              type="time"
              value={newMed.time}
              onChange={(e) =>
                setNewMed({ ...newMed, time: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2">
              Dosage (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., 500mg"
              value={newMed.dosage}
              onChange={(e) =>
                setNewMed({ ...newMed, dosage: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2">
              Duration (Optional)
            </label>

            {/* Toggle between Days and Date Range */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setDurationMode("days")}
                className={`flex-1 px-4 py-2.5 rounded-xl transition-all ${
                  durationMode === "days"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Days
              </button>
              <button
                type="button"
                onClick={() => setDurationMode("dateRange")}
                className={`flex-1 px-4 py-2.5 rounded-xl transition-all ${
                  durationMode === "dateRange"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Date Range
              </button>
            </div>

            {/* Days Input */}
            {durationMode === "days" && (
              <Input
                type="number"
                placeholder="e.g., 30"
                value={newMed.daysNeeded}
                onChange={(e) =>
                  setNewMed({
                    ...newMed,
                    daysNeeded: e.target.value,
                  })
                }
              />
            )}

            {/* Date Range Inputs */}
            {durationMode === "dateRange" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 mb-1.5">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({
                        ...dateRange,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1.5">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({
                        ...dateRange,
                        endDate: e.target.value,
                      })
                    }
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
