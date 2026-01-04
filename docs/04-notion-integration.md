# Notion Integration Guide

This guide explains how Content Visualizer integrates with Notion for content management and synchronization.

---

## Overview

Content Visualizer uses Notion as a **content management system (CMS)** layer, enabling:

- **Bidirectional sync**: Push content to Notion, pull updates back
- **Collaborative editing**: Teams can edit content in Notion
- **Website publishing**: Use Notion as a headless CMS
- **Backup & versioning**: Leverage Notion's history

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT VISUALIZER                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│  │  Schema   │  │ Roadmap   │  │ Wireframe │                   │
│  │  Editor   │  │ Planner   │  │ Designer  │                   │
│  └─────┬─────┘  └─────┬─────┘  └───────────┘                   │
│        │              │                                          │
│        ▼              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              NOTION SYNC SERVICE                             ││
│  │  - Export content blocks                                     ││
│  │  - Export roadmap items                                      ││
│  │  - Import from Notion                                        ││
│  │  - Conflict resolution                                       ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼ (Notion API)
┌─────────────────────────────────────────────────────────────────┐
│                         NOTION                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Content Blocks │  │ Roadmap Items  │  │ Generated      │    │
│  │   Database     │  │   Database     │  │ Content DB     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup

### 1. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Configure:
   - **Name**: Content Visualizer
   - **Logo**: Optional
   - **Associated workspace**: Select your workspace
4. Click **Submit**
5. Copy the **Internal Integration Token** (starts with `ntn_`)

### 2. Create Notion Databases

Create three databases in Notion with these schemas:

#### Content Blocks Database

| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Block title |
| Description | Rich Text | Block content |
| Company | Select | CERE, CEF |
| Type | Select | PILLAR, ARTICLE, LANDING_PAGE, etc. |
| Status | Select | DRAFT, PENDING_REVIEW, APPROVED, LIVE |
| Tags | Multi-select | Categorization tags |
| Created | Date | Creation date |
| Updated | Date | Last update |
| App ID | Rich Text | Internal ID for sync |

#### Roadmap Items Database

| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Item title |
| Description | Rich Text | Item details |
| Company | Select | CERE, CEF |
| Content Type | Select | Block type |
| Phase | Select | Q1, Q2, Q3, Q4 |
| Status | Select | PLANNED, IN_PROGRESS, COMPLETED |
| Priority | Select | LOW, MEDIUM, HIGH, CRITICAL |
| Target Date | Date | Due date |
| Tags | Multi-select | Tags |
| App ID | Rich Text | Internal ID for sync |

#### Generated Content Database

| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Content title |
| Template | Select | Blog Post, Case Study, etc. |
| Content | Rich Text | Generated content |
| Status | Select | DRAFT, FINAL |
| Linked Block | Relation | Link to content block |
| Created | Date | Generation date |

### 3. Share Databases with Integration

For each database:
1. Click **"..."** menu → **"Connections"**
2. Search for your integration name
3. Click to connect

### 4. Get Database IDs

1. Open each database in Notion
2. Copy the URL: `https://notion.so/workspace/DATABASE_ID?v=...`
3. The `DATABASE_ID` is the 32-character string

### 5. Configure Content Visualizer

Add to your `.env.local`:

```env
NOTION_API_KEY=ntn_your_integration_token
NOTION_CONTENT_BLOCKS_DATABASE_ID=your_content_blocks_database_id
NOTION_ROADMAP_DATABASE_ID=your_roadmap_database_id
NOTION_GENERATED_CONTENT_DATABASE_ID=your_generated_content_database_id
```

---

## Using Notion Sync

### Accessing the Sync Panel

1. Click the **"Notion"** button in the header
2. The sync panel opens with connection status

### Sync Modes

#### Export LIVE

Exports only content with **LIVE** status to Notion.

- **Use case**: Publishing approved content
- **Direction**: App → Notion
- **Blocks affected**: Only LIVE status

#### Export Selected

Manually select which blocks to export.

- **Use case**: Selective publishing
- **Direction**: App → Notion
- **Blocks affected**: User-selected only

#### Import

Pull content from Notion into the app.

- **Use case**: Sync collaborative edits
- **Direction**: Notion → App
- **Blocks affected**: All in database

### Export Process

1. **Select sync mode** (Export LIVE or Export Selected)
2. **Click "Export X Blocks"**
3. **Watch progress indicator**:
   - Current block number / total
   - Progress bar
   - Current block being synced
4. **Receive completion toast**:
   - ✅ Success: "Successfully exported X blocks to Notion!"
   - ⚠️ Partial: "Exported X blocks, Y failed"
   - ❌ Failed: "Export failed"

