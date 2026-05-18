'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Package } from 'lucide-react';

const products = [
  { id: 1, name: 'Product A', sku: 'SKU-001', category: 'Electronics', stock: 45, price: '$299' },
  { id: 2, name: 'Product B', sku: 'SKU-002', category: 'Clothing', stock: 120, price: '$49' },
  { id: 3, name: 'Product C', sku: 'SKU-003', category: 'Electronics', stock: 8, price: '$599' },
  { id: 4, name: 'Product D', sku: 'SKU-004', category: 'Home', stock: 65, price: '$89' },
  { id: 5, name: 'Product E', sku: 'SKU-005', category: 'Sports', stock: 32, price: '$149' },
  { id: 6, name: 'Product F', sku: 'SKU-006', category: 'Electronics', stock: 0, price: '$399' },
];

export default function ProductsPage() {
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

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-500 bg-red-500/10', label: 'Out of Stock' };
    if (stock < 20) return { color: 'text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors', label: 'Low Stock' };
    return { color: 'text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors', label: 'In Stock' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage product catalog</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-card/50 border border-border rounded-lg px-3 py-2 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const status = getStockStatus(product.stock);
            return (
              <Card key={product.id} className="border border-border bg-card/50 backdrop-blur hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{product.sku}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Category</span>
                      <span className="text-sm font-medium text-foreground">{product.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Price</span>
                      <span className="text-sm font-bold text-primary dark:text-indigo-400">{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Stock</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                        {status.label} ({product.stock})
                      </span>
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

