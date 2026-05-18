'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Search, Filter, ChevronRight } from 'lucide-react';

const orders = [
  { id: 1001, customer: 'John Doe', amount: '$150', status: 'Delivered', date: '2024-01-15' },
  { id: 1002, customer: 'Jane Smith', amount: '$320', status: 'In Transit', date: '2024-01-14' },
  { id: 1003, customer: 'Mike Johnson', amount: '$89', status: 'Processing', date: '2024-01-14' },
  { id: 1004, customer: 'Sarah Lee', amount: '$450', status: 'Delivered', date: '2024-01-13' },
  { id: 1005, customer: 'Tom Brown', amount: '$210', status: 'Pending', date: '2024-01-13' },
  { id: 1006, customer: 'Emily Davis', amount: '$175', status: 'Delivered', date: '2024-01-12' },
  { id: 1007, customer: 'Chris Wilson', amount: '$290', status: 'In Transit', date: '2024-01-12' },
  { id: 1008, customer: 'Rachel Green', amount: '$125', status: 'Processing', date: '2024-01-11' },
];

const statusColors = {
  Delivered: 'text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors',
  'In Transit': 'text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors',
  Processing: 'text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors',
  Pending: 'text-muted-foreground bg-gray-500/10',
};

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage all system orders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 bg-card/50 border border-border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Orders Table */}
        <Card className="border border-border bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Showing {orders.length} orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-card text-card-foreground border border-border shadow-sm transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">#{order.id}</td>
                      <td className="py-3 px-4 text-foreground">{order.customer}</td>
                      <td className="py-3 px-4 font-semibold text-primary dark:text-indigo-400">{order.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

