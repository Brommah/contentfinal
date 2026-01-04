import type { TourDefinition } from "../TourProvider";

/**
 * Editor Tour - Content Editor tour (Building Blocks view)
 * Covers list view, filtering, rich text editing, Wiki AI, and status management
 */
export const editorTour: TourDefinition = {
  id: "editor",
  name: "Building Blocks Tour",
  description: "Master the content editing experience",
  icon: "✏️",
  tabRestriction: "editor",
  steps: [
    {
      id: "editor-intro",
      target: "[data-tour='editor-main']",
      title: "Building Blocks Editor",
      content:
        "This is your focused content editing workspace. Unlike the visual Architecture view, this provides a list-based approach with powerful filtering and a rich text editor.",
      position: "top",
      spotlight: true,
    },
    {
      id: "block-list",
      target: "[data-tour='editor-block-list']",
      title: "Block Navigator",
      content:
        "All your content blocks are listed here in a resizable sidebar. Click column headers to sort by title, type, or date. Each block shows its type icon, company color, and status.",
      position: "right",
      spotlight: true,
    },
    {
      id: "filter-bar",
      target: "[data-tour='editor-block-list']",
      title: "Powerful Filtering",
      content:
        "Use the search bar to find blocks by title or content. Filter by block type, company (CERE/CEF/Shared), or status. The count shows how many blocks match your filters.",
      position: "right",
      spotlight: true,
    },
    {
      id: "editor-content",
      target: "[data-tour='editor-main']",
      title: "Rich Content Editor",
      content:
        "The main panel provides a full-featured content editor. Write and format your content with headings, bold, italic, lists, links, and more. Changes sync automatically with the Architecture view.",
      position: "top",
      spotlight: true,
    },
    {
      id: "editor-toolbar",
      target: "[data-tour='editor-toolbar']",
      title: "Formatting Tools",
      content:
        "Format your content with the toolbar: headings (H1-H6), bold, italic, strikethrough, bullet lists, numbered lists, blockquotes, code blocks, and links. Markdown shortcuts work too!",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "content-score",
      target: "[data-tour='content-score']",
      title: "Content Quality Score",
      content:
        "This panel shows your content's readability score and quality rating. It analyzes word count, sentence length, and vocabulary. Aim for 60+ for clear, effective content.",
      position: "left",
      spotlight: true,
    },
    {
      id: "connected-blocks",
      target: "[data-tour='editor-main']",
      title: "Connected Blocks",
      content:
        "Below the editor, you'll see blocks connected to the current one. Click any connected block to navigate to it. This helps you understand content relationships.",
      position: "top",
      spotlight: false,
    },
    {
      id: "wiki-ai",
      target: "[data-tour='editor-main']",
      title: "Wiki AI Panel",
      content:
        "Click the 'Wiki AI' button at the bottom right to open the AI assistance panel. It provides context from your wiki and suggests improvements to your content using AI.",
      position: "left",
      spotlight: false,
    },
    {
      id: "status-change",
      target: "[data-tour='editor-status']",
      title: "Status Management",
      content:
        "Change the block's status here. When your content is ready, submit for review to send it to Fred in the CEO View. You can also set tags and update metadata.",
      position: "left",
      spotlight: true,
    },
    {
      id: "save-indicator",
      target: "[data-tour='editor-save']",
      title: "Auto-Save",
      content:
        "Your changes are saved automatically as you type. Look for the checkmark to confirm your latest edits are synced. No need to manually save!",
      position: "bottom",
      spotlight: true,
    },
  ],
};
