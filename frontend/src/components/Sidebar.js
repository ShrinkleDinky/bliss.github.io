import { Link, useLocation } from 'react-router-dom';
import { Home, Users, DollarSign, Shield, Gamepad2, Package, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainSection = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Revenue', path: '/revenue', icon: DollarSign },
  { name: 'Admin Accounts', path: '/admins', icon: Shield },
];

const developmentSection = [
  { name: 'Games', path: '/games', icon: Gamepad2 },
  { name: 'Builds', path: '/builds', icon: Package },
  { name: 'Updates', path: '/updates', icon: Bell },
];

export default function Sidebar() {
  const location = useLocation();

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
          isActive
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-l-4 border-cyan-400'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">EduPlay</h2>
            <p className="text-xs text-zinc-400">Admin Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-4">Main</h3>
          <div className="space-y-1">
            {mainSection.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-4">Development</h3>
          <div className="space-y-1">
            {developmentSection.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <p className="text-xs text-zinc-400">Platform Status</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-zinc-300 font-medium">All Systems Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}