import type { TourDefinition } from "../TourProvider";

/**
 * Schema Tour - Content Schema canvas tour (Architecture view)
 * Covers canvas interaction, blocks, connections, templates, and inline editing
 */
export const schemaTour: TourDefinition = {
  id: "schema",
  name: "Architecture Tour",
  description: "Learn to visualize your content hierarchy",
  icon: "🗺️",
  tabRestriction: "schema",
  steps: [
    {
      id: "canvas-intro",
      target: "[data-tour='canvas']",
      title: "Visual Content Canvas",
      content:
        "This is your content canvas - an infinite workspace for mapping content relationships. Drag to pan, scroll to zoom. All blocks and connections are visualized here.",
      position: "top",
      spotlight: true,
    },
    {
      id: "palette",
      target: "[data-tour='palette']",
      title: "Block Palette",
      content:
        "Drag block types from here onto the canvas. Each type serves a specific purpose: Company blocks, Value Props, Pain Points, Solutions, Features, Verticals, Articles, and Tech Components.",
      position: "right",
      spotlight: true,
    },
    {
      id: "palette-blocks",
      target: "[data-tour='palette-blocks']",
      title: "Block Types Explained",
      content:
        "Value Props define your core offering. Pain Points describe customer problems. Solutions show how you solve them. Features highlight capabilities. Articles are long-form content pieces.",
      position: "right",
      spotlight: true,
    },
    {
      id: "filter-toolbar",
      target: "[data-tour='filter-toolbar']",
      title: "Filter & Search",
      content:
        "Filter blocks by company (CERE/CEF/Shared), status (Draft, Pending Review, Approved, Live), or type. Use the search to quickly find specific content blocks by title.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "toolbar",
      target: "[data-tour='toolbar']",
      title: "Canvas Toolbar",
      content:
        "Use these tools to auto-organize your layout, view version history, undo/redo changes, and export your schema to Markdown or JSON for external use.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "new-block-button",
      target: "[data-tour='canvas']",
      title: "Adding New Blocks",
      content:
        "Click the 'New Block' button at the bottom center or press 'T' to open the templates gallery. You can also drag from the palette or double-click the canvas to add a new block.",
      position: "top",
      spotlight: false,
    },
    {
      id: "inline-editing",
      target: "[data-tour='canvas']",
      title: "Quick Inline Editing",
      content:
        "Double-click any block on the canvas to open the inline editor. This lets you quickly edit title, subtitle, and status without opening the full editor panel.",
      position: "top",
      spotlight: false,
    },
    {
      id: "block-editor",
      target: "[data-tour='block-editor']",
      title: "Block Editor Panel",
      content:
        "When you select a block, this panel opens on the right. Edit content, change status, add tags, manage connections, view content score, and submit for review.",
      position: "left",
      spotlight: true,
    },
    {
      id: "block-status",
      target: "[data-tour='status']",
      title: "Block Status Workflow",
      content:
        "Every block has a status: Draft → Pending Review → Approved → Live. Submit content for review to send it to Fred in the CEO View for approval.",
      position: "left",
      spotlight: true,
    },
    {
      id: "connections",
      target: "[data-tour='canvas']",
      title: "Drawing Connections",
      content:
        "To connect blocks, drag from one block's connection handle to another. Connections show relationships between content pieces - like how a Pain Point leads to a Solution.",
      position: "top",
      spotlight: false,
    },
    {
      id: "multi-select",
      target: "[data-tour='canvas']",
      title: "Multi-Select & Bulk Actions",
      content:
        "Hold Shift and drag to select multiple blocks. A toolbar appears with bulk actions: change status, company, or delete multiple blocks at once.",
      position: "top",
      spotlight: false,
    },
  ],
};
