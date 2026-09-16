import React, { useState, useEffect } from 'react';
import { billAPI, orderAPI, settingsAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import ThermalReceiptModal from '../../components/billing/ThermalReceiptModal';
import {
  DollarSign, Receipt, CreditCard, Banknote, Smartphone,
  CheckCircle2, Printer, Search, RefreshCw, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CashierDesk() {
  const [bills, setBills] = useState([]);
  const [unbilledOrders, setUnbilledOrders] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '৳', taxRate: 10, serviceChargeRate: 5 });
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  // Active Thermal Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { socket } = useSocket();

  useEffect(() => {
    fetchCashierData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchCashierData();
    socket.on('bill_generated', handleRefresh);
    socket.on('payment_completed', handleRefresh);
    socket.on('new_order', handleRefresh);
    socket.on('order_status_updated', handleRefresh);

    return () => {
      socket.off('bill_generated', handleRefresh);
      socket.off('payment_completed', handleRefresh);
      socket.off('new_order', handleRefresh);
      socket.off('order_status_updated', handleRefresh);
    };
  }, [socket]);

  const fetchCashierData = async () => {
    try {
      const [billsRes, ordersRes, settingsRes] = await Promise.all([
        billAPI.getBills(),
        orderAPI.getOrders({ status: 'SERVED,READY' }),
        settingsAPI.getSettings(),
      ]);

      setBills(billsRes.data);
      // Find orders that don't have a bill generated yet
      const unbilled = ordersRes.data.filter((o) => !o.bills || o.bills.length === 0);
      setUnbilledOrders(unbilled);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (!selectedBill && billsRes.data.length > 0) {
        setSelectedBill(billsRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load cashier data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (orderId) => {
    try {
      const res = await billAPI.generateBill(orderId);
      await fetchCashierData();
      setSelectedBill(res.data);
    } catch (err) {
      alert('Failed to generate bill.');
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    setSettling(true);
    try {
      await billAPI.processPayment(selectedBill.id, {
        paymentMethod,
        transactionId: transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      });

      // Fetch thermal receipt data immediately
      const receiptRes = await billAPI.getThermalReceipt(selectedBill.id);
      setReceiptData(receiptRes.data);
      setIsReceiptOpen(true);

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#be123c'],
      });

      await fetchCashierData();
      setTransactionId('');
    } catch (err) {
      alert(err.response?.data?.message || 'Payment settlement failed.');
    } finally {
      setSettling(false);
    }
  };

  const handleOpenReceipt = async (billId) => {
    try {
      const res = await billAPI.getThermalReceipt(billId);
      setReceiptData(res.data);
      setIsReceiptOpen(true);
    } catch (err) {
      alert('Failed to load receipt.');
    }
  };

  const currency = settings.currencySymbol || '৳';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111117] border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Cashier Billing Desk & POS Settlement
            </h2>
            <p className="text-xs text-slate-400">
              Process payments and automatically generate 80mm thermal receipts
            </p>
          </div>
        </div>

        <button
          onClick={fetchCashierData}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
          title="Refresh Bills"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid: Bills Queue & Settlement Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Bills & Orders Queue (6 cols) */}
        <div className="lg:col-span-6 space-y-5">

          {/* Unbilled Active Orders that need invoice generated */}
          {unbilledOrders.length > 0 && (
            <div className="p-5 rounded-3xl bg-restoza-dark-900 border border-amber-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Orders Ready for Invoicing ({unbilledOrders.length})
                </h3>
              </div>

              <div className="space-y-2">
                {unbilledOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-sm text-white font-mono">{ord.orderNumber}</span>
                      <p className="text-xs text-slate-400">
                        {ord.table ? `Table ${ord.table.tableNumber}` : 'Takeaway'} • {ord.customerName}
                      </p>
                    </div>

                    <button
                      onClick={() => handleGenerateBill(ord.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glow-gold"
                    >
                      Generate Bill ({currency}{ord.total})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bills List */}
          <div className="p-5 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl space-y-3">
            <h3 className="text-base font-serif font-bold text-white mb-2">
              Invoices & Bills Queue
            </h3>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {bills.map((bill) => {
                const isSelected = selectedBill?.id === bill.id;
                const isPaid = bill.status === 'PAID';

                return (
                  <div
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected
                      ? 'border-emerald-500/70 bg-emerald-950/20 shadow-lg'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-white">{bill.billNumber}</span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Order #{bill.order?.orderNumber} • {bill.order?.table ? `Table ${bill.order.table.tableNumber}` : 'Takeaway'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold text-white font-mono">
                          {currency}{bill.total}
                        </span>
                        <span
                          className={`block text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isPaid ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                        >
                          {bill.status}
                        </span>
                      </div>
                    </div>

                    {isPaid && (
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Paid via {bill.payments?.[0]?.paymentMethod || 'CASH'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReceipt(bill.id);
                          }}
                          className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {bills.length === 0 && (
                <p className="text-center py-10 text-slate-400 text-xs">
                  No invoices generated yet.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Bill Details & Payment Settlement (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {selectedBill ? (
            <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl space-y-5">

              {/* Bill Details Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Invoice Details
                  </span>
                  <h3 className="text-xl font-bold font-mono text-white mt-1">
                    {selectedBill.billNumber}
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedBill.status === 'PAID'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                    }`}
                >
                  {selectedBill.status}
                </span>
              </div>

              {/* Guest & Table Info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 p-3 bg-black/40 rounded-xl">
                <div>
                  <span className="text-slate-500">Guest:</span> {selectedBill.order?.customerName || 'Diner'}
                </div>
                <div>
                  <span className="text-slate-500">Table:</span> {selectedBill.order?.table?.tableNumber || 'Takeaway'}
                </div>
                <div>
                  <span className="text-slate-500">Server:</span> {selectedBill.order?.waiter?.name || 'Counter Staff'}
                </div>
                <div>
                  <span className="text-slate-500">Date:</span> {new Date(selectedBill.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Itemized breakdown */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dishes & Quantities</p>
                <div className="divide-y divide-white/5 text-xs text-slate-300">
                  {selectedBill.order?.orderItems?.map((oi) => (
                    <div key={oi.id} className="py-1.5 flex justify-between">
                      <span>{oi.quantity}× {oi.menuItem?.name}</span>
                      <span className="font-mono">{currency}{oi.subtotal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation breakdown */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{currency}{selectedBill.subtotal}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{currency}{selectedBill.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>VAT / Tax ({settings.taxRate}%)</span>
                  <span>{currency}{selectedBill.tax}</span>
                </div>
                {selectedBill.serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Service Charge ({settings.serviceChargeRate}%)</span>
                    <span>{currency}{selectedBill.serviceCharge}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Due</span>
                  <span className="text-emerald-400 font-mono text-lg">{currency}{selectedBill.total}</span>
                </div>
              </div>

              {/* If UNPAID: Settlement Form */}
              {selectedBill.status === 'UNPAID' ? (
                <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">Choose Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash', icon: Banknote },
                        { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                        { id: 'MOBILE_BANKING', label: 'bKash/Nagad', icon: Smartphone },
                        { id: 'ONLINE', label: 'Online', icon: DollarSign },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isChosen = paymentMethod === m.id;
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${isChosen
                              ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Ref / Slip #</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. TXN-8947261"
                        className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={settling}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{settling ? 'Settling Payment & Printing...' : `Settle & Generate Thermal Receipt (${currency}${selectedBill.total})`}</span>
                  </button>
                </form>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenReceipt(selectedBill.id)}
                    className="w-full py-3 px-4 rounded-xl bg-restoza-burgundy-700 hover:bg-restoza-burgundy-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-glow-burgundy"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 rounded-3xl bg-restoza-dark-900 border border-white/10">
              <Receipt className="w-12 h-12 mx-auto opacity-30 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">No Invoice Selected</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a bill from the queue on the left to process payment or view thermal receipts.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Thermal Receipt Modal */}
      {isReceiptOpen && (
        <ThermalReceiptModal
          receipt={receiptData}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

    </div>
  );
}
