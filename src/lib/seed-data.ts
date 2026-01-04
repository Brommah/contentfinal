/**
 * Seed Data for CERE/CEF Content Visualizer
 * 
 * LAYOUT SYSTEM:
 * - Grid-based positioning with 400px column width, 320px row height
 * - CERE (Protocol) on LEFT: columns 0-4 (x: 50-1650)
 * - CEF (Enterprise) on RIGHT: columns 0-3 (x: 2400-3600)
 * - ~750px gap between sections for cross-company connections
 * 
 * HIERARCHY (top to bottom):
 * Row 0: PAGE ROOTS (Website Pages) - TOP LEVEL, what visitors see
 * Row 1: Company Root - The company/product identity
 * Row 2: Verticals (Use Cases / Industries) - Target segments
 * Row 3: Core Value Propositions
 * Row 4: Tech Components (CERE) / Features (CEF)
 * Row 5: Solutions (what we provide)
 * Row 6: Pain Points (what we solve)
 */

import type { BlockType, Company, BlockStatus, RelationshipType } from "./types";

interface SeedBlock {
  id: string;
  type: BlockType;
  company: Company;
  status: BlockStatus;
  title: string;
  subtitle?: string;
  content?: string;
  tags: string[];
  positionX: number;
  positionY: number;
}

interface SeedConnection {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  relationshipType: RelationshipType;
  label?: string;
  animated?: boolean;
}

// Grid configuration - increased spacing for clearer connection lines
const GRID = {
  colWidth: 400,      // Increased for more horizontal space
  rowHeight: 320,     // Increased for more vertical space between rows
  cere: { baseX: 50 },
  cef: { baseX: 2400 }, // More gap between CERE and CEF sections
};

// Helper to calculate X position
const cereX = (col: number) => GRID.cere.baseX + col * GRID.colWidth;
const cefX = (col: number) => GRID.cef.baseX + col * GRID.colWidth;
const rowY = (row: number) => 50 + row * GRID.rowHeight;

// ============================================
// CERE Network Blocks (Protocol Layer)
// ============================================

