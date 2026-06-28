/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, Check, Filter } from 'lucide-react';
import { TelemetryAlert } from '../types';

interface AlertCenterProps {
  alerts: TelemetryAlert[];
  onDismissAlert: (id: string) => void;
  onClearAll: () => void;
}

export default React.memo(function AlertCenter({
  alerts = [],
  onDismissAlert,
  onClearAll
}: AlertCenterProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Fallback high-density mock alerts if none provided (layout phase)
  const defaultAlerts: TelemetryAlert[] = alerts.length > 0 ? alerts : [
    {
      id: 'alert-1',
      timestamp: '2026-06-28 05:12:00',
      severity: 'critical',
      message: 'Automation execution failed at step: ParseInvoice. System code: OCR_TIMED_OUT',
      projectId: 'PRJ-OCR-42',
      projectName: 'AeroOCR Broker'
    },
    {
      id: 'alert-2',
      timestamp: '2026-06-28 05:10:15',
      severity: 'warning',
      message: 'Negative ROI detected: Budget ($50k) exceeds annualized savings ($12.5k) within first quarter.',
      projectId: 'PRJ-ROI-99',
      projectName: 'Legacy Ledger Sync'
    },
    {
      id: 'alert-3',
      timestamp: '2026-06-28 05:08:44',
      severity: 'info',
      message: 'Active Robot limit reached (95%). Consider upgrading orchestrator node licenses.',
      projectId: 'PRJ-SYS-01',
      projectName: 'Global Node Pool'
    }
  ];

  const filteredAlerts = defaultAlerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getAlertIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getAlertBg = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950/20 border-rose-500/30 text-rose-300';
      case 'warning':
        return 'bg-amber-950/20 border-amber-500/20 text-amber-300';
      case 'info':
        return 'bg-slate-900/40 border-slate-800 text-slate-300';
    }
  };

  const getAlertBadge = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-400">CRITICAL</span>;
      case 'warning':
        return <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">WARNING</span>;
      case 'info':
        return <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">SYSTEM</span>;
    }
  };

  return (
    <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-5 flex flex-col h-full shadow-lg" id="alert-center-panel">
      {/* Panel Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            {defaultAlerts.some(a => a.severity === 'critical') && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Alert Center</h3>
          <span className="rounded-full bg-rose-950/30 border border-rose-500/20 px-2 py-0.5 font-mono text-[10px] text-rose-400 font-bold">
            {defaultAlerts.filter(a => a.severity === 'critical').length} Critical
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="font-sans text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear Non-Critical
        </button>
      </div>

      {/* Segmented Filter Bar */}
      <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-slate-900/60 p-1">
        <Filter className="h-3 w-3 text-slate-500 ml-2" />
        <div className="flex flex-1 gap-1">
          {(['all', 'critical', 'warning', 'info'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`flex-1 rounded py-1 font-mono text-[10px] font-semibold uppercase transition-all ${
                filter === lvl
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 animate-fade-in-up">
            <Check className="h-8 w-8 text-slate-700 stroke-[1.5] mb-2" />
            <p className="font-sans text-xs">All active processes running within nominal operational thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`animate-slide-in-left relative rounded-lg border p-3.5 flex flex-col gap-1.5 transition-all ${getAlertBg(alert.severity)}`}
              id={`alert-card-${alert.id}`}
            >
              {/* Time & Badge Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getAlertIcon(alert.severity)}
                  {getAlertBadge(alert.severity)}
                  <span className="font-mono text-[10px] text-slate-400">
                    {alert.projectId}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-slate-500">
                  {alert.timestamp.substring(11, 19)}
                </span>
              </div>

              {/* Message Body */}
              <p className="font-sans text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                {alert.message}
              </p>

              {/* Scope Metadata */}
              <div className="mt-1 flex items-center justify-between border-t border-slate-900/40 pt-1.5">
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[70%]">
                  Project: <span className="font-sans font-medium text-slate-300">{alert.projectName}</span>
                </span>
                <button
                  onClick={() => onDismissAlert && onDismissAlert(alert.id)}
                  className="flex items-center gap-1 font-mono text-[9px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
