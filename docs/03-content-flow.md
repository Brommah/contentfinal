# Content Flow: From Schema to Website

This document explains how technical content created in Content Visualizer flows through the system and ultimately gets used on websites.

---

## Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           CONTENT LIFECYCLE                                  │
└────────────────────────────────────────────────────────────────────────────┘

     ┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌────────┐
     │ CREATE  │ ──▶ │   REVIEW    │ ──▶ │ APPROVE  │ ──▶ │  LIVE  │
     │ (Draft) │     │ (Pending)   │     │ (Ready)  │     │(Active)│
     └─────────┘     └─────────────┘     └──────────┘     └────────┘
          │                                                     │
          │                                                     ▼
          │         ┌─────────────────────────────────────────────────┐
          │         │              EXPORT DESTINATIONS                 │
          │         ├─────────────────────────────────────────────────┤
          │         │  📄 Notion    │  🌐 Website   │  📊 Analytics   │
          │         │  (CMS)        │  (Frontend)   │  (Reports)      │
          │         └─────────────────────────────────────────────────┘
          │
          ▼
    ┌───────────────────────────────────────────────────┐
    │              WIREFRAME DESIGNER                    │
    │  (Link content blocks to page sections)           │
    └───────────────────────────────────────────────────┘
```

---

## Step 1: Content Creation

### Creating Content Blocks

1. **Navigate to Schema Editor** (Content Editor → Schema)
2. **Add a new block** via the sidebar or right-click menu
3. **Define core properties:**
   - Title (e.g., "CERE Network Value Proposition")
   - Description (detailed content)
   - Company (CERE or CEF)
   - Block Type (Pillar, Article, Landing Page, etc.)
   - Tags (for categorization)

### AI-Assisted Content Creation

1. **Navigate to Content Studio** (Content Editor → Content Studio)
2. **Select a template** (Blog Post, Case Study, Whitepaper, etc.)
3. **Configure generation parameters:**
   - Topic/Title
   - Target audience
   - Tone and style
   - Key points to cover
4. **Generate content** using Gemini AI
5. **Review and edit** the generated draft
6. **Link to roadmap item** (optional) for tracking

---

## Step 2: Content Relationships

Content blocks don't exist in isolation—they form a **content graph**.

### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| **supports** | Block A provides evidence for Block B | Case Study → Value Proposition |
| **enables** | Block A makes Block B possible | Technical Docs → Product Feature |
| **references** | Block A mentions Block B | Blog Post → Whitepaper |
| **contradicts** | Block A conflicts with Block B | Old Messaging → New Messaging |

### Creating Relationships

1. **Hover over a block** to reveal connection handles
2. **Drag from one handle** to another block
3. **Select relationship type** from the popup
4. **Add optional label** for context

### Why Relationships Matter

- **Consistency**: Ensure messaging aligns across content
- **Dependency tracking**: Know what content affects what
- **Impact analysis**: Understand ripple effects of changes
- **Navigation**: Discover related content easily

---

## Step 3: Review & Approval Workflow

### Content Status Flow

```
DRAFT ──────▶ PENDING_REVIEW ──────▶ APPROVED ──────▶ LIVE
  │                 │                    │              │
  │                 ▼                    │              │
  │          NEEDS_CHANGES ◀─────────────┘              │
  │                 │                                   │
  └─────────────────┴───────────────────────────────────┘
                    (revision cycle)
```

### CEO View Approval

1. **Access CEO View** from the navigation
2. **Review pending content** in the queue
3. **Preview content** with full context
4. **Approve or Request Changes** with comments
5. **Content moves to APPROVED status**

### Promotion to LIVE

Once approved, content can be:
- **Manually promoted** to LIVE status
- **Auto-promoted** on a scheduled date
- **Synced to Notion** for website publishing

---

## Step 4: Wireframe Integration

Content blocks are linked to **wireframe sections** to define page layouts.

### Wireframe Pages

```typescript
// Example: CERE Home Page Wireframe
{
  id: "cere-home",
  title: "CERE Home",
  company: "CERE",
  sections: [
    { type: "HERO", linkedBlockIds: ["cere-network-intro"] },
    { type: "FEATURES", linkedBlockIds: ["ddc-overview", "dac-overview"] },
    { type: "CTA", linkedBlockIds: ["cere-get-started"] },
    { type: "FOOTER", linkedBlockIds: [] }
  ]
}
```

### Linking Content to Sections

1. **Open Wireframe Designer** (Content Editor → Wireframe)
2. **Select a page** (or create new)
3. **Click on a section** (Hero, Features, CTA, etc.)
4. **Link content blocks** from the sidebar
5. **Preview the page** with linked content

---

## Step 5: Export to Website

### Notion as CMS

Content flows to websites via Notion as the intermediary CMS:

```
Content Visualizer ──▶ Notion Database ──▶ Website (Next.js/Gatsby)
                            │
                            ▼
                    (Notion API / Embed)
```

### Export Process

1. **Click Notion** button in the header
2. **Select sync mode:**
   - **Export LIVE**: Only content with LIVE status
   - **Export Selected**: Manually selected blocks
   - **Import**: Pull from Notion into the app
3. **Click "Export X Blocks"**
4. **Monitor progress** via the visual indicator
5. **Receive confirmation** when complete

### What Gets Exported

| Field | Notion Property |
|-------|-----------------|
| Title | `title` (Title) |
| Description | `description` (Rich Text) |
| Company | `company` (Select) |
| Block Type | `type` (Select) |
| Status | `status` (Select) |
| Tags | `tags` (Multi-select) |
| Created | `createdAt` (Date) |
| Updated | `updatedAt` (Date) |

---

## Step 6: Website Consumption

### Fetching from Notion

Websites fetch content from Notion databases:

```javascript
// Example: Fetching content for a landing page
const response = await notion.databases.query({
  database_id: CONTENT_BLOCKS_DATABASE_ID,
  filter: {
    and: [
      { property: "status", select: { equals: "LIVE" } },
      { property: "company", select: { equals: "CERE" } },
      { property: "type", select: { equals: "LANDING_PAGE" } }
    ]
  }
});

const contentBlocks = response.results.map(notionToContentBlock);
```

### Rendering Content

```jsx
// Example: React component using content
function HeroSection({ blockId }) {
  const content = useContentBlock(blockId);
  
  return (
    <section className="hero">
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <Button>{content.cta}</Button>
    </section>
  );
}
```

### Content Update Flow

When content is updated:

1. **Edit in Content Visualizer** → Status changes to DRAFT
2. **Go through review cycle** → PENDING_REVIEW → APPROVED
3. **Promote to LIVE** → Ready for export
4. **Sync to Notion** → Database updated
5. **Website rebuilds** → ISR/SSG picks up changes
6. **Users see new content** → Live on production

---

## Best Practices

### Content Organization

- **Use consistent naming**: `[Company] - [Type] - [Topic]`
- **Tag comprehensively**: Enables filtering and search
- **Link relationships**: Build the content graph
- **Document sources**: Track where content originates

### Workflow Efficiency

- **Batch updates**: Group related changes
- **Use AI templates**: Speed up initial drafts
- **Review regularly**: Don't let content stagnate
- **Archive obsolete content**: Keep schema clean

### Quality Control

- **Validate before LIVE**: Check all fields populated
- **Check relationships**: Ensure links are valid
- **Test on staging**: Preview before production
- **Monitor after publish**: Track engagement

---

## Next Steps

- [Notion Integration Guide →](./04-notion-integration.md)
- [Quick Start Guide →](./01-quick-start.md)

