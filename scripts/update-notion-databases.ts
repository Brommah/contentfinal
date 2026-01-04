/**
 * Update Script - Updates Notion database schemas with correct property names
 * 
 * Run with: npx tsx scripts/update-notion-databases.ts
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";

// Database IDs from environment
const CONTENT_BLOCKS_DATABASE_ID = process.env.NOTION_CONTENT_BLOCKS_DATABASE_ID;
const ROADMAP_ITEMS_DATABASE_ID = process.env.NOTION_ROADMAP_DATABASE_ID;

if (!NOTION_API_KEY || !CONTENT_BLOCKS_DATABASE_ID || !ROADMAP_ITEMS_DATABASE_ID) {
  console.error("Error: Required environment variables are missing:");
  console.error("  - NOTION_API_KEY");
  console.error("  - NOTION_CONTENT_BLOCKS_DATABASE_ID");
  console.error("  - NOTION_ROADMAP_DATABASE_ID");
  process.exit(1);
}

interface NotionResponse {
  id: string;
  [key: string]: unknown;
}

async function notionRequest(
  endpoint: string, 
  method: string = "POST",
  body?: object
): Promise<NotionResponse> {
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json();
    console.error("Notion API Error:", JSON.stringify(error, null, 2));
    throw new Error(`Notion API error: ${response.status} - ${error.message || response.statusText}`);
  }

  return response.json();
}

// Property names to match what the sync service sends
const ROADMAP_PROPERTIES_UPDATE = {
  cv_id: { rich_text: {} },
  description: { rich_text: {} },
  company: {
    select: {
      options: [
        { name: "CERE", color: "blue" },
        { name: "CEF", color: "purple" },
        { name: "SHARED", color: "green" },
      ],
    },
  },
  content_type: {
    select: {
      options: [
        { name: "COMPANY", color: "blue" },
        { name: "CORE_VALUE_PROP", color: "yellow" },
        { name: "PAIN_POINT", color: "red" },
        { name: "SOLUTION", color: "green" },
        { name: "FEATURE", color: "purple" },
        { name: "VERTICAL", color: "orange" },
        { name: "ARTICLE", color: "gray" },
        { name: "TECH_COMPONENT", color: "pink" },
      ],
    },
  },
  status: {
    select: {
      options: [
        { name: "PLANNED", color: "gray" },
        { name: "IN_PROGRESS", color: "blue" },
        { name: "REVIEW", color: "yellow" },
        { name: "PUBLISHED", color: "green" },
        { name: "ARCHIVED", color: "brown" },
      ],
    },
  },
  priority: {
    select: {
      options: [
        { name: "LOW", color: "green" },
        { name: "MEDIUM", color: "yellow" },
        { name: "HIGH", color: "orange" },
        { name: "CRITICAL", color: "red" },
      ],
    },
  },
  tags: { multi_select: { options: [] } },
  target_date: { date: {} },
  end_date: { date: {} },
  phase_id: { rich_text: {} },
  assignee_id: { rich_text: {} },
  milestone_id: { rich_text: {} },
  sync_status: {
    select: {
      options: [
        { name: "SYNCED", color: "green" },
        { name: "PENDING", color: "yellow" },
        { name: "CONFLICT", color: "red" },
      ],
    },
  },
  last_sync_at: { date: {} },
};

const CONTENT_BLOCKS_PROPERTIES_UPDATE = {
  cv_id: { rich_text: {} },
  block_type: {
    select: {
      options: [
        { name: "COMPANY", color: "blue" },
        { name: "CORE_VALUE_PROP", color: "yellow" },
        { name: "PAIN_POINT", color: "red" },
        { name: "SOLUTION", color: "green" },
        { name: "FEATURE", color: "purple" },
        { name: "VERTICAL", color: "orange" },
        { name: "ARTICLE", color: "gray" },
        { name: "TECH_COMPONENT", color: "pink" },
      ],
    },
  },
  company: {
    select: {
      options: [
        { name: "CERE", color: "blue" },
        { name: "CEF", color: "purple" },
        { name: "SHARED", color: "green" },
      ],
    },
  },
  status: {
    select: {
      options: [
        { name: "LIVE", color: "green" },
        { name: "VISION", color: "purple" },
        { name: "DRAFT", color: "gray" },
        { name: "ARCHIVED", color: "brown" },
        { name: "PENDING_REVIEW", color: "yellow" },
        { name: "APPROVED", color: "green" },
        { name: "NEEDS_CHANGES", color: "red" },
      ],
    },
  },
  subtitle: { rich_text: {} },
  content: { rich_text: {} },
  tags: { multi_select: { options: [] } },
  external_url: { url: {} },
  owner_name: { rich_text: {} },
  position_x: { number: { format: "number" } },
  position_y: { number: { format: "number" } },
  width: { number: { format: "number" } },
  height: { number: { format: "number" } },
  workspace_id: { rich_text: {} },
  submitted_for_review_at: { date: {} },
  review_comments: { rich_text: {} },
  sync_status: {
    select: {
      options: [
        { name: "SYNCED", color: "green" },
        { name: "PENDING", color: "yellow" },
        { name: "CONFLICT", color: "red" },
        { name: "ERROR", color: "red" },
      ],
    },
  },
  last_sync_at: { date: {} },
};

async function updateDatabase(databaseId: string, properties: object, name: string) {
  console.log(`📝 Updating ${name} database...`);
  
  try {
    await notionRequest(`/databases/${databaseId}`, "PATCH", {
      properties,
    });
    console.log(`✅ ${name} database updated successfully!`);
  } catch (error) {
    console.error(`❌ Failed to update ${name}:`, error);
    throw error;
  }
}

async function main() {
  console.log("🔧 Updating Notion databases with correct property names...\n");

  // Update Roadmap Items database
  await updateDatabase(
    ROADMAP_ITEMS_DATABASE_ID,
    ROADMAP_PROPERTIES_UPDATE,
    "Roadmap Items"
  );

  // Update Content Blocks database
  await updateDatabase(
    CONTENT_BLOCKS_DATABASE_ID,
    CONTENT_BLOCKS_PROPERTIES_UPDATE,
    "Content Blocks"
  );

  console.log("\n✅ All databases updated successfully!");
  console.log("\nYou can now sync data from the app to Notion.");
}

main().catch(console.error);

