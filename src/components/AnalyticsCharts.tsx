/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { RpaProject } from '../types';
import { Coins, TrendingUp, Clock, Landmark, Activity, Zap, Cpu } from 'lucide-react';

Chart.register(...registerables);

interface AnalyticsChartsProps {
  projects: RpaProject[];
}

export default React.memo(function AnalyticsCharts({ projects = [] }: AnalyticsChartsProps) {
  // 1. Math / Aggregations (Single-pass O(N) over up to 50,000 projects)
  const stats = useMemo(() => {
    let totalSavings = 0;
    let totalBudget = 0;
    let sumRoi = 0;
    let roiCount = 0;
    let totalHoursSaved = 0;

    // ROI grouping buckets
    let roiNegative = 0;
    let roi0_100 = 0;
    let roi100_300 = 0;
    let roi300_500 = 0;
    let roi500Plus = 0;

    // Department savings map
    const deptSavingsMap = new Map<string, number>();

    // AI Adoption metrics
    let aiEnabledCount = 0;
    let aiDisabledCount = 0;

    // Deployment Strategy metrics
    let cloudCount = 0;
    let nonCloudCount = 0;

    // Project Status breakdown
    let statusCompleted = 0;
    let statusActive = 0;
    let statusPlanned = 0;
    let statusFailed = 0;

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];

      const savings = p.annual_savings_usd || 0;
      const budget = p.budget_usd || 0;
      const hours = p.employee_hours_saved || 0;

      totalSavings += savings;
      totalBudget += budget;
      totalHoursSaved += hours;

      if (p.roi_percent !== undefined && !isNaN(p.roi_percent)) {
        sumRoi += p.roi_percent;
        roiCount++;
      }

      // ROI distribution grouping
      const roi = p.roi_percent || 0;
      if (roi < 0) {
        roiNegative++;
      } else if (roi <= 100) {
        roi0_100++;
      } else if (roi <= 300) {
        roi100_300++;
      } else if (roi <= 500) {
        roi300_500++;
      } else {
        roi500Plus++;
      }

      // Department savings
      const dept = p.department || 'Unknown';
      deptSavingsMap.set(dept, (deptSavingsMap.get(dept) || 0) + savings);

      // AI Enabled Adoption
      const aiVal = String(p.ai_enabled || '').trim().toLowerCase();
      if (aiVal === 'yes' || aiVal === 'true' || aiVal === 'enabled') {
        aiEnabledCount++;
      } else {
        aiDisabledCount++;
      }

      // Deployment Strategy
      const cloudVal = String(p.cloud_deployment || '').trim().toLowerCase();
      if (cloudVal === 'yes' || cloudVal === 'true' || cloudVal === 'cloud') {
        cloudCount++;
      } else {
        nonCloudCount++;
      }

      // Project Status (Map 'Pending' or other unexpected statuses to 'Planned')
      const status = String(p.project_status || '').trim().toLowerCase();
      if (status === 'completed') {
        statusCompleted++;
      } else if (status === 'active') {
        statusActive++;
      } else if (status === 'failed') {
        statusFailed++;
      } else {
        statusPlanned++;
      }
    }

    // Sort departments by savings descending and pick Top 10 + Other
    const sortedDepts = Array.from(deptSavingsMap.entries())
      .map(([name, savings]) => ({ name, savings }))
      .sort((a, b) => b.savings - a.savings);

    const top10Depts: { name: string; savings: number }[] = [];
    let otherSavings = 0;

    for (let i = 0; i < sortedDepts.length; i++) {
      if (i < 10) {
        top10Depts.push(sortedDepts[i]);
      } else {
        otherSavings += sortedDepts[i].savings;
      }
    }

    if (otherSavings > 0) {
      top10Depts.push({ name: 'Other', savings: otherSavings });
    }

    const avgRoi = roiCount > 0 ? sumRoi / roiCount : 0;

    return {
      totalSavings,
      totalBudget,
      avgRoi,
      totalHoursSaved,
      roiDistribution: [roiNegative, roi0_100, roi100_300, roi300_500, roi500Plus],
      topDepartments: top10Depts,
      aiAdoption: [aiEnabledCount, aiDisabledCount],
      cloudAdoption: [cloudCount, nonCloudCount],
      projectStatus: [statusCompleted, statusActive, statusPlanned, statusFailed]
    };
  }, [projects]);

  // Formatting Helpers (M = Millions, B = Billions)
  const formatLargeValue = (value: number) => {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + ' B';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + ' M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + ' K';
    }
    return value.toLocaleString();
  };

  const formatCurrency = (value: number) => {
    return '$' + formatLargeValue(value);
  };

  // Canvas Refs
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const deptCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chart Instances Refs
  const roiChartRef = useRef<any>(null);
  const deptChartRef = useRef<any>(null);
  const aiChartRef = useRef<any>(null);
  const cloudChartRef = useRef<any>(null);
  const statusChartRef = useRef<any>(null);

  // Common aesthetics
  const gridColor = 'rgba(255, 255, 255, 0.05)';
  const labelColor = '#94a3b8'; // Slate-400
  const titleFont = { family: 'Inter, sans-serif', size: 12, weight: '600' as const };
  const tickFont = { family: 'ui-monospace, "JetBrains Mono", monospace', size: 10 };

  // 1. ROI Distribution Chart.js Bar Chart
  useEffect(() => {
    const ctx = roiCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (roiChartRef.current) {
      roiChartRef.current.destroy();
    }

    roiChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Negative ROI', '0-100%', '100-300%', '300-500%', '500%+'],
        datasets: [{
          data: stats.roiDistribution,
          backgroundColor: [
            'rgba(239, 68, 68, 0.25)', // Red
            'rgba(245, 158, 11, 0.25)', // Amber
            'rgba(59, 130, 246, 0.25)', // Blue
            'rgba(139, 92, 246, 0.25)', // Purple
            'rgba(16, 185, 129, 0.25)', // Emerald
          ],
          borderColor: [
            '#ef4444',
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6',
            '#10b981',
          ],
          borderWidth: 1.5,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111318',
            borderColor: '#2d323e',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Inter, sans-serif', size: 11, weight: 'bold' },
            bodyFont: tickFont,
            callbacks: {
              label: (context) => ` Projects: ${context.parsed.y.toLocaleString()}`,
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: labelColor, font: { family: 'Inter, sans-serif', size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: labelColor, font: tickFont }
          }
        }
      }
    });

    return () => {
      roiChartRef.current?.destroy();
      roiChartRef.current = null;
    };
  }, [stats.roiDistribution]);

  // 2. Department Savings Horizontal Bar Chart
  useEffect(() => {
    const ctx = deptCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (deptChartRef.current) {
      deptChartRef.current.destroy();
    }

    deptChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stats.topDepartments.map(d => d.name),
        datasets: [{
          data: stats.topDepartments.map(d => d.savings),
          backgroundColor: 'rgba(6, 182, 212, 0.2)', // Cyan
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          borderRadius: 4,
          barThickness: 14,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111318',
            borderColor: '#2d323e',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Inter, sans-serif', size: 11, weight: 'bold' },
            bodyFont: tickFont,
            callbacks: {
              label: (context) => ` Savings: $${context.parsed.x.toLocaleString()}`,
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              font: tickFont,
              callback: (value) => '$' + formatLargeValue(Number(value))
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#f1f5f9',
              font: { family: 'Inter, sans-serif', size: 11 }
            }
          }
        }
      }
    });

    return () => {
      deptChartRef.current?.destroy();
      deptChartRef.current = null;
    };
  }, [stats.topDepartments]);

  // 3. AI Enabled Adoption Donut Chart (Chart A)
  useEffect(() => {
    const ctx = aiCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (aiChartRef.current) {
      aiChartRef.current.destroy();
    }

    aiChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['AI Enabled', 'AI Disabled'],
        datasets: [{
          data: stats.aiAdoption,
          backgroundColor: [
            'rgba(16, 185, 129, 0.25)', // Emerald
            'rgba(115, 123, 140, 0.2)', // Gray
          ],
          borderColor: [
            '#10b981',
            '#737b8c',
          ],
          borderWidth: 1.5,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: labelColor,
              font: { family: 'Inter, sans-serif', size: 10 },
              boxWidth: 8,
              boxHeight: 8,
              padding: 8
            }
          },
          tooltip: {
            backgroundColor: '#111318',
            borderColor: '#2d323e',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Inter, sans-serif', size: 11, weight: 'bold' },
            bodyFont: tickFont,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = stats.aiAdoption.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${context.label}: ${value.toLocaleString()} (${percent}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      aiChartRef.current?.destroy();
      aiChartRef.current = null;
    };
  }, [stats.aiAdoption]);

  // 4. Cloud Deployment Strategy Donut Chart (Chart B)
  useEffect(() => {
    const ctx = cloudCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (cloudChartRef.current) {
      cloudChartRef.current.destroy();
    }

    cloudChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cloud', 'Non-Cloud'],
        datasets: [{
          data: stats.cloudAdoption,
          backgroundColor: [
            'rgba(59, 130, 246, 0.25)', // Blue
            'rgba(115, 123, 140, 0.2)', // Gray
          ],
          borderColor: [
            '#3b82f6',
            '#737b8c',
          ],
          borderWidth: 1.5,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: labelColor,
              font: { family: 'Inter, sans-serif', size: 10 },
              boxWidth: 8,
              boxHeight: 8,
              padding: 8
            }
          },
          tooltip: {
            backgroundColor: '#111318',
            borderColor: '#2d323e',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Inter, sans-serif', size: 11, weight: 'bold' },
            bodyFont: tickFont,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = stats.cloudAdoption.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${context.label}: ${value.toLocaleString()} (${percent}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      cloudChartRef.current?.destroy();
      cloudChartRef.current = null;
    };
  }, [stats.cloudAdoption]);

  // 5. Project Status Breakdown Donut Chart
  useEffect(() => {
    const ctx = statusCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (statusChartRef.current) {
      statusChartRef.current.destroy();
    }

    statusChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Active', 'Planned', 'Failed'],
        datasets: [{
          data: stats.projectStatus,
          backgroundColor: [
            'rgba(16, 185, 129, 0.25)', // Emerald/Completed
            'rgba(59, 130, 246, 0.25)', // Blue/Active
            'rgba(245, 158, 11, 0.25)', // Amber/Planned
            'rgba(239, 68, 68, 0.25)', // Red/Failed
          ],
          borderColor: [
            '#10b981',
            '#3b82f6',
            '#f59e0b',
            '#ef4444'
          ],
          borderWidth: 1.5,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: labelColor,
              font: { family: 'Inter, sans-serif', size: 11 },
              boxWidth: 10,
              boxHeight: 10,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: '#111318',
            borderColor: '#2d323e',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Inter, sans-serif', size: 11, weight: 'bold' },
            bodyFont: tickFont,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = stats.projectStatus.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${context.label}: ${value.toLocaleString()} (${percent}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      statusChartRef.current?.destroy();
      statusChartRef.current = null;
    };
  }, [stats.projectStatus]);

  return (
    <div className="space-y-6" id="executive-center-container">
      {/* SECTION 1: EXECUTIVE KPI BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="executive-kpi-bar">
        {/* Card 1 */}
        <div className="p-4 bg-[#1b1d24] border border-[#272a34] rounded-lg shadow-md flex flex-col justify-between h-[115px]">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider font-mono border-b border-[#272a34]/50 pb-1.5 mb-2 flex items-center justify-between">
            <span>TOTAL ANNUAL SAVINGS</span>
            <Coins className="h-3.5 w-3.5 text-[#10b981]" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-white">
            {formatCurrency(stats.totalSavings)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Derived from annual_savings_usd</span>
        </div>

        {/* Card 2 */}
        <div className="p-4 bg-[#1b1d24] border border-[#272a34] rounded-lg shadow-md flex flex-col justify-between h-[115px]">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider font-mono border-b border-[#272a34]/50 pb-1.5 mb-2 flex items-center justify-between">
            <span>TOTAL AUTOMATION BUDGET</span>
            <Landmark className="h-3.5 w-3.5 text-[#3b82f6]" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-white">
            {formatCurrency(stats.totalBudget)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Derived from budget_usd</span>
        </div>

        {/* Card 3 */}
        <div className="p-4 bg-[#1b1d24] border border-[#272a34] rounded-lg shadow-md flex flex-col justify-between h-[115px]">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider font-mono border-b border-[#272a34]/50 pb-1.5 mb-2 flex items-center justify-between">
            <span>AVERAGE ROI</span>
            <TrendingUp className="h-3.5 w-3.5 text-[#a855f7]" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-white">
            {stats.avgRoi.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Derived from roi_percent</span>
        </div>

        {/* Card 4 */}
        <div className="p-4 bg-[#1b1d24] border border-[#272a34] rounded-lg shadow-md flex flex-col justify-between h-[115px]">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider font-mono border-b border-[#272a34]/50 pb-1.5 mb-2 flex items-center justify-between">
            <span>EMPLOYEE HOURS SAVED</span>
            <Clock className="h-3.5 w-3.5 text-[#f59e0b]" />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-white">
            {formatLargeValue(stats.totalHoursSaved)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Derived from employee_hours_saved</span>
        </div>
      </div>

      {/* MID ROW: ROI Performance & Department Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: ROI PERFORMANCE */}
        <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col h-[340px] shadow-lg">
          <div className="border-b border-[#272a34] pb-2 mb-4 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              ROI Distribution
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Process Count per Range</span>
          </div>
          <div className="relative flex-1 min-h-0">
            <canvas ref={roiCanvasRef} />
          </div>
        </div>

        {/* SECTION 3: DEPARTMENT SAVINGS */}
        <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col h-[340px] shadow-lg">
          <div className="border-b border-[#272a34] pb-2 mb-4 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Top Departments by Savings
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Top 10 + Other</span>
          </div>
          <div className="relative flex-1 min-h-0">
            <canvas ref={deptCanvasRef} />
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: AI & Cloud Adoption & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 7: AI & CLOUD ADOPTION */}
        <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col h-[340px] shadow-lg">
          <div className="border-b border-[#272a34] pb-2 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI & Cloud Adoption Trends
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1 items-center">
            {/* Chart A: AI Enabled Adoption */}
            <div className="flex flex-col items-center h-full justify-center">
              <h4 className="text-[11px] font-semibold text-slate-400 mb-2 font-mono flex items-center gap-1">
                <Cpu className="h-3 w-3 text-[#10b981]" />
                AI ENABLED ADOPTION
              </h4>
              <div className="relative w-full h-[180px] flex items-center justify-center">
                <canvas ref={aiCanvasRef} />
              </div>
            </div>

            {/* Chart B: Deployment Strategy */}
            <div className="flex flex-col items-center h-full justify-center">
              <h4 className="text-[11px] font-semibold text-slate-400 mb-2 font-mono flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#3b82f6]" />
                DEPLOYMENT STRATEGY
              </h4>
              <div className="relative w-full h-[180px] flex items-center justify-center">
                <canvas ref={cloudCanvasRef} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8: PROJECT STATUS HEALTH */}
        <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col h-[340px] shadow-lg">
          <div className="border-b border-[#272a34] pb-2 mb-4 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Project Status Breakdown
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Portfolio Health Check</span>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center">
            <canvas ref={statusCanvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
});