### Rate Limiting

The sync service respects Notion's API limits:
- **~3 requests/second** with 350ms delays
- **Automatic backoff** on 429 errors
- **Progress updates** for each block

---

## Sync Architecture

### Content Block Mapping

```typescript
// App → Notion transformation
function blockToNotionProperties(block: BlockData) {
  return {
    Title: { title: [{ text: { content: block.title } }] },
    Description: { rich_text: [{ text: { content: block.description } }] },
    Company: { select: { name: block.company } },
    Type: { select: { name: block.blockType } },
    Status: { select: { name: block.status } },
    Tags: { multi_select: block.tags.map(t => ({ name: t })) },
    "App ID": { rich_text: [{ text: { content: block.id } }] },
    Created: { date: { start: block.createdAt.toISOString() } },
    Updated: { date: { start: block.updatedAt.toISOString() } },
  };
}
```

### Sync Record Tracking

The sync service maintains a local registry:

```typescript
interface SyncRecord {
  appId: string;            // Local block ID
  notionPageId: string;     // Notion page ID
  lastAppUpdate: Date;      // Last local change
  lastNotionUpdate: Date;   // Last Notion change
  syncStatus: "SYNCED" | "PENDING" | "CONFLICT" | "ERROR";
  hasConflict: boolean;
}
```

### Conflict Resolution

When the same content is edited in both places:

1. **Detection**: Compare timestamps
2. **Notification**: Alert user of conflict
3. **Resolution options**:
   - **Use App Version**: Overwrite Notion
   - **Use Notion Version**: Overwrite local
   - **Manual Merge**: Review both versions

---

## Website Integration

### Using Notion as Headless CMS

Your website can fetch content directly from Notion:

```javascript
// Example: Next.js API route
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function getContentBlocks(company, type) {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_CONTENT_BLOCKS_DATABASE_ID,
    filter: {
      and: [
        { property: "Status", select: { equals: "LIVE" } },
        { property: "Company", select: { equals: company } },
        { property: "Type", select: { equals: type } },
      ],
    },
    sorts: [{ property: "Updated", direction: "descending" }],
  });

  return response.results.map(parseNotionPage);
}
```

### Incremental Static Regeneration (ISR)

For performance, use ISR with Notion:

```javascript
// pages/content/[slug].js
export async function getStaticProps({ params }) {
  const content = await getContentBySlug(params.slug);
  
  return {
    props: { content },
    revalidate: 60, // Revalidate every 60 seconds
  };
}
```

### Webhook Updates (Advanced)

For real-time updates, implement Notion webhooks:

1. Set up a webhook endpoint
2. Subscribe to database changes
3. Trigger site rebuild on updates

---

## Best Practices

### Organization

- **Use views**: Create filtered views in Notion for different teams
- **Lock properties**: Prevent accidental schema changes
- **Document conventions**: Maintain consistent naming

### Performance

- **Batch exports**: Export during low-traffic periods
- **Cache responses**: Don't query Notion on every request
- **Use ISR**: Balance freshness and performance

### Security

- **Limit integration scope**: Only share necessary databases
- **Rotate tokens**: Regularly update API keys
- **Audit access**: Review who has edit permissions

### Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key is valid |
| 404 Not Found | Verify database is shared with integration |
| 429 Rate Limited | Reduce request frequency |
| Sync conflicts | Use conflict resolution UI |
| Missing properties | Ensure database schema matches |

---

## API Reference

### Notion Sync Service

```typescript
const syncService = getNotionSyncService();

// Export all LIVE blocks
await syncService.pushAllBlocksToNotion(liveBlocks);

// Export single block
await syncService.pushBlockToNotion(block);

// Import from Notion
await syncService.pullFromNotion();

// Check for conflicts
const conflicts = syncService.getConflicts();

// Resolve conflict
await syncService.resolveConflict(appId, "APP" | "NOTION");
```

### Events

```typescript
// Subscribe to sync events
syncService.subscribe((event) => {
  switch (event.type) {
    case "SYNC_PROGRESS":
      console.log(`${event.current}/${event.total}: ${event.title}`);
      break;
    case "SYNC_COMPLETE":
      console.log(`Done! ${event.result.syncedCount} synced`);
      break;
    case "SYNC_ERROR":
      console.error(event.error);
      break;
  }
});
```

---

## Next Steps

- [Quick Start Guide →](./01-quick-start.md)
- [System Architecture →](./02-system-explainer.md)
- [Content Flow for Websites →](./03-content-flow.md)

