"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { RELATIONSHIP_CONFIGS, type RelationshipType } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";

interface EdgeData {
  relationshipType: RelationshipType;
  label?: string | null;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; icon: string }[] = [
  { value: "FLOWS_INTO", label: "Flows Into", icon: "→" },
  { value: "SOLVES", label: "Solves", icon: "✓" },
  { value: "DEPENDS_ON", label: "Depends On", icon: "⊂" },
  { value: "REFERENCES", label: "References", icon: "↗" },
  { value: "ENABLES", label: "Enables", icon: "⚡" },
  { value: "PART_OF", label: "Part Of", icon: "◐" },
];

// Connection strength configurations - stronger relationships have thicker lines and faster animations
const CONNECTION_STRENGTH: Record<RelationshipType, { strokeWidth: number; animationDuration: string }> = {
  FLOWS_INTO: { strokeWidth: 3, animationDuration: "1s" },
  SOLVES: { strokeWidth: 3.5, animationDuration: "0.8s" },
  DEPENDS_ON: { strokeWidth: 4, animationDuration: "0.6s" },
  REFERENCES: { strokeWidth: 2, animationDuration: "2s" },
  ENABLES: { strokeWidth: 3.5, animationDuration: "0.8s" },
  PART_OF: { strokeWidth: 2.5, animationDuration: "1.5s" },
};

/**
 * ContentConnectionEdge - Custom edge for content relationships
 * Shows relationship type with color coding and editable dropdown
 */
function ContentConnectionEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateEdge, edges } = useCanvasStore();
  
  const edgeData = data as unknown as EdgeData;
  const config = RELATIONSHIP_CONFIGS[edgeData?.relationshipType || "REFERENCES"];

  // Calculate connection multiplier based on how connected the nodes are
  const connectionMultiplier = useMemo(() => {
    const sourceConnections = edges.filter((e) => e.source === source || e.target === source).length;
    const targetConnections = edges.filter((e) => e.source === target || e.target === target).length;
    const maxConnections = Math.max(sourceConnections, targetConnections);
    
    // Scale from 0.8 to 1.5 based on connections (1 connection = 0.8, 6+ connections = 1.5)
    return Math.min(1.5, 0.8 + (maxConnections - 1) * 0.14);
  }, [edges, source, target]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate stroke dash array based on style
  const getStrokeDasharray = () => {
    switch (config.style) {
      case "dashed":
        return "8 4";
      case "dotted":
        return "2 4";
      default:
        return undefined;
    }
  };

  const handleTypeChange = useCallback((newType: RelationshipType) => {
    const newConfig = RELATIONSHIP_CONFIGS[newType];
    updateEdge(id, {
      relationshipType: newType,
      label: newConfig.label,
    });
    setIsEditing(false);
  }, [id, updateEdge]);

  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay to allow click on dropdown option
    setTimeout(() => setIsEditing(false), 150);
  }, []);

  const strength = CONNECTION_STRENGTH[edgeData?.relationshipType || "REFERENCES"];
  const effectiveStrokeWidth = strength.strokeWidth * connectionMultiplier;
  const effectiveGlowWidth = effectiveStrokeWidth + 4;

  return (
    <>
      {/* Animated glow effect for stronger connections */}
      {effectiveStrokeWidth >= 3 && (
        <path
          d={edgePath}
          style={{
            fill: "none",
            stroke: config.color,
            strokeWidth: effectiveGlowWidth,
            strokeOpacity: 0.1 + (connectionMultiplier - 0.8) * 0.15,
            filter: "blur(4px)",
          }}
        />
      )}
      
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: config.color,
          strokeWidth: selected ? effectiveStrokeWidth + 1 : effectiveStrokeWidth,
          strokeDasharray: getStrokeDasharray(),
        }}
      />
      
      {/* Animated flow indicator for connected edges */}
      <circle r="3" fill={config.color}>
        <animateMotion
          dur={strength.animationDuration}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            /* Dropdown for editing relationship type */
            <div
              className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
              style={{ minWidth: "140px" }}
            >
              <div className="text-[9px] text-gray-400 px-2 py-1 border-b border-gray-700 uppercase tracking-wider">
                Relationship Type
              </div>
              {RELATIONSHIP_OPTIONS.map((option) => {
                const optionConfig = RELATIONSHIP_CONFIGS[option.value];
                const isSelected = option.value === edgeData?.relationshipType;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleTypeChange(option.value)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`
                      w-full px-2 py-1.5 text-left text-[11px] flex items-center gap-2
                      hover:bg-gray-800 transition-colors
                      ${isSelected ? "bg-gray-800" : ""}
                    `}
                    style={{ color: optionConfig.color }}
                  >
                    <span className="w-4 text-center">{option.icon}</span>
                    <span>{option.label}</span>
                    {isSelected && (
                      <span className="ml-auto text-[10px]">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Display label (clickable to edit) */
            <button
              onClick={handleLabelClick}
              onBlur={handleBlur}
              className={`
                flex items-center gap-1
                text-[10px] font-medium
                rounded-full
                shadow-sm
                transition-all
                hover:scale-105
                cursor-pointer
                ${selected ? "scale-110 ring-2 ring-white/30" : ""}
              `}
              style={{
                backgroundColor: `${config.color}20`,
                border: `1px solid ${config.color}50`,
                padding: "3px 10px",
              }}
              title="Click to change relationship type"
            >
              {/* Relationship icon */}
              <span className="text-[9px]">
                {config.type === "FLOWS_INTO" && "→"}
                {config.type === "SOLVES" && "✓"}
                {config.type === "DEPENDS_ON" && "⊂"}
                {config.type === "REFERENCES" && "↗"}
                {config.type === "ENABLES" && "⚡"}
                {config.type === "PART_OF" && "◐"}
              </span>
              <span style={{ color: config.color }}>
                {edgeData?.label || config.label}
              </span>
              {/* Edit indicator */}
              <span className="text-[8px] opacity-50 ml-0.5">▾</span>
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(ContentConnectionEdge);
