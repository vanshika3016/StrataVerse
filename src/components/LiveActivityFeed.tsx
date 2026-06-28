/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, Cpu, RefreshCw, Layers, Play, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { StreamEvent } from '../types';

interface LiveActivityFeedProps {
  events: StreamEvent[];
  isStreaming: boolean;
}

export default React.memo(function LiveActivityFeed({
  events = [],
  isStreaming
}: LiveActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom as new event logs stream in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  // Fallback high-density mock events if none provided (layout phase)
  const defaultEvents: StreamEvent[] = events.length > 0 ? events : [
    {
      id: 'evt-1',
      timestamp: '2026-06-28 05:24:50',
      type: 'status_change',
      message: 'Orchestration node DE-MUC-9 online. Ready for execution cycles.'
    },
    {
      id: 'evt-2',
      timestamp: '2026-06-28 05:24:51',
      type: 'update',
      message: 'Batch received: processed 12 records. Cumulative savings increased by $240,500.'
    },
    {
      id: 'evt-3',
      timestamp: '2026-06-28 05:24:53',
      type: 'anomaly',
      message: 'Anomaly detected in AeroOCR Broker: extreme macro savings volatility (+34%).'
    },
    {
      id: 'evt-4',
      timestamp: '2026-06-28 05:24:55',
      type: 'update',
      message: 'Batch received: processed 45 records. Active robot orchestration pool balanced.'
    }
  ];

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'started':
        return {
          icon: <Play className="h-3 w-3 text-cyan-400 fill-cyan-400/20" />,
          colorClass: 'text-cyan-300 font-semibold',
          badgeClass: 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
          colorClass: 'text-emerald-300 font-medium',
          badgeClass: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
        };
      case 'updated':
        return {
          icon: <Layers className="h-3 w-3 text-slate-400" />,
          colorClass: 'text-slate-300',
          badgeClass: 'bg-slate-900/40 border-slate-850 text-slate-400'
        };
      case 'rescheduled':
        return {
          icon: <Clock className="h-3 w-3 text-amber-400" />,
          colorClass: 'text-amber-300/90 font-mono',
          badgeClass: 'bg-amber-950/40 border-amber-500/20 text-amber-400'
        };
      case 'failed':
        return {
          icon: <XCircle className="h-3 w-3 text-rose-400 animate-pulse" />,
          colorClass: 'text-rose-400 font-bold',
          badgeClass: 'bg-rose-950/40 border-rose-500/20 text-rose-400'
        };
      case 'anomaly':
        return {
          icon: <ShieldAlert className="h-3 w-3 text-rose-400" />,
          colorClass: 'text-rose-400 font-bold',
          badgeClass: 'bg-rose-950/40 border-rose-500/20 text-rose-400'
        };
      case 'status_change':
        return {
          icon: <Cpu className="h-3 w-3 text-cyan-400" />,
          colorClass: 'text-cyan-400 font-semibold',
          badgeClass: 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
        };
      default:
        return {
          icon: <Layers className="h-3 w-3 text-emerald-400" />,
          colorClass: 'text-emerald-300',
          badgeClass: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
        };
    }
  };

  return (
    <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-5 flex flex-col h-full shadow-lg" id="live-feed-panel">
      {/* Panel Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Live Activity Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono text-[10px] text-slate-500">
            {isStreaming ? 'FEED ACTIVE' : 'FEED IDLE'}
          </span>
        </div>
      </div>

      {/* Terminal Display */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-[#121319] border border-[#272a34] rounded-lg p-3 font-mono text-[11px] leading-relaxed max-h-[220px] scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent space-y-2"
        id="terminal-display"
      >
        <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
          <RefreshCw className={`h-3 w-3 ${isStreaming ? 'animate-spin' : ''}`} />
          <span>System Console Feed</span>
        </div>

        <div className="space-y-1.5">
          {defaultEvents.map((event) => {
            const style = getEventStyle(event.type);
            return (
              <div
                key={event.id}
                className="animate-stream-in flex items-start gap-2 border-b border-slate-950/50 pb-1"
              >
                {/* Timestamp */}
                <span className="text-slate-600 shrink-0 select-none">
                  [{event.timestamp.substring(11, 19)}]
                </span>

                {/* Badge */}
                <span className={`inline-flex items-center gap-1 rounded border px-1 py-0.5 text-[8px] font-bold uppercase ${style.badgeClass} shrink-0`}>
                  {style.icon}
                  <span>{event.type}</span>
                </span>

                {/* Message */}
                <span className={`flex-1 break-all ${style.colorClass}`}>
                  {event.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
