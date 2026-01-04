"use client";

import React, { useState, useRef, useEffect } from "react";
import { BlockType, Company, BlockStatus, BLOCK_CONFIGS } from "@/lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon?: string;
  color?: string;
  count?: number;
}

interface FilterChipProps<T extends string> {
  label: string;
  icon?: string;
  value: T | "ALL";
  options: FilterOption<T>[];
  onChange: (value: T | "ALL") => void;
  allLabel?: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: BlockType | "ALL";
  onTypeChange: (type: BlockType | "ALL") => void;
  filterCompany: Company | "ALL";
  onCompanyChange: (company: Company | "ALL") => void;
  filterStatus: BlockStatus | "ALL";
  onStatusChange: (status: BlockStatus | "ALL") => void;
  totalCount: number;
  filteredCount: number;
}

// ============================================================================
// FILTER CHIP COMPONENT
// ============================================================================

function FilterChip<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
  allLabel = "All",
}: FilterChipProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const isActive = value !== "ALL";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
          transition-all duration-150 border
          ${isActive
            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700"
            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }
        `}
      >
        {selectedOption?.icon || icon}
        <span className="max-w-[100px] truncate">
          {isActive ? selectedOption?.label : label}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl border shadow-xl z-50 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          {/* All option */}
          <button
            onClick={() => {
              onChange("ALL" as T);
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors
              ${value === "ALL"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            `}
          >
            <span className="w-5 text-center">✨</span>
            <span>{allLabel}</span>
          </button>

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                  ${value === option.value
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }
                `}
              >
                <span className="w-5 text-center">{option.icon}</span>
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILTER BAR COMPONENT
// ============================================================================

export default function FilterBar({
  searchQuery,
  onSearchChange,
  filterType,
  onTypeChange,
  filterCompany,
  onCompanyChange,
  filterStatus,
  onStatusChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  // Type options
  const typeOptions: FilterOption<BlockType>[] = Object.values(BLOCK_CONFIGS).map((config) => ({
    value: config.type,
    label: config.label,
    icon: config.icon,
  }));

  // Company options
  const companyOptions: FilterOption<Company>[] = [
    { value: "CERE", label: "CERE", icon: "🔵" },
    { value: "CEF", label: "CEF.AI", icon: "🟢" },
    { value: "SHARED", label: "Shared", icon: "🔗" },
  ];

  // Status options
  const statusOptions: FilterOption<BlockStatus>[] = [
    { value: "LIVE", label: "Live", icon: "🟢" },
    { value: "VISION", label: "Vision", icon: "🔮" },
    { value: "DRAFT", label: "Draft", icon: "📝" },
    { value: "PENDING_REVIEW", label: "Pending Review", icon: "⏳" },
    { value: "APPROVED", label: "Approved", icon: "✅" },
    { value: "NEEDS_CHANGES", label: "Needs Changes", icon: "🔄" },
    { value: "ARCHIVED", label: "Archived", icon: "📦" },
  ];

  const hasActiveFilters = filterType !== "ALL" || filterCompany !== "ALL" || filterStatus !== "ALL";

  const clearFilters = () => {
    onTypeChange("ALL");
    onCompanyChange("ALL");
    onStatusChange("ALL");
    onSearchChange("");
  };

  return (
    <div className="p-4 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800">
      {/* Search row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          label="Type"
          icon="📦"
          value={filterType}
          options={typeOptions}
          onChange={onTypeChange}
          allLabel="All Types"
        />

        <FilterChip
          label="Company"
          icon="🏢"
          value={filterCompany}
          options={companyOptions}
          onChange={onCompanyChange}
          allLabel="All Companies"
        />

        <FilterChip
          label="Status"
          icon="📊"
          value={filterStatus}
          options={statusOptions}
          onChange={onStatusChange}
          allLabel="All Status"
        />

        <div className="flex-1" />

        {/* Results count */}
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {filteredCount === totalCount ? (
            <span>{totalCount} blocks</span>
          ) : (
            <span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{filteredCount}</span>
              <span> of {totalCount}</span>
            </span>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}