export const cereBlocks: SeedBlock[] = [
  // === ROW 1: Company Root (centered on col 2) ===
  {
    id: "cere-root",
    type: "COMPANY",
    company: "CERE",
    status: "LIVE",
    title: "CERE Network",
    subtitle: "Decentralized Data Infrastructure Protocol",
    content: "Cere is a verifiable data infrastructure that serves as the substrate where privacy, compute, and economics converge to make personal and enterprise AI autonomous and sovereign.",
    tags: ["protocol", "web3", "infrastructure"],
    positionX: cereX(2),
    positionY: rowY(1),
  },
  
  // === ROW 2: Verticals / Use Cases (cols 1, 2, 3) ===
  {
    id: "cere-vertical-enterprise",
    type: "VERTICAL",
    company: "CERE",
    status: "LIVE",
    title: "Enterprise Data",
    subtitle: "Enterprise data infrastructure",
    content: "Secure, verifiable data infrastructure for enterprise applications with compliance and audit trails.",
    tags: ["vertical", "enterprise"],
    positionX: cereX(1),
    positionY: rowY(2),
  },
  {
    id: "cere-vertical-defi",
    type: "VERTICAL",
    company: "CERE",
    status: "LIVE",
    title: "DeFi & Web3",
    subtitle: "Decentralized finance infrastructure",
    content: "Trustless data layer for DeFi protocols, DAOs, and Web3 applications requiring verifiable data.",
    tags: ["vertical", "defi", "web3"],
    positionX: cereX(2),
    positionY: rowY(2),
  },
  {
    id: "cere-vertical-ai",
    type: "VERTICAL",
    company: "CERE",
    status: "LIVE",
    title: "AI & Machine Learning",
    subtitle: "Sovereign AI data infrastructure",
    content: "Privacy-preserving data infrastructure for AI training and inference with verifiable provenance.",
    tags: ["vertical", "ai", "ml"],
    positionX: cereX(3),
    positionY: rowY(2),
  },
  
  // === ROW 3: Core Value Propositions (cols 1 and 3) ===
  {
    id: "cere-vp-cerebellum",
    type: "CORE_VALUE_PROP",
    company: "CERE",
    status: "PENDING_REVIEW",
    title: "The Cerebellum for AI",
    subtitle: "7-word descriptor",
    content: "The Cere Stack acts as the 'Cerebellum' that keeps data, compute, and trust synchronized.",
    tags: ["positioning", "tagline"],
    positionX: cereX(1),
    positionY: rowY(3),
  },
  {
    id: "cere-vp-verifiable",
    type: "CORE_VALUE_PROP",
    company: "CERE",
    status: "LIVE",
    title: "Verifiable Data Infrastructure",
    subtitle: "Core positioning",
    content: "It transforms raw datastream into actionable reflexes where every event, computation, and token flow is deterministic and auditable.",
    tags: ["positioning", "value-prop"],
    positionX: cereX(3),
    positionY: rowY(3),
  },
  
  // === ROW 4: Tech Components (cols 0-4) ===
  {
    id: "cere-tech-opengov",
    type: "TECH_COMPONENT",
    company: "CERE",
    status: "LIVE",
    title: "Protocol & OpenGov",
    subtitle: "On-chain governance",
    content: "The source of truth/decentralization where smart contracts govern the network. Pure on-chain democracy where code executes the will of token holders.",
    tags: ["governance", "blockchain"],
    positionX: cereX(0),
    positionY: rowY(4),
  },
  {
    id: "cere-tech-ddc",
    type: "TECH_COMPONENT",
    company: "CERE",
    status: "LIVE",
    title: "DDC (Data Clusters)",
    subtitle: "Content-addressable storage",
    content: "Decentralized Data Clusters - content-addressable storage that scales horizontally. Data is mathematically weaved into a resilient fabric. Trust through mathematics.",
    tags: ["storage", "decentralized"],
    positionX: cereX(1),
    positionY: rowY(4),
  },
  {
    id: "cere-tech-dac",
    type: "TECH_COMPONENT",
    company: "CERE",
    status: "LIVE",
    title: "DAC (Data Activity)",
    subtitle: "Automated verification",
    content: "Data Activity Capture - the protocol autonomously verifies work and pays for it. Every computation has a receipt, every byte transferred generates a cryptographic proof.",
    tags: ["economics", "verification"],
    positionX: cereX(2),
    positionY: rowY(4),
  },
  {
    id: "cere-tech-zk",
    type: "TECH_COMPONENT",
    company: "CERE",
    status: "LIVE",
    title: "Zero-Knowledge (EDEK)",
    subtitle: "Privacy infrastructure",
    content: "Data node operators can't see your data. The EDEK system uses client-side key generation, providing mathematical certainty that your data stays sovereign.",
    tags: ["privacy", "encryption"],
    positionX: cereX(3),
    positionY: rowY(4),
  },
  {
    id: "cere-tech-dsc",
    type: "TECH_COMPONENT",
    company: "CERE",
    status: "LIVE",
    title: "DSC (Data Stream)",
    subtitle: "Real-time processing",
    content: "Data Stream Compute - real-time processing where raw events become insights. Operates on data in motion (Kafka-based) with cryptographic guarantees.",
    tags: ["streaming", "real-time"],
    positionX: cereX(4),
    positionY: rowY(4),
  },
  
  // === ROW 5: Solutions (cols 0.5-3.5) ===
  {
    id: "cere-sol-trust-layer",
    type: "SOLUTION",
    company: "CERE",
    status: "LIVE",
    title: "Verifiable Trust Layer",
    content: "Provides tamper-proof audit trails for every action. A mathematical guarantee that what happened is what was recorded.",
    tags: ["solution", "trust"],
    positionX: cereX(0.5),
    positionY: rowY(5),
  },
  {
    id: "cere-sol-edge",
    type: "SOLUTION",
    company: "CERE",
    status: "LIVE",
    title: "Edge-First Architecture",
    content: "Nodes self-organize into clusters based on geography and capability, ensuring data lives close to where it's needed.",
    tags: ["solution", "edge"],
    positionX: cereX(1.5),
    positionY: rowY(5),
  },
  {
    id: "cere-sol-economics",
    type: "SOLUTION",
    company: "CERE",
    status: "LIVE",
    title: "Automated Economics",
    content: "Self-funding, self-correcting system. Rewards flow instantly for honest work, slashing penalizes misbehavior automatically.",
    tags: ["solution", "economics"],
    positionX: cereX(2.5),
    positionY: rowY(5),
  },
  {
    id: "cere-sol-sovereign",
    type: "SOLUTION",
    company: "CERE",
    status: "LIVE",
    title: "Sovereign Data Fabric",
    content: "Client-side encryption keys and content-addressable storage ensure you are the only one who holds the keys to your intelligence.",
    tags: ["solution", "sovereignty"],
    positionX: cereX(3.5),
    positionY: rowY(5),
  },
  
  // === ROW 6: Pain Points - Aligned directly below their corresponding Solutions ===
  {
    id: "cere-pain-trust",
    type: "PAIN_POINT",
    company: "CERE",
    status: "LIVE",
    title: '"Trust Us" Default',
    content: "Cloud providers hold your keys and models run on opaque servers. No mathematical proof, just policy promises.",
    tags: ["pain-point", "trust"],
    positionX: cereX(0.5),  // Below sol-trust-layer
    positionY: rowY(6),
  },
  {
    id: "cere-pain-separation",
    type: "PAIN_POINT",
    company: "CERE",
    status: "LIVE",
    title: "Data & Compute Split",
    content: "Your data is in one place. Your compute is in another. This fragmentation results in added costs and latency.",
    tags: ["pain-point", "architecture"],
    positionX: cereX(1.5),  // Below sol-edge
    positionY: rowY(6),
  },
  {
    id: "cere-pain-centralized",
    type: "PAIN_POINT",
    company: "CERE",
    status: "LIVE",
    title: "Centralized Vulnerability",
    content: "Traditional databases sit behind corporate firewalls: vulnerable, opaque, and controlled by one entity.",
    tags: ["pain-point", "security"],
    positionX: cereX(2.5),  // Below sol-economics
    positionY: rowY(6),
  },
  {
    id: "cere-pain-sovereignty",
    type: "PAIN_POINT",
    company: "CERE",
    status: "LIVE",
    title: "Lack of Sovereignty",
    content: "In traditional architectures, you do not truly own your data or the intelligence derived from it.",
    tags: ["pain-point", "ownership"],
    positionX: cereX(3.5),  // Below sol-sovereign
    positionY: rowY(6),
  },
];

