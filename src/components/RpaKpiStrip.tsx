/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Cpu, Layers, DollarSign } from 'lucide-react';

interface RpaKpiStripProps {
  totalStreamedRows: number;
  activeRobots: number;
  globalSavings: number;
  isStreaming?: boolean;
}

export default React.memo(function RpaKpiStrip({
  totalStreamedRows,
  activeRobots,
  globalSavings,
  isStreaming = true
}: RpaKpiStripProps) {
  
  // Local state to simulate small fluctuations in rate deltas for realism
  const [rowsRate, setRowsRate] = useState(125);
  const [botsRate, setBotsRate] = useState(42);
  const [savingsRate, setSavingsRate] = useState(8420);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Fluctuate rows rate around 125
      setRowsRate(prev => Math.max(90, Math.min(160, prev + Math.floor(Math.random() * 11) - 5)));
      // Fluctuate bots rate around 42
      setBotsRate(prev => Math.max(30, Math.min(55, prev + Math.floor(Math.random() * 5) - 2)));
      // Fluctuate savings rate around 8420
      setSavingsRate(prev => Math.max(7800, Math.min(9100, prev + Math.floor(Math.random() * 201) - 100)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const formatKMB = (val: number): string => {
    if (val >= 1e9) {
      return `$${(val / 1e9).toFixed(2)}B`;
    }
    if (val >= 1e6) {
      return `$${(val / 1e6).toFixed(2)}M`;
    }
    if (val >= 1e3) {
      return `$${(val / 1e3).toFixed(1)}K`;
    }
    return `$${val}`;
  };

  const formatInteger = (val: number): string => {
    return val.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="rpa-kpi-strip">
      {/* Card 1: TOTAL STREAMED ROWS */}
      <div 
        className="bg-[#1b1d24] border border-[#272a34] border-l-2 border-l-cyan-500 rounded-lg p-6 flex flex-col justify-between shadow-md hover:border-cyan-500/40 transition-colors" 
        id="kpi-streamed-rows"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">TOTAL STREAMED ROWS</span>
          <Layers className="h-3.5 w-3.5 text-cyan-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {formatInteger(totalStreamedRows)}
          </span>
          <div className="text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1 select-none">
            {isStreaming ? (
              <span className="text-emerald-400 animate-pulse flex items-center gap-0.5">
                ▲ +{rowsRate} rows/sec
              </span>
            ) : (
              <span className="text-slate-500">
                0 rows/sec (PAUSED)
              </span>
            )}
          </div>
        </div>
        <div className="mt-1 border-t border-[#272a34]/40 pt-1.5 flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] text-slate-500">Live telemetry records processed</span>
          <span className="text-[9px] font-mono text-cyan-500 font-bold tracking-tight">VIRTUALIZED</span>
        </div>
      </div>

      {/* Card 2: ACTIVE ROBOTS */}
      <div 
        className="bg-[#1b1d24] border border-[#272a34] border-l-2 border-l-sky-500 rounded-lg p-6 flex flex-col justify-between shadow-md hover:border-sky-500/40 transition-colors" 
        id="kpi-active-robots"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">ACTIVE ROBOTS</span>
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {formatInteger(activeRobots)}
          </span>
          <div className="text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1 select-none">
            {isStreaming ? (
              <span className="text-emerald-400 animate-pulse flex items-center gap-0.5">
                ▲ +{botsRate} bots/min
              </span>
            ) : (
              <span className="text-slate-500">
                0 bots/min (PAUSED)
              </span>
            )}
          </div>
        </div>
        <div className="mt-1 border-t border-[#272a34]/40 pt-1.5 flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] text-slate-500">Currently deployed bots</span>
          <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-tight">AUTO_SCALE</span>
        </div>
      </div>

      {/* Card 3: GLOBAL SAVINGS */}
      <div 
        className="bg-[#1b1d24] border border-[#272a34] border-l-2 border-l-emerald-500 rounded-lg p-6 flex flex-col justify-between shadow-md hover:border-emerald-500/40 transition-colors" 
        id="kpi-global-savings"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">GLOBAL SAVINGS</span>
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {formatKMB(globalSavings)}
          </span>
          <div className="text-[10px] sm:text-[11px] font-mono font-semibold flex items-center gap-1 select-none">
            {isStreaming ? (
              <span className="text-emerald-400 animate-pulse flex items-center gap-0.5">
                ▲ +${savingsRate.toLocaleString()}/sec
              </span>
            ) : (
              <span className="text-slate-500">
                +$0/sec (PAUSED)
              </span>
            )}
          </div>
        </div>
        <div className="mt-1 border-t border-[#272a34]/40 pt-1.5 flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] text-slate-500">Accumulated annual savings</span>
          <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-tight">ROI_INDEXED</span>
        </div>
      </div>
    </div>
  );
});
