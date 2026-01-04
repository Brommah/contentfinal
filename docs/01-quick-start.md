# Quick Start Guide

Get up and running with Content Visualizer in under 5 minutes.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- A Notion account (optional, for sync features)
- Supabase account (optional, for persistence)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Brommah/contentfinal.git
cd contentfinal/content-visualizer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment (Optional)

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Notion Integration (optional)
NOTION_API_KEY=your_notion_api_key
NOTION_CONTENT_BLOCKS_DATABASE_ID=your_database_id
NOTION_ROADMAP_DATABASE_ID=your_roadmap_database_id
NOTION_GENERATED_CONTENT_DATABASE_ID=your_generated_content_database_id

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Content Generation (optional)
GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** The app works in demo mode without any environment variables configured.

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## First Steps

### 1. Explore the Home Dashboard

The home page provides an overview of your content ecosystem:
- Content health metrics
- Recent activity
- Quick actions

### 2. Navigate to Content Schema

Click **"Content Editor" → "Schema"** to see the visual content architecture:
- Drag and drop content blocks
- Create relationships between blocks
- Organize by company (CERE/CEF)

### 3. Create Your First Content Block

1. Click **"+ Add Block"** in the sidebar
2. Choose a block type (Article, Landing Page, etc.)
3. Fill in the title and description
4. Drag it onto the canvas

### 4. Connect Blocks

1. Hover over a block to see connection handles
2. Drag from one handle to another
3. Choose the relationship type (supports, enables, etc.)

### 5. Manage Content Status

Content flows through these statuses:
- **Draft** → Initial creation
- **Pending Review** → Ready for approval
- **Approved** → Approved by reviewers
- **Live** → Published and active

---

## Key Features Overview

| Feature | Location | Description |
|---------|----------|-------------|
| **CEO View** | Navigation | Content approval dashboard |
| **Schema Editor** | Content Editor | Visual content architecture |
| **Content Studio** | Content Editor | AI-powered content creation |
| **Wireframe Designer** | Content Editor | Page layout design |
| **Roadmap** | Navigation | Content planning & scheduling |
| **Analytics** | Navigation | Performance metrics |
| **Notion Sync** | Top bar | Bidirectional Notion integration |

---

## Demo Mode

Without configuration, the app runs in demo mode with:
- Sample content blocks pre-loaded
- Local storage persistence
- Full UI functionality

This is perfect for exploring the system before connecting external services.

---

## Next Steps

- [System Architecture →](./02-system-explainer.md)
- [Content Flow for Websites →](./03-content-flow.md)
- [Notion Integration Guide →](./04-notion-integration.md)

