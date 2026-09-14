import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Mail, Phone, Lock, X } from 'lucide-react';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'WAITER',
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
      setFormData({ name: '', email: '', phone: '', password: '', role: 'WAITER' });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register staff member.');
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await authAPI.updateStaff(staff.id, { status: newStatus });
      fetchStaff();
    } catch (err) {
      alert('Failed to update staff status.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Restaurant Staff & Access Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage employee accounts, assign workstation roles, and toggle access states.
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

      <div className="p-5 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 pb-2">
              <th className="py-3 px-4">EMPLOYEE</th>
              <th className="py-3 px-4">ROLE</th>
              <th className="py-3 px-4">CONTACT</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {staffList.map((st) => (
              <tr key={st.id} className="hover:bg-white/[0.02]">
                <td className="py-3.5 px-4 font-semibold text-white">
                  <div>{st.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal">Joined: {new Date(st.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-amber-300">
                    {st.role}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div>{st.email}</div>
                  <div className="text-slate-500 text-[11px]">{st.phone || 'No phone'}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      st.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {st.status === 'ACTIVE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {st.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleToggleStatus(st)}
                    className="px-3 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    {st.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
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
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
