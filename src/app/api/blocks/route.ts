import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getAuthenticatedUser, addSecurityHeaders } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";

// Validation schemas
const blockTypeEnum = z.enum([
  "COMPANY",
  "PAGE_ROOT",
  "CORE_VALUE_PROP",
  "PAIN_POINT",
  "SOLUTION",
  "FEATURE",
  "VERTICAL",
  "ARTICLE",
  "TECH_COMPONENT",
]);

const companyEnum = z.enum(["CERE", "CEF", "SHARED"]);
const statusEnum = z.enum(["LIVE", "VISION", "DRAFT", "ARCHIVED", "PENDING_REVIEW", "APPROVED", "NEEDS_CHANGES"]);

const createBlockSchema = z.object({
  type: blockTypeEnum,
  company: companyEnum,
  status: statusEnum.optional().default("DRAFT"),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0),
  width: z.number().optional().default(280),
  height: z.number().optional().default(120),
  externalUrl: z.string().url().optional(),
  parentId: z.string().optional(),
  workspaceId: z.string().min(1),
});

/**
 * GET /api/blocks - List blocks (optionally filtered by workspace)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Optional auth - allow both authenticated and demo access
    const user = await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const type = searchParams.get("type");
    const company = searchParams.get("company");

    // If authenticated, verify access to workspace
    // For now, we allow access if user owns the workspace or it's demo mode
    const blocks = await db.block.findMany({
      where: {
        ...(workspaceId && { workspaceId }),
        ...(type && { type: type as z.infer<typeof blockTypeEnum> }),
        ...(company && { company: company as z.infer<typeof companyEnum> }),
      },
      orderBy: { createdAt: "asc" },
    });

    logger.request("GET", "/api/blocks", 200, Date.now() - startTime, {
      userId: user?.id,
      workspaceId,
      blockCount: blocks.length,
    });

    const response = NextResponse.json(blocks);
    return addSecurityHeaders(response);
  } catch (error) {
    logger.error("Error fetching blocks", error instanceof Error ? error : undefined, {
      path: "/api/blocks",
    });
    
    const response = NextResponse.json(
      { error: "Failed to fetch blocks" },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

/**
 * POST /api/blocks - Create a new block
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth is optional for now (allows demo mode)
    const user = await getAuthenticatedUser(request);
    
    const body = await request.json();
    const validated = createBlockSchema.parse(body);

    const block = await db.block.create({
      data: {
        type: validated.type,
        company: validated.company,
        status: validated.status,
        title: validated.title,
        subtitle: validated.subtitle,
        content: validated.content,
        tags: validated.tags,
        positionX: validated.positionX,
        positionY: validated.positionY,
        width: validated.width,
        height: validated.height,
        externalUrl: validated.externalUrl,
        parentId: validated.parentId,
        workspaceId: validated.workspaceId,
      },
    });

    logger.request("POST", "/api/blocks", 201, Date.now() - startTime, {
      userId: user?.id,
      blockId: block.id,
      workspaceId: validated.workspaceId,
    });

    const response = NextResponse.json(block, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation failed for block creation", { issues: error.issues });
      const response = NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }
    
    logger.error("Error creating block", error instanceof Error ? error : undefined);
    
    const response = NextResponse.json(
      { error: "Failed to create block" },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

/**
 * PUT /api/blocks - Bulk update blocks (for batch position updates)
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const user = await getAuthenticatedUser(request);
    
    const body = await request.json();
    const blocks = z.array(z.object({
      id: z.string(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).parse(body);

    // Use transaction for bulk updates
    await db.$transaction(
      blocks.map((block) =>
        db.block.update({
          where: { id: block.id },
          data: {
            ...(block.positionX !== undefined && { positionX: block.positionX }),
            ...(block.positionY !== undefined && { positionY: block.positionY }),
            ...(block.width !== undefined && { width: block.width }),
            ...(block.height !== undefined && { height: block.height }),
          },
        })
      )
    );

    logger.request("PUT", "/api/blocks", 200, Date.now() - startTime, {
      userId: user?.id,
      updatedCount: blocks.length,
    });

    const response = NextResponse.json({ success: true, updated: blocks.length });
    return addSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation failed for bulk block update", { issues: error.issues });
      const response = NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }
    
    logger.error("Error bulk updating blocks", error instanceof Error ? error : undefined);
    
    const response = NextResponse.json(
      { error: "Failed to update blocks" },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}
