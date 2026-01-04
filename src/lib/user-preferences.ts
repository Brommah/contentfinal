/**
 * User Preferences Service
 * Manages user settings with database persistence for authenticated users
 * and localStorage fallback for demo mode.
 */

import { supabase } from "./supabase";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  sidebarWidth: number;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  completedTours: string[];
  seenActions: string[];
  visitedTabs: string[];
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  lastActiveTab: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  sidebarWidth: 320,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  completedTours: [],
  seenActions: [],
  visitedTabs: [],
  notificationsEnabled: true,
  emailNotifications: false,
  lastActiveTab: "home",
};

const LOCAL_STORAGE_KEY = "cv-user-preferences";

/**
 * Get user preferences.
 * Falls back to localStorage for demo mode.
 */
export async function getUserPreferences(userId?: string): Promise<UserPreferences> {
  if (!userId) {
    return getLocalPreferences();
  }

  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No preferences found, create defaults
        return DEFAULT_PREFERENCES;
      }
      throw error;
    }

    return mapDbToPreferences(data);
  } catch (err) {
    console.warn("Failed to load preferences from database, using local:", err);
    return getLocalPreferences();
  }
}

/**
 * Save user preferences.
 */
export async function saveUserPreferences(
  userId: string | undefined,
  preferences: Partial<UserPreferences>
): Promise<void> {
  if (!userId) {
    saveLocalPreferences(preferences);
    return;
  }

  try {
    const dbData = mapPreferencesToDb(preferences);
    
    const { error } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: userId,
        ...dbData,
      }, {
        onConflict: "user_id",
      });

    if (error) throw error;
  } catch (err) {
    console.warn("Failed to save preferences to database, using local:", err);
    saveLocalPreferences(preferences);
  }
}

/**
 * Update a single preference.
 */
export async function updatePreference<K extends keyof UserPreferences>(
  userId: string | undefined,
  key: K,
  value: UserPreferences[K]
): Promise<void> {
  await saveUserPreferences(userId, { [key]: value });
}

// ============================================
// Local Storage Functions (for demo mode)
// ============================================

function getLocalPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.warn("Failed to load local preferences:", err);
  }

  return DEFAULT_PREFERENCES;
}

function saveLocalPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === "undefined") return;

  try {
    const current = getLocalPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save local preferences:", err);
  }
}

// ============================================
// Database Mapping
// ============================================

interface DbUserPreferences {
  theme?: string;
  sidebar_width?: number;
  left_sidebar_open?: boolean;
  right_sidebar_open?: boolean;
  completed_tours?: string[];
  seen_actions?: string[];
  visited_tabs?: string[];
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  last_active_tab?: string;
}

function mapDbToPreferences(data: DbUserPreferences): UserPreferences {
  return {
    theme: (data.theme as UserPreferences["theme"]) || DEFAULT_PREFERENCES.theme,
    sidebarWidth: data.sidebar_width ?? DEFAULT_PREFERENCES.sidebarWidth,
    leftSidebarOpen: data.left_sidebar_open ?? DEFAULT_PREFERENCES.leftSidebarOpen,
    rightSidebarOpen: data.right_sidebar_open ?? DEFAULT_PREFERENCES.rightSidebarOpen,
    completedTours: data.completed_tours ?? DEFAULT_PREFERENCES.completedTours,
    seenActions: data.seen_actions ?? DEFAULT_PREFERENCES.seenActions,
    visitedTabs: data.visited_tabs ?? DEFAULT_PREFERENCES.visitedTabs,
    notificationsEnabled: data.notifications_enabled ?? DEFAULT_PREFERENCES.notificationsEnabled,
    emailNotifications: data.email_notifications ?? DEFAULT_PREFERENCES.emailNotifications,
    lastActiveTab: data.last_active_tab ?? DEFAULT_PREFERENCES.lastActiveTab,
  };
}

function mapPreferencesToDb(preferences: Partial<UserPreferences>): DbUserPreferences {
  const result: DbUserPreferences = {};

  if (preferences.theme !== undefined) result.theme = preferences.theme;
  if (preferences.sidebarWidth !== undefined) result.sidebar_width = preferences.sidebarWidth;
  if (preferences.leftSidebarOpen !== undefined) result.left_sidebar_open = preferences.leftSidebarOpen;
  if (preferences.rightSidebarOpen !== undefined) result.right_sidebar_open = preferences.rightSidebarOpen;
  if (preferences.completedTours !== undefined) result.completed_tours = preferences.completedTours;
  if (preferences.seenActions !== undefined) result.seen_actions = preferences.seenActions;
  if (preferences.visitedTabs !== undefined) result.visited_tabs = preferences.visitedTabs;
  if (preferences.notificationsEnabled !== undefined) result.notifications_enabled = preferences.notificationsEnabled;
  if (preferences.emailNotifications !== undefined) result.email_notifications = preferences.emailNotifications;
  if (preferences.lastActiveTab !== undefined) result.last_active_tab = preferences.lastActiveTab;

  return result;
}


