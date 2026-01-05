/**
 * Image Generation API Route using Gemini 3 Pro Image Preview
 * Uses the gemini-3-pro-image-preview model for high-fidelity image generation
 */

import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini 3 Pro Image Preview - for image generation
const GEMINI_IMAGE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { prompt, cardId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${GEMINI_IMAGE_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini Image API error:", response.status, errorData);
      
      return NextResponse.json({
        success: true,
        fallback: true,
        gradient: getCardGradient(cardId || "default"),
      });
    }

    const data = await response.json();
    
    // Check for image data in response
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return NextResponse.json({
          success: true,
          imageData: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        });
      }
    }

    // Fallback if no image generated
    return NextResponse.json({
      success: true,
      fallback: true,
      gradient: getCardGradient(cardId || "default"),
    });

  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({
      success: true,
      fallback: true,
      gradient: getCardGradient("default"),
    });
  }
}

// Get gradient styles for each card type
function getCardGradient(cardId: string): string {
  const gradients: Record<string, string> = {
    "ceo-dashboard": "linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.2) 50%, rgba(217,70,239,0.3) 100%)",
    "schema": "linear-gradient(135deg, rgba(6,182,212,0.4) 0%, rgba(59,130,246,0.2) 50%, rgba(99,102,241,0.3) 100%)",
    "editor": "linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0.2) 50%, rgba(20,184,166,0.3) 100%)",
    "wireframe": "linear-gradient(135deg, rgba(249,115,22,0.4) 0%, rgba(245,158,11,0.2) 50%, rgba(234,179,8,0.3) 100%)",
    "content-creation": "linear-gradient(135deg, rgba(236,72,153,0.4) 0%, rgba(244,63,94,0.2) 50%, rgba(239,68,68,0.3) 100%)",
    "roadmap": "linear-gradient(135deg, rgba(14,165,233,0.4) 0%, rgba(59,130,246,0.2) 50%, rgba(99,102,241,0.3) 100%)",
    "analytics": "linear-gradient(135deg, rgba(132,204,22,0.4) 0%, rgba(34,197,94,0.2) 50%, rgba(16,185,129,0.3) 100%)",
    "default": "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 50%, rgba(168,85,247,0.3) 100%)",
  };
  return gradients[cardId] || gradients["default"];
}

// Card prompts for image generation
const CARD_PROMPTS: Record<string, string> = {
  "ceo-dashboard": "Generate an abstract digital art background for a CEO dashboard. Dark purple and violet nebula clouds with subtle golden sparkles. Executive command center aesthetic. Futuristic corporate luxury. No text, no logos, pure abstract ambient art. 16:9 ratio.",
  "schema": "Generate an abstract digital art background showing interconnected neural nodes. Cyan and electric blue glowing connections on dark space background. Data architecture visualization. Network topology aesthetic. No text, pure abstract art. 16:9 ratio.",
  "editor": "Generate an abstract digital art background with floating 3D geometric blocks. Emerald green and teal gradient atmosphere. Building blocks and modular construction theme. Creative workspace energy. No text, pure abstract art. 16:9 ratio.",
  "wireframe": "Generate an abstract digital art background with layered rectangular frames. Warm amber and orange sunset gradients on dark backdrop. Web design blueprint aesthetic. UI/UX wireframe inspiration. No text, pure abstract art. 16:9 ratio.",
  "content-creation": "Generate an abstract digital art background with AI creativity sparks. Magenta and hot pink energy waves radiating from center. Content generation magic and innovation. Dynamic artistic explosion. No text, pure abstract art. 16:9 ratio.",
  "roadmap": "Generate an abstract digital art background with flowing timeline paths. Sky blue and deep indigo gradient space. Milestone markers as glowing orbs along paths. Strategic planning visualization. No text, pure abstract art. 16:9 ratio.",
  "analytics": "Generate an abstract digital art background with rising data bars and chart patterns. Lime green and emerald growth indicators on dark backdrop. Business intelligence aurora effect. Data visualization aesthetic. No text, pure abstract art. 16:9 ratio.",
};

// Batch generate images for all cards
export async function GET() {
  const results: Record<string, string> = {};
  
  for (const [cardId, prompt] of Object.entries(CARD_PROMPTS)) {
    try {
      const response = await fetch(`${GEMINI_IMAGE_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            results[cardId] = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      // Use fallback gradient if no image generated
      if (!results[cardId]) {
        results[cardId] = getCardGradient(cardId);
      }
    } catch (error) {
      console.error(`Error generating image for ${cardId}:`, error);
      results[cardId] = getCardGradient(cardId);
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return NextResponse.json({ success: true, images: results });
}
