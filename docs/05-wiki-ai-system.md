# Wiki AI System

The **Wiki AI System** is the intelligent core of Content Visualizer—a context-aware AI content generation engine that leverages your organizational knowledge base (Wiki) to produce on-brand, technically accurate content.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WIKI AI SYSTEM                                     │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │    Wiki      │    │   Content    │    │    AI        │                  │
│  │   Context    │───▶│   Blocks     │───▶│  Generation  │                  │
│  │  (Knowledge) │    │  (Source)    │    │  (Gemini)    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         └───────────────────┴───────────────────┘                           │
│                             │                                               │
│                             ▼                                               │
│                    ┌──────────────┐                                         │
│                    │   Context-   │                                         │
│                    │   Enriched   │                                         │
│                    │   Prompt     │                                         │
│                    └──────────────┘                                         │
│                             │                                               │
│                             ▼                                               │
│                    ┌──────────────┐                                         │
│                    │  Generated   │                                         │
│                    │   Content    │                                         │
│                    └──────────────┘                                         │
│                             │                                               │
│              ┌──────────────┼──────────────┐                                │
│              ▼              ▼              ▼                                │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐                            │
│        │  Schema  │  │ Roadmap  │  │  Notion  │                            │
│        │  Block   │  │  Item    │  │ Database │                            │
│        └──────────┘  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Wiki Knowledge Base

The Wiki is a **structured repository of organizational knowledge** that provides context for all AI-generated content. It contains:

- **Technical Documentation**: Platform architecture, APIs, protocols
- **Product Information**: Features, capabilities, use cases
- **Brand Guidelines**: Messaging, tone, terminology
- **Industry Verticals**: Sector-specific content and applications

```typescript
// The Wiki is embedded in the system
const CEF_WIKI_CONTENT = `
## Data Onboarding Wiki (A1)
A unified Go microservice that merges event processing, rule execution, 
and data pipeline orchestration into a horizontally scalable core.

## ROB Wiki (A2) - Real-Time Orchestration Builder
The control plane of the CEF platform. It is where services, data flows, 
and AI agents are designed, connected, and deployed...

## Orchestrator Wiki (A3) - DDC Compute Node
DDC Compute Node is compute instance in a distributed AI computation 
platform that provides secure, scalable infrastructure...
`;
```

### 2. Content Blocks (Source Material)

Content blocks serve as **source material** for generation. The AI uses these blocks to understand:

- What topics are relevant
- The company voice and style
- Technical accuracy requirements
- Existing messaging to maintain consistency

### 3. AI Engine (Gemini)

The system uses **Google Gemini 2.0 Flash** for content generation:

- High-speed inference (~1-3 seconds per generation)
- Structured JSON output for consistent parsing
- Context window supports entire Wiki + multiple blocks

---

## How It Works

### Step 1: Wiki Context Selection

Users select relevant Wiki sections to provide domain context:

```
┌─────────────────────────────────────────────────┐
│  📚 Wiki Sections                               │
│                                                 │
│  ☑ Data Onboarding Wiki (A1)                   │
│  ☑ ROB Wiki (A2) - Orchestration Builder       │
│  ☐ Orchestrator Wiki (A3) - DDC Node           │
│  ☐ Data Vault Wiki (A4)                         │
│  ☑ Agent Registry Wiki (A5)                     │
│                                                 │
│  [3 sections selected]                          │
└─────────────────────────────────────────────────┘
```

### Step 2: Block Selection (Optional)

Users can select existing content blocks as additional context:

```
┌─────────────────────────────────────────────────┐
│  📦 Content Blocks                              │
│                                                 │
│  ☑ CEF.AI Value Proposition                    │
│  ☑ Enterprise AI Overview                      │
│  ☐ Developer Quick Start                        │
│                                                 │
│  [2 blocks selected]                            │
└─────────────────────────────────────────────────┘
```

### Step 3: Prompt Engineering

The system constructs a **context-enriched prompt**:

```typescript
const systemPrompt = `
You are an expert technical writer for CEF.AI.

WIKI CONTEXT (Reference material):
${selectedWikiSections.join("\n\n")}

CURRENT BLOCK TO IMPROVE:
Title: ${block.title}
Type: ${block.type}
Current Content: ${block.content}

USER REQUEST:
${userPrompt}

FORMATTING RULES:
1. Plain text only - no markdown
2. Be concise and direct
3. Maintain technical accuracy

Respond with JSON:
{
  "title": "Improved title (3-8 words)",
  "subtitle": "Brief tagline (one sentence)",
  "content": "Main content paragraphs"
}
`;
```

