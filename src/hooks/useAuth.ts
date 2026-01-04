"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithProvider as authSignInWithProvider,
} from "@/lib/auth";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  supabaseAvailable: boolean;
}

/**
 * Hook for managing authentication state.
 * Automatically subscribes to auth state changes.
 * Returns mock state if Supabase is not configured.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    supabaseAvailable: true,
  });

  useEffect(() => {
    // If Supabase is not available, skip auth setup
    if (!supabase) {
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        supabaseAvailable: false,
      });
      return;
    }
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
        supabaseAvailable: true,
      });
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
        supabaseAvailable: true,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authSignIn(email, password);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authSignUp(email, password);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authSignOut();
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await authSignInWithProvider("google");
  }, []);

  const signInWithGithub = useCallback(async () => {
    await authSignInWithProvider("github");
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
  };
}

