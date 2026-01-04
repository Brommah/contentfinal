/**
 * Authentication module using Supabase Auth.
 * Provides hooks and utilities for user authentication.
 * All functions gracefully handle missing Supabase configuration.
 */

import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Check if Supabase is available, throw if not.
 */
function requireSupabase() {
  if (!supabase) {
    throw new Error("Authentication is not available. Supabase is not configured.");
  }
  return supabase;
}

/**
 * Sign up a new user with email and password.
 */
export async function signUp(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in with email and password.
 */
export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in with OAuth provider.
 */
export async function signInWithProvider(provider: "google" | "github") {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current session.
 */
export async function getSession() {
  if (!supabase) return null;
  
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

/**
 * Get the current user.
 */
export async function getUser() {
  if (!supabase) return null;
  
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (!supabase) {
    // Return a no-op subscription if Supabase is not available
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Reset password for a user.
 */
export async function resetPassword(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update user password.
 */
export async function updatePassword(newPassword: string) {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}