### Step 4: Generation & Output

The AI generates content that is:

- **Technically accurate** (grounded in Wiki knowledge)
- **On-brand** (consistent with existing content)
- **Properly formatted** (clean, no markdown artifacts)

---

## Generation Modes

### 1. Content Improvement (Wiki Sync Panel)

Improve existing content blocks using Wiki context:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Improve** | Enhance clarity and impact | Refining draft content |
| **Simplify** | Make more accessible | Technical → Marketing |
| **Custom** | User-defined prompt | Specific requirements |

```typescript
const prompts: Record<string, string> = {
  improve: "Improve this content to be more compelling and clear. 
            Use the wiki context to ensure technical accuracy.",
  simplify: "Simplify this content to be more accessible to 
             non-technical audiences while maintaining accuracy.",
  custom: customPrompt,
};
```

### 2. Content Creation (Content Studio)

Generate new content from scratch:

**Templates Available:**

| Category | Templates |
|----------|-----------|
| **Social** | X/Twitter Thread, LinkedIn Post, Discord, Telegram |
| **Blog** | Blog Post, Technical Blog, Summary |
| **Announcement** | Product Launch, Partnership, Milestone |
| **Newsletter** | Weekly Update, Product Newsletter |
| **Internal** | Status Report, Meeting Notes |

**Generation Parameters:**

```typescript
interface GenerationParams {
  tone: "professional" | "casual" | "excited" | "informative" | "urgent";
  length: "short" | "medium" | "long";
  includeEmojis: boolean;
  includeHashtags: boolean;
  includeCTA: boolean;
  customInstructions: string;
}
```

### 3. Wireframe Block Generation

Auto-generate content for page sections:

```typescript
// Generate blocks based on page context
async function generateBlocksWithAI(context: PageContext) {
  const pageTypePrompts: Record<PageType, string> = {
    quickstart: "Create content for a Quick Start guide...",
    developers: "Create content for Developer Documentation...",
    protocol: "Create content for Protocol deep-dive...",
    vertical: "Create content for industry vertical...",
    enterprise: "Create content for Enterprise solutions...",
  };
  
  // Returns 4 blocks: hero, 2x content, feature
  return generatedBlocks;
}
```

---

## Architecture

### API Routes

```
/api/gemini           - Core AI generation endpoint
/api/blocks/generate  - Block generation for wireframes
/api/generated-content - Save generated content to Notion
```

### Data Flow

```
User Action
     │
     ▼
┌─────────────────┐
│ Collect Context │
│ - Wiki sections │
│ - Content blocks│
│ - User prompt   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Prompt    │
│ - System prompt │
│ - Formatting    │
│ - JSON schema   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gemini API      │
│ - 2.0 Flash     │
│ - Temperature 0.7│
│ - Max 2048 tokens│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse Response  │
│ - JSON extraction│
│ - Cleanup       │
│ - Validation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply/Save      │
│ - Update block  │
│ - Link roadmap  │
│ - Save to Notion│
└─────────────────┘
```

### Response Processing

```typescript
// Clean and parse AI response
const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

// Remove markdown artifacts
let cleanedText = generatedText.trim();
if (cleanedText.startsWith("```json")) {
  cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
}

const parsed = JSON.parse(cleanedText);

// Clean remaining formatting
const cleanContent = (text: string) => {
  return text
    .replace(/\*\*/g, "")     // Remove bold markers
    .replace(/\*/g, "")       // Remove italic markers
    .replace(/^[-•]\s*/gm, "") // Remove bullets
    .trim();
};
```

---

## Wiki Content Structure

The Wiki is organized by platform components:

```
CEF AI Wiki Structure
│
├── Core Marketing Hub (M1)
│   └── Central hub for marketing activities
│
├── Technical Components
│   ├── Data Onboarding Wiki (A1) - Event processing
│   ├── ROB Wiki (A2) - Real-Time Orchestration Builder
│   ├── Orchestrator Wiki (A3) - DDC Compute Node
│   ├── Data Vault Wiki (A4) - Multi-model storage
│   ├── Agent Registry Wiki (A5) - AI agent management
│   ├── Inference Runtime (A8) - Model inference
│   ├── Agent Runtime (A9) - Agent execution
│   ├── Resource Allocation (A10) - Dynamic resources
│   ├── Deployments (A11) - Orchestration
│   ├── Event Runtime (A12) - Event processing
│   ├── Activity Capture (A13) - Auditing
│   └── Stream Ingestion (A14) - High-throughput
│
├── Integrations
│   ├── CEF.AI Integrations (B2)
│   ├── Nightingale Integration (A7) - Speech-to-text
│   └── NLP Use Case (A8)
│
├── Marketing & Sales
│   ├── Product Marketing (B3)
│   ├── Core Product Content (S0)
│   ├── Demos (S1)
│   ├── Website + Verticals (S2)
│   ├── Campaigns (S3)
│   ├── Growth / G2M (B4)
│   └── Enterprise Sales Collateral
│
└── Infrastructure
    ├── Testing / Observability (A6)
    ├── DevOps (Z1)
    └── Universal Security Layer (IAM)
