/**
 * Notion API Proxy Route
 * Handles all Notion API calls server-side to avoid CORS issues
 */

import { NextRequest, NextResponse } from "next/server";

const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";

/**
 * Get Notion API key from environment.
 * Returns null if not configured.
 */
function getNotionApiKey(): string | null {
  return process.env.NOTION_API_KEY || null;
}

interface NotionProxyRequest {
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: object;
}

export async function POST(request: NextRequest) {
  try {
    const notionApiKey = getNotionApiKey();

    if (!notionApiKey) {
      return NextResponse.json(
        { error: "Notion API not configured. Set NOTION_API_KEY environment variable." },
        { status: 503 }
      );
    }

    const { endpoint, method, body }: NotionProxyRequest = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {
      "Authorization": `Bearer ${notionApiKey}`,
      "Notion-Version": NOTION_API_VERSION,
      "Content-Type": "application/json",
    };

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers,
    };

    if (body && (method === "POST" || method === "PATCH")) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error("Notion API error:", data);
      return NextResponse.json(
        { error: data.message || "Notion API error", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Notion proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy Notion request", details: String(error) },
      { status: 500 }
    );
  }
}

