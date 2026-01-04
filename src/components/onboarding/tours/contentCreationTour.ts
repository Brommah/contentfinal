import type { TourDefinition } from "../TourProvider";

/**
 * Content Creation Tour - Content Studio tour
 * Covers the AI-powered content generation workbench with template selection,
 * block selection, parameters configuration, and output editing
 */
export const contentCreationTour: TourDefinition = {
  id: "content-creation",
  name: "Content Studio Tour",
  description: "Generate content with AI assistance",
  icon: "✨",
  tabRestriction: "content-creation",
  steps: [
    {
      id: "studio-intro",
      target: "[data-tour='editor-main']",
      title: "Content Studio",
      content:
        "Welcome to the AI-powered Content Studio! Create announcements, blog posts, social media content, newsletters, and more - all generated from your existing content blocks.",
      position: "top",
      spotlight: true,
    },
    {
      id: "step-indicator",
      target: "[data-tour='editor-main']",
      title: "Step-by-Step Workflow",
      content:
        "The studio guides you through 4 steps: Choose a Template, Select Source Content, Configure Generation Options, and Review/Edit Output. Follow the steps at the top.",
      position: "top",
      spotlight: false,
    },
    {
      id: "template-selection",
      target: "[data-tour='editor-main']",
      title: "Step 1: Choose Template",
      content:
        "Start by selecting a content template. Categories include Social Media (Twitter, LinkedIn, Discord), Blog & Articles, Announcements, Newsletter, and Internal documents.",
      position: "top",
      spotlight: true,
    },
    {
      id: "template-types",
      target: "[data-tour='editor-main']",
      title: "Template Types",
      content:
        "Each template is optimized for its platform: Twitter posts have character limits, LinkedIn posts are professional, Discord announcements use emojis, blog posts have sections.",
      position: "top",
      spotlight: false,
    },
    {
      id: "block-selection",
      target: "[data-tour='editor-main']",
      title: "Step 2: Select Source Content",
      content:
        "Choose which content blocks to use as context. The AI will read these blocks and generate new content based on them. Filter by company or block type to find the right sources.",
      position: "top",
      spotlight: true,
    },
    {
      id: "selected-preview",
      target: "[data-tour='editor-main']",
      title: "Selected Blocks Preview",
      content:
        "The right panel shows your selected blocks. These will be compiled into context for the AI. You can select multiple blocks to create content that combines different topics.",
      position: "top",
      spotlight: false,
    },
    {
      id: "parameters",
      target: "[data-tour='editor-main']",
      title: "Step 3: Configure Generation",
      content:
        "Customize how the AI generates content: set the tone (professional, casual, excited), length (short, medium, long), and toggle options like emojis, hashtags, and CTAs.",
      position: "top",
      spotlight: true,
    },
    {
      id: "custom-instructions",
      target: "[data-tour='editor-main']",
      title: "Custom Instructions",
      content:
        "Add any specific instructions for the AI. For example: 'Focus on enterprise use cases' or 'Mention the upcoming product launch'. These guide the generation.",
      position: "top",
      spotlight: false,
    },
    {
      id: "output",
      target: "[data-tour='editor-main']",
      title: "Step 4: Review Output",
      content:
        "Review the AI-generated content. You can edit it directly, regenerate with different settings, copy to clipboard, or save it. If you don't like the result, just regenerate!",
      position: "top",
      spotlight: true,
    },
    {
      id: "create-as-block",
      target: "[data-tour='editor-main']",
      title: "Create as Block",
      content:
        "Happy with the output? Click 'Create as Block' to save it as a new content block in your Architecture. It will automatically be connected to the source blocks you selected.",
      position: "top",
      spotlight: false,
    },
    {
      id: "link-to-roadmap",
      target: "[data-tour='editor-main']",
      title: "Link to Roadmap",
      content:
        "You can also link the generated content to a roadmap item. This helps track which content deliverables are completed and ties everything together.",
      position: "top",
      spotlight: false,
    },
  ],
};


