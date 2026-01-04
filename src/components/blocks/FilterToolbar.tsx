"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import {
  BLOCK_CONFIGS,
  COMPANY_COLORS,
  type BlockType,
  type Company,
  type BlockStatus,
} from "@/lib/types";

/**
 * FilterToolbar - Top toolbar for filtering visible content
 */
export default function FilterToolbar() {
  const { filters, setFilters, resetFilters, nodes } = useCanvasStore();
  const [showFilters, setShowFilters] = useState(false);

  // Count blocks by filter
  const counts = {
    total: nodes.length,
    byCompany: {
      CERE: nodes.filter((n) => (n.data as { company: Company }).company === "CERE").length,
      CEF: nodes.filter((n) => (n.data as { company: Company }).company === "CEF").length,
      SHARED: nodes.filter((n) => (n.data as { company: Company }).company === "SHARED").length,
    },
    byStatus: {
      LIVE: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "LIVE").length,
      VISION: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "VISION").length,
      DRAFT: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "DRAFT").length,
      ARCHIVED: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "ARCHIVED").length,
      PENDING_REVIEW: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "PENDING_REVIEW").length,
      APPROVED: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "APPROVED").length,
      NEEDS_CHANGES: nodes.filter((n) => (n.data as { status: BlockStatus }).status === "NEEDS_CHANGES").length,
    } as Record<BlockStatus, number>,
  };

  const toggleCompany = (company: Company) => {
    const newCompanies = filters.companies.includes(company)
      ? filters.companies.filter((c) => c !== company)
      : [...filters.companies, company];
    setFilters({ companies: newCompanies.length > 0 ? newCompanies : [company] });
  };

  const toggleStatus = (status: BlockStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses: newStatuses.length > 0 ? newStatuses : [status] });
  };

  const toggleType = (type: BlockType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    setFilters({ types: newTypes.length > 0 ? newTypes : [type] });
  };

  const isFiltered =
    filters.companies.length < 3 ||
    filters.statuses.length < 4 ||
    filters.types.length < 8 ||
    filters.searchQuery.length > 0;

  return (
    <div className="glass border-b border-gray-200 dark:border-gray-800" data-tour="filter-toolbar">
      {/* Main toolbar */}
      <div className="flex items-center gap-4 px-4 py-2">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              placeholder="Search blocks..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters({ searchQuery: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Quick company filters */}
        <div className="flex items-center gap-1">
          {(["CERE", "CEF", "SHARED"] as Company[]).map((company) => (
            <button
              key={company}
              onClick={() => toggleCompany(company)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${filters.companies.includes(company)
                  ? "text-white shadow-sm"
                  : "text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }
              `}
              style={{
                backgroundColor: filters.companies.includes(company)
                  ? COMPANY_COLORS[company].primary
                  : undefined,
              }}
            >
              {company} ({counts.byCompany[company]})
            </button>
          ))}
        </div>

        {/* Quick status filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleStatus("LIVE")}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${filters.statuses.includes("LIVE")
                ? "bg-green-500 text-white"
                : "text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            Live ({counts.byStatus.LIVE})
          </button>
          <button
            onClick={() => toggleStatus("VISION")}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${filters.statuses.includes("VISION")
                ? "bg-amber-500 text-white"
                : "text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            Vision ({counts.byStatus.VISION})
          </button>
        </div>

        {/* More filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
            ${showFilters || isFiltered
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {isFiltered && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Reset filters */}
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Reset
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
          {/* Block types */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Block Types
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BLOCK_CONFIGS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => toggleType(key as BlockType)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${filters.types.includes(key as BlockType)
                      ? "shadow-sm"
                      : "opacity-40 hover:opacity-70"
                    }
                  `}
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                  }}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All status options */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {(["LIVE", "VISION", "DRAFT", "ARCHIVED"] as BlockStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${filters.statuses.includes(status)
                      ? status === "LIVE"
                        ? "bg-green-500 text-white"
                        : status === "VISION"
                        ? "bg-amber-500 text-white"
                        : status === "DRAFT"
                        ? "bg-gray-400 text-white"
                        : "bg-gray-600 text-white"
                      : "text-gray-500 bg-gray-100 dark:bg-gray-800"
                    }
                  `}
                >
                  {status} ({counts.byStatus[status]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

