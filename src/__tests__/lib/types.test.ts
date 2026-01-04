import { describe, it, expect } from "vitest";
import {
  canTransitionTo,
  getAvailableTransitions,
  VALID_STATUS_TRANSITIONS,
  BLOCK_CONFIGS,
  STATUS_CONFIGS,
  COMPANY_COLORS,
  RELATIONSHIP_CONFIGS,
} from "@/lib/types";

describe("Status Transitions", () => {
  describe("canTransitionTo", () => {
    it("should allow DRAFT to transition to PENDING_REVIEW", () => {
      expect(canTransitionTo("DRAFT", "PENDING_REVIEW")).toBe(true);
    });

    it("should allow DRAFT to transition to ARCHIVED", () => {
      expect(canTransitionTo("DRAFT", "ARCHIVED")).toBe(true);
    });

    it("should NOT allow DRAFT to transition to LIVE directly", () => {
      expect(canTransitionTo("DRAFT", "LIVE")).toBe(false);
    });

    it("should allow PENDING_REVIEW to transition to APPROVED", () => {
      expect(canTransitionTo("PENDING_REVIEW", "APPROVED")).toBe(true);
    });

    it("should allow PENDING_REVIEW to transition to NEEDS_CHANGES", () => {
      expect(canTransitionTo("PENDING_REVIEW", "NEEDS_CHANGES")).toBe(true);
    });

    it("should allow APPROVED to transition to LIVE", () => {
      expect(canTransitionTo("APPROVED", "LIVE")).toBe(true);
    });

    it("should allow NEEDS_CHANGES to transition back to DRAFT", () => {
      expect(canTransitionTo("NEEDS_CHANGES", "DRAFT")).toBe(true);
    });

    it("should allow LIVE to transition to ARCHIVED", () => {
      expect(canTransitionTo("LIVE", "ARCHIVED")).toBe(true);
    });

    it("should NOT allow LIVE to transition back to DRAFT directly", () => {
      expect(canTransitionTo("LIVE", "DRAFT")).toBe(false);
    });

    it("should allow ARCHIVED to transition to DRAFT", () => {
      expect(canTransitionTo("ARCHIVED", "DRAFT")).toBe(true);
    });

    it("should allow VISION to transition to DRAFT", () => {
      expect(canTransitionTo("VISION", "DRAFT")).toBe(true);
    });
  });

  describe("getAvailableTransitions", () => {
    it("should return correct transitions for DRAFT", () => {
      const transitions = getAvailableTransitions("DRAFT");
      expect(transitions).toContain("PENDING_REVIEW");
      expect(transitions).toContain("ARCHIVED");
      expect(transitions).not.toContain("LIVE");
    });

    it("should return correct transitions for PENDING_REVIEW", () => {
      const transitions = getAvailableTransitions("PENDING_REVIEW");
      expect(transitions).toContain("APPROVED");
      expect(transitions).toContain("NEEDS_CHANGES");
    });

    it("should return correct transitions for APPROVED", () => {
      const transitions = getAvailableTransitions("APPROVED");
      expect(transitions).toContain("LIVE");
      expect(transitions).toContain("DRAFT");
    });

    it("should return correct transitions for LIVE", () => {
      const transitions = getAvailableTransitions("LIVE");
      expect(transitions).toContain("ARCHIVED");
      expect(transitions).toHaveLength(1);
    });
  });

  describe("VALID_STATUS_TRANSITIONS", () => {
    it("should have all status keys defined", () => {
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("DRAFT");
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("PENDING_REVIEW");
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("APPROVED");
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("NEEDS_CHANGES");
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("LIVE");
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("VISION");
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty("ARCHIVED");
    });
  });
});

describe("Block Configs", () => {
  it("should have all block types configured", () => {
    expect(BLOCK_CONFIGS).toHaveProperty("COMPANY");
    expect(BLOCK_CONFIGS).toHaveProperty("PAGE_ROOT");
    expect(BLOCK_CONFIGS).toHaveProperty("CORE_VALUE_PROP");
    expect(BLOCK_CONFIGS).toHaveProperty("PAIN_POINT");
    expect(BLOCK_CONFIGS).toHaveProperty("SOLUTION");
    expect(BLOCK_CONFIGS).toHaveProperty("FEATURE");
    expect(BLOCK_CONFIGS).toHaveProperty("VERTICAL");
    expect(BLOCK_CONFIGS).toHaveProperty("ARTICLE");
    expect(BLOCK_CONFIGS).toHaveProperty("TECH_COMPONENT");
  });

  it("should have required properties for each block type", () => {
    Object.values(BLOCK_CONFIGS).forEach((config) => {
      expect(config).toHaveProperty("type");
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("bgColor");
      expect(config).toHaveProperty("borderColor");
      expect(config).toHaveProperty("icon");
    });
  });
});

describe("Status Configs", () => {
  it("should have all status types configured", () => {
    expect(STATUS_CONFIGS).toHaveProperty("LIVE");
    expect(STATUS_CONFIGS).toHaveProperty("VISION");
    expect(STATUS_CONFIGS).toHaveProperty("DRAFT");
    expect(STATUS_CONFIGS).toHaveProperty("ARCHIVED");
    expect(STATUS_CONFIGS).toHaveProperty("PENDING_REVIEW");
    expect(STATUS_CONFIGS).toHaveProperty("APPROVED");
    expect(STATUS_CONFIGS).toHaveProperty("NEEDS_CHANGES");
  });

  it("should have required properties for each status", () => {
    Object.values(STATUS_CONFIGS).forEach((config) => {
      expect(config).toHaveProperty("status");
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("bgColor");
      expect(config).toHaveProperty("icon");
    });
  });
});

describe("Company Colors", () => {
  it("should have all companies configured", () => {
    expect(COMPANY_COLORS).toHaveProperty("CERE");
    expect(COMPANY_COLORS).toHaveProperty("CEF");
    expect(COMPANY_COLORS).toHaveProperty("SHARED");
  });

  it("should have primary and secondary colors for each company", () => {
    Object.values(COMPANY_COLORS).forEach((colors) => {
      expect(colors).toHaveProperty("primary");
      expect(colors).toHaveProperty("secondary");
      expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

describe("Relationship Configs", () => {
  it("should have all relationship types configured", () => {
    expect(RELATIONSHIP_CONFIGS).toHaveProperty("FLOWS_INTO");
    expect(RELATIONSHIP_CONFIGS).toHaveProperty("SOLVES");
    expect(RELATIONSHIP_CONFIGS).toHaveProperty("DEPENDS_ON");
    expect(RELATIONSHIP_CONFIGS).toHaveProperty("REFERENCES");
    expect(RELATIONSHIP_CONFIGS).toHaveProperty("ENABLES");
    expect(RELATIONSHIP_CONFIGS).toHaveProperty("PART_OF");
  });

  it("should have required properties for each relationship", () => {
    Object.values(RELATIONSHIP_CONFIGS).forEach((config) => {
      expect(config).toHaveProperty("type");
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("animated");
      expect(config).toHaveProperty("style");
    });
  });
});


