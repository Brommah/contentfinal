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
      position: "bottom",
      spotlight: false,
    },
    {
      id: "wiki-ai-first",
      target: "[data-tour='wiki-ai-button']",
      title: "Wiki AI Panel",
      content:
        "The Wiki AI panel is expanded by default. It provides context from your wiki and uses AI to suggest improvements for your content. This is the most powerful feature for content creation!",
      position: "left",
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
      target: "[data-tour='editor-content']",
      title: "Content Editor",
      content:
        "Select a block from the list to open it here. You can edit the title, subtitle, content, and all metadata. Changes sync automatically with the Architecture view.",
      position: "left",
      spotlight: true,
    },
    {
      id: "editor-toolbar",
      target: "[data-tour='editor-toolbar']",
      title: "Content Area",
      content:
        "Write your content here with full markdown support. The editor auto-expands as you type. All changes are auto-saved.",
      position: "top",
      spotlight: true,
    },
    {
      id: "content-score",
      target: "[data-tour='content-score']",
      title: "Content Metrics",
      content:
        "Track your word count and character count as you write. This helps you maintain consistent content length across blocks.",
      position: "top",
      spotlight: true,
    },
    {
      id: "status-change",
      target: "[data-tour='editor-status']",
      title: "Status Management",
      content:
        "Change the block's status here. Set to 'Pending Review' when ready for Fred's review in the CEO View. Other statuses include Draft, Live, Vision, and Archived.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "save-indicator",
      target: "[data-tour='editor-save']",
      title: "Auto-Save Indicator",
      content:
        "Your changes are saved automatically as you type. The checkmark confirms your latest edits are synced. No need to manually save!",
      position: "top",
      spotlight: true,
    },
  ],
};
