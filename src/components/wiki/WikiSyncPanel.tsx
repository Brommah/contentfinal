"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";

// The CEF AI Wiki content (fetched from Notion page)
const CEF_WIKI_CONTENT = `# CEF AI - DSC Core Wiki (B1)

## Core Marketing Hub (M1)
Central hub for all CEF marketing activities and content coordination.

## Data Onboarding Wiki (A1)
A unified Go microservice that merges event processing, rule execution, and data pipeline orchestration into a horizontally scalable core.

**Key Features:**
- Unified SDK: single API for web, mobile, bots, and third-party integrations.
- Event validation: JSON schema and cryptographic signature (Ed25519) checks.
- Decryption: EDEK-based AES payloads for secure ingestion.
- Real-time and batch ingestion: parallel dispatch to processing and storage branches.
- Filtering & routing: campaign, targeting, rule groups, and triggers.
- Centralized key management: integrates with Agent Service Registry for keys.
- Downstream hooks: DSC (Data Stream Compute), Data Wallet (immutable chain), and real-time WebSocket delivery.
- Error handling & analytics: per-event error channels and ingestion KPIs.

**Data Flow:**
1. Client POST /events with signature/encryption.
2. Validation: schema + signature + optional decryption.
3. Routing: parallel dispatch to V2 Processing Core (ExecutionService, DataPipelineService, ScriptRunner) and Data Wallet module (DDC-backed).
4. Downstream: processed events trigger agent workflows, get indexed, and exposed for real-time analytics or archival.

## ROB Wiki (A2) - Real-Time Orchestration Builder
The Real-Time Orchestration Builder (ROB) is the control plane of the CEF platform. It is where services, data flows, and AI agents are designed, connected, and deployed into live, event-driven applications.

**Core Purpose:** ROB turns raw event streams into orchestrated, multi-agent workflows that can respond, reason, and deliver results in real time.

**What It Does:**
- Data Service Management — Create and manage the top-level container for a use case, including its data sources (streams, rafts) and processing logic.
- Workflow Orchestration — Define Engagements (rules + triggers) that react to specific events and invoke one or more agents. Supports atomic hot-reloads of rules with full audit trails for safe live edits during demos or production.
- Agent Integration — Attach agents from the central Registry with version, configuration, and capability controls.
- Deployment Control — Schedule and manage live deployments with targeting, rate limits, and campaign-style activation.
- Developer Experience — Visual UI, CLI, and sandbox environments for rapid iteration; real-time monitoring of executions.

**Position in the Platform:**
1. Upstream: Receives processed events from the Data Stream Compute (A3) layer.
2. Downstream: Invokes agents in the Runtime (A11) on compute resources allocated by Resource Allocation (A10).
3. Cross-cutting: Connects to the Agent Registry (A5) for definitions and to Observability (A6) for execution logs and audits.
4. Specialized: First-class support for speech-to-text driven engagements for live conversation intelligence demos.

**One-Line Pitch:** ROB is the brain of the CEF platform — it decides what should happen next when data arrives, and makes it happen instantly, with the right agents, on the right resources, under full developer control.

## Orchestrator Wiki (A3) - DDC Compute Node
DDC Compute Node is compute instance in a distributed AI computation platform that provides secure, scalable infrastructure for running AI models and executing complex workflows in a decentralised environment.

**Core Purpose:** Enables organisations to deploy and run AI applications with enterprise-grade security, distributed tracing, and blockchain-like data integrity - all while supporting 80-90% of AI/ML models through a unified interface.

**Key Components:**

🔧 Compute Engine (Go)
- Event module: Event-driven data processing and workflow orchestration, Immutable event chain storage with DDC integration (Data Vault), Pipeline and workflow execution management
- P2P module: Other node discovery, Model metadata sharing, Model distribution and routing

⚡ Function Runtime (Node.js/NestJS)
- Secure sandboxed function execution (VM2)
- Distributed tracing with comprehensive monitoring
- Agent/Raft integration via MCP protocol

🤖 Model Runtime (Python)
- Universal AI model inference across frameworks (PyTorch, HuggingFace, TensorFlow, ONNX, vLLM)
- Intelligent GPU allocation and memory management
- 5-10x performance optimisation for LLM workloads

**Key Features:**
- 🔐 Security: Permissioned access, signature verification, encryption
- 📊 Full Observability: Distributed tracing, performance metrics, audit trails
- 🚀 High Performance: Multi-GPU allocation, intelligent caching, acceleration
- 🌐 P2P Distributed: Built for decentralized cluster computing
- 🔗 Blockchain Integration: Data activity capture tracked on-chain

**Use Cases:** AI model serving, secure workflow execution, distributed computing, enterprise AI applications, and decentralized data processing.

## Data Vault Wiki (A4)
A multi-model storage abstraction that unifies access to time-series, document, and key-value databases. It optimizes data placement, lifecycle, and retrieval without exposing developers to backend-specific complexities.

**Core capabilities:**
- Single API for heterogeneous storage engines
- Automatic tiering between hot, warm, and cold data
- Retention policies and archiving for lifecycle management

The layer ensures durability, integrity, and cost efficiency while supporting global scale and sharded deployments.

## Agent Registry Wiki (A5)
Central registry for all AI agents in the CEF platform. Manages agent definitions, versions, capabilities, and configurations.

## Testing / Infra (Observability IaaS, Deployment) (A6)
Infrastructure for testing, observability, and deployment automation across the CEF platform.

## Inference Runtime Wiki (A8)
Runtime environment for AI model inference, optimized for low-latency responses.

## Agent Runtime Wiki (A9)
Execution environment for AI agents, providing sandboxed and secure runtime capabilities.

## Resource Allocation Wiki (A10)
Dynamic resource allocation system for compute, memory, and GPU resources across the platform.

## Deployments Wiki (A11)
Deployment management and orchestration for services and agents.

## Event Runtime Wiki (A12)
Event processing runtime for real-time event handling and streaming.

## Compute Activity Capture Wiki (A13)
Tracks and records all compute activities for auditing and billing purposes.

## Stream Ingestion Service (SIS) Wiki (A14)
High-throughput stream ingestion for real-time data processing.

## DataSource/Agent Registry Wiki (A2b)
Registry for data sources and their agent integrations.

## Real-Time Indexing / Querying / Events Wiki (A2C)
Real-time data indexing and querying capabilities for event streams.

## CEF.AI infra / DevOps - Wiki (Z1)
Infrastructure and DevOps practices for the CEF.AI platform.

## Universal Security Layer (IAM Model)
Unified identity and access management across all CEF services.

## CEF.AI Integrations Wiki (B2)
Integration guides and documentation for third-party services.

## Nightingale Integration Wiki (A7)
Speech-to-text and conversation intelligence integration.

## NLP Use Case Wiki (A8)
Natural Language Processing use cases and implementations.

## CEF.AI Product Marketing (B3)
Product marketing strategies and content for CEF.AI.

## CEF.AI Core Product Content Wiki (S0)
Core product documentation and content library.

## CEF Demos (S1)
Demo applications and showcase materials.

## CEF Website + Vertical Pages (S2)
Website content and vertical-specific landing pages.

## CEF Campaigns (S3)
Marketing campaign materials and tracking.

## CEF.AI Growth / G2M (B4)
Go-to-market strategies and growth initiatives.

## CEF.AI Enterprise Sales Collateral Wiki
Enterprise sales materials and pitch decks.`;

