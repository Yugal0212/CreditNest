'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Zap, TrendingUp, BarChart as BarChartIcon, Users, Store, ArrowUpRight, DollarSign } from 'lucide-react';
import { AdminAnalyticsSkeleton } from '@/components/skeletons/AdminSkeletons';
import dynamic from 'next/dynamic';

const BarChart: any = dynamic(() => import('recharts').then((mod) => mod.BarChart as any), { ssr: false });
const Bar: any = dynamic(() => import('recharts').then((mod) => mod.Bar as any), { ssr: false });
const XAxis: any = dynamic(() => import('recharts').then((mod) => mod.XAxis as any), { ssr: false });
const YAxis: any = dynamic(() => import('recharts').then((mod) => mod.YAxis as any), { ssr: false });
const Tooltip: any = dynamic(() => import('recharts').then((mod) => mod.Tooltip as any), { ssr: false });
const ResponsiveContainer: any = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer as any), { ssr: false });
const Cell: any = dynamic(() => import('recharts').then((mod) => mod.Cell as any), { ssr: false });

import { useState, useEffect } from 'react';

interface AnalyticsData {
  period: string;
  shopGrowth: { newShops: number };
  customerGrowth: { newCustomers: number };
  topShops: Array<{ shopName: string; revenue: number }>;
  creditRecoveryRate: number;
  collectionEfficiency: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getAnalytics(period);
      setData(response.data.analytics);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-8 max-w-7xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                <Zap className="w-8 h-8 text-primary dark:text-indigo-400" /> Platform Analytics
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">
                In-depth financial insights and growth metrics across CreditNest.
              </p>
            </div>
            <div className="flex bg-card text-card-foreground border border-border shadow-sm rounded-xl border border-border/50 p-1">
              {[
                 { label: '7D', value: '7days' },
                 { label: '30D', value: '30days' },
                 { label: '90D', value: '90days' },
                 { label: '1Y', value: '1year' },
               ].map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    period === p.value ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="min-h-[500px]">
              <AdminAnalyticsSkeleton />
            </div>
          ) : !data ? (
             <div className="text-center py-20 min-h-[500px] flex items-center justify-center glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all rounded-2xl">
               <p className="text-muted-foreground font-medium">Analytics unavailable for this period.</p>
             </div>
          ) : (
            <div className="space-y-6 min-h-[500px]">
              
              {/* Top Level Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors rounded-full blur-2xl group-hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition-all" />
                  <p className="text-xs font-bold text-primary dark:text-primary dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Store className="w-4 h-4" /> New Shops
                  </p>
                  <p className="text-4xl font-black text-foreground">{data.shopGrowth.newShops}</p>
                </div>
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors rounded-full blur-2xl group-hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition-all" />
                  <p className="text-xs font-bold text-primary dark:text-primary dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Users className="w-4 h-4" /> New Customers
                  </p>
                  <p className="text-4xl font-black text-foreground">{data.customerGrowth.newCustomers}</p>
                </div>
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group border-indigo-500/20 dark:border-indigo-400/20 dark:border-indigo-500/20 dark:border-indigo-400/20 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors rounded-full blur-2xl group-hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition-all" />
                  <p className="text-xs font-bold text-primary dark:text-primary dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <BarChartIcon className="w-4 h-4" /> Credit Recovery
                  </p>
                  <p className="text-4xl font-black text-primary dark:text-primary dark:text-indigo-400">{data.creditRecoveryRate}%</p>
                </div>
                 <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group border-indigo-500/20 dark:border-indigo-400/20 dark:border-indigo-500/20 dark:border-indigo-400/20 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors rounded-full blur-2xl group-hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition-all" />
                  <p className="text-xs font-bold text-primary dark:text-primary dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Collection Effic.
                  </p>
                  <p className="text-4xl font-black text-primary dark:text-primary dark:text-indigo-400">{data.collectionEfficiency}%</p>
                </div>
              </div>

              {/* Main Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all h-full">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary dark:text-indigo-400" />
                     </div>
                     <div>
                       <h2 className="text-lg font-black text-foreground">Top Performing Shops</h2>
                       <p className="text-xs text-muted-foreground font-medium">By revenue originated in {period}</p>
                     </div>
                  </div>

                   <div className="h-[250px] w-full mt-4">
                     {data.topShops.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-center text-sm text-muted-foreground">No revenue data for this period.</p>
                        </div>
                     ) : (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={data.topShops} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <XAxis dataKey="shopName" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                           <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val: number | string) => `₹${val}`} />
                           <Tooltip
                             cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                           />
                           <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                             {data.topShops.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#a5b4fc'} />
                             ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     )}
                   </div>
                </div>

                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center p-10 bg-gradient-to-br from-background to-muted/20">
                     <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-400/20">
                        <Zap className="w-12 h-12 text-white" />
                     </div>
                     <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Platform Health is Excellent</h3>
                     <p className="text-muted-foreground text-sm max-w-sm">
                        Credit recovery is at {data.creditRecoveryRate}% and collection efficiency stands at {data.collectionEfficiency}% for the selected period.
                     </p>
                </div>

              </div>

            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

