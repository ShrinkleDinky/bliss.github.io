import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import HomeTab from '@/components/tabs/HomeTab';
import UsersTab from '@/components/tabs/UsersTab';
import RevenueTab from '@/components/tabs/RevenueTab';
import AdminsTab from '@/components/tabs/AdminsTab';
import GamesTab from '@/components/tabs/GamesTab';
import BuildsTab from '@/components/tabs/BuildsTab';
import UpdatesTab from '@/components/tabs/UpdatesTab';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/stats/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">EduPlay Console</h1>
            <p className="text-sm text-zinc-400">Educational Minigames Administration</p>
          </div>
          <Button 
            onClick={handleLogout}
            data-testid="logout-button"
            variant="outline" 
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<HomeTab stats={stats} />} />
            <Route path="/users" element={<UsersTab />} />
            <Route path="/revenue" element={<RevenueTab />} />
            <Route path="/admins" element={<AdminsTab />} />
            <Route path="/games" element={<GamesTab />} />
            <Route path="/builds" element={<BuildsTab />} />
            <Route path="/updates" element={<UpdatesTab />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}