// Parse wiki content into sections
interface WikiSection {
  id: string;
  title: string;
  content: string;
  level: number;
}

function parseWikiSections(content: string): WikiSection[] {
  const sections: WikiSection[] = [];
  const lines = content.split("\n");
  let currentSection: WikiSection | null = null;
  let contentBuffer: string[] = [];

  lines.forEach((line, index) => {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h1Match || h2Match || h3Match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentBuffer.join("\n").trim();
        sections.push(currentSection);
      }

      // Start new section
      const title = h1Match?.[1] || h2Match?.[1] || h3Match?.[1] || "";
      const level = h1Match ? 1 : h2Match ? 2 : 3;
      currentSection = {
        id: `section-${index}`,
        title,
        content: "",
        level,
      };
      contentBuffer = [];
    } else if (currentSection) {
      contentBuffer.push(line);
    }
  });

  // Save last section
  if (currentSection !== null) {
    (currentSection as WikiSection).content = contentBuffer.join("\n").trim();
    sections.push(currentSection as WikiSection);
  }

  return sections;
}

interface WikiSyncPanelProps {
  selectedBlock?: BlockData | null;
  onApplySuggestion?: (blockId: string, updates: Partial<BlockData>) => void;
}

export default function WikiSyncPanel({ selectedBlock: externalSelectedBlock, onApplySuggestion }: WikiSyncPanelProps) {
  const { nodes, updateNode } = useCanvasStore();
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    title?: string;
    subtitle?: string;
    content?: string;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [promptType, setPromptType] = useState<"improve" | "expand" | "simplify" | "custom">("improve");
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"wiki" | "generate">("wiki");
  const [internalSelectedBlockId, setInternalSelectedBlockId] = useState<string | null>(null);

  const wikiSections = useMemo(() => parseWikiSections(CEF_WIKI_CONTENT), []);

  const allBlocks = useMemo(() => 
    nodes.map((n) => n.data as BlockData), 
    [nodes]
  );

  // Use internal selection or external selection
  const selectedBlock = useMemo(() => {
    if (internalSelectedBlockId) {
      return allBlocks.find(b => b.id === internalSelectedBlockId) || null;
    }
    return externalSelectedBlock || null;
  }, [internalSelectedBlockId, externalSelectedBlock, allBlocks]);

  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const selectAllSections = useCallback(() => {
    setSelectedSections(new Set(wikiSections.map((s) => s.id)));
  }, [wikiSections]);

  const clearSections = useCallback(() => {
    setSelectedSections(new Set());
  }, []);

  const getSelectedContext = useCallback(() => {
    return wikiSections
      .filter((s) => selectedSections.has(s.id))
      .map((s) => `## ${s.title}\n${s.content}`)
      .join("\n\n");
  }, [wikiSections, selectedSections]);

  const generateImprovement = useCallback(async (block: BlockData) => {
    if (selectedSections.size === 0) {
      setError("Please select at least one wiki section for context");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuggestion(null);

    const prompts: Record<string, string> = {
      improve: "Improve this content block to be more compelling, clear, and aligned with the CEF.AI platform messaging. Maintain technical accuracy while making it more engaging.",
      expand: "Expand this content with more detail, examples, and technical depth based on the wiki context. Add relevant features, benefits, and use cases.",
      simplify: "Simplify this content to be more accessible and easier to understand. Remove jargon and make it suitable for a broader audience while keeping key technical points.",
      custom: customPrompt,
    };

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompts[promptType],
          context: getSelectedContext(),
          blockTitle: block.title,
          blockContent: block.content || block.subtitle || "",
          blockType: block.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      
      if (data.structured && data.result) {
        // Structured response with title, subtitle, content
        setSuggestion({
          title: data.result.title || "",
          subtitle: data.result.subtitle || "",
          content: data.result.content || "",
        });
      } else if (data.result) {
        // Legacy plain text response - put it all in content
        setSuggestion({
          content: typeof data.result === "string" ? data.result : "",
        });
      } else {
        throw new Error("No suggestion generated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSections, promptType, customPrompt, getSelectedContext]);

  const applySuggestion = useCallback((block: BlockData) => {
    if (!suggestion) return;

    // Build updates object with only non-empty fields
    const updates: Partial<BlockData> = {};
    if (suggestion.title) updates.title = suggestion.title;
    if (suggestion.subtitle) updates.subtitle = suggestion.subtitle;
    if (suggestion.content) updates.content = suggestion.content;

    // Update the block
    updateNode(block.id, updates);
    
    // Also call the callback if provided
    if (onApplySuggestion) {
      onApplySuggestion(block.id, updates);
    }

    setSuggestion(null);
  }, [suggestion, updateNode, onApplySuggestion]);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-lg">📚</span>
          Wiki Context & AI
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Select wiki sections for context, then generate improvements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab("wiki")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "wiki"
              ? "text-purple-300 border-b-2 border-purple-500 bg-slate-800/50"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          📖 Wiki ({selectedSections.size}/{wikiSections.length})
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "text-purple-300 border-b-2 border-purple-500 bg-slate-800/50"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          ✨ Generate
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "wiki" && (
          <div className="p-4 space-y-3">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedSections.size} sections selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllSections}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Select All
                </button>
                <button
                  onClick={clearSections}
                  className="text-xs text-slate-500 hover:text-slate-400"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Wiki Sections */}
            <div className="space-y-2">
              {wikiSections.map((section) => (
                <label
                  key={section.id}
                  className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSections.has(section.id)
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSections.has(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${
                        section.level === 1 ? "text-white" : "text-slate-300"
                      }`}>
                        {section.title}
                      </div>
                      {section.content && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {section.content.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === "generate" && (
          <div className="p-4 space-y-4">
            {/* Block Selection */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">
                Select Block to Improve
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                {allBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => setInternalSelectedBlockId(block.id)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedBlock?.id === block.id
                        ? "bg-purple-500/30 text-purple-200 ring-1 ring-purple-500"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="font-medium truncate">{block.title}</div>
                    <div className="text-xs text-slate-500">{block.type}</div>
                  </button>
                ))}
              </div>
              {selectedBlock && (
                <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-300">
                    Selected: <strong>{selectedBlock.title}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Type */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">
                Improvement Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "improve", label: "✨ Improve", desc: "Enhance clarity" },
                  { id: "expand", label: "📝 Expand", desc: "Add detail" },
                  { id: "simplify", label: "🎯 Simplify", desc: "Make accessible" },
                  { id: "custom", label: "💬 Custom", desc: "Your prompt" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPromptType(type.id as typeof promptType)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      promptType === type.id
                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-[10px] text-slate-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            {promptType === "custom" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Custom Prompt
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe how you want the content improved..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={() => selectedBlock && generateImprovement(selectedBlock)}
              disabled={!selectedBlock || isGenerating || selectedSections.size === 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate Improvement
                </>
              )}
            </button>

            {!selectedBlock && (
              <p className="text-xs text-amber-400 text-center">
                ↑ Select a block above to generate improvements
              </p>
            )}

            {selectedSections.size === 0 && selectedBlock && (
              <p className="text-xs text-amber-400 text-center">
                Go to Wiki tab and select context sections first
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Loading */}
            {isGenerating && (
              <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Generating improvement...</p>
              </div>
            )}

            {/* Suggestion Result */}
            {suggestion && !isGenerating && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-medium">
                    Generated Improvement
                  </label>
                  <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 max-h-72 overflow-y-auto space-y-3">
                    {suggestion.title && (
                      <div>
                        <span className="text-[10px] uppercase text-purple-400 font-medium">Title</span>
                        <p className="text-sm text-white font-medium mt-0.5">
                          {suggestion.title}
                        </p>
                      </div>
                    )}
                    {suggestion.subtitle && (
                      <div>
                        <span className="text-[10px] uppercase text-purple-400 font-medium">Subtitle</span>
                        <p className="text-sm text-slate-300 mt-0.5">
                          {suggestion.subtitle}
                        </p>
                      </div>
                    )}
                    {suggestion.content && (
                      <div>
                        <span className="text-[10px] uppercase text-purple-400 font-medium">Content</span>
                        <p className="text-sm text-slate-300 mt-0.5 whitespace-pre-wrap">
                          {suggestion.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBlock && (
                  <button
                    onClick={() => applySuggestion(selectedBlock)}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
                  >
                    ✓ Apply to "{selectedBlock.title}"
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSuggestion(null);
                      if (selectedBlock) {
                        generateImprovement(selectedBlock);
                      }
                    }}
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={() => {
                      const text = [
                        suggestion.title && `Title: ${suggestion.title}`,
                        suggestion.subtitle && `Subtitle: ${suggestion.subtitle}`,
                        suggestion.content && `Content: ${suggestion.content}`,
                      ].filter(Boolean).join("\n\n");
                      navigator.clipboard.writeText(text);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
                <button
                  onClick={() => setSuggestion(null)}
                  className="w-full px-3 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  ✕ Discard
                </button>
              </div>
            )}

            {/* Context Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs">
                💡 Select wiki sections in the <strong>Wiki</strong> tab first to provide context for better suggestions.
                {selectedSections.size > 0 && (
                  <span className="block mt-1 text-blue-400">
                    ✓ Using {selectedSections.size} section(s) as context
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50">
        <a
          href="https://www.notion.so/cere/CEF-AI-Wiki-Index-C1-Root-1c6d800083d68082a0b3c95bc84b0706"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          Open Wiki in Notion →
        </a>
      </div>
    </div>
  );
}

