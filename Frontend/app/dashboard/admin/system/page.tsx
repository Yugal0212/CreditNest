'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { 
  ShieldAlert, Activity, Database, Server, Cpu, HardDrive, 
  Terminal, ShieldCheck, PlayCircle, Loader2, CheckCircle2, Clock, Globe
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AdminSystemSkeleton } from '@/components/skeletons/AdminSkeletons';
import { io, Socket } from 'socket.io-client';

interface SystemDiagnostics {
  status: string;
  serverUptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  database: {
    status: string;
    totalUsers: number;
    totalShops: number;
    totalCustomers: number;
    totalTransactions: number;
    totalPayments: number;
    totalAuditLogs: number;
    activeSessions: number;
  };
  systemLoad: {
    cpu: number;
    networkLatency: string;
    requestRate: string;
    errorRate: string;
  };
}

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch to avoid waiting 5 seconds for the first socket emit
    fetchSystemDiagnostics();

    // Setup WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on('system_health', (data: any) => {
      setHealth((prev) => {
        if (!prev) return data;
        return {
          ...prev,
          ...data,
          database: data.database || prev.database,
        };
      });
      setIsLoading(false);
    });

    socket.on('system_log', (log: LogEntry) => {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, log];
        // Keep only last 50 logs to prevent memory bloat
        return newLogs.slice(-50);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchSystemDiagnostics = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setHealth(response.data.health);
    } catch (error: any) {
      toast({
        title: 'Diagnostic Failure',
        description: error.response?.data?.message || 'Failed to fetch platform metrics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDiagnostics = async (id: string, label: string) => {
    setRunningTool(id);
    try {
      let response;
      if (id === 'db_backup') {
        response = await adminAPI.runSystemBackup();
        if (response.data.backupUrl) {
          const a = document.createElement('a');
          a.href = process.env.NEXT_PUBLIC_API_URL + response.data.backupUrl;
          a.download = response.data.backupUrl.split('/').pop() || 'backup.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else if (id === 'db_prune') {
        response = await adminAPI.runPruneTokens();
      } else if (id === 'db_optimize') {
        response = await adminAPI.runOptimizeDB();
      }

      toast({
        title: 'Task Completed',
        description: response?.data?.message || `Successfully executed: ${label}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Task Failed',
        description: error.response?.data?.message || `Failed to execute ${label}`,
        variant: 'destructive'
      });
    } finally {
      setRunningTool(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-500';
      case 'POST': return 'text-indigo-500';
      case 'PUT':
      case 'PATCH': return 'text-amber-500';
      case 'DELETE': return 'text-rose-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-8 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <ShieldAlert className="w-8 h-8 text-primary dark:text-indigo-400" /> Platform Diagnostics
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Live system monitoring, access logs, and real-time operational status.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-xs shadow-sm">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               Live Connection
            </div>
          </div>

          {isLoading ? (
            <AdminSystemSkeleton />
          ) : !health ? (
            <div className="text-center py-16 glass-card bg-card text-card-foreground border border-border rounded-2xl shadow-sm">
              <p className="text-muted-foreground font-medium">Failed to establish socket connection with server stats API.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column (Grid spanning 2 columns) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Real-time Server Stats */}
                <div className="glass-card bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary dark:text-indigo-400" />
                      Server Hardware Load
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* CPU Widget */}
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                        <span>CPU Allocation</span>
                        <Cpu className="w-4 h-4 text-primary dark:text-indigo-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-3xl font-black tracking-tight text-foreground">{health.systemLoad.cpu}%</p>
                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary dark:bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${health.systemLoad.cpu}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Heap Memory Widget */}
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                        <span>RAM Heap Used</span>
                        <HardDrive className="w-4 h-4 text-primary dark:text-indigo-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-3xl font-black tracking-tight text-foreground">{health.memoryUsage.heapUsed}MB</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                          <span>Total Limit</span>
                          <span>{health.memoryUsage.heapTotal}MB</span>
                        </div>
                      </div>
                    </div>

                    {/* Process Uptime Widget */}
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
                        <span>Node Process Uptime</span>
                        <Clock className="w-4 h-4 text-primary dark:text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black tracking-tight text-foreground">{formatUptime(health.serverUptime)}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Continuously active</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Database Metrics & Index Status */}
                <div className="glass-card bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2 mb-6">
                    <Database className="w-5 h-5 text-primary dark:text-indigo-400" />
                    Database Table Statistics (PostgreSQL)
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Users', value: health?.database?.totalUsers || 0 },
                      { label: 'Active Shops', value: health?.database?.totalShops || 0 },
                      { label: 'Customers', value: health?.database?.totalCustomers || 0 },
                      { label: 'Credit Sales', value: health?.database?.totalTransactions || 0 },
                      { label: 'Audit Logs', value: health?.database?.totalAuditLogs || 0 },
                      { label: 'Active Sessions', value: health?.database?.activeSessions || (health as any)?.activeSessions || 0 },
                    ].map((tbl, i) => (
                      <div key={i} className="bg-muted/30 border border-border/50 rounded-xl p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tbl.label}</span>
                        <p className="text-2xl font-black text-foreground mt-1">{tbl.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-Time System Log Terminal */}
                <div className="bg-[#0f172a] dark:bg-black border border-slate-800 rounded-2xl p-0 shadow-lg font-mono overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-[#1e293b]/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs text-slate-400 font-bold ml-2 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Live API Traffic Stream
                      </span>
                    </div>
                  </div>

                  <div className="p-4 h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {logs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        Waiting for incoming traffic...
                      </div>
                    ) : (
                      <div className="space-y-2 text-[11px] leading-relaxed">
                        {logs.map((log, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            key={i} 
                            className="flex flex-col sm:flex-row gap-2 sm:gap-4 hover:bg-slate-800/50 p-1 rounded transition-colors text-slate-300"
                          >
                            <span className="text-slate-500 shrink-0">
                              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold w-12 ${getMethodColor(log.method)}`}>{log.method}</span>
                              <span className="text-slate-200 truncate max-w-[200px] sm:max-w-xs">{log.path}</span>
                            </div>
                            <span className="text-slate-500 ml-auto flex items-center gap-1 font-semibold shrink-0">
                               <Globe className="w-3 h-3" /> {log.ip}
                            </span>
                          </motion.div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Platform Controls & Tools */}
              <div className="space-y-6">
                
                {/* Platform Health Summary */}
                <div className="glass-card bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
                  
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-primary dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                      System Summary
                    </span>
                    <h3 className="text-xl font-black text-foreground">Platform Health Outstanding</h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      All servers are currently reporting stable loads. Rate limits are handling all requests inside optimal parameters.
                    </p>
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">API Error Rate</span>
                      <strong className="text-foreground text-sm">{health.systemLoad.errorRate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Ping Speed</span>
                      <strong className="text-emerald-500 text-sm">{health.systemLoad.networkLatency}</strong>
                    </div>
                  </div>
                </div>

                {/* Operations & Maintenance Tools */}
                <div className="glass-card bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2 mb-6">
                    <ShieldCheck className="w-5 h-5 text-primary dark:text-indigo-400" />
                    Admin Operations
                  </h2>

                  <div className="space-y-3">
                    {[
                      { id: 'db_backup', label: 'Backup PostgreSQL Database', desc: 'Secure compression export to storage archive.' },
                      { id: 'db_prune', label: 'Prune Verification Tokens', desc: 'Clear expired OTP codes and temp login caches.' },
                      { id: 'db_optimize', label: 'Optimize Database Indices', desc: 'Recalculate PostgreSQL table indexes.' },
                    ].map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleRunDiagnostics(tool.id, tool.label)}
                        disabled={runningTool !== null}
                        className="w-full text-left p-4 bg-muted/30 hover:bg-muted/60 disabled:opacity-50 border border-border/50 rounded-xl transition-all flex items-center gap-3 group relative overflow-hidden"
                      >
                        <div className="p-2.5 bg-indigo-500/10 rounded-lg text-primary dark:text-indigo-400">
                          {runningTool === tool.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">{tool.label}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-snug">{tool.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
