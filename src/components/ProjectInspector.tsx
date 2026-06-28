/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { X, Cpu, TrendingUp, TrendingDown, DollarSign, Clock, BarChart2, Shield, Globe, Award } from 'lucide-react';
import { RpaProject } from '../types';

// Register Chart.js components
Chart.register(...registerables);

interface ProjectInspectorProps {
  project: RpaProject;
  onClose: () => void;
}

export default function ProjectInspector({ project, onClose }: ProjectInspectorProps) {
  const roiGaugeRef = useRef<HTMLCanvasElement | null>(null);
  const savingsBarRef = useRef<HTMLCanvasElement | null>(null);
  const hoursSavedRef = useRef<HTMLCanvasElement | null>(null);

  const roiChartInstance = useRef<Chart | null>(null);
  const savingsChartInstance = useRef<Chart | null>(null);
  const hoursChartInstance = useRef<Chart | null>(null);

  // Helper formatting functions
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

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  useEffect(() => {
    // -------------------------------------------------------------
    // 1. ROI Gauge Chart
    // -------------------------------------------------------------
    if (roiGaugeRef.current) {
      if (roiChartInstance.current) {
        roiChartInstance.current.destroy();
      }

      const isNegative = project.roi_percent < 0;
      const roiVal = Math.min(Math.max(project.roi_percent, -100), 1000); // Clamp between -100% and 1000% for display
      
      // Gauge visualization data: positive is emerald, negative is rose
      const dataColor = isNegative ? 'rgba(244, 63, 94, 0.85)' : 'rgba(16, 185, 129, 0.85)';
      const remainingColor = 'rgba(39, 42, 52, 0.6)';

      // Calculate percentage of 500% target ROI for visual length
      const targetPercent = Math.min(Math.max((roiVal + 100) / 1100 * 100, 5), 100);

      roiChartInstance.current = new Chart(roiGaugeRef.current, {
        type: 'doughnut',
        data: {
          labels: ['ROI %', 'Target Delta'],
          datasets: [{
            data: [targetPercent, 100 - targetPercent],
            backgroundColor: [dataColor, remainingColor],
            borderWidth: 0,
            circumference: 180,
            rotation: -90,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          cutout: '75%',
        }
      });
    }

    // -------------------------------------------------------------
    // 2. Budget vs Savings Comparison Bar Chart
    // -------------------------------------------------------------
    if (savingsBarRef.current) {
      if (savingsChartInstance.current) {
        savingsChartInstance.current.destroy();
      }

      savingsChartInstance.current = new Chart(savingsBarRef.current, {
        type: 'bar',
        data: {
          labels: ['Budget', 'Annual Savings'],
          datasets: [{
            data: [project.budget_usd, project.annual_savings_usd],
            backgroundColor: [
              'rgba(56, 189, 248, 0.75)', // sky-400 for budget
              'rgba(16, 185, 129, 0.75)'  // emerald-500 for savings
            ],
            borderColor: [
              '#38bdf8',
              '#10b981'
            ],
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 24,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.dataset.label || ''}: ${formatCurrency(context.raw as number)}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(39, 42, 52, 0.4)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 9, family: 'monospace' },
                callback: (value) => {
                  if (Number(value) >= 1e6) return `$${(Number(value) / 1e6).toFixed(1)}M`;
                  if (Number(value) >= 1e3) return `$${(Number(value) / 1e3).toFixed(0)}k`;
                  return `$${value}`;
                }
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                color: '#cbd5e1',
                font: { size: 10, weight: 'bold' }
              }
            }
          }
        }
      });
    }

    // -------------------------------------------------------------
    // 3. Employee Hours Saved Visualization Chart
    // -------------------------------------------------------------
    if (hoursSavedRef.current) {
      if (hoursChartInstance.current) {
        hoursChartInstance.current.destroy();
      }

      // Benchmark is 2,000 hours (roughly 1 full-time FTE year)
      const benchmarkVal = 2000;
      const hoursSaved = project.employee_hours_saved || 0;

      hoursChartInstance.current = new Chart(hoursSavedRef.current, {
        type: 'bar',
        data: {
          labels: ['Hours Saved', 'FTE Year Base'],
          datasets: [{
            data: [hoursSaved, benchmarkVal],
            backgroundColor: [
              'rgba(168, 85, 247, 0.75)', // purple-500
              'rgba(71, 85, 105, 0.5)'    // slate-600
            ],
            borderColor: [
              '#a855f7',
              '#475569'
            ],
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 18,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.raw} hours`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#cbd5e1', font: { size: 10, weight: 'bold' } }
            },
            y: {
              grid: { color: 'rgba(39, 42, 52, 0.4)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 9, family: 'monospace' },
                callback: (value) => `${value}h`
              }
            }
          }
        }
      });
    }

    // Cleanup on destroy
    return () => {
      if (roiChartInstance.current) {
        roiChartInstance.current.destroy();
      }
      if (savingsChartInstance.current) {
        savingsChartInstance.current.destroy();
      }
      if (hoursChartInstance.current) {
        hoursChartInstance.current.destroy();
      }
    };
  }, [project]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Active</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Failed</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[11px] font-bold text-amber-400 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-400 font-sans">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div 
      className="w-full lg:w-[480px] shrink-0 border border-[#272a34] bg-[#1b1d24] rounded-lg shadow-2xl flex flex-col h-[60vh] lg:h-auto min-h-[500px] overflow-hidden animate-fade-in-right" 
      id="project-inspector-drawer"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111216] border-b border-[#272a34]">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
            PROJECT INSPECTOR
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1e2128] transition-colors cursor-pointer outline-none"
          title="Close Inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Scrollable Workspace */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin select-none">
        
        {/* Core Profile */}
        <div className="p-3.5 rounded bg-[#121319] border border-[#272a34]/70">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-white leading-snug tracking-tight">
              {project.project_name}
            </h4>
            {getStatusBadge(project.project_status)}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-[#272a34]/40">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">PROJECT ID</span>
              <span className="text-slate-200 select-all font-semibold">{project.project_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">COMPANY ID</span>
              <span className="text-slate-200 font-semibold">{project.company_id || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Detailed Meta Metrics Grid */}
        <div className="space-y-2">
          <h5 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest px-1">
            System Attributes
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs font-sans">
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Department</span>
              <span className="text-slate-200 font-semibold">{project.department}</span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Automation Type</span>
              <span className="text-cyan-400 font-mono font-semibold">{project.automation_type}</span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Robots Deployed</span>
              <span className="text-slate-200 font-mono font-bold flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-slate-500" />
                {project.robots_deployed}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Implementation Partner</span>
              <span className="text-slate-300 font-semibold truncate block" title={project.implementation_partner}>
                {project.implementation_partner}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Country</span>
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-slate-500" />
                {project.country}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Industry</span>
              <span className="text-slate-300 font-semibold truncate block" title={project.industry}>
                {project.industry}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">AI Enabled</span>
              <span className={`font-semibold font-mono ${project.ai_enabled === 'Yes' ? 'text-emerald-400' : 'text-slate-500'}`}>
                {project.ai_enabled || 'No'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Cloud Deployment</span>
              <span className={`font-semibold font-mono ${project.cloud_deployment === 'Yes' ? 'text-cyan-400' : 'text-slate-500'}`}>
                {project.cloud_deployment || 'No'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Start Date</span>
              <span className="text-slate-300 font-mono">{project.start_date || 'N/A'}</span>
            </div>
            <div className="p-2.5 rounded bg-[#121319]/60 border border-[#272a34]/40">
              <span className="text-[10px] font-mono text-slate-500 block mb-0.5 uppercase">Completion Date</span>
              <span className="text-slate-300 font-mono">{project.completion_date || 'In Progress'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Financial Metrics Cards */}
        <div className="space-y-2">
          <h5 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest px-1">
            Financial Ledger
          </h5>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded bg-[#121319] border border-[#272a34]">
              <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block mb-1">
                Budget (USD)
              </span>
              <span className="text-xs font-mono font-extrabold text-sky-400">
                {formatCurrency(project.budget_usd)}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319] border border-[#272a34]">
              <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block mb-1">
                Savings (USD)
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-400">
                {formatCurrency(project.annual_savings_usd)}
              </span>
            </div>
            <div className="p-2.5 rounded bg-[#121319] border border-[#272a34]">
              <span className="text-[8px] font-bold font-mono text-slate-500 uppercase block mb-1">
                ROI (Est)
              </span>
              <span className={`text-xs font-mono font-extrabold ${project.roi_percent < 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                {formatPercentage(project.roi_percent)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Visual Analytics (Chart.js) */}
        <div className="space-y-4 border-t border-[#272a34]/40 pt-4">
          <h5 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1">
            <BarChart2 className="h-3.5 w-3.5" />
            Telemetry Charts
          </h5>

          {/* Chart A: ROI Gauge */}
          <div className="p-3 rounded bg-[#121319]/40 border border-[#272a34]/40 flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-slate-400 self-start mb-2 uppercase">
              ROI Performance Indicator (Target 500%)
            </span>
            <div className="relative w-full h-[100px] flex items-center justify-center">
              <canvas ref={roiGaugeRef} />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <span className={`text-sm font-mono font-bold leading-none ${project.roi_percent < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {project.roi_percent < 0 ? '' : '+'}{formatPercentage(project.roi_percent)}
                </span>
                <span className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">CURRENT ROI</span>
              </div>
            </div>
          </div>

          {/* Chart B: Budget vs Savings Horizontal Bar */}
          <div className="p-3 rounded bg-[#121319]/40 border border-[#272a34]/40">
            <span className="text-[9px] font-mono font-bold text-slate-400 block mb-2 uppercase">
              Allocation vs Reward Efficiency
            </span>
            <div className="h-[120px] w-full relative">
              <canvas ref={savingsBarRef} />
            </div>
          </div>

          {/* Chart C: Employee Hours Saved */}
          <div className="p-3 rounded bg-[#121319]/40 border border-[#272a34]/40">
            <span className="text-[9px] font-mono font-bold text-slate-400 block mb-2 uppercase">
              Employee Labor Hours Restructured
            </span>
            <div className="h-[120px] w-full relative">
              <canvas ref={hoursSavedRef} />
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400 font-sans">
              Saved <span className="font-mono font-bold text-purple-400">{formatNumber(project.employee_hours_saved)}</span> hours 
              (FTE year benchmark is <span className="font-mono text-slate-500">2,000h</span>)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
