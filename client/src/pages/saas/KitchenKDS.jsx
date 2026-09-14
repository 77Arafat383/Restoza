import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { ChefHat, Clock, CheckCircle2, Flame, AlertCircle, RefreshCw } from 'lucide-react';

export default function KitchenKDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchKitchenOrders();
  }, []);

  // Listen to socket events for live kitchen updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) => {
        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
          return prev.filter((o) => o.id !== updatedOrder.id);
        }
        return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      });
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [socket]);

  const fetchKitchenOrders = async () => {
    try {
      const res = await orderAPI.getOrders({
        status: 'PENDING,CONFIRMED,PREPARING,READY',
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      fetchKitchenOrders();
    } catch (err) {
      alert('Failed to update kitchen order status.');
    }
  };

  const calculateElapsedMinutes = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diffMs / 60000);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Kitchen Display System...</div>;
  }

  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar with Live Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111117] border border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Kitchen Display System (KDS)
            </h2>
            <p className="text-xs text-slate-400">
              Live chef ticket queue with real-time audio/visual sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs font-semibold px-4 py-2 rounded-xl bg-black/40 border border-white/10">
            <span className="text-rose-400">{pendingCount} New Tickets</span>
            <span className="text-amber-400">{preparingCount} In Prep</span>
            <span className="text-emerald-400">{readyCount} Food Ready</span>
          </div>

          <button
            onClick={fetchKitchenOrders}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid (Tickets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const elapsed = calculateElapsedMinutes(order.createdAt);
          const isUrgent = elapsed > 15;

          const isPreparing = order.status === 'PREPARING';
          const isReady = order.status === 'READY';
          const isPending = order.status === 'PENDING' || order.status === 'CONFIRMED';

          return (
            <div
              key={order.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${
                isReady
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : isUrgent
                  ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/50'
                  : 'bg-[#121218] border-white/10'
              }`}
            >
              {/* Ticket Top Header */}
              <div
                className={`px-5 py-3.5 border-b flex items-center justify-between ${
                  isReady
                    ? 'bg-emerald-950/40 border-emerald-500/20'
                    : isUrgent
                    ? 'bg-rose-950/60 border-rose-500/30'
                    : 'bg-black/30 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white">
                    {order.orderNumber}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-amber-300">
                    {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className={isUrgent ? 'text-rose-300 font-bold' : 'text-slate-300'}>
                    {elapsed}m ago
                  </span>
                </div>
              </div>

              {/* Guest & Special Order Instructions */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                  <span>Guest: <strong className="text-white">{order.customerName || 'Diner'}</strong></span>
                  <span>Waiter: <strong className="text-white">{order.waiter?.name || 'Self-Order'}</strong></span>
                </div>

                {order.specialInstruction && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Special: "{order.specialInstruction}"</span>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2.5">
                  {order.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-white font-serif">
                            {item.menuItem?.name}
                          </span>
                        </div>
                        {item.specialInstruction && (
                          <p className="text-[11px] text-amber-400 mt-1 font-medium italic">
                            ↳ Note: {item.specialInstruction}
                          </p>
                        )}
                      </div>

                      <span className="text-base font-extrabold px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono">
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons at Bottom */}
              <div className="p-4 bg-black/40 border-t border-white/10">
                {isPending && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-glow-gold flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Start Cooking (Accept)</span>
                  </button>
                )}

                {isPreparing && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'READY')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Food as Ready</span>
                  </button>
                )}

                {isReady && (
                  <div className="text-center py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ready For Waiter Pickup</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 rounded-3xl bg-[#111117] border border-white/10">
            <ChefHat className="w-12 h-12 mx-auto opacity-30 text-amber-400 mb-3" />
            <h3 className="text-lg font-bold text-white">All Kitchen Orders Clear</h3>
            <p className="text-xs text-slate-400 mt-1">
              Waiting for new incoming tickets from waiters or customer digital menus.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
