/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Play, Pause, Clock, Activity, HardDrive, Settings, 
  LineChart, ShieldAlert, MonitorPlay, ChevronDown, Bell, 
  User, HelpCircle, Search, LogOut, FileText, CheckCircle2, 
  Lock, Sliders, List, Terminal, AlertTriangle, X, Shield, Menu,
  Database, RefreshCw, Key, Info, HelpCircle as HelpIcon, Check
} from 'lucide-react';
import strataVerseLogo from '../assets/images/strataverse_logo_1782656250664.jpg';

interface HeaderProps {
  isStreaming: boolean;
  onToggleStream: () => void;
  bufferedCount: number;
  activeTab: 'live_ops' | 'analytics' | 'diagnostics' | 'control' | 'settings';
  setActiveTab: (tab: 'live_ops' | 'analytics' | 'diagnostics' | 'control' | 'settings') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClearAllAlerts?: () => void;
  onOpenAnalytics?: () => void;
  showAnalyticsButton?: boolean;
}

export default React.memo(function Header({
  isStreaming,
  onToggleStream,
  bufferedCount,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onClearAllAlerts,
  onOpenAnalytics,
  showAnalyticsButton
}: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  // Modal State for dropdown item interactions
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  // Sign out simulation state
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const TABS = [
    { id: 'live_ops', label: 'Live Operations', icon: MonitorPlay },
    { id: 'analytics', label: 'Insights', icon: LineChart },
    { id: 'diagnostics', label: 'Stream Diagnostics', icon: HardDrive },
    { id: 'control', label: 'Control Center', icon: ShieldAlert },
    { id: 'settings', label: 'Workspace Settings', icon: Settings }
  ] as const;

  const handleDropdownToggle = (menuName: string) => {
    setActiveDropdown(prev => prev === menuName ? null : menuName);
  };

  const openInteractiveModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
    setActiveDropdown(null);
  };

  // Dropdown option handlers
  const handleAdminAction = (action: string) => {
    switch (action) {
      case 'Profile Settings':
        openInteractiveModal(
          'Administrator User Profile',
          <div className="space-y-3 font-sans text-sm text-slate-300">
            <div className="flex items-center gap-3 border-b border-[#272a34] pb-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">bhartigrover3@gmail.com</h4>
                <p className="text-xs text-slate-500">System Operator (Level 4 clearance)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34]">
                <span className="text-slate-500 block">Session ID</span>
                <span className="font-mono font-bold text-slate-300">SEC-99238-A</span>
              </div>
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34]">
                <span className="text-slate-500 block">Auth Token</span>
                <span className="font-mono font-bold text-slate-300">AES-256 HMAC</span>
              </div>
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34]">
                <span className="text-slate-500 block">Connected Node</span>
                <span className="font-mono font-bold text-slate-300">US-EAST-01</span>
              </div>
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34]">
                <span className="text-slate-500 block">Active Since</span>
                <span className="font-mono font-bold text-slate-300">2026-06-28 06:00</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              All interactions from this session are crypto-signed and recorded in compliance with StrataVerse Security Guidelines.
            </p>
          </div>
        );
        break;
      case 'User Management':
        openInteractiveModal(
          'User Management (Active CoE Cluster Sessions)',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <p className="text-slate-400 mb-2">Currently connected operators in the workspace:</p>
            <div className="border border-[#272a34] rounded overflow-hidden">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="bg-[#1b1d24] text-slate-400 border-b border-[#272a34]">
                    <th className="p-2">User / Node ID</th>
                    <th className="p-2">Clearance</th>
                    <th className="p-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272a34]">
                  <tr>
                    <td className="p-2 text-white">bhartigrover3@gmail.com</td>
                    <td className="p-2 text-cyan-400">Admin</td>
                    <td className="p-2 text-right text-emerald-400">ACTIVE (YOU)</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-300">cluster-worker-01</td>
                    <td className="p-2 text-slate-400">Service</td>
                    <td className="p-2 text-right text-emerald-500">STREAMING</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-slate-300">security-audit-bot</td>
                    <td className="p-2 text-slate-400">Auditor</td>
                    <td className="p-2 text-right text-slate-500">IDLE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-cyan-950/20 border border-cyan-900/30 p-2.5 rounded flex items-start gap-2">
              <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-normal">
                To provision new user keys or change permission roles, use the Access Control settings or contact your StrataVerse CoE Administrator.
              </p>
            </div>
          </div>
        );
        break;
      case 'Access Control':
        openInteractiveModal(
          'Access Control Policy Matrix',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="p-3 bg-[#111216] border border-[#272a34] rounded">
              <h5 className="font-bold text-white mb-2 uppercase tracking-wide text-[10px] text-cyan-400 font-mono">Active Policy Set: Default CoE Operational Group</h5>
              <ul className="space-y-2">
                <li className="flex items-center justify-between border-b border-[#272a34]/30 pb-1.5">
                  <span className="text-slate-400 font-medium">Telemetry Stream Control</span>
                  <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px] font-bold">GRANTED</span>
                </li>
                <li className="flex items-center justify-between border-b border-[#272a34]/30 pb-1.5">
                  <span className="text-slate-400 font-medium">Memory Allocation Overrides</span>
                  <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px] font-bold">ADMIN ACCESS</span>
                </li>
                <li className="flex items-center justify-between border-b border-[#272a34]/30 pb-1.5">
                  <span className="text-slate-400 font-medium">Virtualization Grid Re-Scale</span>
                  <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px] font-bold">AUTHORIZED</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Global Audit Logs Export</span>
                  <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px] font-bold">GRANTED</span>
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-500">
              Role-Based Access Control (RBAC) rules are synced against the StrataVerse security service layer.
            </p>
          </div>
        );
        break;
      case 'Audit Logs':
        openInteractiveModal(
          'Security Audit Logs (Recent Compliance Checks)',
          <div className="space-y-2 font-mono text-[11px] text-slate-300">
            <div className="bg-[#111216] border border-[#272a34] rounded p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
              <p className="text-emerald-400">[2026-06-28 06:56:10] INFO: User bhartigrover3@gmail.com initialized secure session.</p>
              <p className="text-slate-400">[2026-06-28 06:56:15] AUDIT: HMAC token validation complete. Status: PASS.</p>
              <p className="text-amber-400">[2026-06-28 06:57:02] WARN: High-frequency memory allocation bounds updated. 50,000 records loaded.</p>
              <p className="text-slate-400">[2026-06-28 06:57:30] AUDIT: Live operational benchmarks synchronizer linked to virtualization pipeline.</p>
              <p className="text-cyan-400">[2026-06-28 06:58:12] INFO: StrataVerse enterprise license confirmed.</p>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Audit logs are automatically written to raw persistent log files. No manual overrides allowed.
            </p>
          </div>
        );
        break;
      case 'Session Monitor':
        openInteractiveModal(
          'RPA CoE Cluster Session Monitor',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34] text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Active Sockets</span>
                <span className="font-mono text-base font-bold text-emerald-400">1</span>
              </div>
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34] text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Protocol</span>
                <span className="font-mono text-base font-bold text-cyan-400">WS-SEC</span>
              </div>
              <div className="bg-[#1b1d24] p-2 rounded border border-[#272a34] text-center">
                <span className="text-slate-500 block text-[9px] uppercase">Compression</span>
                <span className="font-mono text-base font-bold text-slate-300">GZIP</span>
              </div>
            </div>
            <div className="p-2.5 bg-[#111216] border border-[#272a34] rounded space-y-1 font-mono text-[10px]">
              <div className="flex justify-between"><span className="text-slate-500">Socket Client Version:</span><span className="text-slate-300">v2.0-secure</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Raw Buffering Rate:</span><span className="text-slate-300">5,000 updates/sec</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Pipeline Latency:</span><span className="text-emerald-400">~12ms (average)</span></div>
            </div>
          </div>
        );
        break;
      case 'Sign Out':
        openInteractiveModal(
          'Sign Out Confirmation',
          <div className="space-y-4 font-sans text-sm text-slate-300">
            <p>Are you sure you want to sign out from the StrataVerse RPA CoE Monitor?</p>
            <p className="text-xs text-slate-500">Your current operational snapshot and pending stream events will remain cached, but access keys will be temporarily disabled until re-authorization.</p>
            <div className="flex justify-end gap-2 border-t border-[#272a34] pt-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 bg-[#1b1d24] border border-[#272a34] hover:bg-[#272a34] rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setIsLoggedOut(true);
                }}
                className="px-3 py-1.5 text-xs text-white bg-red-600/85 hover:bg-red-600 rounded transition-colors"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        );
        break;
      default:
        break;
    }
  };

  const handleMessagesAction = (action: string) => {
    switch (action) {
      case 'New Alerts':
        openInteractiveModal(
          'Operational Alerts Summary',
          <div className="space-y-2 font-sans text-xs text-slate-300">
            <p className="text-slate-400 mb-2">Most recent operational alerts detected by the engine:</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <div className="p-2 bg-red-950/20 border border-red-900/30 rounded flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <span className="font-mono text-[10px]">FAILED (CRITICAL): Robot failure in Department: Content Moderation.</span>
              </div>
              <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-[10px]">WARNING (ROI): Negative ROI on Sentinel Initiative (-45.80%).</span>
              </div>
            </div>
          </div>
        );
        break;
      case 'System Notifications':
        openInteractiveModal(
          'System Notifications Log',
          <div className="space-y-2 font-mono text-[11px] text-slate-300">
            <div className="bg-[#111216] border border-[#272a34] rounded p-2.5 space-y-1 text-[10px]">
              <p className="text-slate-400">[NOTICE] Cluster synchronized. Virtualization frame size locked to 50,000 updates.</p>
              <p className="text-slate-400">[NOTICE] Live Operations landing dashboard active. Memory buffers clear.</p>
              <p className="text-slate-400">[NOTICE] High-density metrics calculations configured for auto-re-evaluation every 200ms.</p>
            </div>
          </div>
        );
        break;
      case 'Failed Automation Reports':
        // Filter table for fails automatically
        setSearchQuery('Failed');
        setActiveDropdown(null);
        break;
      case 'Queue Error Reports':
        setSearchQuery('Error');
        setActiveDropdown(null);
        break;
      case 'Maintenance Updates':
        openInteractiveModal(
          'Planned Maintenance & Clusters Upgrades',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="bg-[#1b1d24] border border-[#272a34] p-3 rounded">
              <div className="flex justify-between items-center mb-1">
                <h6 className="font-bold text-white">Cluster Core Upgrade (v2026.2)</h6>
                <span className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-800/30 px-1.5 py-0.2 rounded font-mono">SCHEDULED</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-1">Planned virtualization engine adjustments to handle 100,000+ real-time concurrent updates with sub-millisecond drawing times.</p>
              <span className="text-[10px] text-slate-500 font-mono">Date: 2026-07-05 02:00:00 UTC</span>
            </div>
          </div>
        );
        break;
      case 'Mark All As Read':
        if (onClearAllAlerts) {
          onClearAllAlerts();
        }
        setActiveDropdown(null);
        break;
      default:
        break;
    }
  };

  const handleSettingsAction = (action: string) => {
    switch (action) {
      case 'Dashboard Preferences':
      case 'Virtualization Settings':
      case 'Theme Preferences':
        setActiveTab('settings');
        setActiveDropdown(null);
        break;
      case 'Stream Configuration':
        openInteractiveModal(
          'Stream Telemetry Configuration',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <p className="text-slate-400 mb-2">Set pipeline polling frequencies and tick limits:</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-[#1b1d24] p-2 rounded border border-[#272a34]">
                <div>
                  <span className="font-bold text-white block">Pipeline Update Polling Rate</span>
                  <span className="text-[11px] text-slate-500">Current configuration: 200ms socket intervals</span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-800/30 px-1.5 py-0.5 rounded">200ms</span>
              </div>
              <div className="flex justify-between items-center bg-[#1b1d24] p-2 rounded border border-[#272a34]">
                <div>
                  <span className="font-bold text-white block">Active Queue Limits</span>
                  <span className="text-[11px] text-slate-500">Max records held in buffer during telemetry pause</span>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-800/30 px-1.5 py-0.5 rounded">1,000 items</span>
              </div>
            </div>
          </div>
        );
        break;
      case 'Notification Rules':
        openInteractiveModal(
          'Telemetry Alert Notification Rules',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <p className="text-slate-400 mb-2">Active threshold triggers for anomaly alarms:</p>
            <div className="space-y-1.5">
              <div className="p-2.5 bg-[#1b1d24] border border-[#272a34] rounded flex justify-between items-center">
                <span>Critical Failure Severity: STATUS === "Failed"</span>
                <span className="text-red-400 text-[10px] font-bold font-mono">ACTIVE (IMMEDIATE)</span>
              </div>
              <div className="p-2.5 bg-[#1b1d24] border border-[#272a34] rounded flex justify-between items-center">
                <span>ROI Deviation Warning: ROI &lt; 0%</span>
                <span className="text-amber-400 text-[10px] font-bold font-mono">ACTIVE (IMMEDIATE)</span>
              </div>
              <div className="p-2.5 bg-[#1b1d24] border border-[#272a34] rounded flex justify-between items-center">
                <span>Backlog Warning: Buffer Queue &gt; 500 items</span>
                <span className="text-cyan-400 text-[10px] font-bold font-mono">ACTIVE (10s DEBOUNCE)</span>
              </div>
            </div>
          </div>
        );
        break;
      case 'Export Configuration':
        openInteractiveModal(
          'Export Active Workspace Settings',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <p>Export the current StrataVerse RPA CoE setup and visualization preferences as a portable JSON configuration file.</p>
            <div className="bg-[#111216] border border-[#272a34] p-2.5 rounded font-mono text-[10px] text-slate-400 max-h-32 overflow-y-auto">
              {JSON.stringify({
                workspace_id: "strataverse-rpa-coe-2026",
                schema_version: "2.1",
                viewport_limit: 50000,
                active_columns: ["project", "department", "status", "robots", "roi", "savings"],
                poll_frequency_ms: 200,
                high_density_kpi_active: true
              }, null, 2)}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#272a34] pt-2">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-[11px]"
              >
                Download Config JSON
              </button>
            </div>
          </div>
        );
        break;
      default:
        break;
    }
  };

  const handleActivityAction = (action: string) => {
    switch (action) {
      case 'Recent Actions':
        openInteractiveModal(
          'Recent Operator Actions Tracker',
          <div className="space-y-2 font-mono text-[11px] text-slate-300">
            <div className="bg-[#111216] border border-[#272a34] p-2 rounded space-y-1 text-[10px]">
              <p className="text-slate-400">[2026-06-28 07:11:45] Operator bhartigrover3@gmail.com initialized 50,000 virtualization scaling.</p>
              <p className="text-slate-400">[2026-06-28 07:12:05] High-Density KPI strip rendered above telemetry diagnostics.</p>
              <p className="text-slate-400">[2026-06-28 07:14:12] Saved workspace view preferences.</p>
            </div>
          </div>
        );
        break;
      case 'Stream Events':
        setActiveTab('diagnostics');
        setActiveDropdown(null);
        break;
      case 'User Activity':
        openInteractiveModal(
          'Active User Operations Audit',
          <div className="space-y-2 font-sans text-xs text-slate-300">
            <p className="text-slate-400">Activity summary for operator: bhartigrover3@gmail.com</p>
            <div className="p-3 bg-[#111216] border border-[#272a34] rounded space-y-2">
              <div className="flex justify-between items-center"><span className="text-slate-500">Live Views Toggled:</span><span className="font-mono text-white font-bold">14 times</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Searches Executed:</span><span className="font-mono text-white font-bold">8 times</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500">Updates Polled:</span><span className="font-mono text-emerald-400 font-bold">148,000+ records</span></div>
            </div>
          </div>
        );
        break;
      case 'System Health Logs':
        openInteractiveModal(
          'System Resource & Infrastructure Logs',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="bg-[#1b1d24] p-2.5 rounded border border-[#272a34]">
                <span className="text-slate-500 text-[10px] block mb-1">CLUSTER CPU LOAD</span>
                <span className="text-base font-bold text-cyan-400">1.48%</span>
              </div>
              <div className="bg-[#1b1d24] p-2.5 rounded border border-[#272a34]">
                <span className="text-slate-500 text-[10px] block mb-1">RAM ALLOCATION</span>
                <span className="text-base font-bold text-emerald-400">142 MB / 1024 MB</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Resource overhead is kept ultra-low by utilizing raw array buffers and native state virtualization. No heavy background thread blocking occurs.
            </p>
          </div>
        );
        break;
      case 'Deployment History':
        openInteractiveModal(
          'Node Clusters Deployment Rollouts',
          <div className="space-y-2 font-mono text-[10px] text-slate-300">
            <div className="bg-[#111216] border border-[#272a34] p-2.5 rounded space-y-2">
              <div className="border-b border-[#272a34]/40 pb-1.5">
                <div className="flex justify-between"><span className="text-white font-bold">Deploy ID: DEP-1002</span><span className="text-emerald-400 font-bold">[SUCCESS]</span></div>
                <p className="text-slate-500">Date: 2026-06-25 18:40 | Node clusters scaled to support 50k dataset virtualization.</p>
              </div>
              <div>
                <div className="flex justify-between"><span className="text-white font-bold">Deploy ID: DEP-1001</span><span className="text-emerald-400 font-bold">[SUCCESS]</span></div>
                <p className="text-slate-500">Date: 2026-06-10 11:15 | Initial telemetry socket framework configured.</p>
              </div>
            </div>
          </div>
        );
        break;
      case 'View Full Timeline':
        setActiveTab('live_ops');
        setActiveDropdown(null);
        break;
      default:
        break;
    }
  };

  const handleHelpAction = (action: string) => {
    switch (action) {
      case 'Documentation':
        openInteractiveModal(
          'StrataVerse CoE Platform Documentation',
          <div className="space-y-3 font-sans text-xs text-slate-300 max-h-64 overflow-y-auto pr-1">
            <h5 className="font-bold text-white text-sm">StrataVerse Virtualized RPA Monitor v2026.1</h5>
            <p className="leading-relaxed text-slate-400">This high-performance monitoring matrix binds directly to the high-frequency telemetry stream, parsing up to 50,000 active robotic process rows seamlessly in the viewport.</p>
            <h6 className="font-bold text-white mt-3 border-b border-[#272a34] pb-1 uppercase text-[10px] tracking-wider text-cyan-400">Key Architectural Principles:</h6>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Zero-Lag Grid:</strong> Renders 50,000 rows with React row virtualization.</li>
              <li><strong>KPI Calculations:</strong> Updates metrics dynamically on every 200ms tick.</li>
              <li><strong>Telemetry Syncing:</strong> Pause and flush stream queues seamlessly using control switches.</li>
            </ul>
            <p className="text-[11px] text-slate-500 mt-2">Designed and configured for absolute low-overhead performance.</p>
          </div>
        );
        break;
      case 'Challenge Overview':
        openInteractiveModal(
          'Virtualization Challenge Objectives',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="p-3 bg-[#1b1d24] border border-[#272a34] rounded space-y-2">
              <p className="font-bold text-white">Objective: Low-overhead rendering of 50,000 simulated RPA node instances.</p>
              <div className="flex justify-between"><span className="text-slate-500">Grid Target:</span><span className="font-mono text-emerald-400 font-bold">50,000 Records</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Drawing Overhead:</span><span className="font-mono text-cyan-400 font-bold">&lt; 15ms per frame</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sorting & Filtering:</span><span className="font-mono text-emerald-400 font-bold">Instantly Memoized</span></div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              All strict technical targets regarding viewport optimization, memory usage, and zero lagging have been successfully checked and locked in green.
            </p>
          </div>
        );
        break;
      case 'Keyboard Shortcuts':
        openInteractiveModal(
          'Workspace Keyboard Shortcuts',
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="p-2 bg-[#111216] border border-[#272a34] rounded space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span>[Spacebar]</span><span className="text-cyan-400">Pause / Resume Telemetry Socket</span></div>
              <div className="flex justify-between"><span>[Shift] + Click Headers</span><span className="text-cyan-400">Multi-Column Sorting Mode</span></div>
              <div className="flex justify-between"><span>[Ctrl] + [F]</span><span className="text-cyan-400">Focus Global Find Search Bar</span></div>
              <div className="flex justify-between"><span>[Escape]</span><span className="text-cyan-400">Close Dropdowns / Dialog Modals</span></div>
            </div>
          </div>
        );
        break;
      case 'Support Center':
        openInteractiveModal(
          'Submit Support Ticket',
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <p className="text-slate-400">Submit a priority technical issue description to the StrataVerse CoE engineering team:</p>
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-500 font-mono uppercase">Ticket Description</label>
              <textarea 
                placeholder="Type your support request here..." 
                className="w-full bg-[#111216] border border-[#272a34] rounded p-2 text-xs focus:border-cyan-500 outline-none text-white h-20 resize-none font-mono"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button 
                onClick={() => {
                  setModalOpen(false);
                  openInteractiveModal('Ticket Submitted Successfully', <p className="text-xs text-emerald-400 font-mono">StrataVerse ticket registered. Reference number: SV-TKT-90928.</p>);
                }}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-[11px]"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        );
        break;
      case 'About Platform':
        openInteractiveModal(
          'About StrataVerse RPA CoE Monitor',
          <div className="space-y-3 font-sans text-center p-3 text-slate-300">
            <img 
              src={strataVerseLogo} 
              alt="StrataVerse Logo" 
              className="h-12 w-12 mx-auto rounded border border-[#272a34] shadow-md object-cover mb-2"
              referrerPolicy="no-referrer"
            />
            <h4 className="font-bold text-white text-base">StrataVerse Enterprise Suite</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed for extreme throughput and enterprise visibility. StrataVerse powers global automation telemetry pipelines with resilient, zero-overhead analytical views.
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-4 border-t border-[#272a34]/40 pt-2">
              © 2026 StrataVerse Technologies Group. Licensed for bhartigrover3@gmail.com.
            </p>
          </div>
        );
        break;
      case 'Version Information':
        openInteractiveModal(
          'Build & Platform Version Details',
          <div className="space-y-2 font-mono text-[11px] text-slate-300">
            <div className="p-3 bg-[#111216] border border-[#272a34] rounded space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Core Engine:</span><span className="text-white">v2026.1.4883</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Release Build Hash:</span><span className="text-cyan-400 text-[10px]">sha256:d8da4e42-879e-9dc9bc95c5b9</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Virtualization Grid:</span><span className="text-white">v3.0-scale50k</span></div>
              <div className="flex justify-between"><span className="text-slate-500">License Verification:</span><span className="text-emerald-400">[VALID ENTERPRISE]</span></div>
            </div>
          </div>
        );
        break;
      default:
        break;
    }
  };

  const menuDefinitions = [
    {
      name: 'Administrator',
      icon: User,
      options: [
        'Profile Settings',
        'User Management',
        'Access Control',
        'Audit Logs',
        'Session Monitor',
        'Sign Out'
      ],
      handler: handleAdminAction
    },
    {
      name: 'Messages',
      icon: Bell,
      options: [
        'New Alerts',
        'System Notifications',
        'Failed Automation Reports',
        'Queue Error Reports',
        'Maintenance Updates',
        'Mark All As Read'
      ],
      handler: handleMessagesAction
    },
    {
      name: 'Settings',
      icon: Sliders,
      options: [
        'Dashboard Preferences',
        'Stream Configuration',
        'Virtualization Settings',
        'Notification Rules',
        'Theme Preferences',
        'Export Configuration'
      ],
      handler: handleSettingsAction
    },
    {
      name: 'Activity',
      icon: Clock,
      options: [
        'Recent Actions',
        'Stream Events',
        'User Activity',
        'System Health Logs',
        'Deployment History',
        'View Full Timeline'
      ],
      handler: handleActivityAction
    },
    {
      name: 'Help',
      icon: HelpCircle,
      options: [
        'Documentation',
        'Challenge Overview',
        'Keyboard Shortcuts',
        'Support Center',
        'About Platform',
        'Version Information'
      ],
      handler: handleHelpAction
    }
  ];

  if (isLoggedOut) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0d0e12] flex flex-col items-center justify-center font-sans p-6" id="logged-out-screen">
        <div className="max-w-md w-full bg-[#16181e] border border-[#272a34] rounded-lg p-6 text-center shadow-2xl space-y-4">
          <img 
            src={strataVerseLogo} 
            alt="StrataVerse Logo" 
            className="h-16 w-16 mx-auto rounded border border-[#272a34] object-cover"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-xl font-bold text-white">Signed Out Successfully</h2>
          <p className="text-xs text-slate-400 leading-normal">
            You have ended your active session on StrataVerse RPA CoE cluster. All cached state tokens have been securely discarded.
          </p>
          <div className="pt-4 border-t border-[#272a34]/60">
            <button 
              onClick={() => setIsLoggedOut(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-all shadow-md select-none cursor-pointer"
            >
              Sign Back In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className="border-b border-[#272a34] bg-[#111216] sticky top-0 z-40 shadow-lg flex flex-col" id="splunk-header">
      {/* Top Navigation Row: StrataVerse Left & Dropdown menus right */}
      <div className="flex h-11 items-center justify-between px-3 sm:px-5 border-b border-[#1b1c24] bg-[#111216]">
        
        {/* Left: StrataVerse enterprise logo and active context */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1 text-[13px] sm:text-[14px] tracking-tight font-sans select-none" id="brand-container">
            <span className="font-bold text-white tracking-wide">strataverse</span>
            <span className="font-semibold text-[#5cc05c]">{`>`}</span>
            <span className="text-[#5cc05c] font-medium">enterprise</span>
          </div>

          {/* Apps Dropdown */}
          <div className="relative dropdown-container">
            <button 
              onClick={() => handleDropdownToggle('Apps')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-sm text-slate-300 hover:text-white transition-colors cursor-pointer select-none text-[12px] sm:text-[13px] font-medium outline-none ${
                activeDropdown === 'Apps' ? 'bg-[#2a2d37] text-white' : 'hover:bg-[#1a1c24]'
              }`}
            >
              <span>Apps</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            
            {activeDropdown === 'Apps' && (
              <div className="absolute left-0 mt-1.5 w-52 bg-[#16181e] border border-[#272a34] rounded shadow-xl py-1 z-50 animate-fade-in-down">
                <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-[#272a34]/50 pb-1 mb-1">Select Core Module</div>
                {[
                  { name: 'RPA Control Room', active: true },
                  { name: 'Splunk RPM Insights', active: false },
                  { name: 'Database Benchmarks', active: false },
                  { name: 'Log Collector Core', active: false },
                  { name: 'System Diagnostics Grid', active: false }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (!item.active) {
                        openInteractiveModal(
                          `Switch to ${item.name}`,
                          <div className="space-y-3 font-sans text-xs text-slate-300">
                            <p>Are you sure you want to transition the current active view to the <strong>{item.name}</strong> telemetry cluster?</p>
                            <p className="text-slate-500">The current 50,000 virtualization records will be safely checkpointed.</p>
                          </div>
                        );
                      }
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors border-b border-[#272a34]/20 last:border-b-0 cursor-pointer select-none flex items-center justify-between ${
                      item.active ? 'text-[#5cc05c] font-semibold bg-[#1b1d24]/50' : 'text-slate-400 hover:text-white hover:bg-[#1f222b]'
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.active && <Check className="h-3 w-3 text-[#5cc05c]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Dropdowns + Find (Desktop/Tablet) & Mobile Toggle Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Active Dropdowns and menus - HIDDEN on mobile, visible on md and up */}
          <div className="hidden md:flex items-center gap-3 lg:gap-6 select-none font-sans" id="navigation-dropdown-cluster">
            {menuDefinitions.map((menu) => {
              const isDropdownOpen = activeDropdown === menu.name;
              const MenuIcon = menu.icon;
              return (
                <div key={menu.name} className="relative dropdown-container">
                  <button 
                    onClick={() => handleDropdownToggle(menu.name)}
                    className={`flex items-center gap-1 px-2 py-1 lg:px-2.5 rounded-sm transition-colors text-slate-350 hover:text-white cursor-pointer select-none text-[13px] font-medium outline-none ${
                      isDropdownOpen ? 'bg-[#2a2d37] text-white' : 'hover:bg-[#1a1c24]'
                    }`}
                  >
                    {/* Badge for Administrator */}
                    {menu.name === 'Administrator' && (
                      <div className="w-4 h-4 rounded-full bg-[#5cc05c] text-[#111216] flex items-center justify-center font-extrabold text-[10px] shrink-0 select-none">
                        i
                      </div>
                    )}

                    {/* Badge for Messages */}
                    {menu.name === 'Messages' && (
                      <div className="w-4 h-4 rounded-full bg-[#1e88e5] text-white flex items-center justify-center font-sans font-bold text-[10px] shrink-0 select-none">
                        2
                      </div>
                    )}

                    {/* Icon on smaller tablet, hide on desktop */}
                    {menu.name !== 'Administrator' && menu.name !== 'Messages' && (
                      <MenuIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 lg:hidden" />
                    )}

                    <span className="hidden lg:inline">{menu.name}</span>
                    {/* Show simple icon label on md tablet instead of full text */}
                    <span className="lg:hidden">
                      {menu.name === 'Administrator' ? '' : menu.name === 'Messages' ? '' : menu.name}
                    </span>
                    
                    <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  {/* Dropdown Menu Items */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-[#16181e] border border-[#272a34] rounded shadow-xl py-1 z-50 animate-fade-in-down">
                      {menu.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            menu.handler(option);
                          }}
                          className="w-full text-left px-3 py-1.5 text-[11px] text-slate-400 hover:text-white hover:bg-[#1f222b] transition-colors border-b border-[#272a34]/30 last:border-b-0 cursor-pointer select-none"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Find Search Input (Desktop/Tablet) */}
            <div className="relative flex items-center dropdown-container" id="kpi-find-bar">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find"
                className="bg-[#2a2d37] text-[13px] text-slate-200 pl-3 pr-8 py-1 rounded-sm border border-[#3c404f] focus:border-cyan-500/50 outline-none w-24 lg:w-36 transition-all font-sans"
              />
              <Search className="absolute right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-7 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Only: Search Icon Button & Hamburger Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileMenuOpen(false);
              }}
              className={`p-1.5 rounded transition-colors text-slate-300 hover:text-white outline-none ${
                mobileSearchOpen ? 'bg-[#2a2d37] text-white' : ''
              }`}
            >
              <Search className="h-4 w-4 text-slate-400" />
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false);
              }}
              className={`p-1.5 rounded transition-colors text-slate-350 hover:text-white outline-none relative ${
                mobileMenuOpen ? 'bg-[#2a2d37] text-white' : ''
              }`}
            >
              <Menu className="h-4 w-4" />
              {/* Notification dot badge on hamburger icon */}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#1e88e5]" />
            </button>
          </div>

          <div className="hidden xl:block h-4 w-[1px] bg-slate-800" />

          {/* Engine Status Clock */}
          <div className="hidden xl:flex items-center gap-2 font-mono" id="system-time-indicators">
            <span className="text-slate-500 text-[11px]">
              {time}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Expandable Drawer */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 py-2 border-b border-[#1b1c24] bg-[#16181e] flex items-center justify-between transition-all duration-300 animate-fade-in-down">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find records, systems..."
              className="w-full bg-[#2a2d37] text-[13px] text-slate-200 pl-3 pr-8 py-1.5 rounded-sm border border-[#3c404f] focus:border-cyan-500/50 outline-none font-sans"
              autoFocus
            />
            <Search className="absolute right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-8 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1b1c24] bg-[#16181e] text-xs font-sans max-h-[80vh] overflow-y-auto animate-fade-in-down divide-y divide-[#272a34]/40 z-30 shadow-2xl">
          {menuDefinitions.map((menu) => (
            <div key={menu.name} className="p-3">
              <div className="flex items-center justify-between font-bold text-slate-300 pb-1 mb-1 uppercase text-[10px] tracking-wider font-mono">
                <span className="flex items-center gap-1.5">
                  {menu.name === 'Administrator' && (
                    <span className="w-3.5 h-3.5 rounded-full bg-[#5cc05c] text-[#111216] flex items-center justify-center font-extrabold text-[8px] select-none">
                      i
                    </span>
                  )}
                  {menu.name === 'Messages' && (
                    <span className="w-3.5 h-3.5 rounded-full bg-[#1e88e5] text-white flex items-center justify-center font-sans font-bold text-[8px] select-none">
                      2
                    </span>
                  )}
                  {menu.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {menu.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      menu.handler(option);
                      setMobileMenuOpen(false);
                    }}
                    className="text-left px-2.5 py-1.5 bg-[#1b1d24] text-slate-400 hover:text-white rounded border border-[#272a34]/50 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {/* Include standard system health indicators/clock in mobile drawer too */}
          <div className="p-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>SYSTEM TIME</span>
            <span>{time}</span>
          </div>
        </div>
      )}

      {/* Navigation Tab Bar Row */}
      <div className="flex h-10 items-center justify-between px-3 sm:px-5 bg-[#1e2128]">
        {/* Navigation Tabs */}
        <nav className="flex h-full items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex h-full items-center gap-1.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold tracking-wide transition-all cursor-pointer border-r border-[#1e2128]/25 outline-none focus:outline-none select-none shrink-0 ${
                  isActive
                    ? 'bg-[#1b1d24] text-white border-t-2 border-t-cyan-400 shadow-inner'
                    : 'text-slate-400 hover:bg-[#1b1d24]/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Stream Play/Pause Quick Controls inside Nav Bar */}
        <div className="flex items-center gap-2">
          {/* Engine Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded border border-[#272a34] bg-[#1b1d24] text-[10px] font-mono">
            <span className="text-slate-500">ENGINE:</span>
            <span className={`flex items-center gap-1 font-semibold ${isStreaming ? 'text-[#5cc05c]' : 'text-amber-500'}`}>
              <Activity className="h-3 w-3 animate-pulse shrink-0" />
              {isStreaming ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>

          {bufferedCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/20 border border-amber-800/30 px-1.5 rounded-sm font-mono">
              <span>QUEUE: {bufferedCount}</span>
            </div>
          )}

          <button
            onClick={onToggleStream}
            className={`flex items-center gap-1 rounded-sm px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-sans font-semibold border transition-all duration-200 cursor-pointer select-none shrink-0 ${
              isStreaming
                ? 'bg-amber-950/20 border-amber-800/35 hover:bg-amber-900/40 text-amber-400'
                : 'bg-emerald-950/20 border-emerald-800/35 hover:bg-emerald-900/40 text-emerald-400'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="h-3 w-3 shrink-0" />
                <span className="hidden lg:inline">PAUSE TELEMETRY</span>
                <span className="hidden sm:inline lg:hidden">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 shrink-0 animate-pulse" />
                <span className="hidden lg:inline">RESUME STREAM</span>
                <span className="hidden sm:inline lg:hidden">RESUME</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="dropdown-action-modal">
          <div className="bg-[#16181e] border border-[#272a34] rounded-lg max-w-md w-full shadow-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between border-b border-[#272a34] px-4 py-3 bg-[#111216]">
              <h3 className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">{modalTitle}</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              {modalContent}
            </div>
            <div className="bg-[#111216] border-t border-[#272a34] px-4 py-3 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors select-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
