import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, CreditCard, Gift } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RevenueTab() {
  const [revenue, setRevenue] = useState([]);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevenue(response.data);
    } catch (error) {
      toast.error('Failed to fetch revenue data');
    }
  };

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const subscriptionRevenue = revenue.filter(r => r.type === 'subscription').reduce((sum, r) => sum + r.amount, 0);
  const purchaseRevenue = revenue.filter(r => r.type === 'purchase').reduce((sum, r) => sum + r.amount, 0);
  const donationRevenue = revenue.filter(r => r.type === 'donation').reduce((sum, r) => sum + r.amount, 0);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'subscription': return <TrendingUp className="w-4 h-4" />;
      case 'purchase': return <CreditCard className="w-4 h-4" />;
      case 'donation': return <Gift className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'subscription': return 'from-green-500 to-emerald-500';
      case 'purchase': return 'from-blue-500 to-cyan-500';
      case 'donation': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up" data-testid="revenue-tab">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Revenue & Finances</h2>
        <p className="text-zinc-400">Financial overview and transaction history</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white" data-testid="total-revenue">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">All-time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Subscriptions</CardTitle>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${subscriptionRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">Recurring revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Purchases</CardTitle>
            <CreditCard className="w-5 h-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${purchaseRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">One-time payments</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Donations</CardTitle>
            <Gift className="w-5 h-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${donationRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">Community support</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {revenue.map((item) => (
              <div
                key={item.id}
                data-testid={`revenue-item-${item.id}`}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getTypeColor(item.type)} rounded-lg flex items-center justify-center`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.description}</p>
                    <p className="text-sm text-zinc-400">
                      {item.source} • {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-400">${item.amount.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 capitalize">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}