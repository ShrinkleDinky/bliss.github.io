import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BuildsTab() {
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/builds`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuilds(response.data);
    } catch (error) {
      toast.error('Failed to fetch builds');
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Package className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up" data-testid="builds-tab">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Build Management</h2>
        <p className="text-zinc-400">Game build history and deployment status</p>
      </div>

      <div className="grid gap-4">
        {builds.map((build) => (
          <Card
            key={build.id}
            data-testid={`build-item-${build.id}`}
            className="p-6 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{build.game_name}</h3>
                    <Badge className={`${getStatusColor(build.status)} border`}>
                      {build.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-zinc-500 text-sm">Version</p>
                      <p className="text-white font-semibold">{build.version}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Build Date</p>
                      <p className="text-white font-semibold">
                        {new Date(build.build_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Build Time</p>
                      <p className="text-white font-semibold">
                        {new Date(build.build_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-sm">Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(build.status)}
                        <span className="text-white font-semibold capitalize">{build.status}</span>
                      </div>
                    </div>
                  </div>

                  {build.notes && (
                    <div className="bg-zinc-800/50 rounded p-3">
                      <p className="text-sm text-zinc-400">
                        <span className="text-zinc-500 font-medium">Notes:</span> {build.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}