// ============================================
// CEF Blocks (Enterprise Layer)
// ============================================

export const cefBlocks: SeedBlock[] = [
  // === ROW 1: Company Root (centered on col 1.5) ===
  {
    id: "cef-root",
    type: "COMPANY",
    company: "CEF",
    status: "LIVE",
    title: "CEF.AI",
    subtitle: "Enterprise AI Inference Platform",
    content: "A new Data Compute Platform built from the ground up for multi-agents. Secure, owned and customized models that evolve with your business.",
    tags: ["enterprise", "ai", "platform"],
    positionX: cefX(1.5),
    positionY: rowY(1),
  },
  
  // === ROW 2: Verticals / Use Cases (cols 0.5, 1.5, 2.5) ===
  {
    id: "cef-vertical-gaming",
    type: "VERTICAL",
    company: "CEF",
    status: "LIVE",
    title: "Gaming",
    subtitle: "NLP for Gaming",
    content: "AI-powered gaming experiences with personalized agents and real-time interaction.",
    tags: ["vertical", "gaming"],
    positionX: cefX(0.5),
    positionY: rowY(2),
  },
  {
    id: "cef-vertical-robotics",
    type: "VERTICAL",
    company: "CEF",
    status: "LIVE",
    title: "Robotics / Computer Vision",
    subtitle: "Real-time anomaly detection",
    content: "The agentic-first platform for real-time anomaly detection & automated response across cameras, drones, and robotic fleets.",
    tags: ["vertical", "robotics", "cv"],
    positionX: cefX(1.5),
    positionY: rowY(2),
  },
  {
    id: "cef-vertical-developers",
    type: "VERTICAL",
    company: "CEF",
    status: "LIVE",
    title: "Developers",
    subtitle: "Developer platform",
    content: "Self-service developer tools with 'Hello World' simplicity. Drop-in, fast integration with enterprise response workflows.",
    tags: ["vertical", "developers"],
    positionX: cefX(2.5),
    positionY: rowY(2),
  },
  
  // === ROW 3: Core Value Propositions (cols 0.5 and 2.5) ===
  {
    id: "cef-vp-inference",
    type: "CORE_VALUE_PROP",
    company: "CEF",
    status: "LIVE",
    title: "Inference Platform",
    subtitle: "Core product definition",
    content: "CEF = 'Inference Platform' that solves data security, lineage, and long-term memory context, designed for real-time and full agent lifecycle.",
    tags: ["positioning", "core"],
    positionX: cefX(0.5),
    positionY: rowY(3),
  },
  {
    id: "cef-vp-multi-agent",
    type: "CORE_VALUE_PROP",
    company: "CEF",
    status: "LIVE",
    title: "Multi-Agent First",
    subtitle: "Platform architecture",
    content: "Dynamically deployed multi-agents work autonomously yet collectively toward site goals — processing live streams in parallel with real-time feedback loops.",
    tags: ["positioning", "agents"],
    positionX: cefX(2.5),
    positionY: rowY(3),
  },
  
  // === ROW 4: Core Features (cols 0-3) ===
  {
    id: "cef-feat-control-plane",
    type: "FEATURE",
    company: "CEF",
    status: "LIVE",
    title: "Unified Control Plane",
    subtitle: "Agent Deployment & Monitoring",
    content: "Orchestrate multi-agent workflows, define policies, and monitor health/efficacy. One view for workflows/streams/agents/health.",
    tags: ["feature", "orchestration"],
    positionX: cefX(0),
    positionY: rowY(4),
  },
  {
    id: "cef-feat-context-memory",
    type: "FEATURE",
    company: "CEF",
    status: "LIVE",
    title: "Context Memory",
    subtitle: "Secure Data Vaults",
    content: "Everyone's data is individually segmented, encrypted, policy-enforced access, used for verifiable compute. Semantically organized for drop-in personalized agents.",
    tags: ["feature", "memory", "security"],
    positionX: cefX(1),
    positionY: rowY(4),
  },
  {
    id: "cef-feat-lineage",
    type: "FEATURE",
    company: "CEF",
    status: "LIVE",
    title: "Data Lineage",
    subtitle: "End-to-end traceability",
    content: "See what happened. End-to-end traceability for data → inference → action, with replayable runs. Safely test new logic or model versions on real data with instant rollback.",
    tags: ["feature", "audit", "lineage"],
    positionX: cefX(2),
    positionY: rowY(4),
  },
  {
    id: "cef-feat-sovereignty",
    type: "FEATURE",
    company: "CEF",
    status: "LIVE",
    title: "Sovereignty / Edge-Ready",
    subtitle: "On-prem, hosted, or hybrid",
    content: "Deploy sovereign compute in on-prem, hosted, or hybrid environments. Compute runs only on permitted, segmented local data; full encryption.",
    tags: ["feature", "edge", "sovereignty"],
    positionX: cefX(3),
    positionY: rowY(4),
  },
  
  // === ROW 5: Solutions (cols 0.5, 1.5, 2.5) ===
  {
    id: "cef-sol-single-source",
    type: "SOLUTION",
    company: "CEF",
    status: "LIVE",
    title: "Single Source of Truth",
    content: "Unified Control Plane solves fragmentation & opacity. Live status, health, and incident history across agents/streams.",
    tags: ["solution", "control-plane"],
    positionX: cefX(0.5),
    positionY: rowY(5),
  },
  {
    id: "cef-sol-transparency",
    type: "SOLUTION",
    company: "CEF",
    status: "LIVE",
    title: "Transparency by Default",
    content: "The Audit & Lineage Engine logs every action; replay proves how/why outcomes occurred. Decision lineage & replay for every frame.",
    tags: ["solution", "transparency"],
    positionX: cefX(1.5),
    positionY: rowY(5),
  },
  {
    id: "cef-sol-sovereign-design",
    type: "SOLUTION",
    company: "CEF",
    status: "LIVE",
    title: "User Sovereign by Design",
    content: "Data stays segmented and encrypted under your keys; models run in your environment. No data egress, no black box, no lock-in.",
    tags: ["solution", "sovereignty"],
    positionX: cefX(2.5),
    positionY: rowY(5),
  },
  
  // === ROW 6: Pain Points - Aligned near their corresponding Solutions ===
  {
    id: "cef-pain-fragmented",
    type: "PAIN_POINT",
    company: "CEF",
    status: "LIVE",
    title: "Fragmented Systems",
    content: "No single source of truth for agents, data, and policies. Siloed stacks with fragile handoffs.",
    tags: ["pain-point", "integration"],
    positionX: cefX(0),    // Near sol-single-source
    positionY: rowY(6),
  },
  {
    id: "cef-pain-feedback",
    type: "PAIN_POINT",
    company: "CEF",
    status: "LIVE",
    title: "Slow Feedback Loops",
    content: "Slow feedback loops due to ETL/warehouse/BI cycles. Batch, late, and unaccountable processing.",
    tags: ["pain-point", "latency"],
    positionX: cefX(1),    // Near sol-single-source
    positionY: rowY(6),
  },
  {
    id: "cef-pain-blackbox",
    type: "PAIN_POINT",
    company: "CEF",
    status: "LIVE",
    title: "Black-Box AI",
    content: "No explainability or audit trail. No evidence for how decisions were made.",
    tags: ["pain-point", "explainability"],
    positionX: cefX(2),    // Near sol-transparency
    positionY: rowY(6),
  },
  {
    id: "cef-pain-compliance",
    type: "PAIN_POINT",
    company: "CEF",
    status: "LIVE",
    title: "Compliance Risk",
    content: "Data leaves controlled environments. Weak compliance & safety proof with poor audit trail.",
    tags: ["pain-point", "compliance"],
    positionX: cefX(3),    // Near sol-sovereign-design
    positionY: rowY(6),
  },
];

