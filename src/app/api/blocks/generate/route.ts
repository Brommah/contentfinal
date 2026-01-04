/**
 * Block Generation API Route
 * Generates AI-powered content blocks for deeper pages
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { BlockType, Company, BlockStatus } from "@/lib/types";
import { getPageById } from "@/lib/wireframe-types";

const GEMINI_API_KEY = "AIzaSyD3Ffiue5HXn1Hw9IITrPRX-Q6yKNlMF1o";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Request validation schema
const generateBlocksSchema = z.object({
  pageId: z.string().min(1),
  parentBlockId: z.string().min(1),
  workspaceId: z.string().min(1),
  company: z.enum(["CERE", "CEF", "SHARED"]),
});

// Generated block structure
interface GeneratedBlock {
  id: string;
  type: BlockType;
  company: Company;
  status: BlockStatus;
  title: string;
  subtitle: string | null;
  content: string | null;
  tags: string[];
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  parentId: string;
  workspaceId: string;
}

// Page context for AI generation
interface PageContext {
  pageName: string;
  pageDescription: string;
  company: Company;
  pageType: "quickstart" | "developers" | "protocol" | "vertical" | "enterprise";
}

/**
 * Determine the page type for context-aware generation
 */
function getPageType(pageId: string): PageContext["pageType"] {
  if (pageId.includes("quickstart")) return "quickstart";
  if (pageId.includes("developers")) return "developers";
  if (pageId.includes("protocol")) return "protocol";
  if (pageId.includes("enterprise")) return "enterprise";
  return "vertical"; // Default for verticals like robotics, gaming
}

/**
 * Generate content blocks using Gemini AI
 */
async function generateBlocksWithAI(context: PageContext): Promise<Array<{
  title: string;
  subtitle: string;
  content: string;
  type: "hero" | "content" | "feature";
}>> {
  const pageTypePrompts: Record<PageContext["pageType"], string> = {
    quickstart: `Create content for a Quick Start guide page. Include:
- A welcoming hero section for new users
- Step-by-step getting started content (3-4 key steps)
- A feature highlight about ease of integration
Focus on simplicity, speed, and developer experience.`,
    
    developers: `Create content for a Developer Documentation hub. Include:
- A hero section emphasizing developer tools and resources
- Content about SDK/API capabilities
- A feature about developer community and support
Focus on technical depth, comprehensive docs, and developer empowerment.`,
    
    protocol: `Create content for a Protocol deep-dive page. Include:
- A hero section about the protocol architecture
- Technical content about how the protocol works
- A feature about security and verification
Focus on technical accuracy, innovation, and trustworthiness.`,
    
    vertical: `Create content for an industry vertical page (${context.pageName}). Include:
- A hero section about AI solutions for this industry
- Use case content specific to this vertical
- A feature about competitive advantages
Focus on industry-specific benefits and real-world applications.`,
    
    enterprise: `Create content for an Enterprise solutions page. Include:
- A hero section about enterprise-grade capabilities
- Content about deployment options and security
- A feature about pricing and support tiers
Focus on scalability, security, compliance, and dedicated support.`,
  };

  const systemPrompt = `You are an expert content strategist for ${context.company === "CERE" ? "CERE Network (decentralized data infrastructure protocol)" : "CEF.AI (enterprise AI inference platform)"}.

PAGE CONTEXT:
- Page Name: ${context.pageName}
- Description: ${context.pageDescription}
- Company: ${context.company}

${pageTypePrompts[context.pageType]}

Generate exactly 4 content blocks in JSON format. Each block should have:
- title: Short, compelling headline (3-8 words)
- subtitle: Brief tagline or supporting text (1 sentence)
- content: Detailed description (2-4 sentences, plain text, no markdown)
- type: One of "hero", "content", or "feature"

The first block should be type "hero", the last should be type "feature", and the middle two should be type "content".

IMPORTANT:
1. Use plain text only - NO markdown, asterisks, or special formatting
2. Be specific to the ${context.company} brand and technology
3. Make content engaging and conversion-focused

Respond ONLY with a valid JSON array:
[
  { "title": "...", "subtitle": "...", "content": "...", "type": "hero" },
  { "title": "...", "subtitle": "...", "content": "...", "type": "content" },
  { "title": "...", "subtitle": "...", "content": "...", "type": "content" },
  { "title": "...", "subtitle": "...", "content": "...", "type": "feature" }
]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean and parse the response
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleanedText);
    
    // Clean any remaining markdown from content
    return parsed.map((block: { title: string; subtitle: string; content: string; type: string }) => ({
      ...block,
      title: block.title?.replace(/\*+/g, "").trim() || "",
      subtitle: block.subtitle?.replace(/\*+/g, "").trim() || "",
      content: block.content?.replace(/\*+/g, "").trim() || "",
    }));
  } catch (error) {
    console.error("AI generation failed, using fallback content:", error);
    // Return fallback content
    return [
      {
        title: `Welcome to ${context.pageName}`,
        subtitle: context.pageDescription,
        content: `Discover what ${context.company === "CERE" ? "CERE Network" : "CEF.AI"} has to offer in this section. Explore features, capabilities, and resources designed to help you succeed.`,
        type: "hero" as const,
      },
      {
        title: "Key Capabilities",
        subtitle: "What you can achieve",
        content: `Learn about the core capabilities available in ${context.pageName}. Our platform provides powerful tools and integrations to streamline your workflow.`,
        type: "content" as const,
      },
      {
        title: "How It Works",
        subtitle: "Simple and powerful",
        content: `Our approach combines ease of use with enterprise-grade capabilities. Get started quickly and scale as your needs grow.`,
        type: "content" as const,
      },
      {
        title: "Get Started Today",
        subtitle: "Begin your journey",
        content: `Ready to explore ${context.pageName}? Our team is here to help you every step of the way. Contact us to learn more.`,
        type: "feature" as const,
      },
    ];
  }
}

/**
 * POST /api/blocks/generate - Generate AI content blocks for a page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = generateBlocksSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { pageId, parentBlockId, workspaceId, company } = validation.data;

    // Get page info for context
    const page = getPageById(pageId);
    if (!page) {
      return NextResponse.json(
        { error: `Page not found: ${pageId}` },
        { status: 404 }
      );
    }

    const pageContext: PageContext = {
      pageName: page.name,
      pageDescription: page.description,
      company: company,
      pageType: getPageType(pageId),
    };

    // Generate content with AI
    const aiBlocks = await generateBlocksWithAI(pageContext);

    // Convert AI output to block data
    const blocks: GeneratedBlock[] = aiBlocks.map((aiBlock, index) => {
      // Map AI block type to actual BlockType
      const blockType: BlockType = aiBlock.type === "hero" 
        ? "CORE_VALUE_PROP" 
        : aiBlock.type === "feature" 
          ? "FEATURE" 
          : "ARTICLE";

      return {
        id: nanoid(),
        type: blockType,
        company: company,
        status: "DRAFT" as BlockStatus,
        title: aiBlock.title,
        subtitle: aiBlock.subtitle,
        content: aiBlock.content,
        tags: ["generated", pageId, aiBlock.type],
        positionX: 50 + (index % 2) * 350,
        positionY: 2100 + Math.floor(index / 2) * 200, // Below page roots
        width: 300,
        height: 140,
        parentId: parentBlockId,
        workspaceId: workspaceId,
      };
    });

    return NextResponse.json({
      success: true,
      pageId,
      parentBlockId,
      blocks,
      count: blocks.length,
    });
  } catch (error) {
    console.error("Block generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate blocks" },
      { status: 500 }
    );
  }
}

