/**
 * Setup Script - Creates Notion databases for Content Visualizer sync
 * 
 * Run with: npx ts-node scripts/setup-notion-databases.ts
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
  console.error("Error: NOTION_API_KEY environment variable is required");
  process.exit(1);
}
const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";

interface NotionResponse {
  id: string;
  url: string;
  [key: string]: unknown;
}

async function notionRequest(endpoint: string, body: object): Promise<NotionResponse> {
  const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Notion API Error:", JSON.stringify(error, null, 2));
    throw new Error(`Notion API error: ${response.status} - ${error.message || response.statusText}`);
  }

  return response.json();
}

async function getWorkspacePages(): Promise<NotionResponse[]> {
  const response = await fetch(`${NOTION_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: { property: "object", value: "page" },
      page_size: 10,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Search failed: ${error.message}`);
  }

  const data = await response.json();
  return data.results;
}

// Content Blocks Database Schema
const CONTENT_BLOCKS_SCHEMA = {
  title: [{ text: { content: "Content Blocks" } }],
  is_inline: false,
  properties: {
    // Title is always required
    "Title": { title: {} },
    
    // Core fields
    "CV ID": { rich_text: {} },
    "Type": {
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
    "Subtitle": { rich_text: {} },
    "Content": { rich_text: {} },
    "Tags": { multi_select: { options: [] } },
    "External URL": { url: {} },
    "Owner Name": { rich_text: {} },
    
    // Position fields
    "Position X": { number: { format: "number" } },
    "Position Y": { number: { format: "number" } },
    "Width": { number: { format: "number" } },
    "Height": { number: { format: "number" } },
    
    // Workflow fields
    "Workspace ID": { rich_text: {} },
    "Submitted for Review": { date: {} },
    "Review Comments": { rich_text: {} },
    
    // Sync fields
    "Sync Status": {
      select: {
        options: [
          { name: "SYNCED", color: "green" },
          { name: "PENDING", color: "yellow" },
          { name: "CONFLICT", color: "red" },
          { name: "ERROR", color: "red" },
        ],
      },
    },
    "Last Sync": { date: {} },
  },
};

// Roadmap Items Database Schema
const ROADMAP_ITEMS_SCHEMA = {
  title: [{ text: { content: "Roadmap Items" } }],
  is_inline: false,
  properties: {
    // Title is always required
    "Title": { title: {} },
    
    // Core fields
    "CV ID": { rich_text: {} },
    "Description": { rich_text: {} },
    "Company": {
      select: {
        options: [
          { name: "CERE", color: "blue" },
          { name: "CEF", color: "purple" },
          { name: "SHARED", color: "green" },
        ],
      },
    },
    "Content Type": {
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
    "Status": {
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
    "Priority": {
      select: {
        options: [
          { name: "LOW", color: "green" },
          { name: "MEDIUM", color: "yellow" },
          { name: "HIGH", color: "orange" },
          { name: "CRITICAL", color: "red" },
        ],
      },
    },
    "Tags": { multi_select: { options: [] } },
    
    // Timeline fields
    "Target Date": { date: {} },
    "End Date": { date: {} },
    "Phase": {
      select: {
        options: [
          { name: "FOUNDATION", color: "blue" },
          { name: "GROWTH", color: "green" },
          { name: "SCALE", color: "orange" },
          { name: "OPTIMIZE", color: "purple" },
        ],
      },
    },
    "Phase ID": { rich_text: {} },
    
    // Assignment fields
    "Assignee ID": { rich_text: {} },
    "Milestone ID": { rich_text: {} },
    
    // Sync fields
    "Sync Status": {
      select: {
        options: [
          { name: "SYNCED", color: "green" },
          { name: "PENDING", color: "yellow" },
          { name: "CONFLICT", color: "red" },
          { name: "ERROR", color: "red" },
        ],
      },
    },
    "Last Sync": { date: {} },
  },
};

async function main() {
  console.log("🚀 Setting up Notion databases for Content Visualizer...\n");

  try {
    // First, find a page to use as parent
    console.log("📂 Searching for workspace pages...");
    const pages = await getWorkspacePages();
    
    if (pages.length === 0) {
      console.error("❌ No pages found in workspace. Please create a page in Notion first and share it with the integration.");
      console.log("\nTo fix this:");
      console.log("1. Go to Notion and create a new page");
      console.log("2. Click '...' menu → 'Add connections' → Select your integration");
      console.log("3. Run this script again");
      process.exit(1);
    }

    // Use the first available page as parent
    const parentPage = pages[0];
    console.log(`✅ Found parent page: ${(parentPage as any).url}\n`);

    // Create Content Blocks database
    console.log("📦 Creating Content Blocks database...");
    const contentBlocksDb = await notionRequest("/databases", {
      parent: { page_id: parentPage.id },
      ...CONTENT_BLOCKS_SCHEMA,
    });
    console.log(`✅ Content Blocks database created!`);
    console.log(`   ID: ${contentBlocksDb.id}`);
    console.log(`   URL: ${contentBlocksDb.url}\n`);

    // Create Roadmap Items database
    console.log("🗺️ Creating Roadmap Items database...");
    const roadmapItemsDb = await notionRequest("/databases", {
      parent: { page_id: parentPage.id },
      ...ROADMAP_ITEMS_SCHEMA,
    });
    console.log(`✅ Roadmap Items database created!`);
    console.log(`   ID: ${roadmapItemsDb.id}`);
    console.log(`   URL: ${roadmapItemsDb.url}\n`);

    // Output configuration
    console.log("═".repeat(60));
    console.log("🎉 SUCCESS! Databases created successfully!");
    console.log("═".repeat(60));
    console.log("\n📋 Copy these IDs to configure sync in Content Visualizer:\n");
    console.log(`Content Blocks Database ID: ${contentBlocksDb.id}`);
    console.log(`Roadmap Items Database ID:  ${roadmapItemsDb.id}`);
    console.log("\n🔗 Database URLs:");
    console.log(`Content Blocks: ${contentBlocksDb.url}`);
    console.log(`Roadmap Items:  ${roadmapItemsDb.url}`);
    console.log("\n" + "═".repeat(60));

  } catch (error) {
    console.error("\n❌ Error setting up databases:", error);
    process.exit(1);
  }
}

main();


