import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import {
  Users, UserPlus, Shield, CheckCircle2, XCircle, Mail, Phone, Lock, X,
  UserCheck, Flame, DollarSign, Clock, CreditCard, ChevronRight, AlertCircle, Edit3, Save
} from 'lucide-react';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACTIVE' | 'FIRED'

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModalStaff, setPayModalStaff] = useState(null);
  const [editingSalaryId, setEditingSalaryId] = useState(null);
  const [salaryInput, setSalaryInput] = useState('');

  // Register Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'WAITER',
    salary: 25000,
    isApprovedDirectly: true,
  });

  // Pay Form State
  const [payFormData, setPayFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    paymentType: 'SALARY',
    note: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await authAPI.getStaff();
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await authAPI.register(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'WAITER',
        salary: 25000,
        isApprovedDirectly: true,
      });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register staff member.');
    }
  };

  const handleApproveStaff = async (staffId) => {
    try {
      await authAPI.updateStaff(staffId, { status: 'ACTIVE' });
      fetchStaff();
    } catch (err) {
      alert('Failed to approve staff account.');
    }
  };

  const handleFireStaff = async (staff) => {
    if (!window.confirm(`Are you sure you want to terminate / FIRE ${staff.name}? This will revoke their workspace login access.`)) {
      return;
    }
    try {
      await authAPI.updateStaff(staff.id, { status: 'FIRED' });
      fetchStaff();
    } catch (err) {
      alert('Failed to update staff status.');
    }
  };

  const handleRehireStaff = async (staffId) => {
    try {
      await authAPI.updateStaff(staffId, { status: 'ACTIVE' });
      fetchStaff();
    } catch (err) {
      alert('Failed to activate staff member.');
    }
  };

  const handleRoleChange = async (staffId, newRole) => {
    try {
      await authAPI.updateStaff(staffId, { role: newRole });
      fetchStaff();
    } catch (err) {
      alert('Failed to update staff role.');
    }
  };

  const handleSaveSalary = async (staffId) => {
    try {
      await authAPI.updateStaff(staffId, { salary: parseFloat(salaryInput) || 0 });
      setEditingSalaryId(null);
      fetchStaff();
    } catch (err) {
      alert('Failed to update base salary.');
    }
  };

  const handleOpenPayModal = (staff) => {
    setPayModalStaff(staff);
    setPayFormData({
      amount: staff.salary || 25000,
      paymentMethod: 'CASH',
      paymentType: 'SALARY',
      note: `Working salary payment for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payModalStaff) return;
    try {
      await authAPI.payStaff(payModalStaff.id, payFormData);
      setPayModalStaff(null);
      fetchStaff();
      alert('Working payment recorded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record staff payment.');
    }
  };

  // Filtered List based on Tab
  const pendingCount = staffList.filter((s) => s.status === 'PENDING_APPROVAL').length;
  const activeCount = staffList.filter((s) => s.status === 'ACTIVE').length;
  const firedCount = staffList.filter((s) => s.status === 'FIRED').length;

  const filteredStaff = staffList.filter((s) => {
    if (activeTab === 'PENDING') return s.status === 'PENDING_APPROVAL';
    if (activeTab === 'ACTIVE') return s.status === 'ACTIVE';
    if (activeTab === 'FIRED') return s.status === 'FIRED' || s.status === 'INACTIVE';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Restaurant User Management & Payroll
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Approve pending staff registrations, update job roles, manage terminations, and disburse working salaries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-gold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Tabs & Status Filter */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ALL'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          All Members ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'PENDING'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Active Staff ({activeCount})
        </button>

        <button
          onClick={() => setActiveTab('FIRED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'FIRED'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Terminated / Fired ({firedCount})
        </button>
      </div>

      {/* Staff Table Card */}
      <div className="p-5 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 pb-2">
              <th className="py-3 px-4">EMPLOYEE</th>
              <th className="py-3 px-4">JOB ROLE</th>
              <th className="py-3 px-4">BASE SALARY</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">ACTIONS & PAYROLL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {filteredStaff.map((st) => (
              <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                
                {/* Employee Info */}
                <td className="py-3.5 px-4 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <div>{st.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{st.email}</div>
                    </div>
                  </div>
                </td>

                {/* Job Role Dropdown */}
                <td className="py-3.5 px-4">
                  <select
                    value={st.role}
                    onChange={(e) => handleRoleChange(st.id, e.target.value)}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-black/50 border border-white/15 text-amber-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="WAITER" className="bg-slate-900 text-white">Waiter</option>
                    <option value="KITCHEN" className="bg-slate-900 text-white">Chef (Kitchen)</option>
                    <option value="CASHIER" className="bg-slate-900 text-white">Cashier</option>
                    <option value="MANAGER" className="bg-slate-900 text-white">Manager</option>
                  </select>
                </td>

                {/* Base Salary */}
                <td className="py-3.5 px-4">
                  {editingSalaryId === st.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={salaryInput}
                        onChange={(e) => setSalaryInput(e.target.value)}
                        className="w-20 px-2 py-1 bg-black/60 border border-amber-500/50 rounded-lg text-xs text-white"
                      />
                      <button
                        onClick={() => handleSaveSalary(st.id)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { setEditingSalaryId(st.id); setSalaryInput(st.salary || 25000); }}>
                      <span className="font-semibold text-white">৳{(st.salary || 0).toLocaleString()}</span>
                      <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  {st.status === 'PENDING_APPROVAL' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                      <Clock className="w-3 h-3" />
                      PENDING APPROVAL
                    </span>
                  )}
                  {st.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      ACTIVE
                    </span>
                  )}
                  {st.status === 'FIRED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                      <Flame className="w-3 h-3" />
                      FIRED / TERMINATED
                    </span>
                  )}
                  {st.status === 'INACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 border border-slate-500/30 text-slate-400">
                      <XCircle className="w-3 h-3" />
                      INACTIVE
                    </span>
                  )}
                </td>

                {/* Actions & Payroll */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    
                    {/* Approve Button */}
                    {st.status === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => handleApproveStaff(st.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-glow-gold transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve Request</span>
                      </button>
                    )}

                    {/* Salary Payout Button */}
                    {st.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleOpenPayModal(st)}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-1 transition-all"
                        title="Give working payment / salary"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Give Payment</span>
                      </button>
                    )}

                    {/* Fire / Terminate Button */}
                    {st.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleFireStaff(st)}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1 transition-all"
                        title="Terminate employment"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Fire Staff</span>
                      </button>
                    )}

                    {/* Rehire / Activate Button */}
                    {(st.status === 'FIRED' || st.status === 'INACTIVE') && (
                      <button
                        onClick={() => handleRehireStaff(st.id)}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-all"
                      >
                        Re-Activate
                      </button>
                    )}

                  </div>
                </td>

              </tr>
            ))}

            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p>No staff members found in this status filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Give Salary Payout Modal */}
      {payModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-restoza-dark-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setPayModalStaff(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">Disburse Working Salary / Payment</h3>
                <p className="text-xs text-slate-400">Employee: <strong>{payModalStaff.name}</strong> ({payModalStaff.role})</p>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={payFormData.amount}
                    onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Type</label>
                  <select
                    value={payFormData.paymentType}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentType: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SALARY" className="bg-slate-900">Monthly Salary</option>
                    <option value="BONUS" className="bg-slate-900">Performance Bonus</option>
                    <option value="OVERTIME" className="bg-slate-900">Overtime Payout</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={payFormData.paymentMethod}
                  onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASH" className="bg-slate-900">Cash Disbursal</option>
                  <option value="BANK_TRANSFER" className="bg-slate-900">Direct Bank Transfer</option>
                  <option value="MOBILE_BANKING" className="bg-slate-900">bKash / Nagad Mobile Banking</option>
                  <option value="CHEQUE" className="bg-slate-900">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Period</label>
                <input
                  type="text"
                  value={payFormData.note}
                  onChange={(e) => setPayFormData({ ...payFormData, note: e.target.value })}
                  placeholder="e.g. September Salary + 5hrs Overtime"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Recent Payment History for this staff member */}
              {payModalStaff.staffPayments && payModalStaff.staffPayments.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[11px] font-semibold text-slate-400 mb-2">Recent Disbursal History:</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {payModalStaff.staffPayments.map((p) => (
                      <div key={p.id} className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-white">৳{p.amount.toLocaleString()}</span> ({p.paymentType})
                          <div className="text-[10px] text-slate-500">{new Date(p.paidAt).toLocaleDateString()} • {p.paymentMethod}</div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">{p.note || 'Paid'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalStaff(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-glow-gold"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-restoza-dark-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-serif font-bold text-white mb-4">Register New Restaurant Staff</h3>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marco Pierre"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="chef@restoza.com"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+880 1711-..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Salary (৳)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="WAITER" className="bg-slate-900">Waiter / Floor Staff</option>
                  <option value="KITCHEN" className="bg-slate-900">Kitchen Staff / Chef</option>
                  <option value="CASHIER" className="bg-slate-900">Cashier</option>
                  <option value="MANAGER" className="bg-slate-900">Restaurant Manager</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isApprovedDirectly}
                    onChange={(e) => setFormData({ ...formData, isApprovedDirectly: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-amber-500"
                  />
                  <span>Approve Immediately</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Register Staff
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

