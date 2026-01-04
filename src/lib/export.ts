/**
 * Export Utilities - Generate various output formats from content schema
 */

import type { Node, Edge } from "@xyflow/react";
import type { BlockData, BlockType, Company, BLOCK_CONFIGS, COMPANY_COLORS } from "./types";

// Block type order for organizing exports
const BLOCK_TYPE_ORDER: BlockType[] = [
  "COMPANY",
  "CORE_VALUE_PROP",
  "FEATURE",
  "TECH_COMPONENT",
  "SOLUTION",
  "PAIN_POINT",
  "VERTICAL",
  "ARTICLE",
];

// Block type labels for markdown
const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  COMPANY: "Company Overview",
  CORE_VALUE_PROP: "Core Value Propositions",
  PAIN_POINT: "Pain Points",
  SOLUTION: "Solutions",
  FEATURE: "Features",
  VERTICAL: "Verticals",
  ARTICLE: "Articles",
  TECH_COMPONENT: "Technology Components",
  PAGE_ROOT: "Page Roots",
};

// Status emoji
const STATUS_EMOJI: Record<string, string> = {
  LIVE: "🟢",
  VISION: "🔮",
  DRAFT: "📝",
  ARCHIVED: "📦",
};

interface ExportOptions {
  includeConnections?: boolean;
  includeStatus?: boolean;
  includeTags?: boolean;
  groupByCompany?: boolean;
  groupByType?: boolean;
  companies?: Company[];
}

/**
 * Export to Markdown format
 */
export function exportToMarkdown(
  nodes: Node[],
  edges: Edge[],
  workspaceName: string,
  options: ExportOptions = {}
): string {
  const {
    includeConnections = true,
    includeStatus = true,
    includeTags = true,
    groupByCompany = true,
    companies = ["CERE", "CEF", "SHARED"],
  } = options;

  const blocks = nodes.map((n) => n.data as BlockData);
  const filteredBlocks = blocks.filter((b) => companies.includes(b.company));

  let md = `# ${workspaceName}\n\n`;
  md += `> Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\n`;
  md += `---\n\n`;

  if (groupByCompany) {
    for (const company of companies) {
      const companyBlocks = filteredBlocks.filter((b) => b.company === company);
      if (companyBlocks.length === 0) continue;

      md += `## ${company === "CERE" ? "🔵 CERE Network" : company === "CEF" ? "🟣 CEF.AI" : "🟢 Shared"}\n\n`;

      // Group by type within company
      for (const blockType of BLOCK_TYPE_ORDER) {
        const typeBlocks = companyBlocks.filter((b) => b.type === blockType);
        if (typeBlocks.length === 0) continue;

        md += `### ${BLOCK_TYPE_LABELS[blockType]}\n\n`;

        for (const block of typeBlocks) {
          md += formatBlockMarkdown(block, { includeStatus, includeTags });
        }
      }
    }
  } else {
    // Group by type only
    for (const blockType of BLOCK_TYPE_ORDER) {
      const typeBlocks = filteredBlocks.filter((b) => b.type === blockType);
      if (typeBlocks.length === 0) continue;

      md += `## ${BLOCK_TYPE_LABELS[blockType]}\n\n`;

      for (const block of typeBlocks) {
        md += formatBlockMarkdown(block, { includeStatus, includeTags });
      }
    }
  }

  // Connections section
  if (includeConnections && edges.length > 0) {
    md += `---\n\n## 🔗 Relationships\n\n`;
    md += `| From | Relationship | To |\n`;
    md += `|------|--------------|----|\n`;

    for (const edge of edges) {
      const fromBlock = blocks.find((b) => b.id === edge.source);
      const toBlock = blocks.find((b) => b.id === edge.target);
      if (!fromBlock || !toBlock) continue;

      const relType = (edge.data as { relationshipType?: string })?.relationshipType || "REFERENCES";
      md += `| ${fromBlock.title} | ${relType.replace(/_/g, " ")} | ${toBlock.title} |\n`;
    }
  }

  return md;
}

function formatBlockMarkdown(
  block: BlockData,
  options: { includeStatus: boolean; includeTags: boolean }
): string {
  let md = "";

  // Title with status
  const statusEmoji = options.includeStatus ? STATUS_EMOJI[block.status] + " " : "";
  md += `#### ${statusEmoji}${block.title}\n\n`;

  // Subtitle
  if (block.subtitle) {
    md += `*${block.subtitle}*\n\n`;
  }

  // Content
  if (block.content) {
    md += `${block.content}\n\n`;
  }

  // Tags
  if (options.includeTags && block.tags && block.tags.length > 0) {
    md += `\`${block.tags.join("` `")}\`\n\n`;
  }

  return md;
}

/**
 * Export to JSON format
 */
export function exportToJSON(
  nodes: Node[],
  edges: Edge[],
  workspaceName: string
): string {
  const blocks = nodes.map((n) => {
    const data = n.data as BlockData;
    return {
      id: data.id,
      type: data.type,
      company: data.company,
      status: data.status,
      title: data.title,
      subtitle: data.subtitle,
      content: data.content,
      tags: data.tags,
    };
  });

  const connections = edges.map((e) => ({
    from: e.source,
    to: e.target,
    type: (e.data as { relationshipType?: string })?.relationshipType,
    label: (e.data as { label?: string })?.label,
  }));

  return JSON.stringify(
    {
      name: workspaceName,
      exportedAt: new Date().toISOString(),
      blocks,
      connections,
    },
    null,
    2
  );
}

/**
 * Export to Notion-compatible format (Markdown with Notion database properties)
 */
export function exportToNotion(
  nodes: Node[],
  edges: Edge[],
  workspaceName: string
): string {
  const blocks = nodes.map((n) => n.data as BlockData);

  let md = `# ${workspaceName}\n\n`;
  md += `## Content Database\n\n`;

  // Create a table format that Notion can import
  md += `| Title | Type | Company | Status | Subtitle | Tags |\n`;
  md += `|-------|------|---------|--------|----------|------|\n`;

  for (const block of blocks) {
    const tags = block.tags?.join(", ") || "";
    md += `| ${block.title} | ${block.type} | ${block.company} | ${block.status} | ${block.subtitle || ""} | ${tags} |\n`;
  }

  md += `\n---\n\n`;

  // Detailed content
  md += `## Content Details\n\n`;

  for (const block of blocks) {
    md += `### ${block.title}\n\n`;
    md += `- **Type:** ${block.type}\n`;
    md += `- **Company:** ${block.company}\n`;
    md += `- **Status:** ${block.status}\n`;
    if (block.subtitle) md += `- **Subtitle:** ${block.subtitle}\n`;
    if (block.tags?.length) md += `- **Tags:** ${block.tags.join(", ")}\n`;
    md += `\n`;
    if (block.content) {
      md += `${block.content}\n\n`;
    }
    md += `---\n\n`;
  }

  return md;
}

/**
 * Export to CSV format
 */
export function exportToCSV(nodes: Node[]): string {
  const blocks = nodes.map((n) => n.data as BlockData);

  const headers = ["ID", "Title", "Type", "Company", "Status", "Subtitle", "Content", "Tags"];
  const rows = blocks.map((b) => [
    b.id,
    `"${b.title.replace(/"/g, '""')}"`,
    b.type,
    b.company,
    b.status,
    `"${(b.subtitle || "").replace(/"/g, '""')}"`,
    `"${(b.content || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    `"${(b.tags || []).join(", ")}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


