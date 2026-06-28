/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import AnalyticsCharts from './components/AnalyticsCharts';
import AlertCenter from './components/AlertCenter';
import LiveActivityFeed from './components/LiveActivityFeed';
import MainTable from './components/MainTable';
import AnalyticsOverlay from './components/AnalyticsOverlay';
import ProjectInspector from './components/ProjectInspector';
import RpaKpiStrip from './components/RpaKpiStrip';
import { RpaProject, TelemetryAlert, StreamEvent, SortRule } from './types';
import { 
  Sliders, Search, Filter, Play, Pause, RefreshCw, Trash2, 
  Settings, Check, MonitorPlay, LineChart, HardDrive, ShieldAlert, X, ChevronDown, Cpu, Activity
} from 'lucide-react';

// Fast CSV Parser matching schema rules
const parseCsvData = (csvText: string): RpaProject[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').length > lines[0].split(',').length 
    ? lines[0].split('\t').map(h => h.trim()) 
    : lines[0].split(',').map(h => h.trim());

  const parsedData: RpaProject[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const line = lines[i];
    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    if (values.length === headers.length) {
      const rowObject: any = { internal_uid: `uid-row-${i}` };
      
      headers.forEach((header, index) => {
        const val = values[index];
        if (['robots_deployed', 'annual_savings_usd', 'budget_usd', 'employee_hours_saved', 'employee_count', 'annual_revenue_usd', 'customer_count', 'founded_year'].includes(header)) {
          rowObject[header] = parseInt(val, 10) || 0;
        } else if (['roi_percent', 'market_share_percent'].includes(header)) {
          rowObject[header] = parseFloat(val) || 0.00;
        } else {
          rowObject[header] = val;
        }
      });
      parsedData.push(rowObject as RpaProject);
    }
  }
  return parsedData;
};

