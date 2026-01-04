import type { TourDefinition } from "../TourProvider";

/**
 * Analytics Tour - Health Dashboard tour
 * Covers metrics, health insights, coverage gaps, governance, and recommendations
 */
export const analyticsTour: TourDefinition = {
  id: "analytics",
  name: "Analytics Tour",
  description: "Understand your content health metrics",
  icon: "📊",
  tabRestriction: "analytics",
  steps: [
    {
      id: "analytics-intro",
      target: "[data-tour='analytics-header']",
      title: "Content Health Dashboard",
      content:
        "Monitor the health and quality of your content ecosystem. Track metrics across blocks, connections, quality scores, and identify issues that need attention.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "view-toggle",
      target: "[data-tour='analytics-header']",
      title: "Overview & Governance Views",
      content:
        "Switch between Overview (metrics and charts) and Governance (audit trails and compliance) views. Both help you maintain a healthy content system.",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "top-stats",
      target: "[data-tour='analytics-stats']",
      title: "Key Metrics",
      content:
        "Quick overview of your content health: total blocks, connections between blocks, average readability score, overdue reviews, and orphaned (unconnected) content.",
      position: "bottom",
      spotlight: true,
    },
    {
      id: "status-distribution",
      target: "[data-tour='status-distribution']",
      title: "Status Distribution",
      content:
        "See how your content is distributed across statuses. A healthy mix means content is flowing through your workflow - from Draft to Pending Review to Approved to Live.",
      position: "right",
      spotlight: true,
    },
    {
      id: "block-types",
      target: "[data-tour='block-types']",
      title: "Block Type Breakdown",
      content:
        "View the distribution of block types. Ensure you have a balanced content strategy with value props, pain points, solutions, and features for both companies.",
      position: "right",
      spotlight: true,
    },
    {
      id: "content-quality",
      target: "[data-tour='content-quality']",
      title: "Content Quality Scores",
      content:
        "Content is analyzed and scored: Excellent (80+), Good (60-79), Needs Work (40-59), or Poor (<40). The score is based on readability, word count, and sentence structure.",
      position: "right",
      spotlight: true,
    },
    {
      id: "company-breakdown",
      target: "[data-tour='company-breakdown']",
      title: "Company Distribution",
      content:
        "See how content is split between CERE, CEF, and Shared. Shared content can be reused by both companies, maximizing your content investment.",
      position: "left",
      spotlight: true,
    },
    {
      id: "overdue-reviews",
      target: "[data-tour='overdue-reviews']",
      title: "Overdue Reviews",
      content:
        "Content waiting too long for review appears here with a red alert. Click any item to navigate to it in the Architecture view and address the bottleneck.",
      position: "left",
      spotlight: true,
    },
    {
      id: "coverage-gaps",
      target: "[data-tour='coverage-gaps']",
      title: "Coverage Gaps",
      content:
        "Missing essential content types for each company are flagged here. For example, if CERE is missing Pain Points, you'll see it here. Fill these gaps for complete coverage.",
      position: "left",
      spotlight: true,
    },
    {
      id: "orphaned-blocks",
      target: "[data-tour='orphaned-blocks']",
      title: "Orphaned Blocks",
      content:
        "Blocks with no connections, wireframe links, or roadmap links are likely unused. Click to view them and either connect them to other content or archive them.",
      position: "left",
      spotlight: true,
    },
    {
      id: "velocity-metrics",
      target: "[data-tour='analytics-stats']",
      title: "Velocity & SLA Tracking",
      content:
        "Below the main charts, you'll find Velocity Metrics (how fast content moves through the pipeline) and SLA Dashboard (review time tracking and targets).",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "recommendations",
      target: "[data-tour='analytics-stats']",
      title: "AI Recommendations",
      content:
        "The Recommendations panel at the bottom uses AI to analyze your content and suggest improvements. It identifies quick wins, content gaps, and optimization opportunities.",
      position: "bottom",
      spotlight: false,
    },
    {
      id: "governance",
      target: "[data-tour='analytics-header']",
      title: "Governance Dashboard",
      content:
        "Switch to the Governance view to see audit trails, approval history, and compliance checks. This helps ensure your content meets quality standards.",
      position: "bottom",
      spotlight: false,
    },
  ],
};