// ============================================
// PAGE ROOT BLOCKS (Website Pages - TOP of Architecture)
// ============================================

export const pageRootBlocks: SeedBlock[] = [
  // === CERE WEBSITE PAGES (Row 0 - TOP) ===
  // HOME is the main entry point, positioned centrally above Company
  {
    id: "page-root-cere-home",
    type: "PAGE_ROOT",
    company: "CERE",
    status: "LIVE",
    title: "Home",
    subtitle: "CERE Network Homepage",
    content: "The main landing page for CERE Network showcasing core value propositions, use cases, and calls-to-action.",
    tags: ["page-root", "home", "cere-home"],
    positionX: cereX(2),
    positionY: rowY(0),
  },
  {
    id: "page-root-cere-quickstart",
    type: "PAGE_ROOT",
    company: "CERE",
    status: "DRAFT",
    title: "Quick Start",
    subtitle: "Get started with CERE in minutes",
    content: "This page helps developers and users quickly integrate with the CERE Network. Step-by-step guides and interactive tutorials.",
    tags: ["page-root", "quickstart", "cere-quickstart"],
    positionX: cereX(0),
    positionY: rowY(0),
  },
  {
    id: "page-root-cere-developers",
    type: "PAGE_ROOT",
    company: "CERE",
    status: "DRAFT",
    title: "Developers",
    subtitle: "Developer documentation and resources",
    content: "Comprehensive developer documentation, API references, SDKs, and code examples for building on CERE Network.",
    tags: ["page-root", "developers", "cere-developers"],
    positionX: cereX(1),
    positionY: rowY(0),
  },
  {
    id: "page-root-cere-protocol",
    type: "PAGE_ROOT",
    company: "CERE",
    status: "DRAFT",
    title: "Protocol",
    subtitle: "How the CERE Protocol works",
    content: "Deep dive into the CERE Protocol architecture, consensus mechanisms, data verification, and economic model.",
    tags: ["page-root", "protocol", "cere-protocol"],
    positionX: cereX(3),
    positionY: rowY(0),
  },
  {
    id: "page-root-cere-usecases",
    type: "PAGE_ROOT",
    company: "CERE",
    status: "DRAFT",
    title: "Use Cases",
    subtitle: "Industries & Applications",
    content: "Explore how CERE powers enterprise data, DeFi, and AI applications with verifiable data infrastructure.",
    tags: ["page-root", "use-cases", "cere-usecases"],
    positionX: cereX(4),
    positionY: rowY(0),
  },
  
  // === CEF WEBSITE PAGES (Row 0 - TOP) ===
  // HOME is the main entry point, positioned centrally above Company
  {
    id: "page-root-cef-home",
    type: "PAGE_ROOT",
    company: "CEF",
    status: "LIVE",
    title: "Home",
    subtitle: "CEF.AI Homepage",
    content: "The main landing page for CEF.AI showcasing the enterprise AI inference platform, key features, and use cases.",
    tags: ["page-root", "home", "cef-home"],
    positionX: cefX(1.5),
    positionY: rowY(0),
  },
  {
    id: "page-root-cef-products",
    type: "PAGE_ROOT",
    company: "CEF",
    status: "DRAFT",
    title: "Products",
    subtitle: "CEF.AI Product Suite",
    content: "Explore our AI inference platform products: Control Plane, Context Memory, Data Lineage, and Edge Deployment solutions.",
    tags: ["page-root", "products", "cef-products"],
    positionX: cefX(0),
    positionY: rowY(0),
  },
  {
    id: "page-root-cef-usecases",
    type: "PAGE_ROOT",
    company: "CEF",
    status: "DRAFT",
    title: "Use Cases",
    subtitle: "Industry Solutions",
    content: "Discover how CEF.AI powers gaming, robotics, computer vision, and enterprise applications with real-time AI inference.",
    tags: ["page-root", "use-cases", "cef-usecases"],
    positionX: cefX(3),
    positionY: rowY(0),
  },
  {
    id: "page-root-cef-pricing",
    type: "PAGE_ROOT",
    company: "CEF",
    status: "DRAFT",
    title: "Pricing",
    subtitle: "Plans & Enterprise",
    content: "Flexible pricing models for startups to enterprises. Self-service plans, custom SLAs, on-premise deployment options.",
    tags: ["page-root", "pricing", "cef-pricing"],
    positionX: cefX(4),
    positionY: rowY(0),
  },
];

