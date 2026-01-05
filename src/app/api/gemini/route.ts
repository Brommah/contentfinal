/**
 * Gemini API Route - LLM integration for content improvements
 */

import { NextRequest, NextResponse } from "next/server";

// Use gemini-2.0-flash which is the latest available model
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export async function POST(request: NextRequest) {
  try {
    const geminiApiKey = getGeminiApiKey();
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API not configured. Set GEMINI_API_KEY environment variable." },
        { status: 503 }
      );
    }

    const { prompt, context, blockTitle, blockContent, blockType } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Build the full prompt with context
    const systemPrompt = `You are an expert technical writer and content strategist for CEF.AI, a decentralized AI computation platform. 

Your task is to improve content blocks for the platform's marketing and documentation materials.

WIKI CONTEXT (Reference material from the CEF AI Wiki):
${context || "No context provided"}

CURRENT BLOCK TO IMPROVE:
Title: ${blockTitle || "Untitled"}
Type: ${blockType || "General"}
Current Content: ${blockContent || "No content"}

USER REQUEST:
${prompt}

IMPORTANT FORMATTING RULES:
1. Do NOT use asterisks, markdown, or any special formatting
2. Write plain text only - no **bold**, no *italics*, no bullet points with dashes
3. Keep paragraphs clean and readable
4. Be concise and direct

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "Improved title here (short, compelling, 3-8 words)",
  "subtitle": "Brief subtitle or tagline (one sentence max)",
  "content": "The main content paragraph(s). Plain text only, no markdown or special characters. Focus on clarity and value."
}

Do not include any text before or after the JSON. Only output the JSON object.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: `Gemini API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse as JSON
    try {
      // Clean up the response - remove any markdown code blocks if present
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      const parsed = JSON.parse(cleanedText);
      
      // Clean any remaining asterisks from the content
      const cleanContent = (text: string) => {
        if (!text) return text;
        return text
          .replace(/\*\*/g, "") // Remove bold markers
          .replace(/\*/g, "")   // Remove italic markers
          .replace(/^[-•]\s*/gm, "") // Remove bullet points
          .trim();
      };
      
      return NextResponse.json({
        result: {
          title: cleanContent(parsed.title || ""),
          subtitle: cleanContent(parsed.subtitle || ""),
          content: cleanContent(parsed.content || ""),
        },
        structured: true,
      });
    } catch {
      // If JSON parsing fails, return as plain text (legacy format)
      // Also clean asterisks from plain text
      const cleanedResult = generatedText
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^[-•]\s*/gm, "")
        .trim();
      
      return NextResponse.json({ result: cleanedResult, structured: false });
    }
  } catch (error) {
    console.error("Gemini route error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

