import type { TourDefinition } from "../TourProvider";

/**
 * Wireframe Tour - Website Builder tour
 * Covers page navigation, sections, responsive preview, deeper pages, and AI generation
 */
export const wireframeTour: TourDefinition = {
  id: "wireframe",
  name: "Website Builder Tour",
  description: "Design landing pages visually",
  icon: "🎨",
  tabRestriction: "wireframe",
  steps: [
    {
      id: "page-navigator",
      target: "[data-tour='page-navigator']",
      title: "Page Navigator",
      content:
        "Browse all your website pages here. Pages are organized by company (CERE/CEF) and can be nested hierarchically. The grid view shows each page as a card with status and section count.",
      position: "right",
      spotlight: true,
    },
    {
      id: "page-cards",
      target: "[data-tour='page-cards']",
      title: "Page Overview Cards",
      content:
        "Each card shows a page's status and section count. The color indicates the company - cyan for CERE, green for CEF. Click any card to edit that page's wireframe.",
      position: "top",
      spotlight: true,
    },
    {
      id: "page-hierarchy",
      target: "[data-tour='page-navigator']",
      title: "Page Hierarchy",
      content:
        "Pages can have parent-child relationships. 'Deeper pages' (sub-pages) automatically get AI-generated content blocks when you first visit them. This helps bootstrap content quickly.",
      position: "right",
      spotlight: false,
    },
    {
      id: "ai-generation",
      target: "[data-tour='page-navigator']",
      title: "AI Content Generation",
      content:
        "When you navigate to a deeper page for the first time, AI automatically generates relevant content blocks based on the page type and company. Watch for the loading indicator.",
      position: "right",
      spotlight: false,
    },
    {
      id: "section-palette",
      target: "[data-tour='section-palette']",
      title: "Section Palette",
      content:
        "Drag section types onto your page: Hero, Features, Pain Points, Solutions, CTAs, Content, and Value Props. Each section type has multiple layout variants you can choose from.",
      position: "right",
      spotlight: true,
    },
    {
      id: "page-canvas",
      target: "[data-tour='page-canvas']",
      title: "Page Canvas",
      content:
        "This is your page preview. Drag sections to reorder them, click to select and edit. Sections render in order from top to bottom, just like they'll appear on the final website.",
      position: "top",
      spotlight: true,
    },
    {
      id: "breadcrumb",
      target: "[data-tour='page-canvas']",
      title: "Navigation Breadcrumb",
      content:
        "The breadcrumb at the top shows your current location in the page hierarchy. Click 'All Pages' to return to the page overview, or click any parent page to navigate there.",
      position: "top",
      spotlight: false,
    },
    {
      id: "viewport-toggle",
      target: "[data-tour='viewport-toggle']",
      title: "Responsive Preview",
      content:
        "Preview your page on different screen sizes: Desktop, Tablet, and Mobile. The canvas resizes to show how your design adapts to different devices.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "section-editor",
      target: "[data-tour='section-editor']",
      title: "Section Editor",
      content:
        "Select a section to open the editor panel. Edit section content, change the layout variant, add notes, set status, and link content blocks from your schema.",
      position: "left",
      spotlight: true,
    },
    {
      id: "section-variants",
      target: "[data-tour='section-editor']",
      title: "Section Variants",
      content:
        "Each section type has multiple layout variants. For example, Hero sections can be centered, left-aligned, or with an image. Choose the variant that best fits your design.",
      position: "left",
      spotlight: false,
    },
    {
      id: "block-linker",
      target: "[data-tour='block-linker']",
      title: "Link to Content Blocks",
      content:
        "Connect wireframe sections to your Content Schema blocks. This ensures page content stays synchronized - when you update a block, the linked wireframe section updates too.",
      position: "left",
      spotlight: true,
    },
    {
      id: "section-status",
      target: "[data-tour='section-editor']",
      title: "Section Status Workflow",
      content:
        "Sections follow the same workflow as blocks: Draft → Pending Review → Approved → Live. Submit sections for review to have Fred approve them in the CEO View.",
      position: "left",
      spotlight: false,
    },
  ],
};
