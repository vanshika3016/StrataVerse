/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AnalyticsOverlay — Chart.js analytics modal shown when the stream is paused.
 * Renders four charts computed from a frozen snapshot of the dataset taken at
 * the moment the user clicked "Pause Telemetry".
 *
 * Charts rendered (all via Chart.js only):
 *   1. Savings by Department  — horizontal bar chart
 *   2. Status Distribution    — doughnut chart
 *   3. ROI Distribution       — bar chart (bucketed ranges)
 *   4. Country Savings        — horizontal bar chart (top 8)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
  Title,
  type ChartConfiguration,
} from 'chart.js';
import { X, BarChart3, PieChart, TrendingUp, Globe, Camera, Pause } from 'lucide-react';
import { RpaProject } from '../types';

// Register only the Chart.js components we actually use — no global side effects
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
  Title
);

// ─── Palette ────────────────────────────────────────────────────────────────
const CYAN    = '#06b6d4';
const BLUE    = '#3b82f6';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';
const ROSE    = '#f43f5e';
const PURPLE  = '#a855f7';
const TEAL    = '#14b8a6';
const ORANGE  = '#f97316';

const DEPT_PALETTE  = [CYAN, BLUE, EMERALD, AMBER, ROSE, PURPLE, TEAL, ORANGE];
const STATUS_PALETTE = [EMERALD, CYAN, ROSE, AMBER];
const ROI_PALETTE    = [ROSE, AMBER, BLUE, EMERALD];
const COUNTRY_PALETTE = [BLUE, TEAL, PURPLE, CYAN, ORANGE, EMERALD, AMBER, ROSE];

// Shared Chart.js defaults for the dark terminal aesthetic
const BASE_FONT = { family: 'ui-monospace, "Cascadia Code", monospace', size: 11 };
const GRID_COLOR  = 'rgba(39,42,52,0.8)';
const LABEL_COLOR = '#94a3b8'; // slate-400

// ─── Data derivation from snapshot ──────────────────────────────────────────

function deriveDeptSavings(projects: RpaProject[]) {
  const map: Record<string, number> = {};
  for (const p of projects) {
    map[p.department] = (map[p.department] || 0) + p.annual_savings_usd;
  }
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return {
    labels: entries.map(([k]) => k),
    data:   entries.map(([, v]) => Math.round(v / 1_000_000 * 100) / 100), // $M
  };
}

function deriveStatusDist(projects: RpaProject[]) {
  const map: Record<string, number> = {};
  for (const p of projects) {
    map[p.project_status] = (map[p.project_status] || 0) + 1;
  }
  const order = ['Active', 'Completed', 'Failed', 'Pending'];
  const labels = order.filter(s => map[s] !== undefined);
  return {
    labels,
    data: labels.map(s => map[s] || 0),
  };
}

function deriveRoiDist(projects: RpaProject[]) {
  let neg = 0, low = 0, med = 0, high = 0;
  for (const p of projects) {
    if (p.roi_percent < 0)        neg++;
    else if (p.roi_percent <= 100) low++;
    else if (p.roi_percent <= 500) med++;
    else                           high++;
  }
  return {
    labels: ['Negative (<0%)', 'Low (0–100%)', 'Medium (100–500%)', 'High (>500%)'],
    data:   [neg, low, med, high],
  };
}

function deriveCountrySavings(projects: RpaProject[]) {
  const map: Record<string, number> = {};
  for (const p of projects) {
    map[p.country] = (map[p.country] || 0) + p.annual_savings_usd;
  }
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    labels: entries.map(([k]) => k),
    data:   entries.map(([, v]) => Math.round(v / 1_000_000 * 100) / 100),
  };
}

// ─── Single chart hook ───────────────────────────────────────────────────────

