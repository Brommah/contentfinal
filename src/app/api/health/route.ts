/**
 * Health Check Endpoint
 * Used for monitoring and deployment verification.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: "ok" | "error" | "skipped";
      latencyMs?: number;
      error?: string;
    };
    environment: {
      status: "ok" | "error";
      missing?: string[];
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks: {
      database: { status: "ok" },
      environment: { status: "ok" },
    },
  };

  // Check environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingEnvVars.length > 0) {
    health.checks.environment = {
      status: "error",
      missing: missingEnvVars,
    };
    health.status = "unhealthy";
    // Skip database check if env vars are missing
    health.checks.database = {
      status: "skipped",
      error: "Missing Supabase environment variables",
    };
  } else {
    // Check database connection
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const dbStart = Date.now();
      const { error } = await supabase.from("workspaces").select("id").limit(1);
      const dbLatency = Date.now() - dbStart;

      if (error) {
        health.checks.database = {
          status: "error",
          latencyMs: dbLatency,
          error: error.message,
        };
        health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
      } else {
        health.checks.database = {
          status: "ok",
          latencyMs: dbLatency,
        };
      }
    } catch (err) {
      health.checks.database = {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown database error",
      };
      health.status = "unhealthy";
    }
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Response-Time": `${Date.now() - startTime}ms`,
    },
  });
}
