'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Store,
  Plus,
  Pencil,
  Trash2,
  UserX,
  UserCheck,
  Loader2,
  Info,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  role: 'shop_owner' | 'customer';
  shop: string;
  shopId?: string;
  shopAddress?: string;
  shopCity?: string;
  shopState?: string;
  address?: string;
  workplace?: string;
  location?: string;
  customers?: number;
  outstanding?: number;
  status: string;
  isActive?: boolean;
  joined: string;
}

interface ShopOption {
  id: string;
  shopName: string;
}

const avatarGradients = [
  'linear-gradient(135deg, #1A5276, #154360)',
  'linear-gradient(135deg, #1E8449, #196F3D)',
  'linear-gradient(135deg, #2E86C1, #2471A3)',
  'linear-gradient(135deg, #7D3C98, #6C3483)',
  'linear-gradient(135deg, #CA6F1E, #AF601A)',
  'linear-gradient(135deg, #148F77, #117A65)',
];

const emptyOwnerForm = {
  ownerName: '',
  shopName: '',
  address: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  password: '',
};

const emptyEditForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  workplace: '',
  shopName: '',
  shopAddress: '',
  shopCity: '',
  shopState: '',
  customerStatus: 'active',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'shop_owner' | 'customer'>('all');
  const [shopFilter, setShopFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState(emptyOwnerForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getAllUsers({
        page: 1,
        limit: 200,
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: search || undefined,
        shopId: shopFilter || undefined,
      });
      setUsers(response.data.users);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, search, shopFilter]);

  const fetchShops = useCallback(async () => {
    try {
      const res = await adminAPI.getShops({ limit: 500 });
      setShops(
        res.data.shops.map((s: { id: string; shopName: string }) => ({
          id: s.id,
          shopName: s.shopName,
        }))
      );
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const openEdit = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      name: u.name,
      email: u.email !== 'N/A' ? u.email : '',
      phone: u.phone !== 'N/A' ? u.phone : '',
      address: u.address || '',
      workplace: u.workplace || '',
      shopName: u.role === 'shop_owner' ? u.shop : '',
      shopAddress: u.shopAddress || '',
      shopCity: u.shopCity || '',
      shopState: u.shopState || '',
      customerStatus: u.status || 'active',
    });
    setEditOpen(true);
  };

  const handleCreateOwner = async () => {
    const f = ownerForm;
    if (!f.ownerName.trim() || !f.shopName.trim() || !f.address.trim() || !f.phone.trim() || !f.email.trim()) {
      toast({
        title: 'Validation',
        description: 'Owner name, shop name, address, phone, and email are required',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createShopOwner({
        role: 'shop_owner',
        ownerName: f.ownerName.trim(),
        shopName: f.shopName.trim(),
        address: f.address.trim(),
        phone: f.phone.trim(),
        email: f.email.trim(),
        city: f.city.trim() || undefined,
        state: f.state.trim() || undefined,
        password: f.password.trim() || undefined,
      });
      toast({ title: 'Success', description: 'Shop owner and shop created' });
      setCreateOpen(false);
      setOwnerForm(emptyOwnerForm);
      fetchUsers();
      fetchShops();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create shop owner',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      if (selectedUser.role === 'shop_owner') {
        await adminAPI.updateUser(selectedUser.role, selectedUser.id, {
          name: editForm.name.trim(),
          email: editForm.email.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          shopName: editForm.shopName.trim(),
          shopAddress: editForm.shopAddress.trim(),
          shopCity: editForm.shopCity.trim(),
          shopState: editForm.shopState.trim(),
        });
      } else {
        await adminAPI.updateUser(selectedUser.role, selectedUser.id, {
          name: editForm.name.trim(),
          email: editForm.email.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          address: editForm.address.trim() || undefined,
          workplace: editForm.workplace.trim() || undefined,
          customerStatus: editForm.customerStatus,
        });
      }
      toast({ title: 'Success', description: 'User updated' });
      setEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const newActiveState = (u.isActive === false || String(u.isActive) === 'false') ? true : false;
      await adminAPI.updateUserStatus(u.role, u.id, {
        isActive: newActiveState,
        ...(u.role === 'shop_owner' ? { shopStatus: newActiveState ? 'ACTIVE' : 'SUSPENDED' } : {}),
      });
      toast({
        title: 'Success',
        description: newActiveState ? 'User activated' : 'User deactivated',
      });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await adminAPI.deleteUser(selectedUser.role, selectedUser.id);
      toast({ title: 'Success', description: 'User deactivated' });
      setDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to deactivate user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filterLabels: Array<'all' | 'shop_owner' | 'customer'> = ['all', 'shop_owner', 'customer'];
  const showShopFilter = roleFilter === 'customer' || roleFilter === 'all';

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-[18px] w-[18px] text-primary" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">User Management</h1>
              </div>
              <p className="ml-11 text-sm text-muted-foreground">
                Shop owners and their shops — admin can add shop owners. Customers are added by shop owners only.
              </p>
            </div>
            <Button onClick={() => { setOwnerForm(emptyOwnerForm); setCreateOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add Shop Owner
            </Button>
          </div>

          {(roleFilter === 'customer' || roleFilter === 'all') && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Customers are created by shop owners from their dashboard. Admin can view, edit, and deactivate customers here.</span>
            </div>
          )}

          <Card className="py-3">
            <CardContent className="flex flex-col gap-3 px-4">
              <div className="flex flex-wrap gap-2">
                {filterLabels.map((role) => (
                  <Button key={role} size="sm" variant={roleFilter === role ? 'default' : 'outline'} onClick={() => setRoleFilter(role)} className="capitalize">
                    {role.replace('_', ' ')}
                  </Button>
                ))}
              </div>
              {showShopFilter && (
                <div className="flex flex-wrap items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={shopFilter}
                    onChange={(e) => setShopFilter(e.target.value)}
                    className="h-9 min-w-[200px] rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">All shops</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.shopName}</option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, shop…" className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : users.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No users found.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((u, i) => {
                    const isUserInactive = u.isActive === false || String(u.isActive) === 'false';
                    return (
                    <Card key={`${u.role}-${u.id}`} className={cn('py-4', isUserInactive && 'opacity-60')}>
                      <CardContent className="space-y-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm" style={{ background: avatarGradients[i % avatarGradients.length] }}>
                              {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-foreground">{u.name}</p>
                              <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', u.role === 'shop_owner' ? 'bg-primary/15 text-primary' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400')}>
                                {u.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => openEdit(u)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => handleToggleActive(u)} aria-label="Toggle active">
                              {!isUserInactive ? <UserX className="h-3.5 w-3.5 text-amber-600" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-600" />}
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => { setSelectedUser(u); setDeleteOpen(true); }} aria-label="Deactivate"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </div>
                        <dl className="space-y-1.5 text-xs">
                          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Shop</dt><dd className="flex items-center gap-1 font-medium text-foreground"><Store className="h-3 w-3" />{u.shop}</dd></div>
                          {u.role === 'shop_owner' && (
                            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Customers</dt><dd className="font-medium">{u.customers ?? 0}</dd></div>
                          )}
                          {u.role === 'customer' && (
                            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Outstanding</dt><dd className={cn('font-bold', u.outstanding ? 'text-destructive' : 'text-emerald-600')}>₹{u.outstanding ?? 0}</dd></div>
                          )}
                          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{u.status} · {!isUserInactive ? 'Active' : 'Inactive'}</dd></div>
                        </dl>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Shop Owner & Shop</DialogTitle></DialogHeader>
            <ShopOwnerForm form={ownerForm} setForm={setOwnerForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateOwner} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit {selectedUser?.role === 'shop_owner' ? 'Shop Owner' : 'Customer'}</DialogTitle>
            </DialogHeader>
            {selectedUser?.role === 'shop_owner' ? (
              <ShopOwnerEditForm form={editForm} setForm={setEditForm} />
            ) : (
              <CustomerEditForm form={editForm} setForm={setEditForm} shopName={selectedUser?.shop} />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Deactivate User</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Deactivate <strong className="text-foreground">{selectedUser?.name}</strong>?
              {selectedUser?.role === 'shop_owner' && ' Their shop will be marked inactive.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>Deactivate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ShopOwnerForm({ form, setForm }: { form: typeof emptyOwnerForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyOwnerForm>> }) {
  return (
    <div className="grid gap-3 py-2">
      <Field label="Owner name *"><Input value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} /></Field>
      <Field label="Shop name *"><Input value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} /></Field>
      <Field label="Shop address *"><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City"><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
        <Field label="State"><Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
      </div>
      <Field label="Password (optional)"><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave empty for OTP login" /></Field>
    </div>
  );
}

function ShopOwnerEditForm({ form, setForm }: { form: typeof emptyEditForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyEditForm>> }) {
  return (
    <div className="grid gap-3 py-2">
      <Field label="Owner name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
      <Field label="Shop name"><Input value={form.shopName} onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))} /></Field>
      <Field label="Shop address"><Input value={form.shopAddress} onChange={(e) => setForm((f) => ({ ...f, shopAddress: e.target.value }))} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City"><Input value={form.shopCity} onChange={(e) => setForm((f) => ({ ...f, shopCity: e.target.value }))} /></Field>
        <Field label="State"><Input value={form.shopState} onChange={(e) => setForm((f) => ({ ...f, shopState: e.target.value }))} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
      </div>
    </div>
  );
}

function CustomerEditForm({ form, setForm, shopName }: { form: typeof emptyEditForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyEditForm>>; shopName?: string }) {
  return (
    <div className="grid gap-3 py-2">
      <Field label="Shop (read-only)"><Input value={shopName || ''} disabled className="opacity-70" /></Field>
      <Field label="Customer name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
      </div>
      <Field label="Address"><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></Field>
      <Field label="Workplace"><Input value={form.workplace} onChange={(e) => setForm((f) => ({ ...f, workplace: e.target.value }))} /></Field>
      <Field label="Credit status">
        <select value={form.customerStatus} onChange={(e) => setForm((f) => ({ ...f, customerStatus: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="cleared">Cleared</option>
        </select>
      </Field>
    </div>
  );
}