import type { TourDefinition } from "../TourProvider";

/**
 * CEO Dashboard Tour - Fred's approval dashboard tour
 * Covers review queues, stats, review requests, and approval workflow
 */
export const ceoDashboardTour: TourDefinition = {
  id: "ceo-dashboard",
  name: "CEO View Tour",
  description: "Review and approve content efficiently",
  icon: "👔",
  tabRestriction: "ceo-dashboard",
  steps: [
    {
      id: "dashboard-intro",
      target: "[data-tour='ceo-header']",
      title: "CEO View",
      content:
        "This is the executive command center for content oversight. Review pending items, track progress, and approve content across all initiatives from a single dashboard.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "stats-row",
      target: "[data-tour='stats-row']",
      title: "Quick Stats",
      content:
        "See at a glance: items in progress, content awaiting review, pages needing approval, roadmap items in review, and team suggestions. Click any stat card to jump to that view.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "company-filter",
      target: "[data-tour='ceo-company-filter']",
      title: "Filter by Company",
      content:
        "Focus on a specific company's content. Filter to see only CERE or CEF items when reviewing. The AI Export button lets you export instructions for Claude/ChatGPT.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "roadmap-overview",
      target: "[data-tour='roadmap-overview']",
      title: "Roadmap Overview",
      content:
        "Track what's in progress and coming up next. Items are grouped by status so you can see the content pipeline at a glance. Click items to navigate to the Roadmap view.",
      position: "right",
      spotlight: true,
    },
    {
      id: "review-requests",
      target: "[data-tour='review-requests']",
      title: "Review Requests",
      content:
        "When team members submit content for review, it appears here with full context. See who requested the review, which blocks need attention, and the due date. Approve all at once or request changes.",
      position: "left",
      spotlight: true,
    },
    {
      id: "content-review",
      target: "[data-tour='content-review']",
      title: "Content Review Queue",
      content:
        "Content blocks submitted for your review appear here. See the block type, company, and status. Approve, request changes, or click to view details in the Architecture view.",
      position: "left",
      spotlight: true,
    },
    {
      id: "page-review",
      target: "[data-tour='page-review']",
      title: "Page Review Queue",
      content:
        "Wireframe pages with sections pending review show up here. Review page designs before they go live. Each card shows the page name, section count, and company.",
      position: "left",
      spotlight: true,
    },
    {
      id: "roadmap-review",
      target: "[data-tour='roadmap-review']",
      title: "Roadmap Review",
      content:
        "Roadmap items in review status are shown here. Approve content strategy items to keep the team moving forward on the content roadmap.",
      position: "left",
      spotlight: true,
    },
    {
      id: "suggestions",
      target: "[data-tour='suggestions-inbox']",
      title: "Team Suggestions",
      content:
        "Team members can submit suggestions for content improvements. Review, approve, or respond to ideas here. Great suggestions can be converted into blocks or roadmap items.",
      position: "left",
      spotlight: true,
    },
  ],
};
