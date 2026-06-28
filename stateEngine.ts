/**
 * STATE ENGINE — Map-based O(1) lookup, no React state involved
 * All data lives here. Components read from this, never own the data.
 */

import { RpaProject, TelemetryAlert, StreamEvent } from './src/types';

type StateListener = () => void;

class StateEngine {
  // Master data store — Map for O(1) lookup by internal_uid
  private projectMap: Map<string, RpaProject> = new Map();

  // Derived sorted+filtered view (what the grid renders)
  private viewPool: RpaProject[] = [];

  // KPI accumulators
  public totalStreamedRows = 0;
  public totalRobotsDeployed = 0;
  public totalSavings = 0;

  // Pause/Play queue
  private isPaused = false;
  private pauseQueue: RpaProject[] = [];

  // Sort state
  public sortRules: { column: keyof RpaProject; direction: 'asc' | 'desc' }[] = [];

  // Filter state
  public selectedDepartments: string[] = [];
  public selectedIndustries: string[] = [];
  public selectedAutomationTypes: string[] = [];
  public searchQuery = '';

  // Alerts & Events
  public alerts: TelemetryAlert[] = [];
  public events: StreamEvent[] = [];

  // Listeners — components subscribe to be notified
  private listeners: Set<StateListener> = new Set();

  subscribe(fn: StateListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Load initial CSV data into the Map
  loadBaseline(projects: RpaProject[]) {
    this.projectMap.clear();
    projects.forEach(p => this.projectMap.set(p.internal_uid, p));
    this.recomputeViewPool();
    this.notify();
  }

  // Called every 200ms by dataStream.js callback
  processBatch(batch: RpaProject[]) {
    if (this.isPaused) {
      this.pauseQueue.push(...batch);
      return { bufferedCount: this.pauseQueue.length };
    }
    this._applyBatch(batch);
    return { bufferedCount: 0 };
  }

  private _applyBatch(batch: RpaProject[]) {
    this.totalStreamedRows += batch.length;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newAlerts: TelemetryAlert[] = [];
    const newEvents: StreamEvent[] = [];

    newEvents.push({
      id: `evt-${Date.now()}`,
      timestamp: nowStr,
      type: 'update',
      message: `Batch received: ${batch.length} row updates applied to memory grid.`
    });

    batch.forEach(incoming => {
      const existing = this.projectMap.get(incoming.internal_uid);
      if (existing) {
        // Update KPI accumulators delta
        this.totalRobotsDeployed += (incoming.robots_deployed - existing.robots_deployed);
        this.totalSavings += (incoming.annual_savings_usd - existing.annual_savings_usd);
      } else {
        this.totalRobotsDeployed += incoming.robots_deployed;
        this.totalSavings += incoming.annual_savings_usd;
      }

      // Update map
      this.projectMap.set(incoming.internal_uid, incoming);

      // Alert detection
      if (incoming.project_status === 'Failed') {
        const randId = Math.random().toString(36).substring(2, 7);
        newAlerts.push({
          id: `alert-f-${incoming.internal_uid}-${randId}`,
          timestamp: nowStr,
          severity: 'critical',
          message: `RPA execution failed: ${incoming.project_name} [${incoming.project_id}]`,
          projectId: incoming.project_id,
          projectName: incoming.project_name,
          rowUid: incoming.internal_uid
        });
        newEvents.push({
          id: `evt-fail-${incoming.internal_uid}-${randId}`,
          timestamp: nowStr,
          type: 'anomaly',
          message: `CRITICAL: ${incoming.project_name} failed execution.`
        });
      }

      if (incoming.roi_percent < 0) {
        const randId = Math.random().toString(36).substring(2, 7);
        newAlerts.push({
          id: `alert-roi-${incoming.internal_uid}-${randId}`,
          timestamp: nowStr,
          severity: 'warning',
          message: `Negative ROI on ${incoming.project_name}: ${incoming.roi_percent.toFixed(2)}%`,
          projectId: incoming.project_id,
          projectName: incoming.project_name,
          rowUid: incoming.internal_uid
        });
      }
    });

    // Merge alerts — deduplicate by projectId+severity
    if (newAlerts.length > 0) {
      const merged = [...newAlerts, ...this.alerts];
      const seen = new Set<string>();
      this.alerts = merged.filter(a => {
        const key = `${a.projectId}-${a.severity}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 30);
    }

    // Merge events — keep last 50
    this.events = [...this.events, ...newEvents].slice(-50);

    // Recompute view
    this.recomputeViewPool();
    this.notify();
  }

  pause() {
    this.isPaused = true;
    this.notify();
  }

  resume() {
    this.isPaused = false;
    const queued = this.pauseQueue.splice(0);
    if (queued.length > 0) {
      this._applyBatch(queued);
    }
    this.notify();
  }

  get paused() {
    return this.isPaused;
  }

  get bufferedCount() {
    return this.pauseQueue.length;
  }

  // Recompute derived view pool — filter + sort
  recomputeViewPool() {
    let result = Array.from(this.projectMap.values());

    // Filter
    if (this.selectedDepartments.length > 0) {
      result = result.filter(p => this.selectedDepartments.includes(p.department));
    }
    if (this.selectedIndustries.length > 0) {
      result = result.filter(p => this.selectedIndustries.includes(p.industry));
    }
    if (this.selectedAutomationTypes.length > 0) {
      result = result.filter(p => this.selectedAutomationTypes.includes(p.automation_type));
    }

    // Fuzzy search
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      const keywords = q.split(/\s+/).filter(Boolean);
      result = result.filter(p => {
        const fields = [p.project_name, p.project_id, p.country, p.implementation_partner]
          .map(v => (v || '').toLowerCase());
        return keywords.every(kw => fields.some(f => f.includes(kw)));
      });
    }

    // Sort
    if (this.sortRules.length > 0) {
      result.sort((a, b) => {
        for (const rule of this.sortRules) {
          const col = rule.column;
          let valA: any = a[col] ?? '';
          let valB: any = b[col] ?? '';
          if (valA !== valB) {
            let cmp = typeof valA === 'number' && typeof valB === 'number'
              ? valA - valB
              : String(valA).localeCompare(String(valB));
            return rule.direction === 'asc' ? cmp : -cmp;
          }
        }
        return 0;
      });
    }

    this.viewPool = result;
  }

  getViewPool() {
    return this.viewPool;
  }

  getProjectMap() {
    return this.projectMap;
  }

  // Filter setters — each triggers recompute
  setDepartments(v: string[]) {
    this.selectedDepartments = v;
    this.recomputeViewPool();
    this.notify();
  }

  setIndustries(v: string[]) {
    this.selectedIndustries = v;
    this.recomputeViewPool();
    this.notify();
  }

  setAutomationTypes(v: string[]) {
    this.selectedAutomationTypes = v;
    this.recomputeViewPool();
    this.notify();
  }

  setSearchQuery(v: string) {
    this.searchQuery = v;
    this.recomputeViewPool();
    this.notify();
  }

  setSortRules(rules: { column: keyof RpaProject; direction: 'asc' | 'desc' }[]) {
    this.sortRules = rules;
    this.recomputeViewPool();
    this.notify();
  }

  dismissAlert(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.notify();
  }

  clearNonCriticalAlerts() {
    this.alerts = this.alerts.filter(a => a.severity === 'critical');
    this.notify();
  }

  // Unique values for filter dropdowns
  getUniqueDepartments() {
    return Array.from(new Set(Array.from(this.projectMap.values()).map(p => p.department))).sort();
  }

  getUniqueIndustries() {
    return Array.from(new Set(Array.from(this.projectMap.values()).map(p => p.industry))).sort();
  }

  getUniqueAutomationTypes() {
    return Array.from(new Set(Array.from(this.projectMap.values()).map(p => p.automation_type))).sort();
  }
}

// Singleton — one engine for the whole app
export const engine = new StateEngine();