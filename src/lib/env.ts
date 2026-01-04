/**
 * Environment variable configuration and validation.
 * Centralized access to all environment variables with type safety.
 */

/**
 * Get an environment variable, throwing if required and missing.
 */
function getEnvVar(key: string, required: boolean = false): string | undefined {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Environment configuration object.
 * Access environment variables through this object for type safety.
 */
export const env = {
  // Supabase
  supabase: {
    url: () => getEnvVar("NEXT_PUBLIC_SUPABASE_URL", true)!,
    anonKey: () => getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", true)!,
    serviceRoleKey: () => getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  },

  // Notion - configure via environment variables
  notion: {
    apiKey: () => getEnvVar("NOTION_API_KEY"),
    contentBlocksDatabaseId: () => getEnvVar("NOTION_CONTENT_BLOCKS_DATABASE_ID"),
    roadmapDatabaseId: () => getEnvVar("NOTION_ROADMAP_DATABASE_ID"),
    generatedContentDatabaseId: () => getEnvVar("NOTION_GENERATED_CONTENT_DATABASE_ID"),
  },

  // AI
  gemini: {
    apiKey: () => getEnvVar("GEMINI_API_KEY"),
  },

  // App
  app: {
    url: () => getEnvVar("NEXT_PUBLIC_APP_URL") || "http://localhost:3000",
    isProduction: () => process.env.NODE_ENV === "production",
    isDevelopment: () => process.env.NODE_ENV === "development",
  },
};

/**
 * Validate all required environment variables at startup.
 * Call this in your app initialization.
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required variables
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

