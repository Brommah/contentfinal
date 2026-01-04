import { describe, it, expect, beforeEach } from "vitest";
import { blockToNode, connectionToEdge } from "@/lib/store";
import type { BlockData, ConnectionData } from "@/lib/types";

describe("blockToNode", () => {
  it("should convert BlockData to React Flow Node", () => {
    const block: BlockData = {
      id: "block-1",
      type: "FEATURE",
      company: "CERE",
      status: "DRAFT",
      title: "Test Feature",
      subtitle: "A test subtitle",
      content: "Test content",
      tags: ["tag1", "tag2"],
      positionX: 100,
      positionY: 200,
      width: 280,
      height: 120,
      workspaceId: "workspace-1",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    };

    const node = blockToNode(block);

    expect(node.id).toBe("block-1");
    expect(node.type).toBe("contentBlock");
    expect(node.position.x).toBe(100);
    expect(node.position.y).toBe(200);
    expect(node.data.title).toBe("Test Feature");
    expect(node.data.type).toBe("FEATURE");
    expect(node.data.company).toBe("CERE");
    expect(node.data.status).toBe("DRAFT");
    expect(node.style?.width).toBe(280);
    expect(node.style?.height).toBe(120);
  });

  it("should preserve all block properties in node data", () => {
    const block: BlockData = {
      id: "block-2",
      type: "PAIN_POINT",
      company: "CEF",
      status: "LIVE",
      title: "Pain Point Title",
      subtitle: null,
      content: null,
      tags: [],
      positionX: 0,
      positionY: 0,
      width: 300,
      height: 150,
      externalUrl: "https://example.com",
      parentId: "parent-1",
      workspaceId: "workspace-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const node = blockToNode(block);

    expect(node.data.externalUrl).toBe("https://example.com");
    expect(node.data.parentId).toBe("parent-1");
    expect(node.data.tags).toEqual([]);
  });
});

describe("connectionToEdge", () => {
  it("should convert ConnectionData to React Flow Edge", () => {
    const connection: ConnectionData = {
      id: "conn-1",
      relationshipType: "SOLVES",
      label: "solves problem",
      animated: true,
      style: null,
      fromBlockId: "block-1",
      toBlockId: "block-2",
      workspaceId: "workspace-1",
    };

    const edge = connectionToEdge(connection);

    expect(edge.id).toBe("conn-1");
    expect(edge.source).toBe("block-1");
    expect(edge.target).toBe("block-2");
    expect(edge.type).toBe("contentConnection");
    expect(edge.animated).toBe(true);
    expect(edge.data?.relationshipType).toBe("SOLVES");
    expect(edge.data?.label).toBe("solves problem");
  });

  it("should handle connections without animation", () => {
    const connection: ConnectionData = {
      id: "conn-2",
      relationshipType: "REFERENCES",
      label: null,
      animated: false,
      style: null,
      fromBlockId: "block-3",
      toBlockId: "block-4",
      workspaceId: "workspace-1",
    };

    const edge = connectionToEdge(connection);

    expect(edge.animated).toBe(false);
    expect(edge.data?.label).toBeNull();
  });

  it("should handle all relationship types", () => {
    const relationshipTypes = [
      "FLOWS_INTO",
      "SOLVES",
      "DEPENDS_ON",
      "REFERENCES",
      "ENABLES",
      "PART_OF",
    ] as const;

    relationshipTypes.forEach((type) => {
      const connection: ConnectionData = {
        id: `conn-${type}`,
        relationshipType: type,
        label: null,
        animated: false,
        style: null,
        fromBlockId: "source",
        toBlockId: "target",
        workspaceId: "workspace-1",
      };

      const edge = connectionToEdge(connection);

      expect(edge.data?.relationshipType).toBe(type);
    });
  });
});


