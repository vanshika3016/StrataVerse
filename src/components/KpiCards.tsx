/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { XCircle, ShieldAlert, PauseCircle } from 'lucide-react';

interface KpiCardsProps {
  failedProcesses: number;
  queueErrors: number;
  pausedAutomations: number;
  isStreaming?: boolean;
}

export default React.memo(function KpiCards({
  failedProcesses = 0,
  queueErrors = 0,
  pausedAutomations = 0,
  isStreaming = true
}: KpiCardsProps) {
  
  // Local states to fluctuate failure rates and queue error rates slightly when streaming is active
  const [failsDelta, setFailsDelta] = useState(2);
  const [errorsDelta, setErrorsDelta] = useState(3);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Small fluctuation for failures rate (e.g. +1 to +3 errors/hr)
      setFailsDelta(prev => Math.max(1, Math.min(5, prev + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
      // Small fluctuation for queue errors rate (e.g. +2 to +5 per min)
      setErrorsDelta(prev => Math.max(1, Math.min(8, prev + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
    }, 1500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const cards = [
    {
      id: 'kpi-failed-processes',
      title: 'FAILED PROCESSES',
      value: failedProcesses.toLocaleString(),
      icon: <XCircle className="h-4 w-4 text-rose-500" />,
      subText: 'Requires operator action',
      borderClass: 'border-l-2 border-l-rose-500 hover:border-rose-500/40',
      badge: 'CRITICAL',
      badgeColor: 'bg-rose-950/40 border-rose-900/30 text-rose-400',
      delta: isStreaming ? (
        <span className="text-rose-400 animate-pulse">
          ▲ +{failsDelta} failures/hr
        </span>
      ) : (
        <span className="text-slate-500">
          0 failures/hr (PAUSED)
        </span>
      )
    },
    {
      id: 'kpi-queue-errors',
      title: 'QUEUE ERRORS',
      value: queueErrors.toLocaleString(),
      icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
      subText: 'Transaction queue anomalies',
      borderClass: 'border-l-2 border-l-amber-500 hover:border-amber-500/40',
      badge: 'WARNING',
      badgeColor: 'bg-amber-950/40 border-amber-900/30 text-amber-400',
      delta: isStreaming ? (
        <span className="text-amber-400 animate-pulse">
          ▲ +{errorsDelta} anomalies/min
        </span>
      ) : (
        <span className="text-slate-500">
          0 anomalies/min (PAUSED)
        </span>
      )
    },
    {
      id: 'kpi-paused-automations',
      title: 'PAUSED AUTOMATIONS',
      value: pausedAutomations.toLocaleString(),
      icon: <PauseCircle className="h-4 w-4 text-sky-400" />,
      subText: 'Currently suspended workflows',
      borderClass: 'border-l-2 border-l-sky-500 hover:border-sky-500/40',
      badge: 'STANDBY',
      badgeColor: 'bg-sky-950/40 border-sky-900/30 text-sky-400',
      delta: !isStreaming ? (
        <span className="text-amber-400 animate-pulse font-bold">
          ▲ Stream suspended
        </span>
      ) : (
        <span className="text-sky-400/90 font-medium">
          ▲ Stable state
        </span>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="kpi-section">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 flex flex-col justify-between shadow-md transition-colors ${card.borderClass}`}
          id={card.id}
        >
          {/* Top Row: Title, badge and icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <div className="text-slate-500 opacity-80">
              {card.icon}
            </div>
          </div>

          {/* KPI Value & Trend Delta */}
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {card.value}
            </span>
            <div className="text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1 select-none">
              {card.delta}
            </div>
          </div>

          {/* Footer Label */}
          <div className="mt-1 border-t border-[#272a34]/40 pt-1.5 flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] text-slate-500">
              {card.subText}
            </span>
            <span className="text-[9px] font-mono text-slate-500">ORCHESTRATOR</span>
          </div>
        </div>
      ))}
    </div>
  );
});
