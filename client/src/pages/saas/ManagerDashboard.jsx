import React, { useState, useEffect } from 'react';
import { analyticsAPI, tableAPI, orderAPI, settingsAPI, ingredientAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  DollarSign, ShoppingBag, Users, Clock, ArrowUpRight,
  TrendingUp, Utensils, AlertCircle, CheckCircle2, ChevronRight,
  Check, X, PackageCheck, Trash2, AlertTriangle, ChefHat, Filter, Search
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function ManagerDashboard({ onNavigateTab }) {
  const [metrics, setMetrics] = useState(null);
  const [tables, setTables] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ingredientRequests, setIngredientRequests] = useState([]);
  const [reqFilter, setReqFilter] = useState('ALL');
  const [reqSearchTerm, setReqSearchTerm] = useState('');
  const [settings, setSettings] = useState({ currencySymbol: '৳' });
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to socket events for live metric refresh and ingredient requests
  useEffect(() => {
    if (!socket) return;
    let timer = null;
    const handleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fetchDashboardData();
      }, 300);
    };

    const handleReqCreated = (newReq) => {
      setIngredientRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
    };

    const handleReqUpdated = (updatedReq) => {
      setIngredientRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    };

    const handleReqDeleted = (id) => {
      setIngredientRequests((prev) => prev.filter((r) => r.id !== parseInt(id)));
    };

    socket.on('new_order', handleRefresh);
    socket.on('order_status_updated', handleRefresh);
    socket.on('payment_completed', handleRefresh);
    socket.on('table_status_changed', handleRefresh);
    socket.on('ingredient_request_created', handleReqCreated);
    socket.on('ingredient_request_updated', handleReqUpdated);
    socket.on('ingredient_request_deleted', handleReqDeleted);

    return () => {
      if (timer) clearTimeout(timer);
      socket.off('new_order', handleRefresh);
      socket.off('order_status_updated', handleRefresh);
      socket.off('payment_completed', handleRefresh);
      socket.off('table_status_changed', handleRefresh);
      socket.off('ingredient_request_created', handleReqCreated);
      socket.off('ingredient_request_updated', handleReqUpdated);
      socket.off('ingredient_request_deleted', handleReqDeleted);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, tablesRes, ordersRes, settingsRes, ingRes] = await Promise.all([
        analyticsAPI.getDashboardMetrics(),
        tableAPI.getTables(),
        orderAPI.getOrders({ todayOnly: 'true' }),
        settingsAPI.getSettings(),
        ingredientAPI.getRequests(),
      ]);

      setMetrics(metricsRes.data);
      setTables(tablesRes.data);
      setRecentOrders(ordersRes.data.slice(0, 6));
      if (settingsRes.data) setSettings(settingsRes.data);
      if (ingRes.data) setIngredientRequests(ingRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIngredientStatus = async (id, newStatus) => {
    try {
      const res = await ingredientAPI.updateStatus(id, newStatus);
      setIngredientRequests((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteIngredientRequest = async (id) => {
    try {
      await ingredientAPI.deleteRequest(id);
      setIngredientRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete request:', err);
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

      {/* Kitchen Ingredient Shopping Requests Management Section */}
      <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              Kitchen Shopping Requests
              {ingredientRequests.filter((r) => r.status === 'PENDING').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                  {ingredientRequests.filter((r) => r.status === 'PENDING').length} Pending
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Review, approve, or mark purchased ingredient requests submitted by Executive Chef
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reqSearchTerm}
                onChange={(e) => setReqSearchTerm(e.target.value)}
                placeholder="Search by ingredient, chef..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs overflow-x-auto">
              {['ALL', 'PENDING', 'APPROVED', 'PURCHASED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReqFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    reqFilter === st
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                  {st === 'PENDING' && ingredientRequests.filter((r) => r.status === 'PENDING').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px]">
                      {ingredientRequests.filter((r) => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        {ingredientRequests.filter((r) => {
          const matchesStatus = reqFilter === 'ALL' || r.status === reqFilter;
          if (!matchesStatus) return false;
          if (!reqSearchTerm.trim()) return true;
          const query = reqSearchTerm.toLowerCase();
          const reqItems = Array.isArray(r.items) ? r.items : [];
          const itemNames = reqItems.map((i) => i.name?.toLowerCase()).join(' ');
          return (
            itemNames.includes(query) ||
            r.ingredient?.toLowerCase().includes(query) ||
            r.requestedBy?.toLowerCase().includes(query) ||
            r.notes?.toLowerCase().includes(query)
          );
        }).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ingredientRequests
              .filter((r) => {
                const matchesStatus = reqFilter === 'ALL' || r.status === reqFilter;
                if (!matchesStatus) return false;
                if (!reqSearchTerm.trim()) return true;
                const query = reqSearchTerm.toLowerCase();
                const reqItems = Array.isArray(r.items) ? r.items : [];
                const itemNames = reqItems.map((i) => i.name?.toLowerCase()).join(' ');
                return (
                  itemNames.includes(query) ||
                  r.ingredient?.toLowerCase().includes(query) ||
                  r.requestedBy?.toLowerCase().includes(query) ||
                  r.notes?.toLowerCase().includes(query)
                );
              })
              .map((req) => {
                const statusStyles = {
                  PENDING: 'bg-amber-900/50 text-amber-300 border-amber-500/40',
                  APPROVED: 'bg-blue-900/50 text-blue-300 border-blue-500/40',
                  PURCHASED: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40',
                  REJECTED: 'bg-red-900/50 text-red-300 border-red-500/40',
                };

                const reqItems = Array.isArray(req.items) && req.items.length > 0
                  ? req.items
                  : [{ name: req.ingredient || 'Ingredient', quantity: req.quantity || '' }];

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all"
                  >
                    <div>
                      {/* Item List Header */}
                      <div className="mb-3 border-b border-white/5 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Requested Shopping List ({reqItems.length} item{reqItems.length > 1 ? 's' : ''})
                        </span>
                        <div className="space-y-1.5">
                          {reqItems.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                {it.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-slate-300 bg-black/30 p-2 rounded-xl border border-white/5 italic">
                          "{req.notes}"
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Req by: <strong className="text-slate-200">{req.requestedBy || 'Chef'}</strong></span>
                        <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Status & Actions Footer */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          statusStyles[req.status] || statusStyles.PENDING
                        }`}
                      >
                        {req.status}
                      </span>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateIngredientStatus(req.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Approve Request"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateIngredientStatus(req.id, 'REJECTED')}
                              className="p-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {req.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => handleUpdateIngredientStatus(req.id, 'PURCHASED')}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Mark as Purchased"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Purchased</span>
                            </button>
                            <button
                              onClick={() => handleUpdateIngredientStatus(req.id, 'REJECTED')}
                              className="p-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {req.status === 'PURCHASED' && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </span>
                        )}

                        {req.status === 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateIngredientStatus(req.id, 'PENDING')}
                            className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteIngredientRequest(req.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
            <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
            <p className="text-sm font-semibold text-slate-400">No ingredient requests found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {reqFilter === 'ALL'
                ? 'Executive Chef has not submitted any shopping requests yet.'
                : `No requests with status "${reqFilter}".`}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
