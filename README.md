# Content Visualizer

A visual, Miro-like content management system for CERE Network and CEF.AI. Build, connect, and manage your content architecture with an intuitive drag-and-drop interface.

![Content Visualizer](https://img.shields.io/badge/status-active-success.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React Flow](https://img.shields.io/badge/React%20Flow-12-blue)

## Features

### Visual Canvas
- **Infinite Canvas** - Pan and zoom to navigate your content schema
- **Drag & Drop** - Intuitive block placement and organization
- **Connection Lines** - Visual relationships between content pieces
- **Minimap** - Quick navigation overview
- **Grid Snapping** - Precise block alignment

### Content Block Types
| Block Type | Purpose | Color |
|------------|---------|-------|
| 🏢 Company | Root container for CERE or CEF | Blue/Purple |
| 💎 Core Value Prop | 7-word descriptors, taglines | Gold |
| 🔥 Pain Point | Problems being solved | Red |
| ✅ Solution | How product solves it | Green |
| ⚡ Feature | Specific capabilities | Teal |
| 🎯 Vertical | Gaming, Robotics, Developers | Orange |
| 📄 Article | Linked content pieces | Gray |
| 🔧 Tech Component | DDC, DAC, ZK infrastructure | Purple |

### Relationship Types
- **Flows Into** → Content inheritance (Core VP → Vertical)
- **Solves** → Pain Point to Solution mapping
- **Depends On** → Infrastructure dependency
- **References** → Article linkage
- **Enables** → Feature capability
- **Part Of** → Component hierarchy

### Filtering & Search
- Filter by company (CERE, CEF, Shared)
- Filter by status (Live, Vision, Draft, Archived)
- Filter by block type
- Full-text search

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (for full functionality) or run in Demo Mode

### Installation

```bash
# Clone and install dependencies
cd content-visualizer
npm install

# Generate Prisma client
npx prisma generate
```

### Demo Mode (No Database Required)

The application runs in **Demo Mode** by default, loading pre-seeded CERE/CEF content in-memory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll see the full content schema for both companies.

### Full Mode (With Database)

1. Set up PostgreSQL and update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/content_visualizer"
```

2. Run migrations:
```bash
npx prisma db push
```

3. Seed the database:
```bash
curl -X POST http://localhost:3000/api/seed
```

4. Access your workspace at `/workspace/default-workspace`

## Project Structure

```
content-visualizer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # REST API routes
│   │   │   ├── blocks/         # Block CRUD
│   │   │   ├── connections/    # Connection CRUD
│   │   │   ├── workspaces/     # Workspace CRUD
│   │   │   └── seed/           # Database seeding
│   │   ├── workspace/[id]/     # Workspace view
│   │   └── page.tsx            # Demo mode entry
│   ├── components/
│   │   ├── canvas/             # React Flow components
│   │   │   ├── Canvas.tsx
│   │   │   ├── ContentBlockNode.tsx
│   │   │   └── ContentConnectionEdge.tsx
│   │   └── blocks/             # Block UI components
│   │       ├── BlockPalette.tsx
│   │       ├── BlockEditor.tsx
│   │       └── FilterToolbar.tsx
│   └── lib/
│       ├── db.ts               # Prisma client
│       ├── store.ts            # Zustand state management
│       ├── types.ts            # TypeScript definitions
│       └── seed-data.ts        # Initial CERE/CEF content
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## Content Schema

The system comes pre-loaded with the complete CERE and CEF content architecture:

### CERE Network (Protocol Layer)
- Core positioning: "Verifiable Data Infrastructure"
- Tech components: DDC, DAC, ZK, DSC, OpenGov
- Pain points and solutions matrix
- Value propositions

### CEF.AI (Enterprise Layer)
- Core product: "Inference Platform"
- Features: Control Plane, Context Memory, Data Lineage
- Verticals: Gaming, Robotics/CV, Developers
- Pain points and solutions

### Cross-Company Connections
Visual connections show how CERE infrastructure enables CEF capabilities.

## API Reference

### Workspaces
- `GET /api/workspaces` - List all workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/[id]` - Get workspace with blocks
- `PATCH /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

### Blocks
- `GET /api/blocks?workspaceId=` - List blocks
- `POST /api/blocks` - Create block
- `PATCH /api/blocks/[id]` - Update block
- `DELETE /api/blocks/[id]` - Delete block

### Connections
- `GET /api/connections?workspaceId=` - List connections
- `POST /api/connections` - Create connection
- `PATCH /api/connections/[id]` - Update connection
- `DELETE /api/connections/[id]` - Delete connection

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React Flow** - Node-based visual editor
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Prisma** - Database ORM
- **PostgreSQL** - Relational database
- **TypeScript** - Type safety

## Addressing Fred's Feedback

This system directly addresses the content issues identified:

1. **Bifurcation** ✅ - CERE (blue) and CEF (purple) are visually distinct
2. **Inheritance** ✅ - Arrows show content flow from core to verticals
3. **Layering** ✅ - Infrastructure → Orchestration → Application layers
4. **Status** ✅ - Live/Vision badges on every block
5. **Single Source of Truth** ✅ - All content in one visual workspace
6. **Rapid Iteration** ✅ - Drag, drop, edit, save instantly

## License

MIT
