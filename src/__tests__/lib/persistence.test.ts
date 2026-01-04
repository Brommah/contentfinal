import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  nodesToBlocks,
  edgesToConnections,
  debounce,
  localPersistence,
} from "@/lib/persistence";
import type { Node, Edge } from "@xyflow/react";
import type { BlockData } from "@/lib/types";

describe("nodesToBlocks", () => {
  it("should convert React Flow nodes to BlockData", () => {
    const nodes: Node[] = [
      {
        id: "node-1",
        type: "contentBlock",
        position: { x: 100, y: 200 },
        data: {
          id: "node-1",
          type: "FEATURE",
          company: "CERE",
          status: "DRAFT",
          title: "Test Feature",
          tags: ["test"],
          positionX: 0,
          positionY: 0,
          width: 280,
          height: 120,
          workspaceId: "workspace-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as BlockData,
        measured: { width: 300, height: 150 },
      },
    ];

    const blocks = nodesToBlocks(nodes);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe("node-1");
    expect(blocks[0].positionX).toBe(100);
    expect(blocks[0].positionY).toBe(200);
    expect(blocks[0].width).toBe(300);
    expect(blocks[0].height).toBe(150);
    expect(blocks[0].title).toBe("Test Feature");
  });

  it("should use data dimensions if measured is not available", () => {
    const nodes: Node[] = [
      {
        id: "node-1",
        type: "contentBlock",
        position: { x: 50, y: 75 },
        data: {
          id: "node-1",
          type: "SOLUTION",
          company: "CEF",
          status: "LIVE",
          title: "Test Solution",
          tags: [],
          positionX: 0,
          positionY: 0,
          width: 250,
          height: 100,
          workspaceId: "workspace-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as BlockData,
      },
    ];

    const blocks = nodesToBlocks(nodes);

    expect(blocks[0].width).toBe(250);
    expect(blocks[0].height).toBe(100);
  });

  it("should handle empty nodes array", () => {
    const blocks = nodesToBlocks([]);
    expect(blocks).toHaveLength(0);
  });
});

describe("edgesToConnections", () => {
  it("should convert React Flow edges to ConnectionData", () => {
    const edges: Edge[] = [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        animated: true,
        data: {
          relationshipType: "SOLVES",
          label: "solves problem",
        },
      },
    ];

    const connections = edgesToConnections(edges);

    expect(connections).toHaveLength(1);
    expect(connections[0].id).toBe("edge-1");
    expect(connections[0].fromBlockId).toBe("node-1");
    expect(connections[0].toBlockId).toBe("node-2");
    expect(connections[0].relationshipType).toBe("SOLVES");
    expect(connections[0].label).toBe("solves problem");
    expect(connections[0].animated).toBe(true);
  });

  it("should default to REFERENCES relationship type if not specified", () => {
    const edges: Edge[] = [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        data: {},
      },
    ];

    const connections = edgesToConnections(edges);

    expect(connections[0].relationshipType).toBe("REFERENCES");
  });

  it("should handle edges without animation", () => {
    const edges: Edge[] = [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
      },
    ];

    const connections = edgesToConnections(edges);

    expect(connections[0].animated).toBe(false);
  });

  it("should handle empty edges array", () => {
    const connections = edgesToConnections([]);
    expect(connections).toHaveLength(0);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce function calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should call function with correct arguments", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 50);

    debouncedFn("arg1", "arg2");

    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should reset timer on subsequent calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("localPersistence", () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: mockLocalStorage });
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("should save workspace data to localStorage", () => {
      const workspaceData = {
        id: "test-workspace",
        name: "Test Workspace",
        viewportX: 0,
        viewportY: 0,
        viewportZoom: 1,
        blocks: [],
        connections: [],
      };

      localPersistence.save("test-workspace", workspaceData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "workspace_test-workspace",
        JSON.stringify(workspaceData)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "workspace_test-workspace_timestamp",
        expect.any(String)
      );
    });
  });

  describe("load", () => {
    it("should load workspace data from localStorage", () => {
      const workspaceData = {
        id: "test-workspace",
        name: "Test Workspace",
        blocks: [],
        connections: [],
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(workspaceData));

      const result = localPersistence.load("test-workspace");

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("workspace_test-workspace");
      expect(result).toEqual(workspaceData);
    });

    it("should return null if no data found", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = localPersistence.load("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getTimestamp", () => {
    it("should return timestamp if exists", () => {
      const timestamp = "2026-01-04T12:00:00.000Z";
      mockLocalStorage.getItem.mockReturnValue(timestamp);

      const result = localPersistence.getTimestamp("test-workspace");

      expect(result).toBeInstanceOf(Date);
    });

    it("should return null if no timestamp", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = localPersistence.getTimestamp("test-workspace");

      expect(result).toBeNull();
    });
  });

  describe("clear", () => {
    it("should remove workspace data and timestamp", () => {
      localPersistence.clear("test-workspace");

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("workspace_test-workspace");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("workspace_test-workspace_timestamp");
    });
  });
});


