/**
 * Generated Content API Route - Save and retrieve generated content from Notion
 */

import { NextRequest, NextResponse } from "next/server";

const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";

function getNotionApiKey(): string | null {
  return process.env.NOTION_API_KEY || null;
}

function getGeneratedContentDatabaseId(): string | null {
  return process.env.NOTION_GENERATED_CONTENT_DATABASE_ID || null;
}

interface GeneratedContentPayload {
  title: string;
  subtitle?: string;
  content: string;
  template: string;
  tone?: string;
  length?: string;
  company?: string;
  hasEmojis?: boolean;
  hasHashtags?: boolean;
  hasCTA?: boolean;
  sourceBlockIds?: string[];
  customInstructions?: string;
  workspaceId?: string;
  createdBy?: string;
}

async function notionRequest(endpoint: string, method: string = "POST", body?: object) {
  const apiKey = getNotionApiKey();
  if (!apiKey) {
    throw new Error("Notion API key not configured");
  }
  
  const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Notion API error: ${response.status} - ${error.message || response.statusText}`);
  }

  return response.json();
}

// Cache for database ID
let cachedDatabaseId: string | null = null;

async function findOrCreateDatabase(): Promise<string> {
  const configuredDbId = getGeneratedContentDatabaseId();
  if (configuredDbId) {
    return configuredDbId;
  }
  
  if (cachedDatabaseId) {
    return cachedDatabaseId;
  }

  const apiKey = getNotionApiKey();
  if (!apiKey) {
    throw new Error("Notion API key not configured");
  }

  // Search for existing Generated Content database
  const searchResponse = await fetch(`${NOTION_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "Generated Content",
      filter: { property: "object", value: "database" },
    }),
  });

  if (!searchResponse.ok) {
    throw new Error("Failed to search for database");
  }

  const searchData = await searchResponse.json();
  const existingDb = searchData.results?.find(
    (db: { title?: Array<{ plain_text: string }> }) =>
      db.title?.[0]?.plain_text === "Generated Content"
  );

  if (existingDb) {
    cachedDatabaseId = existingDb.id;
    return existingDb.id;
  }

  // Create the database if it doesn't exist
  // First, find a parent page
  const pagesResponse = await fetch(`${NOTION_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { property: "object", value: "page" },
      page_size: 1,
    }),
  });

  if (!pagesResponse.ok) {
    throw new Error("Failed to find parent page");
  }

  const pagesData = await pagesResponse.json();
  if (!pagesData.results?.length) {
    throw new Error("No parent page available. Please create a page in Notion first.");
  }

  const parentPageId = pagesData.results[0].id;

  // Create the database
  const createResponse = await notionRequest("/databases", "POST", {
    parent: { page_id: parentPageId },
    title: [{ text: { content: "Generated Content" } }],
    properties: {
      "Title": { title: {} },
      "Content": { rich_text: {} },
      "Subtitle": { rich_text: {} },
      "Template": {
        select: {
          options: [
            { name: "X/Twitter Post", color: "blue" },
            { name: "LinkedIn Post", color: "purple" },
            { name: "Blog Article", color: "green" },
            { name: "Email Newsletter", color: "orange" },
            { name: "Product Description", color: "pink" },
            { name: "Landing Page Copy", color: "yellow" },
            { name: "Press Release", color: "gray" },
            { name: "Ad Copy", color: "red" },
            { name: "Video Script", color: "brown" },
            { name: "Other", color: "default" },
          ],
        },
      },
      "Tone": {
        select: {
          options: [
            { name: "Professional", color: "blue" },
            { name: "Casual", color: "green" },
            { name: "Friendly", color: "yellow" },
            { name: "Bold", color: "red" },
            { name: "Technical", color: "purple" },
            { name: "Inspirational", color: "orange" },
          ],
        },
      },
      "Length": {
        select: {
          options: [
            { name: "Short", color: "green" },
            { name: "Medium", color: "yellow" },
            { name: "Long", color: "orange" },
            { name: "Extended", color: "red" },
          ],
        },
      },
      "Company": {
        select: {
          options: [
            { name: "CERE", color: "blue" },
            { name: "CEF", color: "purple" },
            { name: "SHARED", color: "green" },
          ],
        },
      },
      "Status": {
        select: {
          options: [
            { name: "DRAFT", color: "gray" },
            { name: "READY", color: "green" },
            { name: "PUBLISHED", color: "blue" },
            { name: "ARCHIVED", color: "brown" },
          ],
        },
      },
      "Has Emojis": { checkbox: {} },
      "Has Hashtags": { checkbox: {} },
      "Has CTA": { checkbox: {} },
      "Source Block IDs": { rich_text: {} },
      "Source Block Count": { number: { format: "number" } },
      "Custom Instructions": { rich_text: {} },
      "Character Count": { number: { format: "number" } },
      "Word Count": { number: { format: "number" } },
      "Workspace ID": { rich_text: {} },
      "Created By": { rich_text: {} },
      "Generated At": { date: {} },
      "Times Copied": { number: { format: "number" } },
      "Used In Roadmap": { checkbox: {} },
      "Created As Block": { checkbox: {} },
    },
  });

  cachedDatabaseId = createResponse.id;
  console.log(`Created Generated Content database: ${createResponse.id}`);
  return createResponse.id;
}

// Helper to truncate text for Notion's 2000 char limit
function truncateText(text: string, maxLength: number = 2000): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export async function POST(request: NextRequest) {
  try {
    const payload: GeneratedContentPayload = await request.json();

    if (!payload.title || !payload.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const databaseId = await findOrCreateDatabase();
    const wordCount = payload.content.split(/\s+/).filter(Boolean).length;
    const charCount = payload.content.length;

    // Build properties object
    const properties: Record<string, unknown> = {
      "Title": {
        title: [{ text: { content: truncateText(payload.title, 200) } }],
      },
      "Content": {
        rich_text: [{ text: { content: truncateText(payload.content) } }],
      },
      "Character Count": { number: charCount },
      "Word Count": { number: wordCount },
      "Status": { select: { name: "DRAFT" } },
      "Generated At": { date: { start: new Date().toISOString() } },
      "Times Copied": { number: 0 },
      "Used In Roadmap": { checkbox: false },
      "Created As Block": { checkbox: false },
    };

    // Add optional fields
    if (payload.subtitle) {
      properties["Subtitle"] = {
        rich_text: [{ text: { content: truncateText(payload.subtitle, 500) } }],
      };
    }
    if (payload.template) {
      properties["Template"] = { select: { name: payload.template } };
    }
    if (payload.tone) {
      properties["Tone"] = { select: { name: payload.tone } };
    }
    if (payload.length) {
      properties["Length"] = { select: { name: payload.length } };
    }
    if (payload.company) {
      properties["Company"] = { select: { name: payload.company } };
    }
    if (payload.hasEmojis !== undefined) {
      properties["Has Emojis"] = { checkbox: payload.hasEmojis };
    }
    if (payload.hasHashtags !== undefined) {
      properties["Has Hashtags"] = { checkbox: payload.hasHashtags };
    }
    if (payload.hasCTA !== undefined) {
      properties["Has CTA"] = { checkbox: payload.hasCTA };
    }
    if (payload.sourceBlockIds?.length) {
      properties["Source Block IDs"] = {
        rich_text: [{ text: { content: truncateText(payload.sourceBlockIds.join(", ")) } }],
      };
      properties["Source Block Count"] = { number: payload.sourceBlockIds.length };
    }
    if (payload.customInstructions) {
      properties["Custom Instructions"] = {
        rich_text: [{ text: { content: truncateText(payload.customInstructions, 500) } }],
      };
    }
    if (payload.workspaceId) {
      properties["Workspace ID"] = {
        rich_text: [{ text: { content: payload.workspaceId } }],
      };
    }
    if (payload.createdBy) {
      properties["Created By"] = {
        rich_text: [{ text: { content: payload.createdBy } }],
      };
    }

    // Create the page in Notion
    const page = await notionRequest("/pages", "POST", {
      parent: { database_id: databaseId },
      properties,
    });

    return NextResponse.json({
      success: true,
      id: page.id,
      url: page.url,
      message: "Content saved to Notion successfully",
    });
  } catch (error) {
    console.error("Generated content save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save content" },
      { status: 500 }
    );
  }
}

// GET - Retrieve generated content from Notion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const template = searchParams.get("template");

    const databaseId = await findOrCreateDatabase();

    // Build filter
    const filters: unknown[] = [];
    if (status) {
      filters.push({
        property: "Status",
        select: { equals: status },
      });
    }
    if (template) {
      filters.push({
        property: "Template",
        select: { equals: template },
      });
    }

    const queryBody: Record<string, unknown> = {
      page_size: Math.min(limit, 100),
      sorts: [{ property: "Generated At", direction: "descending" }],
    };

    if (filters.length === 1) {
      queryBody.filter = filters[0];
    } else if (filters.length > 1) {
      queryBody.filter = { and: filters };
    }

    const response = await notionRequest(`/databases/${databaseId}/query`, "POST", queryBody);

    // Transform results
    const items = response.results?.map((page: Record<string, unknown>) => {
      const props = page.properties as Record<string, Record<string, unknown>>;
      return {
        id: page.id,
        url: page.url,
        title: (props["Title"] as { title?: Array<{ plain_text: string }> })?.title?.[0]?.plain_text || "",
        content: (props["Content"] as { rich_text?: Array<{ plain_text: string }> })?.rich_text?.[0]?.plain_text || "",
        subtitle: (props["Subtitle"] as { rich_text?: Array<{ plain_text: string }> })?.rich_text?.[0]?.plain_text || "",
        template: (props["Template"] as { select?: { name: string } })?.select?.name || "",
        tone: (props["Tone"] as { select?: { name: string } })?.select?.name || "",
        length: (props["Length"] as { select?: { name: string } })?.select?.name || "",
        status: (props["Status"] as { select?: { name: string } })?.select?.name || "",
        generatedAt: (props["Generated At"] as { date?: { start: string } })?.date?.start || "",
        wordCount: (props["Word Count"] as { number?: number })?.number || 0,
        charCount: (props["Character Count"] as { number?: number })?.number || 0,
      };
    }) || [];

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error("Generated content fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch content" },
      { status: 500 }
    );
  }
}

