import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password
      });

      localStorage.setItem('admin_token', response.data.access_token);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const initializeSampleData = async () => {
    setInitLoading(true);
    try {
      const response = await axios.post(`${API}/init-sample-data`);
      toast.success('Sample data initialized! Use username: admin, password: admin123');
      setUsername('admin');
      setPassword('admin123');
    } catch (error) {
      toast.error('Failed to initialize sample data');
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)' }}>
      <Card className="w-full max-w-md glass-effect border-zinc-800" data-testid="login-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">EduPlay Console</CardTitle>
          <CardDescription className="text-zinc-400">Admin authentication portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">Username</Label>
              <Input
                id="username"
                data-testid="username-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                data-testid="password-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <Button 
              type="submit" 
              data-testid="login-button"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <Button
              onClick={initializeSampleData}
              data-testid="init-data-button"
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              disabled={initLoading}
            >
              {initLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Initialize Sample Data'
              )}
            </Button>
            <p className="text-xs text-zinc-500 text-center mt-2">First time? Click to create demo admin account</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}