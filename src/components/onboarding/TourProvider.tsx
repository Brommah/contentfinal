"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { TabType } from "@/components/dashboard/TabNavigation";

/**
 * Tour step definition schema
 */
export interface TourStep {
  id: string;
  target: string; // CSS selector (data-tour attribute)
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  spotlight?: boolean;
  tabRestriction?: TabType; // Only show on specific tab
  action?: {
    label: string;
    onClick: () => void;
  };
  media?: {
    type: "image" | "video";
    src: string;
  };
}

/**
 * Tour definition
 */
export interface TourDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: TourStep[];
  tabRestriction?: TabType;
}

/**
 * Context state interface
 */
interface TourState {
  currentTour: string | null;
  currentStep: number;
  completedTours: string[];
  seenActions: string[];
  visitedTabs: TabType[];
  showTabSuggestion: boolean;
  suggestedTab: TabType | null;
}

/**
 * Context value interface
 */
interface TourContextValue extends TourState {
  // Actions
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeTour: () => void;
  skipTour: () => void;
  markActionSeen: (actionId: string) => void;
  resetAllTours: () => void;
  resetTour: (tourId: string) => void;
  
  // Tab-awareness
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dismissTabSuggestion: () => void;
  
  // Helpers
  isTourComplete: (tourId: string) => boolean;
  isActionSeen: (actionId: string) => boolean;
  hasVisitedTab: (tab: TabType) => boolean;
  getCurrentTourSteps: () => TourStep[];
  getAvailableToursForTab: (tab: TabType) => TourDefinition[];
  
  // Tour registry
  registerTour: (tour: TourDefinition) => void;
  registeredTours: TourDefinition[];
}

// LocalStorage keys
const STORAGE_KEYS = {
  COMPLETED_TOURS: "cv-tours-completed",
  SEEN_ACTIONS: "cv-actions-seen",
  VISITED_TABS: "cv-tabs-visited",
  DISMISSED_AT: "cv-tour-dismissed-at",
} as const;

// Create context
const TourContext = createContext<TourContextValue | null>(null);

/**
 * TourProvider - Context provider for managing tour state
 */
interface TourProviderProps {
  children: ReactNode;
  initialTab?: TabType;
}

