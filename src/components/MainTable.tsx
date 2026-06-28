/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Cpu,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { RpaProject, SortRule } from '../types';

interface MainTableProps {
  projects: RpaProject[];
  onSort?: (column: string) => void;
  selectedDepartments: string[];
  selectedIndustries: string[];
  selectedAutomationTypes: string[];
  searchQuery: string;
  sortRules: SortRule[];
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;
  visibleColumns: string[];
  onRenderedRowsCount?: (count: number) => void;
  onRowClick?: (proj: RpaProject) => void;
  selectedProjectUid?: string;
}

interface ProjectRowProps {
  proj: RpaProject;
  visibleColumns: string[];
  rowHeight: number;
  formatPercentage: (val: number) => string;
  formatCurrency: (val: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onRowClick?: (proj: RpaProject) => void;
  isSelected?: boolean;
}

const ProjectRow = React.memo(function ProjectRow({
  proj,
  visibleColumns,
  rowHeight,
  formatPercentage,
  formatCurrency,
  getStatusBadge,
  onRowClick,
  isSelected
}: ProjectRowProps) {
  const isFailed = proj.project_status === 'Failed';
  const isNegativeRoi = proj.roi_percent < 0;

  return (
    <tr
      style={{ height: rowHeight, minHeight: rowHeight, maxHeight: rowHeight }}
      onClick={() => onRowClick?.(proj)}
      title="Click row to inspect project details"
      className={`group transition-colors cursor-pointer border-b border-[#272a34]/35 ${
        isSelected
          ? 'bg-[#1e293b]/90 border-l-2 border-l-cyan-400 font-medium'
          : isFailed
          ? 'bg-rose-950/10 hover:bg-[#20232c] border-l-2 border-l-rose-500'
          : isNegativeRoi
          ? 'bg-amber-950/10 hover:bg-[#20232c] border-l-2 border-l-amber-500'
          : 'hover:bg-[#20232c] border-l-2 border-l-transparent'
      }`}
      id={`grid-row-${proj.internal_uid}`}
    >
      {/* Project Name & ID */}
      {visibleColumns.includes('project_name') && (
        <td className="px-4 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-slate-200 group-hover:text-cyan-400 leading-normal truncate max-w-[240px] transition-colors">
              {proj.project_name}
            </div>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-mono font-bold text-cyan-400/90 bg-cyan-950/40 border border-cyan-850/40 px-1.5 py-0.5 rounded shrink-0">
              CLICK TO INSPECT
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-500 leading-tight">
            {proj.project_id}
          </div>
        </td>
      )}

      {/* Department */}
      {visibleColumns.includes('department') && (
        <td className="px-4 py-1.5">
          <span className="font-medium text-slate-400">{proj.department}</span>
        </td>
      )}

      {/* Status Badge */}
      {visibleColumns.includes('project_status') && (
        <td className="px-4 py-1.5">
          {getStatusBadge(proj.project_status)}
        </td>
      )}

      {/* Robots */}
      {visibleColumns.includes('robots_deployed') && (
        <td className="px-4 py-1.5 font-mono font-semibold">
          {proj.robots_deployed}
        </td>
      )}

      {/* ROI */}
      {visibleColumns.includes('roi_percent') && (
        <td className={`px-4 py-1.5 text-right font-mono font-semibold ${isNegativeRoi ? 'text-rose-400' : 'text-emerald-400'}`}>
          <div className="flex items-center justify-end gap-1">
            {isNegativeRoi ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span>{formatPercentage(proj.roi_percent)}</span>
          </div>
        </td>
      )}

      {/* Savings */}
      {visibleColumns.includes('annual_savings_usd') && (
        <td className="px-4 py-1.5 text-right font-mono font-bold text-slate-200">
          {formatCurrency(proj.annual_savings_usd)}
        </td>
      )}

      {/* Automation Type */}
      {visibleColumns.includes('automation_type') && (
        <td className="px-4 py-1.5 text-slate-300 font-medium">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] font-mono font-bold text-cyan-400 select-none uppercase tracking-wider">
            {proj.automation_type}
          </span>
        </td>
      )}

      {/* Country */}
      {visibleColumns.includes('country') && (
        <td className="px-4 py-1.5 text-slate-400">
          {proj.country}
        </td>
      )}

      {/* Industry */}
      {visibleColumns.includes('industry') && (
        <td className="px-4 py-1.5 text-slate-400">
          {proj.industry}
        </td>
      )}
    </tr>
  );
}, (prev, next) => {
  return (
    prev.proj.internal_uid === next.proj.internal_uid &&
    prev.proj.project_id === next.proj.project_id &&
    prev.proj.project_name === next.proj.project_name &&
    prev.proj.project_status === next.proj.project_status &&
    prev.proj.robots_deployed === next.proj.robots_deployed &&
    prev.proj.annual_savings_usd === next.proj.annual_savings_usd &&
    prev.proj.automation_type === next.proj.automation_type &&
    prev.proj.roi_percent === next.proj.roi_percent &&
    prev.rowHeight === next.rowHeight &&
    prev.isSelected === next.isSelected &&
    prev.onRowClick === next.onRowClick &&
    prev.visibleColumns.length === next.visibleColumns.length &&
    prev.visibleColumns.every((col, i) => col === next.visibleColumns[i])
  );
});

// Fallback default mock projects for initial visual layout modeling
const FALLBACK_MOCK_PROJECTS: RpaProject[] = [
  {
    internal_uid: 'uid-mock-1',
    project_id: 'PRJ-101',
    project_name: 'SAP Invoice Auto-Parser',
    department: 'Finance',
    project_status: 'Completed',
    automation_type: 'RPA',
    robots_deployed: 14,
    annual_savings_usd: 850000,
    budget_usd: 120000,
    roi_percent: 608.33,
    start_date: '2026-01-01',
    employee_hours_saved: 4200,
    country: 'United States',
    industry: 'Technology',
    implementation_partner: 'Cognizant'
  },
  {
    internal_uid: 'uid-mock-2',
    project_id: 'PRJ-102',
    project_name: 'Legacy Ledger Sync Engine',
    department: 'Finance',
    project_status: 'Failed',
    automation_type: 'API Integrator',
    robots_deployed: 4,
    annual_savings_usd: 12500,
    budget_usd: 50000,
    roi_percent: -75.00, // Negative ROI
    start_date: '2026-03-12',
    employee_hours_saved: 150,
    country: 'Germany',
    industry: 'Banking',
    implementation_partner: 'Infosys'
  },
  {
    internal_uid: 'uid-mock-3',
    project_id: 'PRJ-103',
    project_name: 'Workday HR Onboarding pipeline',
    department: 'HR',
    project_status: 'Active',
    automation_type: 'Cognitive',
    robots_deployed: 8,
    annual_savings_usd: 480000,
    budget_usd: 95000,
    roi_percent: 405.26,
    start_date: '2026-02-15',
    employee_hours_saved: 2900,
    country: 'United Kingdom',
    industry: 'Healthcare',
    implementation_partner: 'Accenture'
  },
  {
    internal_uid: 'uid-mock-4',
    project_id: 'PRJ-104',
    project_name: 'E-commerce Order dispatcher',
    department: 'Sales',
    project_status: 'Pending',
    automation_type: 'AI/ML',
    robots_deployed: 2,
    annual_savings_usd: 140000,
    budget_usd: 150000,
    roi_percent: -6.67, // Negative ROI
    start_date: '2026-06-20',
    employee_hours_saved: 450,
    country: 'Japan',
    industry: 'Retail',
    implementation_partner: 'Wipro'
  }
];

export default React.memo(function MainTable({
  projects = [],
  onSort,
  selectedDepartments = [],
  selectedIndustries = [],
  selectedAutomationTypes = [],
  searchQuery = '',
  sortRules = [],
  setSortRules,
  visibleColumns = [],
  onRenderedRowsCount,
  onRowClick,
  selectedProjectUid
}: MainTableProps) {

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600); // Default to 600px to fit visible rows beautifully

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerHeight(Math.min(1200, el.clientHeight || 600));

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measuredHeight = entry.contentRect.height || el.clientHeight || 600;
        setContainerHeight(Math.min(1200, measuredHeight));
      }
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  };

  const sourceProjects = useMemo(() => {
    return projects && projects.length > 0 ? projects : FALLBACK_MOCK_PROJECTS;
  }, [projects]);

  const ALL_AVAILABLE_COLUMNS = useMemo(() => [
    { key: 'project_name', label: 'Project Name & ID' },
    { key: 'department', label: 'Department' },
    { key: 'project_status', label: 'Status' },
    { key: 'robots_deployed', label: 'Robots Deployed' },
    { key: 'roi_percent', label: 'ROI' },
    { key: 'annual_savings_usd', label: 'Annual Savings' },
    { key: 'automation_type', label: 'Automation Type' },
    { key: 'country', label: 'Country' },
    { key: 'industry', label: 'Industry' }
  ] as { key: keyof RpaProject; label: string }[], []);

  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounced search logic for fast inputs with large datasets
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Combined Multi-field fuzzy search & multi-select filtering
  const filteredProjects = useMemo(() => {
    let result = sourceProjects;

    // 1. Department filter
    if (selectedDepartments && selectedDepartments.length > 0) {
      result = result.filter(p => selectedDepartments.includes(p.department));
    }

    // 2. Industry filter
    if (selectedIndustries && selectedIndustries.length > 0) {
      result = result.filter(p => selectedIndustries.includes(p.industry));
    }

    // 3. Automation Type filter
    if (selectedAutomationTypes && selectedAutomationTypes.length > 0) {
      result = result.filter(p => selectedAutomationTypes.includes(p.automation_type));
    }

    // 4. Fuzzy Search
    const query = debouncedQuery.trim().toLowerCase();
    if (query) {
      const keywords = query.split(/\s+/).filter(Boolean);
      if (keywords.length > 0) {
        result = result.filter((p) => {
          const fieldsToSearch = [
            p.project_name,
            p.project_id,
            p.country,
            p.automation_type
          ].map(v => (v || '').toLowerCase());

          // Every keyword must be matched in at least one of the fields
          return keywords.every((keyword) =>
            fieldsToSearch.some((fieldVal) => fieldVal.includes(keyword))
          );
        });
      }
    }

    return result;
  }, [sourceProjects, debouncedQuery, selectedDepartments, selectedIndustries, selectedAutomationTypes]);

  // 1. Stable sorting of default/streamed projects
  const sortedProjects = useMemo(() => {
    if (sortRules.length === 0) {
      return filteredProjects;
    }

    // Attach original index sequence to guarantee strict stable sorting
    const itemsWithIndex = filteredProjects.map((p, idx) => ({ p, idx }));

    itemsWithIndex.sort((a, b) => {
      for (const rule of sortRules) {
        const col = rule.column;
        let valA = a.p[col];
        let valB = b.p[col];

        // Gracefully treat undefined/null as empty string for comparisons
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (valA !== valB) {
          let comparison = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else {
            comparison = String(valA).localeCompare(String(valB));
          }
          return rule.direction === 'asc' ? comparison : -comparison;
        }
      }
      // Stable sort tie-breaker using baseline sequence
      return a.idx - b.idx;
    });

    return itemsWithIndex.map(item => item.p);
  }, [filteredProjects, sortRules]);

  const ROW_HEIGHT = 44;
  const OVERSCAN = 5;
  const totalRows = sortedProjects.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleProjects = sortedProjects.slice(startIndex, endIndex);

  useEffect(() => {
    if (onRenderedRowsCount) {
      onRenderedRowsCount(visibleProjects.length);
    }
  }, [visibleProjects.length, onRenderedRowsCount]);

  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (totalRows - endIndex) * ROW_HEIGHT);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPercentage = (val: number) => {
    return `${val.toFixed(2)}%`;
  };

  const handleColumnHeaderClick = (column: keyof RpaProject, e: React.MouseEvent) => {
    const isShiftPressed = e.shiftKey;
    setSortRules((prevRules) => {
      const existingIndex = prevRules.findIndex(rule => rule.column === column);

      if (isShiftPressed) {
        if (existingIndex > -1) {
          // Rule exists: toggle asc -> desc -> remove
          const currentRule = prevRules[existingIndex];
          const updatedRules = [...prevRules];
          if (currentRule.direction === 'asc') {
            updatedRules[existingIndex] = { column, direction: 'desc' };
            return updatedRules;
          } else {
            // Remove rule
            return updatedRules.filter(rule => rule.column !== column);
          }
        } else {
          // New secondary sort key
          return [...prevRules, { column, direction: 'asc' }];
        }
      } else {
        // Single column exclusive sort
        if (prevRules.length === 1 && prevRules[0].column === column) {
          if (prevRules[0].direction === 'asc') {
            return [{ column, direction: 'desc' }];
          } else {
            return []; // Clear sorting
          }
        } else {
          return [{ column, direction: 'asc' }];
        }
      }
    });

    if (onSort) {
      onSort(String(column));
    }
  };

  const getSortRuleIndex = (column: keyof RpaProject) => {
    return sortRules.findIndex((rule) => rule.column === column);
  };

  const renderSortIndicator = (column: keyof RpaProject) => {
    const idx = getSortRuleIndex(column);
    if (idx === -1) {
      return <ArrowUpDown className="h-3 w-3 text-slate-650 group-hover:text-slate-400 transition-colors shrink-0" />;
    }
    const rule = sortRules[idx];
    const isAsc = rule.direction === 'asc';

    return (
      <span className="flex items-center gap-1 text-cyan-400 font-mono text-[9px] bg-cyan-950/70 border border-cyan-800/40 rounded px-1 py-0.5 shrink-0 select-none">
        {isAsc ? '▲' : '▼'}
        {sortRules.length > 1 && (
          <span className="text-[8px] font-bold text-cyan-500">#{idx + 1}</span>
        )}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
            <Cpu className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Active</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
            <HelpCircle className="h-3 w-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-5 flex flex-col h-full shadow-lg animate-fade-in-up" id="main-grid-panel">
      
      {/* Table Title and Metadata */}
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-200">Virtualized Automation Matrix</h3>
        <p className="text-xs text-slate-400 font-sans">
          Displays real-time process details. Click headers to sort, hold{' '}
          <kbd className="bg-[#121319] border border-[#272a34] rounded px-1 py-0.5 text-[10px] text-cyan-400 font-mono">Shift</kbd> for multi-column.
        </p>
      </div>

      {/* Grid Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto overflow-y-auto h-[60vh] min-h-[500px] rounded-lg border border-[#272a34] bg-[#121319] scrollbar-thin"
        id="data-grid-container"
      >
        <table className="w-full text-left border-collapse min-w-[1000px]">
          {/* Headers */}
          <thead className="bg-[#1b1d24] border-b border-[#272a34] sticky top-0 z-10 text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider select-none">
            <tr>
              {visibleColumns.includes('project_name') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('project_name', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Project</span>
                    {renderSortIndicator('project_name')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('department') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('department', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Department</span>
                    {renderSortIndicator('department')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('project_status') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('project_status', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Status</span>
                    {renderSortIndicator('project_status')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('robots_deployed') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('robots_deployed', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Robots</span>
                    {renderSortIndicator('robots_deployed')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('roi_percent') && (
                <th className="px-4 py-3.5 text-right">
                  <button
                    onClick={(e) => handleColumnHeaderClick('roi_percent', e)}
                    className="group flex items-center gap-1.5 ml-auto text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>ROI</span>
                    {renderSortIndicator('roi_percent')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('annual_savings_usd') && (
                <th className="px-4 py-3.5 text-right">
                  <button
                    onClick={(e) => handleColumnHeaderClick('annual_savings_usd', e)}
                    className="group flex items-center gap-1.5 ml-auto text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Savings</span>
                    {renderSortIndicator('annual_savings_usd')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('automation_type') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('automation_type', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Automation Type</span>
                    {renderSortIndicator('automation_type')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('country') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('country', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Country</span>
                    {renderSortIndicator('country')}
                  </button>
                </th>
              )}
              {visibleColumns.includes('industry') && (
                <th className="px-4 py-3.5">
                  <button
                    onClick={(e) => handleColumnHeaderClick('industry', e)}
                    className="group flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer focus:outline-none transition-colors"
                  >
                    <span>Industry</span>
                    {renderSortIndicator('industry')}
                  </button>
                </th>
              )}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-[#272a34]/30 text-xs text-slate-300 font-sans bg-[#1b1d24]">
            {topSpacerHeight > 0 && (
              <tr style={{ height: topSpacerHeight, border: 0 }}>
                <td colSpan={visibleColumns.length} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
           {visibleProjects.map((proj) => (
              <ProjectRow
                key={proj.internal_uid}
                proj={proj}
                visibleColumns={visibleColumns}
                rowHeight={ROW_HEIGHT}
                formatPercentage={formatPercentage}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
                onRowClick={onRowClick}
                isSelected={selectedProjectUid === proj.internal_uid}
              />
            ))}
            {bottomSpacerHeight > 0 && (
              <tr style={{ height: bottomSpacerHeight, border: 0 }}>
                <td colSpan={visibleColumns.length} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Grid Footer Summary */}
      <div className="mt-3.5 flex items-center justify-between border-t border-slate-900/50 pt-3.5 font-mono text-[11px] text-slate-500">
        <div>
          Showing <span className="text-slate-300 font-bold">{visibleProjects.length}</span> rows (virtualized) of{' '}
          <span className="text-slate-300 font-bold">{totalRows}</span> total records
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span>Real-Time Telemetry Stream Active</span>
        </div>
      </div>
    </div>
  );
});
