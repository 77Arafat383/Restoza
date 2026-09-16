import React, { useState, useEffect } from 'react';
import { tableAPI, menuAPI, orderAPI, billAPI, settingsAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck, Plus, Minus, Send, Receipt, CheckCircle, Clock,
  UtensilsCrossed, AlertCircle, ShoppingBag, X, RefreshCw, Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WaiterPOS() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '৳', taxRate: 10, serviceChargeRate: 5 });
  const [selectedTables, setSelectedTables] = useState([]); // Multi-table selection array
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableOrder, setTableOrder] = useState([]); // Cart items for selected table(s)
  const [specialInstruction, setSpecialInstruction] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Primary selected table for existing order details
  const primaryTable = selectedTables[0] || null;

  useEffect(() => {
    fetchWaiterData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchWaiterData();
    socket.on('order_status_updated', handleRefresh);
    socket.on('table_status_changed', handleRefresh);
    socket.on('payment_completed', handleRefresh);

    return () => {
      socket.off('order_status_updated', handleRefresh);
      socket.off('table_status_changed', handleRefresh);
      socket.off('payment_completed', handleRefresh);
    };
  }, [socket]);

  const fetchWaiterData = async () => {
    try {
      const [tablesRes, catsRes, menuRes, settingsRes] = await Promise.all([
        tableAPI.getTables(),
        menuAPI.getCategories(),
        menuAPI.getItems({ availableOnly: 'true' }),
        settingsAPI.getSettings(),
      ]);

      setTables(tablesRes.data);
      setCategories(catsRes.data);
      setMenuItems(menuRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);

      // Keep current table selections updated
      if (selectedTables.length > 0) {
        const updatedSelected = selectedTables
          .map((st) => tablesRes.data.find((t) => t.id === st.id))
          .filter(Boolean);
        setSelectedTables(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to load waiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTables((prev) => {
      const exists = prev.some((t) => t.id === table.id);
      let updated;
      if (exists) {
        updated = prev.filter((t) => t.id !== table.id);
      } else {
        updated = [...prev, table];
      }

      if (updated.length === 1) {
        setCustomerName(updated[0].orders?.[0]?.customerName || '');
      } else if (updated.length > 1) {
        setCustomerName(`Joined Tables (${updated.map((t) => t.tableNumber).join(', ')})`);
      }
      return updated;
    });
  };

  const clearTableSelection = () => {
    setSelectedTables([]);
    setTableOrder([]);
    setSpecialInstruction('');
    setCustomerName('');
  };

  const addToTableOrder = (item) => {
    setTableOrder((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateOrderQty = (itemId, delta) => {
    setTableOrder((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const q = i.quantity + delta;
            return q > 0 ? { ...i, quantity: q } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const handleSendToKitchen = async () => {
    if (selectedTables.length === 0 || !tableOrder.length) return;
    setSubmitting(true);

    try {
      const tableNumbers = selectedTables.map((t) => `Table ${t.tableNumber}`).join(' + ');

      await orderAPI.createOrder({
        tableId: selectedTables[0].id,
        tableIds: selectedTables.map((t) => t.id),
        orderType: 'DINE_IN',
        customerName: customerName || `${tableNumbers} Guests`,
        specialInstruction,
        items: tableOrder.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          specialInstruction: i.notes || null,
        })),
      });

      setTableOrder([]);
      setSpecialInstruction('');
      setSelectedTables([]);
      await fetchWaiterData();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch order to kitchen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkServed = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, 'SERVED');
      fetchWaiterData();
    } catch (err) {
      alert('Failed to update status to served.');
    }
  };

  const handleRequestBill = async (orderId) => {
    try {
      await billAPI.generateBill(orderId);
      alert('Bill request transmitted to Cashier desk!');
      fetchWaiterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request bill.');
    }
  };

  const handleToggleTableCleaning = async (tableId) => {
    try {
      await tableAPI.updateStatus(tableId, 'AVAILABLE');
      fetchWaiterData();
    } catch (err) {
      alert('Failed to update table status.');
    }
  };

  const currency = settings.currencySymbol || '৳';

  const filteredMenuItems = menuItems.filter((item) => {
    return selectedCategory === 'all' || item.categoryId === parseInt(selectedCategory);
  });

  const orderSubtotal = tableOrder.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Collect all orders across all tables that are marked READY by the kitchen
  const allReadyOrders = [];
  tables.forEach((t) => {
    if (t.orders && t.orders.length > 0) {
      t.orders.forEach((ord) => {
        if (ord.status === 'READY') {
          allReadyOrders.push({
            ...ord,
            tableName: `Table ${t.tableNumber}`,
            tableLocation: t.location,
            tableId: t.id,
          });
        }
      });
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Waiter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111117] border border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Waiter POS & Floor Service
              {allReadyOrders.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 animate-pulse">
                  {allReadyOrders.length} Ready to Deliver!
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Assigned Waiter: <span className="text-amber-400 font-semibold">{user?.name || 'Arafat'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchWaiterData}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 self-end sm:self-auto flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Floor"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Prominent Banner: Food Ready for Table Delivery */}
      {allReadyOrders.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-restoza-dark-900 to-amber-950/80 border-2 border-emerald-500/60 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-serif">
                  Food Ready for Table Delivery!
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950">
                    {allReadyOrders.length} Order{allReadyOrders.length > 1 ? 's' : ''} Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Kitchen Chef has completed prep! Deliver items to respective dining tables below:
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allReadyOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-black/50 border border-emerald-500/50 hover:border-emerald-400 flex flex-col justify-between space-y-3 transition-all relative overflow-hidden shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5 font-serif">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      {ord.tableName}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">
                      {ord.orderNumber}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 font-medium">
                    Guest: <strong className="text-white">{ord.customerName || 'Dine-in Guest'}</strong> ({ord.tableLocation})
                  </p>

                  {/* List of items to deliver to table */}
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Items to Deliver to Table:</p>
                    {ord.orderItems?.map((oi) => (
                      <div key={oi.id} className="flex items-center justify-between text-white font-semibold">
                        <span>{oi.quantity}× {oi.menuItem?.name}</span>
                        {oi.specialInstruction && (
                          <span className="text-[10px] text-amber-300 italic font-normal">({oi.specialInstruction})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Ready {new Date(ord.updatedAt || ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleMarkServed(ord.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-gold transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Food Served</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Restaurant Floor (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-white mb-0.5">
                  Select Dining Table(s)
                </h3>
                <p className="text-xs text-slate-400">
                  Tap 1 or multiple tables to merge seating & take orders
                </p>
              </div>

              {selectedTables.length > 0 && (
                <button
                  onClick={clearTableSelection}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
                >
                  Clear ({selectedTables.length})
                </button>
              )}
            </div>

            {/* Multi-table active selection banner */}
            {selectedTables.length > 1 && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in">
                <div>
                  <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-400">
                    {selectedTables.length} Tables Joined
                  </span>
                  <span className="font-semibold text-white">
                    {selectedTables.map((t) => `Table ${t.tableNumber}`).join(' + ')}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                  {selectedTables.reduce((sum, t) => sum + (t.capacity || 0), 0)} Seats
                </span>
              </div>
            )}

            {/* Grid of Tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tables.map((table) => {
                const selectedIndex = selectedTables.findIndex((t) => t.id === table.id);
                const isSelected = selectedIndex !== -1;
                const activeOrder = table.orders?.[0];
                const isFoodReady = activeOrder?.status === 'READY';

                const statusStyles = {
                  AVAILABLE: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400',
                  OCCUPIED: 'border-rose-500/60 bg-rose-950/30 text-rose-300 hover:border-rose-400',
                  RESERVED: 'border-amber-500/50 bg-amber-950/30 text-amber-300 hover:border-amber-400',
                  CLEANING: 'border-slate-500/40 bg-slate-900/40 text-slate-400 hover:border-slate-300',
                };

                return (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                      isFoodReady
                        ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-400 shadow-glow-gold animate-pulse'
                        : statusStyles[table.status]
                    } ${isSelected ? 'ring-2 ring-amber-400 shadow-glow-gold scale-[1.02] bg-amber-950/40 border-amber-400' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-white">
                        {table.tableNumber}
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950">
                          #{selectedIndex + 1}
                        </span>
                      ) : isFoodReady ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 uppercase tracking-wider animate-bounce">
                          FOOD READY!
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold opacity-70">
                          {table.capacity}P
                        </span>
                      )}
                    </div>

                    <div className="text-[10px]">
                      <p className="text-slate-400 truncate">{table.location}</p>
                      {activeOrder && (
                        <p className={`font-bold uppercase mt-0.5 truncate ${isFoodReady ? 'text-emerald-300 text-xs flex items-center gap-1' : 'text-amber-300'}`}>
                          {isFoodReady && <Bell className="w-3 h-3 text-emerald-400" />}
                          {activeOrder.status}
                        </p>
                      )}
                    </div>

                    <div className="text-[9px] font-bold uppercase tracking-wider">
                      {isFoodReady ? <span className="text-emerald-300">Deliver Food Now</span> : table.status}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If table is in CLEANING status, quick button to reset to AVAILABLE */}
          {primaryTable?.status === 'CLEANING' && (
            <div className="p-4 rounded-2xl bg-black/40 border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-300">Table {primaryTable.tableNumber} sanitized & ready?</span>
              <button
                onClick={() => handleToggleTableCleaning(primaryTable.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Mark Available
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Order Entry & Active Table Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTables.length > 0 ? (
            <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl space-y-6">

              {/* Selected Table Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {selectedTables.length > 1 ? `${selectedTables.length} Tables Joined` : 'Active Table Focus'}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-white mt-1">
                    {selectedTables.map((t) => `Table ${t.tableNumber}`).join(' + ')}
                    {selectedTables.length === 1 && ` (${selectedTables[0].location})`}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-slate-300">
                    Seats: <strong className="text-white">{selectedTables.reduce((s, t) => s + (t.capacity || 0), 0)} Guests</strong>
                  </span>
                </div>
              </div>

              {/* Existing Active Order on this table (if any) */}
              {primaryTable?.orders?.[0] && (
                <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">
                        Current Order: #{primaryTable.orders[0].orderNumber}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Status: <strong className="text-amber-400 uppercase">{primaryTable.orders[0].status}</strong>
                      </p>
                    </div>

                    {/* Waiter Actions for active order */}
                    <div className="flex items-center gap-2">
                      {primaryTable.orders[0].status === 'READY' && (
                        <button
                          onClick={() => handleMarkServed(primaryTable.orders[0].id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Food Served</span>
                        </button>
                      )}

                      {['SERVED', 'READY'].includes(primaryTable.orders[0].status) && (
                        <button
                          onClick={() => handleRequestBill(primaryTable.orders[0].id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-glow-gold"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Request Bill</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Order Items */}
                  <div className="text-xs space-y-1 text-slate-300">
                    {primaryTable.orders[0].orderItems?.map((oi) => (
                      <div key={oi.id} className="flex justify-between py-0.5 border-b border-white/5">
                        <span>{oi.quantity}× {oi.menuItem?.name}</span>
                        <span>{currency}{oi.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Dishes / Waiter POS Cart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                    Add Dishes to Table Order
                  </h4>

                  {/* Category Pill Switcher */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-xs pb-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-2 py-1 text-[11px] rounded-lg font-semibold whitespace-nowrap ${
                        selectedCategory === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-white/5'
                      }`}
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id.toString())}
                        className={`px-2 py-1 text-[11px] rounded-lg font-semibold whitespace-nowrap ${
                          selectedCategory === c.id.toString() ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 bg-white/5'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compact Menu Items Quick-Add Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {filteredMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToTableOrder(item)}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/40 text-left transition-all group"
                    >
                      <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 font-serif">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-amber-400 mt-1 font-mono">
                        {currency}{item.price - (item.discount || 0)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Staged Items for this Order */}
                {tableOrder.length > 0 && (
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <span>Staged Order Items ({tableOrder.length})</span>
                      <span>Subtotal: {currency}{orderSubtotal}</span>
                    </div>

                    <div className="space-y-2 divide-y divide-white/5">
                      {tableOrder.map((item) => (
                        <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{item.name}</p>
                            <input
                              type="text"
                              placeholder="Special note (e.g. no pepper)"
                              value={item.notes || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTableOrder((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, notes: val } : i))
                                );
                              }}
                              className="mt-1 w-full text-[10px] bg-black/40 border border-white/10 rounded px-2 py-0.5 text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-black/60 rounded-lg p-0.5 border border-white/10">
                            <button
                              onClick={() => updateOrderQty(item.id, -1)}
                              className="p-1 hover:text-amber-400 text-slate-400"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-bold text-white text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateOrderQty(item.id, 1)}
                              className="p-1 hover:text-amber-400 text-slate-400"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Special instruction & diner name */}
                    <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Guest Name (optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Kitchen order note..."
                        value={specialInstruction}
                        onChange={(e) => setSpecialInstruction(e.target.value)}
                        className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Send to Kitchen CTA */}
                    <button
                      disabled={submitting}
                      onClick={handleSendToKitchen}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-gold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Transmitting to Kitchen...' : 'Send Order to Kitchen'}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 rounded-3xl bg-restoza-dark-900 border border-white/10">
              <UserCheck className="w-12 h-12 mx-auto opacity-30 text-blue-400 mb-3" />
              <h3 className="text-base font-bold text-white">No Table Selected</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select any table on the left floor plan to manage orders and billing.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
