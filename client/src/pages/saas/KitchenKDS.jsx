import React, { useState, useEffect } from 'react';
import { orderAPI, ingredientAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { ChefHat, Clock, CheckCircle2, Flame, AlertCircle, RefreshCw, ShoppingBag, X, Plus, Trash2, Search } from 'lucide-react';

export default function KitchenKDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [ingredientRequests, setIngredientRequests] = useState([]);
  const [itemList, setItemList] = useState([{ name: '', quantity: '' }]);
  const [reqNotes, setReqNotes] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqError, setReqError] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    fetchKitchenOrders();
    fetchIngredientRequests();
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

    const handleReqCreated = (newReq) => {
      setIngredientRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
    };

    const handleReqUpdated = (updatedReq) => {
      setIngredientRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    };

    const handleReqDeleted = (id) => {
      setIngredientRequests((prev) => prev.filter((r) => r.id !== parseInt(id)));
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('ingredient_request_created', handleReqCreated);
    socket.on('ingredient_request_updated', handleReqUpdated);
    socket.on('ingredient_request_deleted', handleReqDeleted);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('ingredient_request_created', handleReqCreated);
      socket.off('ingredient_request_updated', handleReqUpdated);
      socket.off('ingredient_request_deleted', handleReqDeleted);
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

  const fetchIngredientRequests = async () => {
    try {
      const res = await ingredientAPI.getRequests();
      setIngredientRequests(res.data);
    } catch (err) {
      console.error('Failed to load ingredient requests:', err);
    }
  };

  const handleAddItemRow = () => {
    setItemList((prev) => [...prev, { name: '', quantity: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    if (itemList.length <= 1) return;
    setItemList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItemList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCreateIngredientRequest = async (e) => {
    e.preventDefault();
    setReqError('');
    const validItems = itemList.filter((item) => item.name.trim() && item.quantity.trim());
    if (validItems.length === 0) {
      setReqError('Please add at least one ingredient with a quantity.');
      return;
    }

    setSubmittingReq(true);
    try {
      const res = await ingredientAPI.createRequest({
        items: validItems,
        notes: reqNotes,
      });
      setIngredientRequests((prev) => [res.data, ...prev.filter((r) => r.id !== res.data.id)]);
      setItemList([{ name: '', quantity: '' }]);
      setReqNotes('');
    } catch (err) {
      setReqError(err.response?.data?.message || 'Failed to submit ingredient request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleDeleteIngredientRequest = async (id) => {
    try {
      await ingredientAPI.deleteRequest(id);
      setIngredientRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert('Failed to cancel request.');
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
  const pendingReqCount = ingredientRequests.filter((r) => r.status === 'PENDING').length;

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
              Kitchen Display
            </h2>
            <p className="text-xs text-slate-400">
              Live chef ticket queue with real-time sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold px-4 py-2 rounded-xl bg-black/40 border border-white/10">
            <span className="text-rose-400">{pendingCount} New Tickets</span>
            <span className="text-amber-400">{preparingCount} In Prep</span>
            <span className="text-emerald-400">{readyCount} Food Ready</span>
          </div>

          <button
            onClick={() => {
              setIngredientModalOpen(true);
              fetchIngredientRequests();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Request Ingredients</span>
            {pendingReqCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {pendingReqCount}
              </span>
            )}
          </button>

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
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${isReady
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : isUrgent
                  ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/50'
                  : 'bg-[#121218] border-white/10'
                }`}
            >
              {/* Ticket Top Header */}
              <div
                className={`px-5 py-3.5 border-b flex items-center justify-between ${isReady
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

      {/* Ingredient Shopping Request Modal for Chef */}
      {ingredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#12121a] border border-white/15 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ingredient Shopping Requests</h3>
                  <p className="text-xs text-slate-400">Request kitchen ingredients & supplies from Manager</p>
                </div>
              </div>
              <button
                onClick={() => setIngredientModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1 space-y-6 my-4">
              {/* Request Form */}
              <form onSubmit={handleCreateIngredientRequest} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Submit New Shopping Request List</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {reqError && (
                  <p className="text-xs text-rose-400 font-semibold">{reqError}</p>
                )}

                {/* Items List Rows */}
                <div className="space-y-2.5">
                  {itemList.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder={`Ingredient #${index + 1} (e.g. Fresh Salmon)`}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty (e.g. 5 kg)"
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                      {itemList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Notes / Special Instructions (Optional)</label>
                  <input
                    type="text"
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    placeholder="e.g. Needed urgently for dinner service"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submittingReq}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950 font-bold text-xs shadow-glow-gold hover:opacity-90 disabled:opacity-50"
                  >
                    {submittingReq ? 'Submitting...' : 'Send Request List to Manager'}
                  </button>
                </div>
              </form>

              {/* Submitted Requests List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Request History & Status</h4>
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search request history..."
                      className="w-full pl-8 pr-3 py-1 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {ingredientRequests.filter((req) => {
                  if (!searchFilter.trim()) return true;
                  const query = searchFilter.toLowerCase();
                  const reqItems = Array.isArray(req.items) ? req.items : [];
                  const itemNames = reqItems.map((i) => i.name?.toLowerCase()).join(' ');
                  return (
                    itemNames.includes(query) ||
                    req.ingredient?.toLowerCase().includes(query) ||
                    req.notes?.toLowerCase().includes(query) ||
                    req.status?.toLowerCase().includes(query)
                  );
                }).length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {ingredientRequests
                      .filter((req) => {
                        if (!searchFilter.trim()) return true;
                        const query = searchFilter.toLowerCase();
                        const reqItems = Array.isArray(req.items) ? req.items : [];
                        const itemNames = reqItems.map((i) => i.name?.toLowerCase()).join(' ');
                        return (
                          itemNames.includes(query) ||
                          req.ingredient?.toLowerCase().includes(query) ||
                          req.notes?.toLowerCase().includes(query) ||
                          req.status?.toLowerCase().includes(query)
                        );
                      })
                      .map((req) => {
                        const reqItems = Array.isArray(req.items) && req.items.length > 0
                          ? req.items
                          : [{ name: req.ingredient || 'Ingredient', quantity: req.quantity || '' }];

                        return (
                          <div key={req.id} className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-start justify-between gap-3 text-xs">
                          <div className="flex-1">
                            <div className="space-y-1">
                              {reqItems.map((it, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  <span className="font-bold text-white text-xs">{it.name}</span>
                                  <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {it.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {req.notes && <p className="text-[11px] text-slate-400 mt-1.5 italic">"{req.notes}"</p>}
                            <p className="text-[10px] text-slate-500 mt-1">Requested by {req.requestedBy} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              req.status === 'APPROVED' ? 'bg-blue-950/60 text-blue-300 border-blue-500/40' :
                              req.status === 'PURCHASED' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' :
                              req.status === 'REJECTED' ? 'bg-rose-950/60 text-rose-300 border-rose-500/40' :
                              'bg-amber-950/60 text-amber-300 border-amber-500/40 animate-pulse'
                            }`}>
                              {req.status}
                            </span>
                            {req.status === 'PENDING' && (
                              <button
                                onClick={() => handleDeleteIngredientRequest(req.id)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Cancel Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400 text-xs">No ingredient requests submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
