import { NextResponse } from "next/server";

// Prevent static generation - this route generates images dynamically
export const dynamic = "force-dynamic";
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview"; // Nano Banana Pro

// Refined prompts: Softer aesthetic but MORE LITERAL representation of the subject
const CARDS = [
  { 
    id: "ceo-dashboard", 
    prompt: "A soft, stylized 3D illustration of a clean executive dashboard interface. A simplified layout showing abstract charts and widgets on a glass surface. Deep purple and violet theme (#4C1D95). Soft lighting, matte finish. No text. Depicting high-level strategy and oversight. 16:9 aspect ratio." 
  },
  { 
    id: "schema", 
    prompt: "A soft, stylized 3D illustration of a structured network diagram. Clean, spherical nodes connected by smooth tubes, arranged like a sitemap or organizational chart. Cyan and blue theme (#0E7490). Soft depth of field. No text. Depicting architecture and hierarchy. 16:9 aspect ratio." 
  },
  { 
    id: "editor", 
    prompt: "A soft, stylized 3D illustration of stacking building blocks. Smooth, matte interlocking cubes and bricks forming a solid structure. Emerald and teal theme (#047857). Minimalist, clean. No text. Depicting modular content construction. 16:9 aspect ratio." 
  },
  { 
    id: "wireframe", 
    prompt: "A soft, stylized 3D illustration of a website wireframe. Floating semi-transparent panels representing a webpage header, hero section, and text blocks. Amber and orange theme (#B45309). Frosted glass effect. No text. Depicting page layout design. 16:9 aspect ratio." 
  },
  { 
    id: "content-creation", 
    prompt: "A soft, stylized 3D illustration of a magical quill pen writing on a floating paper scroll. Pink and rose theme (#BE185D). Soft sparkles and flow. No text. Depicting creative writing and AI generation. 16:9 aspect ratio." 
  },
  { 
    id: "roadmap", 
    prompt: "A soft, stylized 3D illustration of a winding path with milestone markers. A smooth road curving into the distance with round flagpoles. Sky blue and indigo theme (#4338CA). Soft lighting. No text. Depicting a project journey and timeline. 16:9 aspect ratio." 
  },
  { 
    id: "analytics", 
    prompt: "A soft, stylized 3D illustration of a rising bar chart. Smooth, 3D columns growing upwards in a positive trend. Lime and green theme (#15803D). Soft shadows, matte finish. No text. Depicting data growth and success. 16:9 aspect ratio." 
  }
];

export async function GET() {
  const results: Record<string, string> = {};
  const publicDir = path.join(process.cwd(), 'public', 'images', 'home');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log(`Starting image generation using model: ${MODEL}`);

  for (const card of CARDS) {
    try {
      console.log(`Generating Image for ${card.id}...`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: card.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE"] 
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error for ${card.id}:`, response.status, errorText);
        results[card.id] = `API Error: ${response.status}`;
        continue;
      }

      const data = await response.json();
      
      const part = data.candidates?.[0]?.content?.parts?.[0];
      
      if (part && part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        const base64Data = part.inlineData.data;
        const extension = part.inlineData.mimeType.split('/')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const fileName = `${card.id}.${extension}`;
        const filePath = path.join(publicDir, fileName);
        
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved ${filePath}`);
        results[card.id] = `Success: ${fileName}`;
      } else {
        console.error(`No image data found for ${card.id}`);
        results[card.id] = "No image data returned";
      }

    } catch (error) {
      console.error(`Error generating ${card.id}:`, error);
      results[card.id] = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    // Slight delay
    await new Promise(r => setTimeout(r, 2000));
  }

  return NextResponse.json({ success: true, results });
}
