'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { 
  Activity, ShieldCheck, User, AlertTriangle, Key, Search, 
  Terminal, Server, FileText, LayoutList 
} from 'lucide-react';
import { AdminLogsSkeleton } from '@/components/skeletons/AdminSkeletons';
import { useState, useEffect } from 'react';

// --- Interfaces ---
interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface ApiLog {
  id: number;
  method: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  statusCode: number;
  responseTime: number;
  createdAt: string;
}

// --- Helpers ---
const getActionIcon = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('auth')) return <Key className="w-4 h-4 text-primary dark:text-indigo-400" />;
  if (a.includes('fail') || a.includes('error')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (a.includes('update') || a.includes('change')) return <Activity className="w-4 h-4 text-primary dark:text-indigo-400" />;
  if (a.includes('create') || a.includes('register') || a.includes('signup')) return <User className="w-4 h-4 text-emerald-500" />;
  return <ShieldCheck className="w-4 h-4 text-muted-foreground" />;
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'POST': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    case 'PUT':
    case 'PATCH': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'DELETE': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
  }
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'text-emerald-500';
  if (status >= 400 && status < 500) return 'text-amber-500';
  if (status >= 500) return 'text-rose-500';
  return 'text-slate-500';
};

// --- Component ---
export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState<'USER_LOGS' | 'API_LOGS'>('USER_LOGS');
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'USER_LOGS') {
        const res = await adminAPI.getAuditLogs({ page: 1, limit: 100 });
        setAuditLogs(res.data.logs || []);
      } else {
        const res = await adminAPI.getApiLogs({ page: 1, limit: 100 });
        setApiLogs(res.data.logs || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching logs',
        description: error.response?.data?.message || 'Failed to connect to backend',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.userEmail && log.userEmail.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredApiLogs = apiLogs.filter(log => 
    log.path.toLowerCase().includes(search.toLowerCase()) ||
    log.method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary dark:text-indigo-400" /> 
                Activity & System Logs
              </h1>
              <p className="text-muted-foreground mt-1 font-medium text-sm">
                Track user operations (login, signup) and monitor HTTP API traffic in real-time.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <button 
              onClick={() => setActiveTab('USER_LOGS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'USER_LOGS' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              User Actions & Logins
            </button>
            <button 
              onClick={() => setActiveTab('API_LOGS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'API_LOGS' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Backend API Traffic
            </button>
          </div>

          {/* Logs Container */}
          <div className="glass-card bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
              <h2 className="font-black text-foreground flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-primary dark:text-indigo-400" />
                {activeTab === 'USER_LOGS' ? 'User Operation History' : 'API Request Log'}
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab === 'USER_LOGS' ? 'actions or users...' : 'routes or methods...'}`}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
              </div>
            </div>

            {isLoading ? (
               <div className="p-4"><AdminLogsSkeleton /></div>
            ) : (activeTab === 'USER_LOGS' ? filteredAuditLogs.length === 0 : filteredApiLogs.length === 0) ? (
              <div className="text-center py-24 flex flex-col items-center justify-center">
                 <Server className="w-12 h-12 text-muted-foreground/30 mb-4" />
                 <p className="text-muted-foreground font-medium">No logs found matching your criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {activeTab === 'USER_LOGS' && filteredAuditLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:px-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm tracking-tight">{log.action}</p>
                          {log.userRole && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border">
                              {log.userRole}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          {log.userEmail || 'System Process'} 
                          {log.ipAddress && ` • IP: ${log.ipAddress}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {activeTab === 'API_LOGS' && filteredApiLogs.map((log) => (
                  <div key={log.id} className="p-3 sm:px-5 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className={`shrink-0 w-14 text-center py-1 rounded border text-[10px] font-black tracking-wider ${getMethodColor(log.method)}`}>
                        {log.method}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate" title={log.path}>
                          {log.path}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate max-w-sm" title={log.userAgent}>
                          {log.userAgent}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-right">
                       <span className={`text-xs font-black px-2 py-1 bg-muted/50 rounded-md border border-border/50 ${getStatusColor(log.statusCode)}`}>
                         {log.statusCode || '---'}
                       </span>
                       <div className="text-right">
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour12: false })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
