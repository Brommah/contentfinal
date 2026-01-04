import type { TourDefinition } from "../TourProvider";

/**
 * Intro Tour - Welcome tour shown on first visit
 * Covers high-level app orientation with updated navigation structure
 */
export const introTour: TourDefinition = {
  id: "intro",
  name: "Welcome Tour",
  description: "Get started with Content Visualizer",
  icon: "👋",
  steps: [
    {
      id: "welcome",
      target: "[data-tour='logo']",
      title: "Welcome to Content Visualizer!",
      content:
        "This is your single source of truth for CERE & CEF content. Let's take a quick tour to help you get started. Click the logo anytime to return to the Home dashboard.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "tabs",
      target: "[data-tour='tabs']",
      title: "Navigate Between Views",
      content:
        "Use these tabs to switch between views: Home for the dashboard, CEO View for approvals, Content Editors (dropdown) for building content, Roadmap for planning, and Analytics for insights.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "home-bento",
      target: "[data-tour='logo']",
      title: "Home Dashboard",
      content:
        "The Home page shows a beautiful bento grid of all available modules. Each card shows stats and allows quick navigation. Click any card to jump directly to that view.",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "ceo-view",
      target: "[data-tour='tabs']",
      title: "CEO View",
      content:
        "The CEO View is Fred's command center. It shows review queues for content blocks, wireframe pages, roadmap items, and team suggestions - all in one place.",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "content-editors",
      target: "[data-tour='tabs']",
      title: "Content Editors",
      content:
        "The Content Editors dropdown gives you access to four powerful tools: Architecture (visual schema), Building Blocks (content editor), Website Builder (page design), and Content Studio (AI generation).",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "sync-status",
      target: "[data-tour='sync-status']",
      title: "Auto-Save Enabled",
      content:
        "Your work is automatically saved. This indicator shows sync status - green means all changes are saved to the cloud.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "keyboard-hint",
      target: "[data-tour='help-button']",
      title: "Tours & Keyboard Shortcuts",
      content:
        "Click this button to access all available tours for the current view. Press ? anytime to see keyboard shortcuts. Navigate tabs with number keys 1-6.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "complete",
      target: "[data-tour='logo']",
      title: "You're Ready!",
      content:
        "Explore each tab to learn more. Every view has its own guided tour - look for the tour button in the help menu to get context-specific guidance anytime.",
      position: "bottom",
      spotlight: false,
    },
  ],
};
