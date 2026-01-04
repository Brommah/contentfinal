# System Architecture

A comprehensive overview of how Content Visualizer works.

## Overview

Content Visualizer is a **visual content management system** designed for organizations managing complex content ecosystems across multiple brands (CERE Network & CEF.AI). It provides:

- **Visual Schema Editor**: Miro-like canvas for content architecture
- **Content Workflow**: Draft → Review → Approval → Live pipeline
- **AI-Powered Creation**: Generate content using templates and AI
- **Multi-Channel Sync**: Bidirectional sync with Notion
- **Executive Dashboard**: CEO-level content oversight

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │   Home    │  │ CEO View  │  │  Editor   │  │  Roadmap  │    │
│  │ Dashboard │  │ (Approve) │  │ (Schema)  │  │ (Gantt)   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Zustand State Store                       │ │
│  │  - nodes (content blocks)                                    │ │
│  │  - edges (relationships)                                     │ │
│  │  - roadmapItems                                              │ │
│  │  - wireframePages                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js API Routes)             │
├─────────────────────────────────────────────────────────────────┤
│  /api/notion/*     - Notion sync operations                      │
│  /api/ai/*         - AI content generation (Gemini)              │
│  /api/admin/*      - Admin operations                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌───────────┐   ┌───────────┐   ┌───────────┐
     │  Notion   │   │ Supabase  │   │  Gemini   │
     │   API     │   │ (Storage) │   │   (AI)    │
     └───────────┘   └───────────┘   └───────────┘
```

---

## Core Components

### 1. Content Blocks

The fundamental unit of content in the system.

```typescript
interface BlockData {
  id: string;
  title: string;
  description: string;
  company: "CERE" | "CEF";
  blockType: BlockType;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "LIVE" | "ARCHIVED";
  tags: string[];
  linkedSections: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Block Types:**
- `PILLAR` - Core messaging pillars
- `ARTICLE` - Blog posts, articles
- `LANDING_PAGE` - Marketing pages
- `CASE_STUDY` - Customer stories
- `WHITEPAPER` - Technical documents
- `VIDEO` - Video content
- `SOCIAL` - Social media content
- `EMAIL` - Email campaigns
- `WEBINAR` - Webinar content
- `PODCAST` - Podcast episodes

### 2. Connections (Relationships)

Define how content blocks relate to each other.

```typescript
interface ConnectionData {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  relationshipType: "supports" | "enables" | "references" | "contradicts";
  label?: string;
}
```

### 3. Roadmap Items

Planned content with scheduling and dependencies.

```typescript
interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  company: Company;
  contentType: BlockType;
  phaseId: string;
  status: RoadmapStatus;
  linkedBlockIds: string[];
  dependsOn: string[];
  targetDate: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  googleDocsUrl?: string;
  notionPageUrl?: string;
  figmaUrl?: string;
}
```

### 4. Wireframe Sections

Page layout components for content design.

```typescript
interface WireframeSection {
  id: string;
  type: SectionType;
  company: Company;
  pageId: string;
  order: number;
  linkedBlockIds: string[];
  status: BlockStatus;
  config: SectionConfig;
}
```

---

## State Management

The app uses **Zustand** for state management with automatic persistence.

### Store Structure

```typescript
const useCanvasStore = create<CanvasState>((set, get) => ({
  // Content
  nodes: [],           // Content blocks on canvas
  edges: [],           // Relationships between blocks
  
  // Roadmap
  roadmapPhases: [],   // Planning phases
  roadmapItems: [],    // Scheduled content
  
  // Wireframe
  wireframePages: [],  // Page layouts
  wireframeSections: [], // Page sections
  
  // Actions
  addNode: (node) => ...,
  updateNode: (id, data) => ...,
  deleteNode: (id) => ...,
  addEdge: (edge) => ...,
  // ... more actions
}));
```

### Persistence Layer

Data persistence follows this priority:
1. **Supabase** (if configured) - Cloud storage
2. **localStorage** - Browser fallback

---

## Views & Navigation

### Home Dashboard
- Content health overview
- Recent activity feed
- Quick action shortcuts

### CEO View
- Content pending approval
- Pages pending review
- Roadmap review queue
- Approval/rejection workflow

### Content Editor
- **Schema**: Visual canvas for content architecture
- **Content Studio**: AI-powered content creation
- **Wireframe Designer**: Page layout design

### Roadmap
- **Gantt View**: Timeline visualization (default)
- **Kanban View**: Status-based columns
- **Calendar View**: Date-based layout

### Analytics
- Content velocity metrics
- Coverage reports
- SLA tracking

---

## Security & Access

### Authentication (Supabase)
- Email/password authentication
- Session management
- Role-based access control

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Input validation (Zod schemas)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Canvas | React Flow |
| Database | Supabase (PostgreSQL) |
| CMS Sync | Notion API |
| AI | Google Gemini |
| Deployment | Vercel |

---

## Next Steps

- [Content Flow for Websites →](./03-content-flow.md)
- [Notion Integration Guide →](./04-notion-integration.md)