// ============================================
// Connections - Internal + Cross-Company
// ============================================

export const seedConnections: SeedConnection[] = [
  // ========================================
  // CERE INTERNAL CONNECTIONS
  // ========================================
  
  // Root → Verticals (Use Cases at top)
  { id: "conn-cere-v1", fromBlockId: "cere-root", toBlockId: "cere-vertical-enterprise", relationshipType: "FLOWS_INTO", animated: true },
  { id: "conn-cere-v2", fromBlockId: "cere-root", toBlockId: "cere-vertical-defi", relationshipType: "FLOWS_INTO", animated: true },
  { id: "conn-cere-v3", fromBlockId: "cere-root", toBlockId: "cere-vertical-ai", relationshipType: "FLOWS_INTO", animated: true },
  
  // Verticals → Value Props
  { id: "conn-cere-1", fromBlockId: "cere-vertical-enterprise", toBlockId: "cere-vp-cerebellum", relationshipType: "ENABLES" },
  { id: "conn-cere-2", fromBlockId: "cere-vertical-ai", toBlockId: "cere-vp-verifiable", relationshipType: "ENABLES" },
  { id: "conn-cere-2b", fromBlockId: "cere-vertical-defi", toBlockId: "cere-vp-verifiable", relationshipType: "ENABLES" },
  
  // Value Props → Tech Components
  { id: "conn-cere-3", fromBlockId: "cere-vp-cerebellum", toBlockId: "cere-tech-opengov", relationshipType: "ENABLES" },
  { id: "conn-cere-4", fromBlockId: "cere-vp-cerebellum", toBlockId: "cere-tech-ddc", relationshipType: "ENABLES" },
  { id: "conn-cere-5", fromBlockId: "cere-vp-verifiable", toBlockId: "cere-tech-dac", relationshipType: "ENABLES" },
  { id: "conn-cere-6", fromBlockId: "cere-vp-verifiable", toBlockId: "cere-tech-zk", relationshipType: "ENABLES" },
  { id: "conn-cere-7", fromBlockId: "cere-vp-verifiable", toBlockId: "cere-tech-dsc", relationshipType: "ENABLES" },
  
  // Tech → Solutions (ENABLES)
  { id: "conn-cere-8", fromBlockId: "cere-tech-dac", toBlockId: "cere-sol-trust-layer", relationshipType: "ENABLES" },
  { id: "conn-cere-9", fromBlockId: "cere-tech-ddc", toBlockId: "cere-sol-edge", relationshipType: "ENABLES" },
  { id: "conn-cere-10", fromBlockId: "cere-tech-dac", toBlockId: "cere-sol-economics", relationshipType: "ENABLES" },
  { id: "conn-cere-11", fromBlockId: "cere-tech-zk", toBlockId: "cere-sol-sovereign", relationshipType: "ENABLES" },
  
  // Solutions → Pain Points (SOLVES relationships)
  { id: "conn-cere-12", fromBlockId: "cere-sol-trust-layer", toBlockId: "cere-pain-trust", relationshipType: "SOLVES" },
  { id: "conn-cere-13", fromBlockId: "cere-sol-trust-layer", toBlockId: "cere-pain-centralized", relationshipType: "SOLVES" },
  { id: "conn-cere-14", fromBlockId: "cere-sol-edge", toBlockId: "cere-pain-separation", relationshipType: "SOLVES" },
  { id: "conn-cere-15", fromBlockId: "cere-sol-sovereign", toBlockId: "cere-pain-sovereignty", relationshipType: "SOLVES" },
  { id: "conn-cere-16", fromBlockId: "cere-sol-economics", toBlockId: "cere-pain-centralized", relationshipType: "SOLVES" },
  
  // ========================================
  // CEF INTERNAL CONNECTIONS
  // ========================================
  
  // Root → Verticals (Use Cases at top)
  { id: "conn-cef-v1", fromBlockId: "cef-root", toBlockId: "cef-vertical-gaming", relationshipType: "FLOWS_INTO", animated: true },
  { id: "conn-cef-v2", fromBlockId: "cef-root", toBlockId: "cef-vertical-robotics", relationshipType: "FLOWS_INTO", animated: true },
  { id: "conn-cef-v3", fromBlockId: "cef-root", toBlockId: "cef-vertical-developers", relationshipType: "FLOWS_INTO", animated: true },
  
  // Verticals → Value Props
  { id: "conn-cef-1", fromBlockId: "cef-vertical-gaming", toBlockId: "cef-vp-inference", relationshipType: "ENABLES" },
  { id: "conn-cef-2", fromBlockId: "cef-vertical-robotics", toBlockId: "cef-vp-multi-agent", relationshipType: "ENABLES" },
  { id: "conn-cef-2b", fromBlockId: "cef-vertical-developers", toBlockId: "cef-vp-inference", relationshipType: "ENABLES" },
  
  // Value Props → Features
  { id: "conn-cef-3", fromBlockId: "cef-vp-inference", toBlockId: "cef-feat-control-plane", relationshipType: "ENABLES" },
  { id: "conn-cef-4", fromBlockId: "cef-vp-inference", toBlockId: "cef-feat-context-memory", relationshipType: "ENABLES" },
  { id: "conn-cef-5", fromBlockId: "cef-vp-multi-agent", toBlockId: "cef-feat-lineage", relationshipType: "ENABLES" },
  { id: "conn-cef-6", fromBlockId: "cef-vp-multi-agent", toBlockId: "cef-feat-sovereignty", relationshipType: "ENABLES" },
  
  // Features → Solutions (ENABLES)
  { id: "conn-cef-7", fromBlockId: "cef-feat-control-plane", toBlockId: "cef-sol-single-source", relationshipType: "ENABLES" },
  { id: "conn-cef-8", fromBlockId: "cef-feat-lineage", toBlockId: "cef-sol-transparency", relationshipType: "ENABLES" },
  { id: "conn-cef-9", fromBlockId: "cef-feat-sovereignty", toBlockId: "cef-sol-sovereign-design", relationshipType: "ENABLES" },
  
  // Solutions → Pain Points (SOLVES)
  { id: "conn-cef-10", fromBlockId: "cef-sol-single-source", toBlockId: "cef-pain-fragmented", relationshipType: "SOLVES" },
  { id: "conn-cef-11", fromBlockId: "cef-sol-single-source", toBlockId: "cef-pain-feedback", relationshipType: "SOLVES" },
  { id: "conn-cef-12", fromBlockId: "cef-sol-transparency", toBlockId: "cef-pain-blackbox", relationshipType: "SOLVES" },
  { id: "conn-cef-13", fromBlockId: "cef-sol-sovereign-design", toBlockId: "cef-pain-compliance", relationshipType: "SOLVES" },
  
  // ========================================
  // CROSS-COMPANY CONNECTIONS (CERE → CEF)
  // These show how CERE infrastructure enables CEF
  // ========================================
  
  // Main infrastructure bridge (company to company)
  { id: "conn-cross-1", fromBlockId: "cere-root", toBlockId: "cef-root", relationshipType: "ENABLES", label: "Infrastructure Layer", animated: true },
  
  // Tech → Features (specific infrastructure dependencies)
  { id: "conn-cross-2", fromBlockId: "cere-tech-ddc", toBlockId: "cef-feat-context-memory", relationshipType: "DEPENDS_ON", label: "Storage" },
  { id: "conn-cross-3", fromBlockId: "cere-tech-dac", toBlockId: "cef-feat-lineage", relationshipType: "DEPENDS_ON", label: "Verification" },
  { id: "conn-cross-4", fromBlockId: "cere-tech-zk", toBlockId: "cef-feat-sovereignty", relationshipType: "DEPENDS_ON", label: "Privacy" },
  { id: "conn-cross-5", fromBlockId: "cere-tech-dsc", toBlockId: "cef-feat-control-plane", relationshipType: "DEPENDS_ON", label: "Streaming" },
  
  // ========================================
  // PAGE ROOT CONNECTIONS
  // Company roots → Page roots
  // ========================================
  
  // === CERE Home connects to Company (main entry point) ===
  { id: "conn-cere-home", fromBlockId: "page-root-cere-home", toBlockId: "cere-root", relationshipType: "FLOWS_INTO", animated: true },
  
  // CERE Page Roots connect to Home (navigation structure)
  { id: "conn-page-1", fromBlockId: "page-root-cere-home", toBlockId: "page-root-cere-quickstart", relationshipType: "REFERENCES", animated: false },
  { id: "conn-page-2", fromBlockId: "page-root-cere-home", toBlockId: "page-root-cere-developers", relationshipType: "REFERENCES", animated: false },
  { id: "conn-page-3", fromBlockId: "page-root-cere-home", toBlockId: "page-root-cere-protocol", relationshipType: "REFERENCES", animated: false },
  { id: "conn-page-3b", fromBlockId: "page-root-cere-home", toBlockId: "page-root-cere-usecases", relationshipType: "REFERENCES", animated: false },
  
  // CERE Verticals connect to Use Cases page
  { id: "conn-cere-vert-uc-1", fromBlockId: "page-root-cere-usecases", toBlockId: "cere-vertical-enterprise", relationshipType: "PART_OF", animated: false },
  { id: "conn-cere-vert-uc-2", fromBlockId: "page-root-cere-usecases", toBlockId: "cere-vertical-defi", relationshipType: "PART_OF", animated: false },
  { id: "conn-cere-vert-uc-3", fromBlockId: "page-root-cere-usecases", toBlockId: "cere-vertical-ai", relationshipType: "PART_OF", animated: false },
  
  // === CEF Home connects to Company (main entry point) ===
  { id: "conn-cef-home", fromBlockId: "page-root-cef-home", toBlockId: "cef-root", relationshipType: "FLOWS_INTO", animated: true },
  
  // CEF Page Roots connect to Home (navigation structure)
  { id: "conn-page-4", fromBlockId: "page-root-cef-home", toBlockId: "page-root-cef-products", relationshipType: "REFERENCES", animated: false },
  { id: "conn-page-5", fromBlockId: "page-root-cef-home", toBlockId: "page-root-cef-usecases", relationshipType: "REFERENCES", animated: false },
  { id: "conn-page-6", fromBlockId: "page-root-cef-home", toBlockId: "page-root-cef-pricing", relationshipType: "REFERENCES", animated: false },
  
  // CEF Verticals connect to Use Cases page
  { id: "conn-cef-vert-uc-1", fromBlockId: "page-root-cef-usecases", toBlockId: "cef-vertical-gaming", relationshipType: "PART_OF", animated: false },
  { id: "conn-cef-vert-uc-2", fromBlockId: "page-root-cef-usecases", toBlockId: "cef-vertical-robotics", relationshipType: "PART_OF", animated: false },
  { id: "conn-cef-vert-uc-3", fromBlockId: "page-root-cef-usecases", toBlockId: "cef-vertical-developers", relationshipType: "PART_OF", animated: false },
];

// Combined blocks
export const allSeedBlocks = [...cereBlocks, ...cefBlocks, ...pageRootBlocks];

// Default demo user
export const demoUser = {
  id: "demo-user-1",
  email: "demo@cere.network",
  name: "Demo User",
  avatar: null,
};

// Default workspace
export const defaultWorkspace = {
  id: "default-workspace",
  name: "CERE & CEF Content Schema",
  description: "Visual content schema for CERE Network protocol and CEF.AI enterprise platform",
  ownerId: demoUser.id,
  viewportX: 0,
  viewportY: 0,
  viewportZoom: 0.6,
};
