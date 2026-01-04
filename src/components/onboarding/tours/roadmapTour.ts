import type { TourDefinition } from "../TourProvider";

/**
 * Roadmap Tour - Content Roadmap tour
 * Covers phases, kanban/gantt/calendar views, milestones, team assignment, and dependencies
 */
export const roadmapTour: TourDefinition = {
  id: "roadmap",
  name: "Content Roadmap Tour",
  description: "Plan your compounding content strategy",
  icon: "📅",
  tabRestriction: "roadmap",
  steps: [
    {
      id: "roadmap-intro",
      target: "[data-tour='roadmap-header']",
      title: "Content Roadmap",
      content:
        "Plan and track your content strategy here. Organize work into phases, assign to team members, set dependencies, and visualize progress across your entire content initiative.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "view-toggle",
      target: "[data-tour='view-toggle']",
      title: "Three View Modes",
      content:
        "Switch between Kanban (column view for phase-based organization), Gantt (timeline view with bars), and Calendar (monthly grid view). Each shows the same data differently.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "company-filter",
      target: "[data-tour='company-filter']",
      title: "Filter by Company",
      content:
        "Focus on CERE, CEF, or view all content items. The team filter next to it lets you see items assigned to specific team members.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "milestones-toggle",
      target: "[data-tour='milestones-toggle']",
      title: "Milestones",
      content:
        "Toggle milestones to see key dates like product launches, website releases, or campaign deadlines. Add your own milestones to track important deadlines visually.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "add-content",
      target: "[data-tour='add-content']",
      title: "Add Content Items",
      content:
        "Click here to add new content items to your roadmap. Set the phase, priority, target date, team assignment, and optionally link to existing content blocks.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "phase-columns",
      target: "[data-tour='phase-columns']",
      title: "Roadmap Phases",
      content:
        "Content moves through phases: Foundation → Activation → Scale → Optimize. Each phase has specific goals and timelines. Drag items between phases as work progresses.",
      position: "top",
      spotlight: true,
    },
    {
      id: "roadmap-item",
      target: "[data-tour='roadmap-item']",
      title: "Roadmap Items",
      content:
        "Each card is a content item. Click the status badge to cycle through: Planned → In Progress → Review → Complete. The purple badge shows the 'compounding score' - how many items depend on this one.",
      position: "right",
      spotlight: true,
    },
    {
      id: "team-assignment",
      target: "[data-tour='phase-columns']",
      title: "Team Assignment",
      content:
        "Each item shows an avatar for the assigned team member. Click the avatar to reassign. Items without an assignment show a placeholder - click to assign someone.",
      position: "top",
      spotlight: false,
    },
    {
      id: "dependencies",
      target: "[data-tour='phase-columns']",
      title: "Dependencies",
      content:
        "Items can depend on other items. A 'Depends on X item(s)' note appears when an item is blocked. The Gantt view shows dependencies as connecting lines.",
      position: "top",
      spotlight: false,
    },
    {
      id: "gantt-view",
      target: "[data-tour='view-toggle']",
      title: "Gantt Timeline View",
      content:
        "Switch to Gantt view to see items on a timeline. Drag items horizontally to change dates, drag the ends to adjust duration. Dependencies are shown as arrows.",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "calendar-view",
      target: "[data-tour='view-toggle']",
      title: "Calendar View",
      content:
        "The Calendar view shows a monthly grid. Items are placed on their target dates. Great for seeing what's due when and spotting scheduling conflicts.",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "item-editor",
      target: "[data-tour='item-editor']",
      title: "Item Details Panel",
      content:
        "Select an item to see full details in the right panel. Edit title, description, dates, priority, and team assignment. Link content blocks and manage dependencies here.",
      position: "left",
      spotlight: true,
    },
  ],
};