export function TourProvider({ children, initialTab = "schema" }: TourProviderProps) {
  const [registeredTours, setRegisteredTours] = useState<TourDefinition[]>([]);
  const [state, setState] = useState<TourState>({
    currentTour: null,
    currentStep: 0,
    completedTours: [],
    seenActions: [],
    visitedTabs: [],
    showTabSuggestion: false,
    suggestedTab: null,
  });
  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);
  const [mounted, setMounted] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    setMounted(true);
    
    try {
      const completedTours = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.COMPLETED_TOURS) || "[]"
      ) as string[];
      const seenActions = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.SEEN_ACTIONS) || "[]"
      ) as string[];
      const visitedTabs = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.VISITED_TABS) || "[]"
      ) as TabType[];

      setState((prev) => ({
        ...prev,
        completedTours,
        seenActions,
        visitedTabs,
      }));
    } catch (error) {
      console.error("[TourProvider] Failed to load persisted state:", error);
    }
  }, []);

  // Persist state changes to localStorage
  const persistState = useCallback((updates: Partial<TourState>) => {
    if (!mounted) return;

    try {
      if (updates.completedTours !== undefined) {
        localStorage.setItem(
          STORAGE_KEYS.COMPLETED_TOURS,
          JSON.stringify(updates.completedTours)
        );
      }
      if (updates.seenActions !== undefined) {
        localStorage.setItem(
          STORAGE_KEYS.SEEN_ACTIONS,
          JSON.stringify(updates.seenActions)
        );
      }
      if (updates.visitedTabs !== undefined) {
        localStorage.setItem(
          STORAGE_KEYS.VISITED_TABS,
          JSON.stringify(updates.visitedTabs)
        );
      }
    } catch (error) {
      console.error("[TourProvider] Failed to persist state:", error);
    }
  }, [mounted]);

  // Register a tour
  const registerTour = useCallback((tour: TourDefinition) => {
    setRegisteredTours((prev) => {
      const exists = prev.some((t) => t.id === tour.id);
      if (exists) return prev;
      return [...prev, tour];
    });
  }, []);

  // Start a tour
  const startTour = useCallback((tourId: string) => {
    setState((prev) => ({
      ...prev,
      currentTour: tourId,
      currentStep: 0,
      showTabSuggestion: false,
      suggestedTab: null,
    }));
  }, []);

  // Get current tour steps
  const getCurrentTourSteps = useCallback((): TourStep[] => {
    if (!state.currentTour) return [];
    const tour = registeredTours.find((t) => t.id === state.currentTour);
    return tour?.steps || [];
  }, [state.currentTour, registeredTours]);

  // Navigation
  const nextStep = useCallback(() => {
    const steps = getCurrentTourSteps();
    setState((prev) => {
      if (prev.currentStep < steps.length - 1) {
        return { ...prev, currentStep: prev.currentStep + 1 };
      }
      return prev;
    });
  }, [getCurrentTourSteps]);

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep > 0) {
        return { ...prev, currentStep: prev.currentStep - 1 };
      }
      return prev;
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    const steps = getCurrentTourSteps();
    if (step >= 0 && step < steps.length) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  }, [getCurrentTourSteps]);

  // Complete tour
  const completeTour = useCallback(() => {
    setState((prev) => {
      if (!prev.currentTour) return prev;
      
      const newCompletedTours = prev.completedTours.includes(prev.currentTour)
        ? prev.completedTours
        : [...prev.completedTours, prev.currentTour];
      
      persistState({ completedTours: newCompletedTours });
      
      return {
        ...prev,
        completedTours: newCompletedTours,
        currentTour: null,
        currentStep: 0,
      };
    });
  }, [persistState]);

  // Skip tour - dismisses for this session but doesn't mark as permanently completed
  // The tour can be restarted via the Tour Launcher
  const skipTour = useCallback(() => {
    const skippedTourId = state.currentTour;
    
    setState((prev) => ({
      ...prev,
      currentTour: null,
      currentStep: 0,
      showTabSuggestion: false,
      suggestedTab: null,
    }));
    
    // Track which tour was skipped and when (for session-based dismissal)
    try {
      // Handle potential old format (string instead of object)
      let skippedTours: Record<string, string> = {};
      const stored = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
            skippedTours = parsed;
          }
        } catch {
          // Old format or corrupted - reset to empty object
          skippedTours = {};
        }
      }
      
      if (skippedTourId) {
        skippedTours[skippedTourId] = new Date().toISOString();
      }
      localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, JSON.stringify(skippedTours));
    } catch (error) {
      console.error("[TourProvider] Failed to save dismiss timestamp:", error);
    }
  }, [state.currentTour]);

  // Mark action as seen
  const markActionSeen = useCallback((actionId: string) => {
    setState((prev) => {
      if (prev.seenActions.includes(actionId)) return prev;
      
      const newSeenActions = [...prev.seenActions, actionId];
      persistState({ seenActions: newSeenActions });
      
      return { ...prev, seenActions: newSeenActions };
    });
  }, [persistState]);

  // Reset all tours
  const resetAllTours = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completedTours: [],
      seenActions: [],
      visitedTabs: [],
      currentTour: null,
      currentStep: 0,
    }));
    
    try {
      localStorage.removeItem(STORAGE_KEYS.COMPLETED_TOURS);
      localStorage.removeItem(STORAGE_KEYS.SEEN_ACTIONS);
      localStorage.removeItem(STORAGE_KEYS.VISITED_TABS);
      localStorage.removeItem(STORAGE_KEYS.DISMISSED_AT);
    } catch (error) {
      console.error("[TourProvider] Failed to reset state:", error);
    }
  }, []);

  // Reset a specific tour
  const resetTour = useCallback((tourId: string) => {
    setState((prev) => {
      const newCompletedTours = prev.completedTours.filter((id) => id !== tourId);
      persistState({ completedTours: newCompletedTours });
      return { ...prev, completedTours: newCompletedTours };
    });
  }, [persistState]);

  // Set active tab with suggestion logic
  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    
    setState((prev) => {
      const isFirstVisit = !prev.visitedTabs.includes(tab);
      const hasTabTour = registeredTours.some(
        (t) => t.tabRestriction === tab && !prev.completedTours.includes(t.id)
      );
      
      let newVisitedTabs = prev.visitedTabs;
      if (isFirstVisit) {
        newVisitedTabs = [...prev.visitedTabs, tab];
        persistState({ visitedTabs: newVisitedTabs });
      }
      
      // If there's an active tour that's tab-restricted to a different tab, stop it
      let shouldStopTour = false;
      if (prev.currentTour) {
        const currentTourDef = registeredTours.find((t) => t.id === prev.currentTour);
        if (currentTourDef?.tabRestriction && currentTourDef.tabRestriction !== tab) {
          shouldStopTour = true;
        }
      }
      
      return {
        ...prev,
        visitedTabs: newVisitedTabs,
        showTabSuggestion: isFirstVisit && hasTabTour && !prev.currentTour && !shouldStopTour,
        suggestedTab: isFirstVisit && hasTabTour ? tab : null,
        // Stop the tour if it's for a different tab
        currentTour: shouldStopTour ? null : prev.currentTour,
        currentStep: shouldStopTour ? 0 : prev.currentStep,
      };
    });
  }, [registeredTours, persistState]);

  // Dismiss tab suggestion
  const dismissTabSuggestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showTabSuggestion: false,
      suggestedTab: null,
    }));
  }, []);

  // Helper functions
  const isTourComplete = useCallback(
    (tourId: string) => state.completedTours.includes(tourId),
    [state.completedTours]
  );

  const isActionSeen = useCallback(
    (actionId: string) => state.seenActions.includes(actionId),
    [state.seenActions]
  );

  const hasVisitedTab = useCallback(
    (tab: TabType) => state.visitedTabs.includes(tab),
    [state.visitedTabs]
  );

  const getAvailableToursForTab = useCallback(
    (tab: TabType): TourDefinition[] => {
      return registeredTours.filter(
        (tour) => !tour.tabRestriction || tour.tabRestriction === tab
      );
    },
    [registeredTours]
  );

  const contextValue: TourContextValue = {
    ...state,
    activeTab,
    registeredTours,
    
    // Actions
    startTour,
    nextStep,
    prevStep,
    goToStep,
    completeTour,
    skipTour,
    markActionSeen,
    resetAllTours,
    resetTour,
    
    // Tab-awareness
    setActiveTab,
    dismissTabSuggestion,
    
    // Helpers
    isTourComplete,
    isActionSeen,
    hasVisitedTab,
    getCurrentTourSteps,
    getAvailableToursForTab,
    
    // Registry
    registerTour,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
}

/**
 * Hook to use tour context
 */
export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

/**
 * Hook to register a tour on mount
 */
export function useRegisterTour(tour: TourDefinition) {
  const { registerTour } = useTour();
  
  useEffect(() => {
    registerTour(tour);
  }, [tour, registerTour]);
}

export { TourContext };