export default function App() {
  // Top-Level Application State
  const [projectsMap, setProjectsMap] = useState<Map<string, RpaProject>>(new Map());
  const projects = useMemo(() => Array.from(projectsMap.values()), [projectsMap]);
  const rpaKpiStats = useMemo(() => {
    let totalSavings = 0;
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      totalSavings += p.annual_savings_usd || 0;
    }
    const activeRobots = projects.filter(
      p => p.project_status === "Active"
    ).reduce(
      (sum, p) => sum + Number(p.robots_deployed || 0),
      0
    );
    return {
      totalStreamedRows: projects.length,
      activeRobots: activeRobots,
      globalSavings: totalSavings
    };
  }, [projects]);
  const [totalStreamedRows, setTotalStreamedRows] = useState<number>(0);
  const [alerts, setAlerts] = useState<TelemetryAlert[]>([]);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [bufferedCount, setBufferedCount] = useState<number>(0);
  const [renderedRowsCount, setRenderedRowsCount] = useState<number>(0);

  // Paused-stream analytics overlay state
  const [pausedSnapshot, setPausedSnapshot] = useState<RpaProject[] | null>(null);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<string>('');
  const [showAnalyticsOverlay, setShowAnalyticsOverlay] = useState<boolean>(false);

  // Active Workspace Tab (Default landing tab is Live Operations)
  const [activeTab, setActiveTab] = useState<'live_ops' | 'analytics' | 'diagnostics' | 'control' | 'settings'>('live_ops');

  // Search & Filters Centralized States
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selectedDepartments');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selectedIndustries');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedAutomationTypes, setSelectedAutomationTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('selectedAutomationTypes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // MainTable Column Visibility and Sorting states, passed down as props
  const [sortRules, setSortRules] = useState<SortRule[]>(() => {
    try {
      const saved = localStorage.getItem('sortRules');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('visibleColumns');
      if (saved) {
        let cols = JSON.parse(saved) as string[];
        if (cols.includes('implementation_partner')) {
          cols = cols.map(c => c === 'implementation_partner' ? 'automation_type' : c);
        }
        return cols;
      }
      return [
        'project_name', 'department', 'project_status', 'robots_deployed', 
        'roi_percent', 'annual_savings_usd', 'automation_type', 'country', 'industry'
      ];
    } catch (e) {
      return [
        'project_name', 'department', 'project_status', 'robots_deployed', 
        'roi_percent', 'annual_savings_usd', 'automation_type', 'country', 'industry'
      ];
    }
  });

  // Layout preference states (Workspace Configurations)
  interface DashboardPrefs {
    showKpis: boolean;
    showCharts: boolean;
    showAlertCenter: boolean;
    showActivityFeed: boolean;
    compactMode: boolean;
  }

  const [dashboardPrefs, setDashboardPrefs] = useState<DashboardPrefs>(() => {
    try {
      const saved = localStorage.getItem('dashboardPrefs');
      return saved ? JSON.parse(saved) : {
        showKpis: true,
        showCharts: true,
        showAlertCenter: true,
        showActivityFeed: true,
        compactMode: false
      };
    } catch (e) {
      return {
        showKpis: true,
        showCharts: true,
        showAlertCenter: true,
        showActivityFeed: true,
        compactMode: false
      };
    }
  });

  // ==========================================
  // Project Inspector & Toast Notification States
  // ==========================================
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
  }, []);

  const handleRowClick = useCallback((proj: RpaProject) => {
    if (isStreaming) {
      showToast("Pause telemetry to inspect project details.", "warning");
      return;
    }
    setSelectedProjectUid(proj.internal_uid);
  }, [isStreaming, showToast]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectUid) return null;
    return projectsMap.get(selectedProjectUid) || projects.find(p => p.internal_uid === selectedProjectUid) || null;
  }, [selectedProjectUid, projectsMap, projects]);

  // Auto-clear toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close inspector if telemetry resumes
  useEffect(() => {
    if (isStreaming) {
      setSelectedProjectUid(null);
    }
  }, [isStreaming]);

  // Trackers for active filters click lists (dropdown visual states)
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'dept' | 'industry' | 'tech' | null>(null);
  
  // Refs for closing filter dropdowns when clicking outside
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setActiveFilterDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state values to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('selectedDepartments', JSON.stringify(selectedDepartments));
    } catch (e) { console.error(e); }
  }, [selectedDepartments]);

  useEffect(() => {
    try {
      localStorage.setItem('selectedIndustries', JSON.stringify(selectedIndustries));
    } catch (e) { console.error(e); }
  }, [selectedIndustries]);

  useEffect(() => {
    try {
      localStorage.setItem('selectedAutomationTypes', JSON.stringify(selectedAutomationTypes));
    } catch (e) { console.error(e); }
  }, [selectedAutomationTypes]);

  useEffect(() => {
    try {
      localStorage.setItem('sortRules', JSON.stringify(sortRules));
    } catch (e) { console.error(e); }
  }, [sortRules]);

  useEffect(() => {
    try {
      localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
    } catch (e) { console.error(e); }
  }, [visibleColumns]);

  useEffect(() => {
    try {
      localStorage.setItem('dashboardPrefs', JSON.stringify(dashboardPrefs));
    } catch (e) { console.error(e); }
  }, [dashboardPrefs]);

  const isStreamingRef = useRef<boolean>(true);
  const bufferedUpdatesRef = useRef<RpaProject[]>([]);
  const projectsRef = useRef<RpaProject[]>([]);

  // Telemetry rate tracking refs
  const lastBatchTimesRef = useRef<{ timestamp: number; size: number }[]>([]);
  const [updatesPerSecond, setUpdatesPerSecond] = useState<number>(0);

  // Filter elapsed benchmark tracker
  const filterElapsedMsRef = useRef<number>(0);

  // Synchronize state value to Ref to bypass setInterval closures
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Load baseline CSV on mount
  useEffect(() => {
    const loadBaseline = async () => {
      try {
        console.log('📡 [Command Hub] Fetching initial schema baseline CSV...');
        const response = await fetch('/rpa_database_2026.csv');
        if (!response.ok) {
          throw new Error(`CSV loading error: ${response.status}`);
        }
        const text = await response.text();
        const parsed = parseCsvData(text);
        
        // Scale the dataset to exactly 50,000 records to show low-latency streaming and high-volume virtualization
        const scaledMap = new Map<string, RpaProject>();
        const TARGET_SIZE = 50000;
        
        if (parsed.length > 0) {
          for (let i = 0; i < TARGET_SIZE; i++) {
            const baseProj = parsed[i % parsed.length];
            const idNum = 10000 + i;
            const uid = `uid-scaled-${i}`;
            scaledMap.set(uid, {
              ...baseProj,
              internal_uid: uid,
              project_id: `PRJ-${idNum}`,
              project_name: `${baseProj.project_name} (Node ${i})`,
              robots_deployed: Math.max(1, baseProj.robots_deployed + (i % 5) - 2),
              annual_savings_usd: Math.max(5000, baseProj.annual_savings_usd + (i % 100) * 120),
              budget_usd: Math.max(5000, baseProj.budget_usd + (i % 50) * 220),
              roi_percent: parseFloat((((Math.max(5000, baseProj.annual_savings_usd + (i % 100) * 120) - Math.max(5000, baseProj.budget_usd + (i % 50) * 220)) / Math.max(5000, baseProj.budget_usd + (i % 50) * 220)) * 100).toFixed(2))
            });
          }
        } else {
          // Fallback if parsing fails or CSV is empty
          for (let i = 0; i < TARGET_SIZE; i++) {
            const uid = `uid-scaled-${i}`;
            const idNum = 10000 + i;
            scaledMap.set(uid, {
              internal_uid: uid,
              project_id: `PRJ-${idNum}`,
              project_name: `Automated Pipeline Service (Node ${i})`,
              department: i % 4 === 0 ? 'Finance' : i % 4 === 1 ? 'HR' : i % 4 === 2 ? 'Sales' : 'Operations',
              project_status: i % 15 === 0 ? 'Failed' : i % 3 === 0 ? 'Completed' : 'Active',
              automation_type: i % 3 === 0 ? 'AI/ML' : i % 2 === 0 ? 'RPA' : 'Cognitive',
              robots_deployed: Math.max(1, (i % 12) + 1),
              annual_savings_usd: 120000 + (i % 100) * 500,
              budget_usd: 45000 + (i % 50) * 300,
              roi_percent: parseFloat((((120000 + (i % 100) * 500 - (45000 + (i % 50) * 300)) / (45000 + (i % 50) * 300)) * 100).toFixed(2)),
              start_date: '2026-01-10',
              employee_hours_saved: 1200 + (i % 100) * 10,
              country: i % 3 === 0 ? 'United States' : i % 3 === 1 ? 'Germany' : 'United Kingdom',
              industry: i % 3 === 0 ? 'Technology' : i % 3 === 1 ? 'Banking' : 'Healthcare',
              implementation_partner: i % 2 === 0 ? 'Cognizant' : 'Accenture'
            });
          }
        }
        
        setProjectsMap(scaledMap);
        
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        setEvents([
          {
            id: 'boot-log-1',
            timestamp: nowStr,
            type: 'status_change',
            message: 'STARTED: Command Terminal Online. Initialized memory grid with 50,000 highly scalable enterprise projects.'
          }
        ]);
        console.log(`✅ [Command Hub] Successfully initialized master table with 50,000 items.`);
      } catch (err) {
        console.error('❌ [Command Hub] Baseline load error:', err);
      }
    };

    loadBaseline();
  }, []);

  // Compute live average updates per second (Hz) based on moving average
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      lastBatchTimesRef.current = lastBatchTimesRef.current.filter(t => now - t.timestamp < 5000);
      
      if (lastBatchTimesRef.current.length >= 2) {
        const first = lastBatchTimesRef.current[0];
        const last = lastBatchTimesRef.current[lastBatchTimesRef.current.length - 1];
        const durationSec = (last.timestamp - first.timestamp) / 1000;
        
        if (durationSec > 0.1) {
          const totalRows = lastBatchTimesRef.current.slice(1).reduce((sum, item) => sum + item.size, 0);
          setUpdatesPerSecond(parseFloat((totalRows / durationSec).toFixed(1)));
        } else {
          setUpdatesPerSecond(0);
        }
      } else if (lastBatchTimesRef.current.length === 1 && isStreaming) {
        setUpdatesPerSecond(lastBatchTimesRef.current[0].size);
      } else {
        setUpdatesPerSecond(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Set up pipeline alert & activity log engine
  const handleNewStreamBatch = useCallback((batch: RpaProject[]) => {
    setTotalStreamedRows(prev => prev + batch.length);

    const now = Date.now();
    lastBatchTimesRef.current.push({ timestamp: now, size: batch.length });

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newEvents: StreamEvent[] = [];
    const newAlerts: TelemetryAlert[] = [];

    // Process a clean sampled subset for logs to maintain absolute high-density clarity without console flood
    const logSample = batch.slice(0, 3);
    
    logSample.forEach((proj) => {
      const randSuffix = Math.random().toString(36).substring(2, 9);
      const randVal = Math.random();

      if (proj.project_status === 'Failed') {
        newEvents.push({
          id: `evt-fail-${proj.project_id}-${Date.now()}-${randSuffix}`,
          timestamp: nowStr,
          type: 'failed',
          message: `FAILED: Execution terminated on ${proj.project_name} [${proj.project_id}] due to engine error: SERVICE_TERMINATION_ERR.`
        });

        newAlerts.push({
          id: `alert-f-${proj.internal_uid}-${Date.now()}-${randSuffix}`,
          timestamp: nowStr,
          severity: 'critical',
          message: `RPA execution failed during target routine. System code: SERVICE_TERMINATION_ERR.`,
          projectId: proj.project_id,
          projectName: proj.project_name
        });
      } else if (proj.roi_percent < 0) {
        newEvents.push({
          id: `evt-roi-${proj.project_id}-${Date.now()}-${randSuffix}`,
          timestamp: nowStr,
          type: 'updated',
          message: `UPDATED: ROI is currently negative (${proj.roi_percent}%) on ${proj.project_name} [${proj.project_id}].`
        });

        newAlerts.push({
          id: `alert-roi-${proj.internal_uid}-${Date.now()}-${randSuffix}`,
          timestamp: nowStr,
          severity: 'warning',
          message: `Negative ROI threshold exceeded: net savings fall short of operational allocation budget.`,
          projectId: proj.project_id,
          projectName: proj.project_name
        });
      } else {
        if (randVal < 0.25) {
          newEvents.push({
            id: `evt-started-${proj.project_id}-${Date.now()}-${randSuffix}`,
            timestamp: nowStr,
            type: 'started',
            message: `STARTED: Launching automated run for ${proj.project_name} [${proj.project_id}] across deployed cluster.`
          });
        } else if (randVal < 0.50) {
          newEvents.push({
            id: `evt-completed-${proj.project_id}-${Date.now()}-${randSuffix}`,
            timestamp: nowStr,
            type: 'completed',
            message: `COMPLETED: ${proj.project_name} [${proj.project_id}] completed processing run successfully.`
          });
        } else if (randVal < 0.75) {
          newEvents.push({
            id: `evt-resched-${proj.project_id}-${Date.now()}-${randSuffix}`,
            timestamp: nowStr,
            type: 'rescheduled',
            message: `RESCHEDULED: ${proj.project_name} [${proj.project_id}] delayed by 5s for peak traffic load balancing.`
          });
        } else {
          newEvents.push({
            id: `evt-updated-${proj.project_id}-${Date.now()}-${randSuffix}`,
            timestamp: nowStr,
            type: 'updated',
            message: `UPDATED: ${proj.project_name} [${proj.project_id}] synchronizing telemetry payload. Savings: $${proj.annual_savings_usd.toLocaleString()}.`
          });
        }
      }
    });

    setEvents(prev => {
      const combined = [...prev, ...newEvents];
      return combined.slice(-40);
    });

    if (newAlerts.length > 0) {
      const dedupedNewAlerts: TelemetryAlert[] = [];
      const seenAlertKeys = new Set<string>();
      for (let i = newAlerts.length - 1; i >= 0; i--) {
        const a = newAlerts[i];
        const key = `${a.projectId}-${a.severity}`;
        if (!seenAlertKeys.has(key)) {
          seenAlertKeys.add(key);
          dedupedNewAlerts.unshift(a);
        }
      }

      setAlerts(prev => {
        const filteredPrev = prev.filter(p => !dedupedNewAlerts.some(n => n.projectId === p.projectId && n.severity === p.severity));
        const combined = [...dedupedNewAlerts, ...filteredPrev];
        return combined.slice(0, 25);
      });
    }
  }, []);

  // Connect to global initializeRpaStream
  useEffect(() => {
    let active = true;
    let timeoutId: any = null;

    const setupStream = () => {
      if (typeof window !== 'undefined' && (window as any).initializeRpaStream) {
        console.log('📡 [Command Hub] Subscribing to high-frequency stream callback...');
        (window as any).initializeRpaStream((incomingBatch: RpaProject[]) => {
          if (!active) return;

          // Map incoming updates to scaled indices so we actively update the 50,000 records
          const scaledIncoming = incomingBatch.map(u => {
            const match = u.internal_uid.match(/uid-row-(\d+)/);
            if (match) {
              const baseIdx = parseInt(match[1], 10) - 1;
              
              // Concentration mapping: ensure 30% of updates land on the top 100 rows
              // (which are highly visible in the viewport) to show active, dynamic streaming.
              // The other 70% of updates are distributed across the entire 50,000 record space.
              let scaledIdx;
              if (Math.random() < 0.3) {
                scaledIdx = Math.floor(Math.random() * 100);
              } else {
                const maxK = Math.floor(50000 / 550); // Map to one of the 90 scaled groups
                const k = Math.floor(Math.random() * maxK);
                scaledIdx = Math.min(49999, baseIdx + k * 550);
              }
              const targetUid = `uid-scaled-${scaledIdx}`;
              
              return {
                ...u,
                internal_uid: targetUid,
                project_id: `PRJ-${10000 + scaledIdx}`,
                project_name: `${u.project_name} (Node ${scaledIdx})`
              };
            }
            return u;
          });

          if (!isStreamingRef.current) {
            bufferedUpdatesRef.current.push(...scaledIncoming);
            setBufferedCount(bufferedUpdatesRef.current.length);
          } else {
            setProjectsMap((prevMap) => {
              const nextMap = new Map(prevMap);
              scaledIncoming.forEach(u => {
                const existing = nextMap.get(u.internal_uid);
                if (existing) {
                  const base = existing as RpaProject;
                  nextMap.set(u.internal_uid, {
                    ...base,
                    robots_deployed: u.robots_deployed,
                    annual_savings_usd: u.annual_savings_usd,
                    roi_percent: u.roi_percent,
                    project_status: u.project_status
                  });
                } else {
                  nextMap.set(u.internal_uid, u);
                }
              });
              return nextMap;
            });
            handleNewStreamBatch(scaledIncoming);
          }
        }, '/rpa_database_2026.csv');
      } else {
        timeoutId = setTimeout(setupStream, 200);
      }
    };

    setupStream();

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleNewStreamBatch]);

  const handleToggleStream = useCallback(() => {
    const next = !isStreamingRef.current;
    isStreamingRef.current = next;
    setIsStreaming(next);
    
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    if (next) {
      // Resuming — flush buffer, clear snapshot and overlay
      const pending = bufferedUpdatesRef.current;
      if (pending.length > 0) {
        handleNewStreamBatch(pending);
        setProjectsMap((prevMap) => {
          const nextMap = new Map(prevMap);
          pending.forEach(u => {
            const existing = nextMap.get(u.internal_uid);
            if (existing) {
              const base = existing as RpaProject;
              nextMap.set(u.internal_uid, {
                ...base,
                robots_deployed: u.robots_deployed,
                annual_savings_usd: u.annual_savings_usd,
                roi_percent: u.roi_percent,
                project_status: u.project_status
              });
            } else {
              nextMap.set(u.internal_uid, u);
            }
          });
          return nextMap;
        });
        bufferedUpdatesRef.current = [];
        setBufferedCount(0);
      }
      // Close overlay and discard snapshot when stream resumes
      setPausedSnapshot(null);
      setSnapshotTimestamp('');
      setShowAnalyticsOverlay(false);

      setEvents(prev => [{ 
        id: `evt-stream-${Date.now()}-${randSuffix}`,
        timestamp: nowStr,
        type: 'status_change',
        message: 'STARTED: Telemetry stream resumed by operator. Memory synchronizer online.'
      }, ...prev]);
    } else {
      // Pausing — capture a frozen snapshot of the current filtered dataset
      const snapshot = Array.from(projectsRef.current);
      setPausedSnapshot(snapshot);
      setSnapshotTimestamp(nowStr);

      setEvents(prev => [{
        id: `evt-stream-${Date.now()}-${randSuffix}`,
        timestamp: nowStr,
        type: 'rescheduled',
        message: 'RESCHEDULED: Telemetry stream paused by operator. Queuing incoming raw ticks into buffer.'
      }, ...prev]);
    }
  }, [handleNewStreamBatch]);

  const handleDismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleClearAllAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(a => a.severity === 'critical'));
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    setEvents(prev => [{
      id: `evt-clear-${Date.now()}-${randSuffix}`,
      timestamp: nowStr,
      type: 'rescheduled',
      message: 'RESCHEDULED: Operator cleared soft warnings. Critical system errors preserved.'
    }, ...prev]);
  }, []);

  const handleSortColumn = useCallback((column: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    setEvents(prev => [{
      id: `evt-sort-${Date.now()}-${randSuffix}`,
      timestamp: nowStr,
      type: 'status_change',
      message: `Sorting order re-calculated by telemetry processor for column: "${column}".`
    }, ...prev]);
  }, []);

  // Compute filtered projects with microsecond high-resolution benchmarker
  const filteredProjectsForDashboard = useMemo(() => {
    const startTime = performance.now();
    let result = projects;

    if (selectedDepartments.length > 0) {
      result = result.filter(p => selectedDepartments.includes(p.department));
    }
    if (selectedIndustries.length > 0) {
      result = result.filter(p => selectedIndustries.includes(p.industry));
    }
    if (selectedAutomationTypes.length > 0) {
      result = result.filter(p => selectedAutomationTypes.includes(p.automation_type));
    }

    const query = searchQuery.trim().toLowerCase();
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

          return keywords.every((keyword) =>
            fieldsToSearch.some((fieldVal) => fieldVal.includes(keyword))
          );
        });
      }
    }

    filterElapsedMsRef.current = performance.now() - startTime;
    return result;
  }, [projects, selectedDepartments, selectedIndustries, selectedAutomationTypes, searchQuery]);

  // Extract unique filter elements for dropdown selections
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    projects.forEach(p => { if (p.department) depts.add(p.department); });
    return Array.from(depts).sort();
  }, [projects]);

  const availableIndustries = useMemo(() => {
    const inds = new Set<string>();
    projects.forEach(p => { if (p.industry) inds.add(p.industry); });
    return Array.from(inds).sort();
  }, [projects]);

  const availableAutomationTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach(p => { if (p.automation_type) types.add(p.automation_type); });
    return Array.from(types).sort();
  }, [projects]);

  // Throttle stream updates for expensive charts to at most 1Hz (1000ms intervals)
  const [throttledFilteredProjects, setThrottledFilteredProjects] = useState(filteredProjectsForDashboard);
  const lastFiltersRef = useRef({ selectedDepartments, selectedIndustries, selectedAutomationTypes, searchQuery });
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    const filtersChanged = 
      lastFiltersRef.current.selectedDepartments !== selectedDepartments ||
      lastFiltersRef.current.selectedIndustries !== selectedIndustries ||
      lastFiltersRef.current.selectedAutomationTypes !== selectedAutomationTypes ||
      lastFiltersRef.current.searchQuery !== searchQuery;

    const now = Date.now();
    
    if (filtersChanged || now - lastUpdateTimeRef.current >= 1000) {
      setThrottledFilteredProjects(filteredProjectsForDashboard);
      lastUpdateTimeRef.current = now;
      if (filtersChanged) {
        lastFiltersRef.current = { selectedDepartments, selectedIndustries, selectedAutomationTypes, searchQuery };
      }
    } else {
      const remaining = 1000 - (now - lastUpdateTimeRef.current);
      const handler = setTimeout(() => {
        setThrottledFilteredProjects(filteredProjectsForDashboard);
        lastUpdateTimeRef.current = Date.now();
      }, remaining);
      return () => clearTimeout(handler);
    }
  }, [filteredProjectsForDashboard, selectedDepartments, selectedIndustries, selectedAutomationTypes, searchQuery]);

  // Compute live aggregates for enterprise KPIs
  const kpiStats = useMemo(() => {
    let totalBots = 0;
    let activeBots = 0;
    let failedProcesses = 0;
    let queueBacklog = 0;
    let completedCount = 0;

    filteredProjectsForDashboard.forEach(p => {
      totalBots += p.robots_deployed;
      if (p.project_status === 'Active') {
        activeBots += p.robots_deployed;
      } else if (p.project_status === 'Failed') {
        failedProcesses += 1;
      } else if (p.project_status === 'Pending') {
        queueBacklog += 1;
      } else if (p.project_status === 'Completed') {
        completedCount += 1;
      }
    });

    const totalResolved = completedCount + failedProcesses;
    const successRate = totalResolved > 0 ? (completedCount / totalResolved) * 100 : 100;

    return {
      activeBots,
      totalBots,
      failedProcesses,
      totalProcesses: filteredProjectsForDashboard.length,
      queueBacklog,
      successRate
    };
  }, [filteredProjectsForDashboard]);

  // Compute live distributions for charts using the throttled dataset
  const chartData = useMemo(() => {
    const deptSavings: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const countrySavings: Record<string, number> = {};
    
    let negativeRoi = 0;
    let lowRoi = 0;
    let mediumRoi = 0;
    let highRoi = 0;

    throttledFilteredProjects.forEach(p => {
      // Dept savings
      deptSavings[p.department] = (deptSavings[p.department] || 0) + p.annual_savings_usd;
      // Tech profiles
      typeCounts[p.automation_type] = (typeCounts[p.automation_type] || 0) + 1;
      // Country savings
      countrySavings[p.country] = (countrySavings[p.country] || 0) + p.annual_savings_usd;

      // ROI ranges
      if (p.roi_percent < 0) {
        negativeRoi += p.robots_deployed;
      } else if (p.roi_percent <= 100) {
        lowRoi += p.robots_deployed;
      } else if (p.roi_percent <= 500) {
        mediumRoi += p.robots_deployed;
      } else {
        highRoi += p.robots_deployed;
      }
    });

    const countrySorted = Object.entries(countrySavings)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      department: Object.entries(deptSavings).map(([name, value]) => ({ name, value })),
      type: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
      country: countrySorted,
      roi: [
        { name: 'Negative (<0%)', value: negativeRoi },
        { name: 'Low (0-100%)', value: lowRoi },
        { name: 'Medium (100-500%)', value: mediumRoi },
        { name: 'High (>500%)', value: highRoi }
      ]
    };
  }, [throttledFilteredProjects]);

  // Operational tab clear actions
  const handleResetFilters = useCallback(() => {
    setSelectedDepartments([]);
    setSelectedIndustries([]);
    setSelectedAutomationTypes([]);
    setSearchQuery('');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    setEvents(prev => [{
      id: `evt-reset-${Date.now()}-${randSuffix}`,
      timestamp: nowStr,
      type: 'status_change',
      message: 'Workspace filters restored to defaults by operator.'
    }, ...prev]);
  }, []);

  const handleClearBuffer = useCallback(() => {
    bufferedUpdatesRef.current = [];
    setBufferedCount(0);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    setEvents(prev => [{
      id: `evt-flush-${Date.now()}-${randSuffix}`,
      timestamp: nowStr,
      type: 'status_change',
      message: 'Operator flushed incoming stream buffer queue. 0 records lost.'
    }, ...prev]);
  }, []);

  const handleRefreshWorkspace = useCallback(() => {
    // Re-trigger a simulated loading log
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const randSuffix = Math.random().toString(36).substring(2, 9);
    setEvents(prev => [{
      id: `evt-refresh-${Date.now()}-${randSuffix}`,
      timestamp: nowStr,
      type: 'status_change',
      message: 'Hard-reloading workspace telemetry allocation memory... Synchronized grid nodes.'
    }, ...prev]);
  }, []);

  return (
    <div className="min-h-screen bg-[#101216] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-300 flex flex-col" id="terminal-root">

      {/* 1. Splunk App Header Navigation */}
      <Header
        isStreaming={isStreaming}
        onToggleStream={handleToggleStream}
        bufferedCount={bufferedCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAnalytics={() => setShowAnalyticsOverlay(true)}
        showAnalyticsButton={!isStreaming && !!pausedSnapshot}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClearAllAlerts={handleClearAllAlerts}
      />

      {/* Main Panel Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 md:px-8 py-6 space-y-6">

        {/* ========================================================== */}
        {/* VIEW 1: LIVE OPERATIONS (DEFAULT LANDING TAB) */}
        {/* ========================================================== */}
        {activeTab === 'live_ops' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Compact Operational Metrics Strip */}
            <div className="bg-[#1b1d24] border border-[#272a34]/70 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-md" id="ops-metrics-strip">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">Live Telemetry Pipeline</span>
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Dataset Size:</span>
                  <span className="text-slate-200 font-bold">{projects.length.toLocaleString()} rows</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 border-l border-[#272a34]/50 pl-4">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Rendered Rows:</span>
                  <span className="text-cyan-400 font-bold">{renderedRowsCount} items</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-[#272a34]/50 pl-4">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Buffered Updates:</span>
                  <span className={`font-bold ${bufferedCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>{bufferedCount} queued</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-[#272a34]/50 pl-4">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Updates Per Second:</span>
                  <span className={`font-bold ${isStreaming ? 'text-emerald-400' : 'text-slate-400'}`}>{updatesPerSecond} Hz</span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 border-l border-[#272a34]/50 pl-4">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Memory Health:</span>
                  <span className="text-emerald-400 font-bold">{(45.2 + projects.length * 0.0025).toFixed(1)} MB / 512 MB (Optimal)</span>
                </div>
                <div className="hidden lg:flex items-center gap-1.5 border-l border-[#272a34]/50 pl-4">
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider font-semibold">Virtualization Status:</span>
                  <span className="text-cyan-500 font-bold uppercase">ACTIVE (Overscan: 8)</span>
                </div>

                {/* Analytics View button — appears only when paused */}
                {!isStreaming && pausedSnapshot && (
                  <div className="flex items-center gap-1.5 border-l border-[#272a34]/50 pl-4">
                    <button
                      onClick={() => setShowAnalyticsOverlay(true)}
                      className="flex items-center gap-1.5 bg-cyan-950/30 border border-cyan-700/50 hover:bg-cyan-900/40 hover:border-cyan-600/60 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded transition-all animate-pulse"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                      Analytics View
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* High-Density KPI Dashboard */}
            <div className="flex flex-col gap-6" id="kpi-dashboards-container">
              <RpaKpiStrip
                totalStreamedRows={rpaKpiStats.totalStreamedRows}
                activeRobots={rpaKpiStats.activeRobots}
                globalSavings={rpaKpiStats.globalSavings}
                isStreaming={isStreaming}
              />
              <KpiCards
                failedProcesses={kpiStats.failedProcesses}
                queueErrors={kpiStats.queueBacklog}
                pausedAutomations={!isStreaming ? projects.filter(p => p.project_status === 'Active').length + 5 : 5}
                isStreaming={isStreaming}
              />
            </div>

            {/* System Engine Telemetry & Virtualization Benchmarks */}
            <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-4 flex flex-col gap-3 shadow-md" id="engineering-status-panel">
              <div className="flex items-center justify-between border-b border-[#272a34]/50 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">System Engine Telemetry & Virtualization Benchmarks</h4>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  <span>Low-Latency Real-Time State</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="bg-[#121319] border border-[#272a34]/40 rounded p-2.5 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Dataset Size</span>
                  <span className="text-sm font-bold font-mono text-slate-200 mt-1">{projects.length.toLocaleString()} rows</span>
                </div>
                
                <div className="bg-[#121319] border border-[#272a34]/40 rounded p-2.5 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Filtered Rows</span>
                  <span className="text-sm font-bold font-mono text-cyan-400 mt-1">{filteredProjectsForDashboard.length.toLocaleString()} rows</span>
                </div>

                <div className="bg-[#121319] border border-[#272a34]/40 rounded p-2.5 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Rendered Rows</span>
                  <span className="text-sm font-bold font-mono text-cyan-300 mt-1">{renderedRowsCount} items</span>
                </div>

                <div className="bg-[#121319] border border-[#272a34]/40 rounded p-2.5 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Overscan Count</span>
                  <span className="text-sm font-bold font-mono text-amber-400 mt-1">8 rows</span>
                </div>

                <div className="bg-[#121319] border border-[#272a34]/40 rounded p-2.5 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">DOM Reduction %</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 mt-1">
                    {((1 - (renderedRowsCount / (filteredProjectsForDashboard.length || 1))) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls (Positioned directly above the table) */}
            <div 
              ref={filterPanelRef}
              className="flex flex-col gap-3 rounded-lg border border-[#272a34] bg-[#1b1d24] p-3 shadow-md"
              id="live-ops-filter-bar"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Left Side: Multi-select Dropdown triggers & Search */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Global Search Bar */}
                  <div className="relative flex items-center rounded border border-slate-800 bg-slate-950/50 px-2.5 py-1.5 text-slate-400 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 w-full sm:w-52 transition-all">
                    <Search className="h-3.5 w-3.5 text-slate-500 shrink-0 mr-1.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects, IDs, partners..."
                      className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full p-0 focus:ring-0"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 text-slate-500 hover:text-slate-300">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Department Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'dept' ? null : 'dept')}
                      className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-sans transition-all cursor-pointer ${
                        selectedDepartments.length > 0
                          ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 font-semibold'
                          : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>DEPT: {selectedDepartments.length === 0 ? 'All' : `${selectedDepartments.length} selected`}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    </button>

                    {activeFilterDropdown === 'dept' && (
                      <div className="absolute left-0 mt-1.5 z-50 w-52 rounded border border-slate-800 bg-slate-950 p-2 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                          <span className="font-bold text-[10px] text-slate-400 tracking-wider font-semibold">FILTER DEPARTMENTS</span>
                          {selectedDepartments.length > 0 && (
                            <button onClick={() => setSelectedDepartments([])} className="text-[10px] text-cyan-500 font-semibold">Clear</button>
                          )}
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {availableDepartments.map(dept => {
                            const isChecked = selectedDepartments.includes(dept);
                            return (
                              <label key={dept} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-900 cursor-pointer rounded text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedDepartments(prev => 
                                      isChecked ? prev.filter(d => d !== dept) : [...prev, dept]
                                    );
                                  }}
                                  className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className="truncate">{dept}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Industry Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'industry' ? null : 'industry')}
                      className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-sans transition-all cursor-pointer ${
                        selectedIndustries.length > 0
                          ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 font-semibold'
                          : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>INDUSTRY: {selectedIndustries.length === 0 ? 'All' : `${selectedIndustries.length} selected`}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    </button>

                    {activeFilterDropdown === 'industry' && (
                      <div className="absolute left-0 mt-1.5 z-50 w-52 rounded border border-slate-800 bg-slate-950 p-2 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                          <span className="font-bold text-[10px] text-slate-400 tracking-wider font-semibold">FILTER INDUSTRIES</span>
                          {selectedIndustries.length > 0 && (
                            <button onClick={() => setSelectedIndustries([])} className="text-[10px] text-cyan-500 font-semibold">Clear</button>
                          )}
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {availableIndustries.map(ind => {
                            const isChecked = selectedIndustries.includes(ind);
                            return (
                              <label key={ind} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-900 cursor-pointer rounded text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedIndustries(prev => 
                                      isChecked ? prev.filter(i => i !== ind) : [...prev, ind]
                                    );
                                  }}
                                  className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className="truncate">{ind}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Automation Tech Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'tech' ? null : 'tech')}
                      className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-sans transition-all cursor-pointer ${
                        selectedAutomationTypes.length > 0
                          ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 font-semibold'
                          : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>TECH: {selectedAutomationTypes.length === 0 ? 'All' : `${selectedAutomationTypes.length} selected`}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                    </button>

                    {activeFilterDropdown === 'tech' && (
                      <div className="absolute left-0 mt-1.5 z-50 w-52 rounded border border-slate-800 bg-slate-950 p-2 text-xs shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                          <span className="font-bold text-[10px] text-slate-400 tracking-wider font-semibold">FILTER TECHNOLOGY</span>
                          {selectedAutomationTypes.length > 0 && (
                            <button onClick={() => setSelectedAutomationTypes([])} className="text-[10px] text-cyan-500 font-semibold">Clear</button>
                          )}
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {availableAutomationTypes.map(tech => {
                            const isChecked = selectedAutomationTypes.includes(tech);
                            return (
                              <label key={tech} className="flex items-center gap-2 px-1 py-1 hover:bg-slate-900 cursor-pointer rounded text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedAutomationTypes(prev => 
                                      isChecked ? prev.filter(t => t !== tech) : [...prev, tech]
                                    );
                                  }}
                                  className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className="truncate">{tech}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Quick Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {/* Reset Filters button */}
                  {(selectedDepartments.length > 0 || selectedIndustries.length > 0 || selectedAutomationTypes.length > 0 || searchQuery) && (
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold bg-[#121319] border border-[#272a34] px-2.5 py-1.5 rounded-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span>RESET FILTERS</span>
                    </button>
                  )}

                  {/* Pause/Resume stream */}
                  <button
                    onClick={handleToggleStream}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold border rounded-sm px-3.5 py-1.5 transition-all select-none cursor-pointer ${
                      isStreaming
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-400 hover:bg-amber-900/40'
                        : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/40 animate-pulse'
                    }`}
                  >
                    {isStreaming ? (
                      <>
                        <Pause className="h-3.5 w-3.5 shrink-0" />
                        <span>PAUSE ENGINE</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                        <span>RESUME ENGINE</span>
                      </>
                    )}
                  </button>

                  {/* Analytics View button — only visible when stream is paused */}
                  {!isStreaming && pausedSnapshot && (
                    <button
                      onClick={() => setShowAnalyticsOverlay(true)}
                      className="flex items-center gap-1.5 text-xs font-mono font-bold border rounded-sm px-3.5 py-1.5 bg-cyan-950/30 border-cyan-700/50 hover:bg-cyan-900/40 hover:border-cyan-600/60 text-cyan-400 transition-all select-none cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                      <span>ANALYTICS VIEW</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Virtualized Automation Matrix & Project Inspector (Primary Visual Focus) */}
            <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">
              <div className="flex-1 min-w-0">
                <MainTable
                  projects={projects}
                  onSort={handleSortColumn}
                  selectedDepartments={selectedDepartments}
                  selectedIndustries={selectedIndustries}
                  selectedAutomationTypes={selectedAutomationTypes}
                  searchQuery={searchQuery}
                  sortRules={sortRules}
                  setSortRules={setSortRules}
                  visibleColumns={visibleColumns}
                  onRenderedRowsCount={setRenderedRowsCount}
                  onRowClick={handleRowClick}
                  selectedProjectUid={selectedProjectUid || undefined}
                />
              </div>
              {selectedProject && (
                <ProjectInspector
                  project={selectedProject}
                  onClose={() => setSelectedProjectUid(null)}
                />
              )}
            </div>

            {/* Alert Center & Live Activity Feed (Positioned below the table, reduced visual footprint by 25%) */}
            {(dashboardPrefs.showAlertCenter || dashboardPrefs.showActivityFeed) && (
              <div className="max-w-5xl mx-auto w-full pt-2">
                <div className={`grid grid-cols-1 ${dashboardPrefs.showAlertCenter && dashboardPrefs.showActivityFeed ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                  {/* Alert Center */}
                  {dashboardPrefs.showAlertCenter && (
                    <div className="h-[240px] min-h-[200px] overflow-hidden flex flex-col">
                      <AlertCenter
                        alerts={alerts}
                        onDismissAlert={handleDismissAlert}
                        onClearAll={handleClearAllAlerts}
                      />
                    </div>
                  )}

                  {/* Activity Log Terminal */}
                  {dashboardPrefs.showActivityFeed && (
                    <div className="h-[240px] min-h-[200px] overflow-hidden flex flex-col">
                      <LiveActivityFeed
                        events={events}
                        isStreaming={isStreaming}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: ANALYTICS & ROI */}
        {/* ========================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Context bar */}
            <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-md">
              <div className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-100">Executive ROI & Optimization Center</h2>
                  <p className="text-xs text-slate-400">High-density live-updating charts summarizing organizational telemetry savings</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-3 sm:mt-0 font-mono text-xs text-slate-400 bg-[#121319] border border-[#272a34] px-3 py-1.5 rounded">
                <span>Active Filter Scope:</span>
                <span className="text-cyan-400 font-bold">{filteredProjectsForDashboard.length} / {projects.length} rows</span>
              </div>
            </div>

            {/* Executive ROI & Optimization Center */}
            <AnalyticsCharts
              projects={throttledFilteredProjects}
            />

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: STREAM DIAGNOSTICS */}
        {/* ========================================================== */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Header info */}
            <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-4 flex items-center gap-3 shadow-md">
              <HardDrive className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-100">Low-Level Pipeline Stream Diagnostics</h2>
                <p className="text-xs text-slate-400">Low-latency system performance check monitors, memory footprints, and multi-sort stack traces</p>
              </div>
            </div>

            {/* Diagnostic Parameters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Panel 1: Transaction Throughput */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col justify-between h-[180px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Stream Throughput</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="my-3">
                  <div className="text-4xl font-bold font-mono tracking-tight text-white flex items-baseline gap-1.5">
                    {updatesPerSecond}
                    <span className="text-xs text-slate-500 font-sans font-normal uppercase">updates/sec</span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-1">Weighted moving average stream sync index (Hz)</p>
                </div>
                <div className="w-full bg-[#121319] h-2 border border-[#272a34] rounded overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (updatesPerSecond / 150) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Panel 2: Memory Allocations & DOM savings */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col justify-between h-[180px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Memory Grid Footprint</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <div className="my-2 text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rendered DOM Nodes:</span>
                    <span className="text-cyan-400 font-bold">{renderedRowsCount * visibleColumns.length} nodes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Virtualizer Overhead:</span>
                    <span className="text-emerald-400 font-bold">1.2% footprint</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DOM reduction:</span>
                    <span className="text-slate-200 font-bold">
                      {(((projects.length - renderedRowsCount) / Math.max(1, projects.length)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  Heap Used: ~34.5 MB / Limit: 2,048 MB
                </div>
              </div>

              {/* Panel 3: Filter & Parse Latency */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 flex flex-col justify-between h-[180px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Fuzzy Filter Latency</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                </div>
                <div className="my-3">
                  <div className="text-4xl font-bold font-mono tracking-tight text-white flex items-baseline gap-1.5">
                    {filterElapsedMsRef.current.toFixed(2)}
                    <span className="text-xs text-slate-500 font-sans font-normal uppercase">ms</span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-1">High-resolution React parsing/search latency</p>
                </div>
                <div className="w-full bg-[#121319] h-2 border border-[#272a34] rounded overflow-hidden">
                  <div 
                    className="h-full bg-indigo-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (filterElapsedMsRef.current / 5) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Low-Level diagnostic grid details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Virtualization diagnostics */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-2">
                  Memory Virtualization Check Status
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Virtualizer:</span>
                    <span className="text-slate-200">Custom Native CSS Scroll-Grid Virtualizer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">OverScan Padding Size:</span>
                    <span className="text-cyan-400">8 pre-rendered rows</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Row Alloc Height:</span>
                    <span className="text-slate-200">54px standard height</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Streamed Records:</span>
                    <span className="text-emerald-400">{totalStreamedRows.toLocaleString()} updates</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client Memory Health:</span>
                    <span className="text-[#5cc05c] font-bold">ONLINE (CONNECTED)</span>
                  </div>
                </div>
              </div>

              {/* Sort Stack configuration block */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-2">
                  Active Multi-Sort Keys Stack
                </h3>
                {sortRules.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono text-center py-4">
                    [No Active Sort Keys. Table matches default sequence]
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-[#121319] border border-[#272a34] rounded p-3 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre">
                      {JSON.stringify(sortRules, null, 2)}
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans">
                      Active sort priorities are synchronized to local workspace cache rule files in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 4: CONTROL CENTER */}
        {/* ========================================================== */}
        {activeTab === 'control' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Context */}
            <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-4 flex items-center gap-3 shadow-md">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-100">Automation Control Center Console</h2>
                <p className="text-xs text-slate-400">Perform real-time emergency overrides, buffer flushes, and database synchronizations</p>
              </div>
            </div>

            {/* Dashboard Controls Grid of Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Emergency Pause/Resume */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 flex flex-col justify-between h-[180px]">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">Telemetry Ingestion Status</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Pause raw operations socket telemetry inputs immediately to troubleshoot allocation grids</p>
                </div>
                <button
                  onClick={handleToggleStream}
                  className={`w-full flex items-center justify-center gap-2 rounded-sm py-2 text-xs font-mono font-bold border transition-colors cursor-pointer select-none ${
                    isStreaming 
                      ? 'bg-amber-950/20 border-amber-800 text-amber-400 hover:bg-amber-900/45' 
                      : 'bg-emerald-950/20 border-emerald-800 text-emerald-400 hover:bg-emerald-900/45'
                  }`}
                >
                  {isStreaming ? <Pause className="h-4 w-4 shrink-0" /> : <Play className="h-4 w-4 shrink-0" />}
                  <span>{isStreaming ? 'SUSPEND STREAM SOCKET' : 'ACTIVATE STREAM SOCKET'}</span>
                </button>
              </div>

              {/* Card 2: Flush Buffer */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 flex flex-col justify-between h-[180px]">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">Flush Queue Buffer</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Empty cached stream telemetry buffers completely. Active when pipeline updates are suspended.</p>
                </div>
                <button
                  onClick={handleClearBuffer}
                  disabled={bufferedCount === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2 text-xs font-mono font-bold border border-rose-800/60 bg-rose-950/10 hover:bg-rose-900/25 text-rose-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>FLUSH Telemetry BUFFER ({bufferedCount})</span>
                </button>
              </div>

              {/* Card 3: Clear Warnings */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 flex flex-col justify-between h-[180px]">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">Deduplicate & Clear Soft Alerts</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Clear soft warning alerts inside alert log widgets. Keeps critical failure issues intact.</p>
                </div>
                <button
                  onClick={handleClearAllAlerts}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2 text-xs font-mono font-bold border border-slate-800 bg-[#121319] hover:bg-slate-900 text-slate-300 transition-colors cursor-pointer select-none"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span>PURGE ACTIVE WARNINGS</span>
                </button>
              </div>

              {/* Card 4: Reset Workspace Filters */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 flex flex-col justify-between h-[180px]">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">Reset Active Workspace Filters</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Restore search query, department selection, and tech filter stacks to standard defaults.</p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2 text-xs font-mono font-bold border border-slate-800 bg-[#121319] hover:bg-slate-900 text-slate-300 transition-colors cursor-pointer select-none"
                >
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  <span>RESET GLOBAL FILTERS</span>
                </button>
              </div>

              {/* Card 5: Refresh Workspace Memory */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 flex flex-col justify-between h-[180px]">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-1">Re-Align Telemetry Grid</h3>
                  <p className="text-[11px] text-slate-500 font-sans">Synchronize allocated dataset columns and trigger state updates with baseline schema elements</p>
                </div>
                <button
                  onClick={handleRefreshWorkspace}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2 text-xs font-mono font-bold border border-slate-800 bg-[#121319] hover:bg-slate-900 text-slate-300 transition-colors cursor-pointer select-none"
                >
                  <RefreshCw className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span>SYNCHRONIZE WORKSPACE GRID</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 5: WORKSPACE SETTINGS */}
        {/* ========================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Context */}
            <div className="rounded-lg border border-[#272a34] bg-[#1b1d24] p-4 flex items-center gap-3 shadow-md">
              <Settings className="h-5 w-5 text-cyan-400 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-100">Global Workspace Settings</h2>
                <p className="text-xs text-slate-400">Configure layout elements, columns visibility parameters, and client storage footprints</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Settings Group 1: Columns Visibility */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 space-y-3 lg:col-span-2">
                <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-2">
                  Configure Table Column Allocations
                </h3>
                <p className="text-xs text-slate-400">
                  Select which telemetry fields should be compiled and displayed inside the virtualized operations grid. At least 1 field required.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { key: 'project_name', label: 'Project Name & ID' },
                    { key: 'department', label: 'Department' },
                    { key: 'project_status', label: 'Execution Status' },
                    { key: 'robots_deployed', label: 'Deployed Robots' },
                    { key: 'roi_percent', label: 'ROI return (%)' },
                    { key: 'annual_savings_usd', label: 'Annual Savings (USD)' },
                    { key: 'automation_type', label: 'Automation Type' },
                    { key: 'country', label: 'Location / Country' },
                    { key: 'industry', label: 'Market / Industry' }
                  ].map((col) => {
                    const isChecked = visibleColumns.includes(col.key);
                    return (
                      <label 
                        key={col.key} 
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded border cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-[#121319] border-cyan-500/40 text-slate-200' 
                            : 'bg-[#1b1d24] border-slate-850 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              if (visibleColumns.length > 1) {
                                setVisibleColumns(prev => prev.filter(c => c !== col.key));
                              }
                            } else {
                              setVisibleColumns(prev => [...prev, col.key]);
                            }
                          }}
                          className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-4 w-4 cursor-pointer"
                        />
                        <span className="text-xs font-medium">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Settings Group 2: Layout & Cache footprints */}
              <div className="bg-[#1b1d24] border border-[#272a34] rounded-lg p-6 space-y-4">
                
                {/* Visual preferences checklist */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-2">
                    Visual Layout Layout Options
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <label className="flex items-center gap-2.5 text-slate-450 hover:text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dashboardPrefs.showKpis}
                        onChange={(e) => setDashboardPrefs(prev => ({ ...prev, showKpis: e.target.checked }))}
                        className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>Enable Live Ops KPI bar</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-slate-450 hover:text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dashboardPrefs.showCharts}
                        onChange={(e) => setDashboardPrefs(prev => ({ ...prev, showCharts: e.target.checked }))}
                        className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>Enable Analytics Tab access</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-slate-450 hover:text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dashboardPrefs.showAlertCenter}
                        onChange={(e) => setDashboardPrefs(prev => ({ ...prev, showAlertCenter: e.target.checked }))}
                        className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>Enable operational Alert panel</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-slate-450 hover:text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dashboardPrefs.showActivityFeed}
                        onChange={(e) => setDashboardPrefs(prev => ({ ...prev, showActivityFeed: e.target.checked }))}
                        className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 h-3.5 w-3.5"
                      />
                      <span>Enable Terminal Activity feed</span>
                    </label>
                  </div>
                </div>

                {/* Local Storage details */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider pb-1">
                    Client Storage Footprint
                  </h3>
                  <div className="bg-[#121319] border border-[#272a34] p-3 rounded font-mono text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Persistence Status:</span>
                      <span className="text-[#5cc05c] font-bold">CONNECTED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Keys Saved:</span>
                      <span>6 items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage Footprint:</span>
                      <span>~14.5 KB</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* Control Room footer */}
      <footer className="border-t border-[#272a34] bg-[#1a1c23] py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Enterprise Automation Command Hub. Secured with military-grade operational telemetry pipelines.</p>
      </footer>

      {/* ── Chart.js Analytics Overlay ─────────────────────────────────────────
          Rendered as a portal-like fixed overlay above the entire UI.
          Visible only when the stream is paused AND the user clicks Analytics View.
          Snapshot is frozen at pause time and never updates until next pause.
      ──────────────────────────────────────────────────────────────────────── */}
      {showAnalyticsOverlay && pausedSnapshot && (
        <AnalyticsOverlay
          snapshot={pausedSnapshot}
          snapshotSize={pausedSnapshot.length}
          snapshotTimestamp={snapshotTimestamp}
          onClose={() => setShowAnalyticsOverlay(false)}
        />
      )}

      {/* Floating System-Alert Toast */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded border shadow-xl transition-all duration-300 animate-slide-in-up ${
            toast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-800 text-amber-300'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-800 text-rose-300'
              : 'bg-cyan-950/95 border-cyan-800 text-cyan-300'
          }`}
          id="system-floating-toast"
        >
          <div className="flex-1 text-xs font-mono font-semibold">
            {toast.message}
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1 rounded hover:bg-white/10 text-current transition-colors cursor-pointer outline-none"
            title="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
