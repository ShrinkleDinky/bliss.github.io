import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Edit2, Trash2, Plus, Crown, Zap, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [effectDialogOpen, setEffectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    username: '',
    full_name: '',
    plan: 'Standard',
    age: '',
    school: '',
    grade: '',
    bio: ''
  });
  const [effectForm, setEffectForm] = useState({
    effect_type: 'text',
    content: '',
    duration: 5000
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm(user);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/users/${selectedUser.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const formData = { ...newUserForm };
      if (formData.age) formData.age = parseInt(formData.age);
      
      await axios.post(`${API}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setAddDialogOpen(false);
      setNewUserForm({
        email: '',
        username: '',
        full_name: '',
        plan: 'Standard',
        age: '',
        school: '',
        grade: '',
        bio: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSendEffect = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/live-effects/send`, {
        user_id: selectedUser.id,
        ...effectForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Live effect sent to ${selectedUser.username}!`);
      setEffectDialogOpen(false);
      setEffectForm({ effect_type: 'text', content: '', duration: 5000 });
    } catch (error) {
      toast.error('Failed to send effect');
    } finally {
      setLoading(false);
    }
  };

  const openEffectEditor = (user) => {
    setSelectedUser(user);
    setEffectDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-slide-up" data-testid="users-tab">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-zinc-400">Manage platform users and their accounts</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-user-button" className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    data-testid="new-user-email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    data-testid="new-user-username"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  data-testid="new-user-fullname"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={newUserForm.age}
                    onChange={(e) => setNewUserForm({...newUserForm, age: e.target.value})}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Input
                    value={newUserForm.grade}
                    onChange={(e) => setNewUserForm({...newUserForm, grade: e.target.value})}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={newUserForm.plan} onValueChange={(val) => setNewUserForm({...newUserForm, plan: val})}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Upgraded">Upgraded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>School</Label>
                <Input
                  value={newUserForm.school}
                  onChange={(e) => setNewUserForm({...newUserForm, school: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={newUserForm.bio}
                  onChange={(e) => setNewUserForm({...newUserForm, bio: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <Button onClick={handleAdd} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700" data-testid="submit-new-user">
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card
            key={user.id}
            data-testid={`user-row-${user.username}`}
            className={`p-6 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors ${
              user.plan === 'Upgraded' ? 'upgraded-user-row' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white" data-testid={`user-name-${user.username}`}>{user.full_name}</h3>
                      {user.plan === 'Upgraded' && (
                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 font-semibold flex items-center gap-1">
                          <Crown className="w-3 h-3" /> UPGRADED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400" data-testid={`user-email-${user.username}`}>@{user.username} • {user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Status</p>
                    <p className="text-white font-medium capitalize">{user.status}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Games Played</p>
                    <p className="text-white font-medium">{user.total_games_played}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Total Score</p>
                    <p className="text-white font-medium">{user.total_score.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">School</p>
                    <p className="text-white font-medium">{user.school || 'N/A'}</p>
                  </div>
                </div>
                
                {user.bio && (
                  <p className="mt-3 text-sm text-zinc-400 italic">"{user.bio}"</p>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`send-effect-${user.username}`}
                  onClick={() => openEffectEditor(user)}
                  className="border-zinc-700 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`edit-user-${user.username}`}
                  onClick={() => handleEdit(user)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`delete-user-${user.username}`}
                  onClick={() => handleDelete(user.id)}
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={editForm.plan} onValueChange={(val) => setEditForm({...editForm, plan: val})}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Upgraded">Upgraded</SelectItem>
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
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={editForm.age || ''}
                  onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value)})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School</Label>
                <Input
                  value={editForm.school || ''}
                  onChange={(e) => setEditForm({...editForm, school: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input
                  value={editForm.grade || ''}
                  onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Games Played</Label>
                <Input
                  type="number"
                  value={editForm.total_games_played || 0}
                  onChange={(e) => setEditForm({...editForm, total_games_played: parseInt(e.target.value)})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Score</Label>
                <Input
                  type="number"
                  value={editForm.total_score || 0}
                  onChange={(e) => setEditForm({...editForm, total_score: parseInt(e.target.value)})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700" data-testid="submit-edit-user">
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Effects Dialog */}
      <Dialog open={effectDialogOpen} onOpenChange={setEffectDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Live Effects Editor
            </DialogTitle>
            <DialogDescription>
              Send real-time effects to {selectedUser?.username}'s screen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Effect Type</Label>
              <Select value={effectForm.effect_type} onValueChange={(val) => setEffectForm({...effectForm, effect_type: val})}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Text Message
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image URL
                    </div>
                  </SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                data-testid="effect-content"
                placeholder={effectForm.effect_type === 'image' ? 'Enter image URL...' : 'Enter message...'}
                value={effectForm.content}
                onChange={(e) => setEffectForm({...effectForm, content: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (milliseconds)</Label>
              <Input
                type="number"
                value={effectForm.duration}
                onChange={(e) => setEffectForm({...effectForm, duration: parseInt(e.target.value)})}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button 
              onClick={handleSendEffect} 
              disabled={loading || !effectForm.content} 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
              data-testid="send-effect-button"
            >
              {loading ? 'Sending...' : 'Send Effect'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}