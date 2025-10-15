import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus, Shield, ShieldCheck } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminsTab() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'admin'
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    }
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditForm(admin);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/admins/${selectedAdmin.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin updated successfully');
      setEditDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to update admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/admin/register`, newAdminForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin created successfully');
      setAddDialogOpen(false);
      setNewAdminForm({
        email: '',
        username: '',
        full_name: '',
        password: '',
        role: 'admin'
      });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up" data-testid="admins-tab">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Admin Accounts</h2>
          <p className="text-zinc-400">Manage administrative access and permissions</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-admin-button" className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="mr-2 h-4 w-4" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>Create a new administrator account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  data-testid="new-admin-email"
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  data-testid="new-admin-username"
                  value={newAdminForm.username}
                  onChange={(e) => setNewAdminForm({...newAdminForm, username: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  data-testid="new-admin-fullname"
                  value={newAdminForm.full_name}
                  onChange={(e) => setNewAdminForm({...newAdminForm, full_name: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  data-testid="new-admin-password"
                  type="password"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newAdminForm.role} onValueChange={(val) => setNewAdminForm({...newAdminForm, role: val})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700" data-testid="submit-new-admin">
                {loading ? 'Creating...' : 'Create Admin'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card
            key={admin.id}
            data-testid={`admin-row-${admin.username}`}
            className="p-6 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    {admin.role === 'super_admin' ? (
                      <ShieldCheck className="w-6 h-6 text-white" />
                    ) : (
                      <Shield className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white" data-testid={`admin-name-${admin.username}`}>{admin.full_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        admin.role === 'super_admin' 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                      }`}>
                        {admin.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400" data-testid={`admin-email-${admin.username}`}>@{admin.username} • {admin.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Status</p>
                    <p className="text-white font-medium capitalize">{admin.status}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Created</p>
                    <p className="text-white font-medium">{new Date(admin.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Last Login</p>
                    <p className="text-white font-medium">
                      {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`edit-admin-${admin.username}`}
                  onClick={() => handleEdit(admin)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`delete-admin-${admin.username}`}
                  onClick={() => handleDelete(admin.id)}
                  className="border-zinc-700 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update administrator information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email || ''}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={editForm.username || ''}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password (leave blank to keep current)</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(val) => setEditForm({...editForm, status: val})}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700" data-testid="submit-edit-admin">
              {loading ? 'Updating...' : 'Update Admin'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}