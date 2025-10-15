import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bell, Sparkles, Bug, Shield, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UpdatesTab() {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpdates(response.data);
    } catch (error) {
      toast.error('Failed to fetch updates');
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'feature': return <Sparkles className="w-5 h-5" />;
      case 'bugfix': return <Bug className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'feature': return 'from-purple-500 to-pink-500';
      case 'bugfix': return 'from-blue-500 to-cyan-500';
      case 'security': return 'from-red-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'released': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up" data-testid="updates-tab">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Platform Updates</h2>
        <p className="text-zinc-400">Feature releases and system updates</p>
      </div>

      <div className="space-y-4">
        {updates.map((update) => (
          <Card
            key={update.id}
            data-testid={`update-item-${update.id}`}
            className="p-6 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(update.type)} rounded-xl flex items-center justify-center text-white`}>
                {getTypeIcon(update.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-white">{update.title}</h3>
                      <Badge className={`${getStatusColor(update.status)} border`}>
                        {update.status.toUpperCase().replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400">Version {update.version} • {update.type.charAt(0).toUpperCase() + update.type.slice(1)}</p>
                  </div>
                </div>

                <p className="text-zinc-300 mb-4">{update.description}</p>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {update.release_date 
                        ? `Released ${new Date(update.release_date).toLocaleDateString()}`
                        : `Created ${new Date(update.created_at).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}