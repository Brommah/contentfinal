/**
 * Setup Script - Creates Notion database for Generated Content storage
 * 
 * Run with: npx ts-node scripts/setup-generated-content-database.ts
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

// Generated Content Database Schema
const GENERATED_CONTENT_SCHEMA = {
  title: [{ text: { content: "Generated Content" } }],
  is_inline: false,
  properties: {
    // Title is always required
    "Title": { title: {} },
    
    // Core content fields
    "Content": { rich_text: {} },
    "Subtitle": { rich_text: {} },
    
    // Template info
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
    
    // Generation parameters
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
    
    // Metadata
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
    
    // Options flags
    "Has Emojis": { checkbox: {} },
    "Has Hashtags": { checkbox: {} },
    "Has CTA": { checkbox: {} },
    
    // Source tracking
    "Source Block IDs": { rich_text: {} },
    "Source Block Count": { number: { format: "number" } },
    "Custom Instructions": { rich_text: {} },
    
    // Tracking
    "Character Count": { number: { format: "number" } },
    "Word Count": { number: { format: "number" } },
    "Workspace ID": { rich_text: {} },
    "Created By": { rich_text: {} },
    "Generated At": { date: {} },
    
    // Usage tracking
    "Times Copied": { number: { format: "number" } },
    "Used In Roadmap": { checkbox: {} },
    "Created As Block": { checkbox: {} },
  },
};

async function main() {
  console.log("🚀 Setting up Generated Content database in Notion...\n");

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

    // Create Generated Content database
    console.log("📝 Creating Generated Content database...");
    const generatedContentDb = await notionRequest("/databases", {
      parent: { page_id: parentPage.id },
      ...GENERATED_CONTENT_SCHEMA,
    });
    console.log(`✅ Generated Content database created!`);
    console.log(`   ID: ${generatedContentDb.id}`);
    console.log(`   URL: ${generatedContentDb.url}\n`);

    // Output configuration
    console.log("═".repeat(60));
    console.log("🎉 SUCCESS! Database created successfully!");
    console.log("═".repeat(60));
    console.log("\n📋 Add this to your environment variables:\n");
    console.log(`NOTION_GENERATED_CONTENT_DATABASE_ID=${generatedContentDb.id}`);
    console.log("\n🔗 Database URL:");
    console.log(`${generatedContentDb.url}`);
    console.log("\n" + "═".repeat(60));

  } catch (error) {
    console.error("\n❌ Error setting up database:", error);
    process.exit(1);
  }
}

main();