function useChart(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: ChartConfiguration | null
) {
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;

    // Destroy any previous instance on this canvas
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvas, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // config is derived from snapshot — stable after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Individual chart panels ─────────────────────────────────────────────────

interface ChartPanelProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

function ChartPanel({ title, subtitle, icon, canvasRef }: ChartPanelProps) {
  return (
    <div className="bg-[#121319] border border-[#272a34] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#272a34]/60 pb-2.5">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{subtitle}</span>
      </div>
      <div className="relative w-full" style={{ height: 210 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ─── Savings by Department chart ─────────────────────────────────────────────

function DeptSavingsChart({ projects }: { projects: RpaProject[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { labels, data } = deriveDeptSavings(projects);

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Annual Savings ($M)',
        data,
        backgroundColor: labels.map((_, i) => DEPT_PALETTE[i % DEPT_PALETTE.length] + '33'),
        borderColor:     labels.map((_, i) => DEPT_PALETTE[i % DEPT_PALETTE.length]),
        borderWidth: 1,
        borderRadius: 3,
        barThickness: 18,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.x.toFixed(2)}M`,
          },
          backgroundColor: '#1b1d24',
          borderColor: '#272a34',
          borderWidth: 1,
          titleColor: LABEL_COLOR,
          bodyColor: '#e2e8f0',
          titleFont: BASE_FONT,
          bodyFont: BASE_FONT,
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: { color: LABEL_COLOR, font: BASE_FONT, callback: v => `$${v}M` },
        },
        y: {
          grid: { display: false },
          ticks: { color: LABEL_COLOR, font: BASE_FONT },
        },
      },
    },
  };

  useChart(ref, config);

  return (
    <ChartPanel
      title="Savings by Department"
      subtitle="USD Annual · $M"
      icon={<BarChart3 className="h-4 w-4 text-cyan-400" />}
      canvasRef={ref}
    />
  );
}

// ─── Status Distribution chart ────────────────────────────────────────────────

function StatusChart({ projects }: { projects: RpaProject[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { labels, data } = deriveStatusDist(projects);
  const total = data.reduce((s, v) => s + v, 0);

  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: STATUS_PALETTE.slice(0, labels.length).map(c => c + '33'),
        borderColor:     STATUS_PALETTE.slice(0, labels.length),
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: LABEL_COLOR,
            font: BASE_FONT,
            padding: 12,
            boxWidth: 10,
            boxHeight: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
            },
          },
          backgroundColor: '#1b1d24',
          borderColor: '#272a34',
          borderWidth: 1,
          titleColor: LABEL_COLOR,
          bodyColor: '#e2e8f0',
          titleFont: BASE_FONT,
          bodyFont: BASE_FONT,
        },
      },
    },
  };

  useChart(ref, config);

  return (
    <ChartPanel
      title="Status Distribution"
      subtitle="Process Count"
      icon={<PieChart className="h-4 w-4 text-emerald-400" />}
      canvasRef={ref}
    />
  );
}

// ─── ROI Distribution chart ───────────────────────────────────────────────────

function RoiChart({ projects }: { projects: RpaProject[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { labels, data } = deriveRoiDist(projects);

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Projects',
        data,
        backgroundColor: ROI_PALETTE.map(c => c + '33'),
        borderColor:     ROI_PALETTE,
        borderWidth: 1,
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString()} projects` },
          backgroundColor: '#1b1d24',
          borderColor: '#272a34',
          borderWidth: 1,
          titleColor: LABEL_COLOR,
          bodyColor: '#e2e8f0',
          titleFont: BASE_FONT,
          bodyFont: BASE_FONT,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: LABEL_COLOR, font: { ...BASE_FONT, size: 9 } },
        },
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: LABEL_COLOR, font: BASE_FONT, stepSize: 1 },
        },
      },
    },
  };

  useChart(ref, config);

  return (
    <ChartPanel
      title="ROI Distribution"
      subtitle="Project Buckets"
      icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
      canvasRef={ref}
    />
  );
}

// ─── Country Savings chart ────────────────────────────────────────────────────

function CountryChart({ projects }: { projects: RpaProject[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { labels, data } = deriveCountrySavings(projects);

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Annual Savings ($M)',
        data,
        backgroundColor: labels.map((_, i) => COUNTRY_PALETTE[i % COUNTRY_PALETTE.length] + '33'),
        borderColor:     labels.map((_, i) => COUNTRY_PALETTE[i % COUNTRY_PALETTE.length]),
        borderWidth: 1,
        borderRadius: 3,
        barThickness: 18,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` $${ctx.parsed.x.toFixed(2)}M` },
          backgroundColor: '#1b1d24',
          borderColor: '#272a34',
          borderWidth: 1,
          titleColor: LABEL_COLOR,
          bodyColor: '#e2e8f0',
          titleFont: BASE_FONT,
          bodyFont: BASE_FONT,
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: { color: LABEL_COLOR, font: BASE_FONT, callback: v => `$${v}M` },
        },
        y: {
          grid: { display: false },
          ticks: { color: LABEL_COLOR, font: BASE_FONT },
        },
      },
    },
  };

  useChart(ref, config);

  return (
    <ChartPanel
      title="Country Savings"
      subtitle="Top 8 · USD Annual · $M"
      icon={<Globe className="h-4 w-4 text-blue-400" />}
      canvasRef={ref}
    />
  );
}

// ─── Main overlay component ──────────────────────────────────────────────────

interface AnalyticsOverlayProps {
  snapshot: RpaProject[];          // frozen dataset captured at pause time
  snapshotSize: number;            // total rows in the frozen snapshot
  snapshotTimestamp: string;       // ISO-like string of when pause was clicked
  onClose: () => void;
}

export default function AnalyticsOverlay({
  snapshot,
  snapshotSize,
  snapshotTimestamp,
  onClose,
}: AnalyticsOverlayProps) {

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(8,9,12,0.85)', backdropFilter: 'blur(3px)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Paused stream analytics overlay"
    >
      {/* Modal panel */}
      <div
        className="relative flex flex-col bg-[#111216] border border-[#272a34] rounded-xl shadow-2xl w-full max-w-5xl mx-4"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a34] shrink-0">
          <div className="flex items-center gap-3">
            {/* Paused indicator */}
            <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-800/40 rounded px-2.5 py-1">
              <Pause className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Stream Paused
              </span>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-tight">
                Analytics View — Frozen Snapshot
              </h2>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Captured {snapshotTimestamp} · {snapshotSize.toLocaleString()} records · Chart.js v4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#1b1d24] border border-[#272a34] rounded px-2.5 py-1">
              <Camera className="h-3 w-3 text-slate-500" />
              <span className="text-[10px] font-mono text-slate-400">
                Static snapshot · live updates frozen
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded border border-[#272a34] bg-[#1b1d24] hover:bg-rose-950/30 hover:border-rose-800/40 text-slate-400 hover:text-rose-400 transition-all"
              aria-label="Close analytics overlay"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Chart grid ── */}
        <div
          className="flex-1 overflow-y-auto p-5"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Each chart mounts independently — isolated canvas lifecycle */}
            <DeptSavingsChart   projects={snapshot} />
            <StatusChart        projects={snapshot} />
            <RoiChart           projects={snapshot} />
            <CountryChart       projects={snapshot} />
          </div>

          {/* Footer note */}
          <p className="mt-4 text-center text-[10px] font-mono text-slate-600">
            All charts rendered with Chart.js · Data frozen at pause time · Resume stream to collect new data
          </p>
        </div>
      </div>
    </div>
  );
}
