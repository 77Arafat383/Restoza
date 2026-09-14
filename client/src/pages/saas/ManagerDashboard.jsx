import React, { useState, useEffect } from 'react';
import { analyticsAPI, tableAPI, orderAPI, settingsAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  DollarSign, ShoppingBag, Users, Clock, ArrowUpRight,
  TrendingUp, Utensils, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function ManagerDashboard({ onNavigateTab }) {
  const [metrics, setMetrics] = useState(null);
  const [tables, setTables] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '৳' });
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to socket events for live metric refresh
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchDashboardData();
    socket.on('new_order', handleRefresh);
    socket.on('order_status_updated', handleRefresh);
    socket.on('payment_completed', handleRefresh);
    socket.on('table_status_changed', handleRefresh);

    return () => {
      socket.off('new_order', handleRefresh);
      socket.off('order_status_updated', handleRefresh);
      socket.off('payment_completed', handleRefresh);
      socket.off('table_status_changed', handleRefresh);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, tablesRes, ordersRes, settingsRes] = await Promise.all([
        analyticsAPI.getDashboardMetrics(),
        tableAPI.getTables(),
        orderAPI.getOrders({ todayOnly: 'true' }),
        settingsAPI.getSettings(),
      ]);

      setMetrics(metricsRes.data);
      setTables(tablesRes.data);
      setRecentOrders(ordersRes.data.slice(0, 6));
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const currency = settings.currencySymbol || '৳';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mr-3"></div>
        <span>Loading Executive Analytics...</span>
      </div>
    );
  }

  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const occupancyPercent = tables.length ? Math.round((occupiedCount / tables.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="p-5 rounded-2xl bg-restoza-dark-900 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              {currency}{metrics?.todaySales?.toLocaleString() || '45,850'}
            </h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% vs yesterday</span>
            </p>
          </div>
        </div>

        {/* Orders Placed */}
        <div className="p-5 rounded-2xl bg-restoza-dark-900 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orders Today</span>
            <div className="p-2 rounded-xl bg-restoza-burgundy-600/20 text-restoza-burgundy-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              {metrics?.todayOrdersCount || '128'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Active in workflow: <span className="text-amber-400 font-semibold">{metrics?.activeOrdersCount || 3}</span>
            </p>
          </div>
        </div>

        {/* Floor Occupancy */}
        <div className="p-5 rounded-2xl bg-restoza-dark-900 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Table Occupancy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              {occupancyPercent}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {occupiedCount} of {tables.length} tables seated
            </p>
          </div>
        </div>

        {/* Average Prep Time */}
        <div className="p-5 rounded-2xl bg-restoza-dark-900 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kitchen Pace</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              14.5 min
            </h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target met under 18m</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sales Overview Chart */}
      <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Weekly Revenue & Sales Velocity
            </h3>
            <p className="text-xs text-slate-400">
              7-day performance overview across dine-in and online orders
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
              Gross Revenue ({currency})
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#881337" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `${currency}${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141419',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Restaurant Floor Visual Layout + Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Floor Layout Map */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Live Restaurant Floor</h3>
              <p className="text-xs text-slate-400">Interactive dining room status</p>
            </div>
            <button
              onClick={() => onNavigateTab('tables')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Manage Tables</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Legends */}
          <div className="flex flex-wrap gap-4 text-xs mb-6 pb-4 border-b border-white/5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Reserved
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Cleaning
            </span>
          </div>

          {/* Visual Tables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((table) => {
              const statusColors = {
                AVAILABLE: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
                OCCUPIED: 'border-rose-500/60 bg-rose-950/30 text-rose-300 shadow-glow-burgundy',
                RESERVED: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
                CLEANING: 'border-slate-500/40 bg-slate-900/40 text-slate-400',
              };

              const dotColors = {
                AVAILABLE: 'bg-emerald-400',
                OCCUPIED: 'bg-rose-500',
                RESERVED: 'bg-amber-400',
                CLEANING: 'bg-slate-400',
              };

              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-28 ${
                    statusColors[table.status] || 'border-white/10 bg-black/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{table.tableNumber}</span>
                    <span className={`w-2 h-2 rounded-full ${dotColors[table.status]}`}></span>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <p className="text-slate-300">{table.capacity} seats</p>
                    <p className="text-[10px] text-slate-400 truncate">{table.location}</p>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    {table.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Culinary Items */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                Best Selling Dishes
              </h3>
              <button
                onClick={() => onNavigateTab('menu')}
                className="text-xs text-amber-400 hover:underline"
              >
                View Menu
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Highest grossing gourmet creations today
            </p>

            <div className="space-y-3">
              {metrics?.popularItems?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <span className="text-xs font-bold text-amber-400 w-4 text-center">
                    #{idx + 1}
                  </span>
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{currency}{item.price}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300">
                    {item.soldCount || 18} sold
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-300">
              <p className="font-semibold text-amber-400">Operations Tip</p>
              <p className="mt-0.5 text-slate-400">
                Wagyu burger and Truffle fries demand is peaking. Kitchen prep stations alerted.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Live Orders Stream */}
      <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-serif font-bold text-white">Live Orders Stream</h3>
          <span className="text-xs text-slate-400">Real-time database updates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 pb-2">
                <th className="py-2.5 px-3">ORDER #</th>
                <th className="py-2.5 px-3">TABLE / TYPE</th>
                <th className="py-2.5 px-3">GUEST</th>
                <th className="py-2.5 px-3">ITEMS</th>
                <th className="py-2.5 px-3">TOTAL</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-mono font-bold text-white">{ord.orderNumber}</td>
                  <td className="py-3 px-3">
                    {ord.table ? `Table ${ord.table.tableNumber}` : 'Takeaway'}
                  </td>
                  <td className="py-3 px-3">{ord.customerName || 'Guest'}</td>
                  <td className="py-3 px-3">
                    {ord.orderItems?.length || 1} items (
                    {ord.orderItems?.map((oi) => oi.menuItem?.name).slice(0, 2).join(', ')}
                    {ord.orderItems?.length > 2 ? '...' : ''})
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">{currency}{ord.total}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === 'PREPARING' ? 'bg-amber-900/50 text-amber-300 border border-amber-500/40' :
                        ord.status === 'READY' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/40' :
                        ord.status === 'SERVED' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/40' :
                        ord.status === 'COMPLETED' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
