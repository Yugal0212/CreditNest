'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Activity, ShieldCheck, User, Store, AlertTriangle, Key, Search, Clock } from 'lucide-react';

import { useState, useEffect } from 'react';

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

const getActionIcon = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('auth')) return <Key className="w-4 h-4 text-primary dark:text-indigo-400" />;
  if (a.includes('fail') || a.includes('error')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (a.includes('update') || a.includes('change')) return <Activity className="w-4 h-4 text-primary dark:text-indigo-400" />;
  if (a.includes('create') || a.includes('register')) return <User className="w-4 h-4 text-primary dark:text-indigo-400" />;
  return <ShieldCheck className="w-4 h-4 text-muted-foreground" />;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await adminAPI.getAuditLogs({ page: 1, limit: 100 });
      setLogs(response.data.logs);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load system logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.userEmail && log.userEmail.toLowerCase().includes(search.toLowerCase())) ||
    (log.ipAddress && log.ipAddress.includes(search))
  );

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary dark:text-indigo-400" /> System Logs
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Real-time security audit trails and system activity logs.
              </p>
            </div>
          </div>

          <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-0 overflow-hidden">
            <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row flex-wrap items-center gap-4 justify-between bg-muted/20">
              <h2 className="font-black text-foreground">Recent Activity</h2>
              <div className="relative w-full sm:w-auto min-w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50 transition-all shadow-sm"
                />
              </div>
            </div>

            {isLoading ? (
               <div className="text-center py-20">
                 <svg className="animate-spin h-8 w-8 text-primary dark:text-indigo-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <p className="text-muted-foreground font-medium">Retrieving audit trails...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                 <p className="text-muted-foreground font-medium">No logs found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredLogs.map((log, i) => (
                  <div
                    key={log.id}
                   
                   
                   
                    className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 justify-between"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-background border border-border/80 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm tracking-tight">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-medium text-primary dark:text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors px-2 py-0.5 rounded-full">
                            {log.userRole || 'SYSTEM'}
                          </span>
                          {log.userEmail && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[200px]">
                              {log.userEmail}
                            </span>
                          )}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-[10px] font-mono text-muted-foreground/80 bg-card text-card-foreground border border-border shadow-sm p-2 rounded-lg border border-border/40 max-w-lg overflow-x-auto">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 text-right shrink-0 ml-14 sm:ml-0">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> 
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                      {log.ipAddress && (
                         <span className="text-[10px] font-mono text-muted-foreground mt-1 hidden sm:block">
                           IP: {log.ipAddress}
                         </span>
                      )}
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

