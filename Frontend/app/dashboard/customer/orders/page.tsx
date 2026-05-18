'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Package, Truck, Check, MessageSquare } from 'lucide-react';

const orders = [
  { id: 3001, date: '2024-01-10', amount: '$125.99', status: 'Delivered', items: 2, icon: Check, color: 'text-primary dark:text-indigo-400' },
  { id: 3002, date: '2024-01-12', amount: '$89.50', status: 'In Transit', items: 1, icon: Truck, color: 'text-primary dark:text-indigo-400' },
  { id: 3003, date: '2024-01-13', amount: '$245.00', status: 'Delivered', items: 3, icon: Check, color: 'text-primary dark:text-indigo-400' },
  { id: 3004, date: '2024-01-14', amount: '$156.75', status: 'Processing', items: 2, icon: Package, color: 'text-primary dark:text-indigo-400' },
  { id: 3005, date: '2024-01-15', amount: '$342.00', status: 'In Transit', items: 4, icon: Truck, color: 'text-primary dark:text-indigo-400' },
];

export default function CustomerOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CUSTOMER') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your purchases</p>
        </div>

        <div className="space-y-3">
          {orders.map((order) => {
            const Icon = order.icon;
            return (
              <Card key={order.id} className="border border-border bg-card/50 backdrop-blur hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-${order.color.split('-')[1]}-500/10 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${order.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.date} • {order.items} items</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-primary dark:text-indigo-400">{order.amount}</p>
                        <p className={`text-xs font-medium ${order.color}`}>{order.status}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