```

---

## Best Practices

### 1. Context Selection

**Do:**
- Select Wiki sections relevant to your topic
- Include 2-5 Wiki sections for optimal context
- Choose content blocks that match your target style

**Don't:**
- Select all Wiki sections (dilutes relevance)
- Skip context selection (generic output)
- Mix unrelated topics

### 2. Prompt Engineering

**Effective Prompts:**
```
✓ "Create a Twitter thread announcing our new SDK with 
   focus on developer experience"

✓ "Improve this landing page copy to emphasize enterprise 
   security features mentioned in the A3 wiki"

✓ "Simplify the technical explanation for a CMO audience"
```

**Weak Prompts:**
```
✗ "Make it better"
✗ "Write content"
✗ "Fix this"
```

### 3. Template Selection

| Content Goal | Recommended Template |
|--------------|---------------------|
| Awareness | Twitter Thread, LinkedIn Post |
| Education | Technical Blog, Blog Post |
| Conversion | Product Launch, Landing Page |
| Retention | Newsletter, Update/Changelog |
| Internal | Meeting Notes, Status Report |

### 4. Generation Parameters

| Audience | Tone | Length |
|----------|------|--------|
| Developers | Informative | Medium-Long |
| Executives | Professional | Short |
| Community | Casual/Excited | Short-Medium |
| Partners | Professional | Medium |

---

## Integration Points

### Notion Sync

Generated content can be saved to Notion:

```typescript
// Save to Generated Content database
await fetch("/api/generated-content", {
  method: "POST",
  body: JSON.stringify({
    title: generatedTitle,
    content: generatedContent,
    template: template.name,
    tone: params.tone,
    sourceBlockIds: selectedBlocks.map(b => b.id),
  }),
});
```

### Roadmap Linking

Link generated content to roadmap items:

```typescript
// Create as block and link to roadmap
const newBlock = addNode({
  type: "ARTICLE",
  title: generatedTitle,
  content: generatedContent,
});

linkBlockToRoadmapItem(roadmapItemId, newBlock.id);
```

### Schema Integration

Generated content becomes part of the content schema:

```typescript
// Add to canvas as a new block
const newNode = addNode({
  type: blockType,
  company: selectedCompany,
  title: title,
  subtitle: subtitle,
  content: content,
  tags: [template.category],
});
```

---

## Configuration

### Environment Variables

```env
# AI Generation (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Notion Storage (for saving generated content)
NOTION_API_KEY=your_notion_api_key
NOTION_GENERATED_CONTENT_DATABASE_ID=your_database_id
```

### Model Settings

```typescript
const generationConfig = {
  temperature: 0.7,    // Creativity level (0-1)
  topK: 40,            // Token sampling breadth
  topP: 0.95,          // Nucleus sampling
  maxOutputTokens: 2048, // Max response length
};
```

---

## Extending the Wiki

To add new Wiki content:

1. **Edit `WikiSyncPanel.tsx`:**

```typescript
const CEF_WIKI_CONTENT = `
// ... existing content ...

## New Component Wiki (A15)
Description of the new component...

**Key Features:**
- Feature 1
- Feature 2

**Use Cases:**
- Use case 1
- Use case 2
`;
```

2. **Parse into sections:**

The system automatically parses headers (`##`) into selectable sections.

3. **Future: Notion-backed Wiki**

For dynamic Wiki content, integrate with a Notion database:

```typescript
// Future implementation
async function fetchWikiFromNotion() {
  const response = await notion.databases.query({
    database_id: WIKI_DATABASE_ID,
  });
  return parseNotionToWiki(response.results);
}
```

---

## Next Steps

- [Quick Start Guide →](./01-quick-start.md)
- [System Architecture →](./02-system-explainer.md)
- [Content Flow →](./03-content-flow.md)
- [Notion Integration →](./04-notion-integration.md)

