/**
 * User Preferences API
 * GET/PUT user preferences for authenticated users.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, addSecurityHeaders } from "@/lib/api-middleware";
import { getUserPreferences, saveUserPreferences } from "@/lib/user-preferences";
import { logger } from "@/lib/logger";
import { z } from "zod";

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  sidebarWidth: z.number().min(200).max(600).optional(),
  leftSidebarOpen: z.boolean().optional(),
  rightSidebarOpen: z.boolean().optional(),
  completedTours: z.array(z.string()).optional(),
  seenActions: z.array(z.string()).optional(),
  visitedTabs: z.array(z.string()).optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  lastActiveTab: z.string().optional(),
});

/**
 * GET /api/user/preferences - Get user preferences
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    const preferences = await getUserPreferences(user.id);

    logger.request("GET", "/api/user/preferences", 200, Date.now() - startTime, {
      userId: user.id,
    });

    const response = NextResponse.json(preferences);
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error(
      "Error fetching user preferences",
      error instanceof Error ? error : undefined
    );

    const response = NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

/**
 * PUT /api/user/preferences - Update user preferences
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    const body = await request.json();
    const validated = preferencesSchema.parse(body);

    await saveUserPreferences(user.id, validated);

    logger.request("PUT", "/api/user/preferences", 200, Date.now() - startTime, {
      userId: user.id,
      updatedFields: Object.keys(validated),
    });

    const response = NextResponse.json({ success: true });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation failed for preferences update", {
        issues: error.issues,
      });
      const response = NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    logger.error(
      "Error updating user preferences",
      error instanceof Error ? error : undefined
    );

    const response = NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}


