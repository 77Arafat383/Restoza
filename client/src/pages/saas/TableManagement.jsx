import React, { useState, useEffect } from 'react';
import { tableAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Grid3X3, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    location: 'Main Dining',
    status: 'AVAILABLE',
  });

  const { socket } = useSocket();

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchTables();
    socket.on('table_status_changed', handleRefresh);
    return () => socket.off('table_status_changed', handleRefresh);
  }, [socket]);

  const fetchTables = async () => {
    try {
      const res = await tableAPI.getTables();
      setTables(res.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: `T-${(tables.length + 1).toString().padStart(2, '0')}`,
      capacity: 4,
      location: 'Main Dining',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tableAPI.updateTable(editingTable.id, formData);
      } else {
        await tableAPI.createTable(formData);
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save table.');
    }
  };

  const handleUpdateStatus = async (tableId, status) => {
    try {
      await tableAPI.updateStatus(tableId, status);
      fetchTables();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('Delete this restaurant table?')) return;
    try {
      await tableAPI.deleteTable(tableId);
      fetchTables();
    } catch (err) {
      alert('Failed to delete table.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-amber-400" />
            Restaurant Floor & Table Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure floor seating arrangements, VIP booths, and live status states.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-gold flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const statusColors = {
            AVAILABLE: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
            OCCUPIED: 'border-rose-500/60 bg-rose-950/30 text-rose-300 shadow-glow-burgundy',
            RESERVED: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
            CLEANING: 'border-slate-500/40 bg-slate-900/40 text-slate-400',
          };

          return (
            <div
              key={table.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between h-48 transition-all ${
                statusColors[table.status]
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg text-white">
                    {table.tableNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="p-1 rounded-md hover:bg-red-900/40 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                  <p>Capacity: <strong className="text-white">{table.capacity} Persons</strong></p>
                  <p>Zone: <strong className="text-white">{table.location}</strong></p>
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Status:</span>
                <select
                  value={table.status}
                  onChange={(e) => handleUpdateStatus(table.id, e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="AVAILABLE" className="bg-slate-900">AVAILABLE</option>
                  <option value="OCCUPIED" className="bg-slate-900">OCCUPIED</option>
                  <option value="RESERVED" className="bg-slate-900">RESERVED</option>
                  <option value="CLEANING" className="bg-slate-900">CLEANING</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-restoza-dark-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-serif font-bold text-white mb-4">
              {editingTable ? 'Edit Table Settings' : 'Add New Restaurant Table'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Table Number</label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  placeholder="e.g. T-15"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Location Zone</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Main Dining" className="bg-slate-900">Main Dining Hall</option>
                  <option value="Window View" className="bg-slate-900">Window View</option>
                  <option value="Patio Terrace" className="bg-slate-900">Patio Terrace</option>
                  <option value="VIP Lounge" className="bg-slate-900">VIP Private Lounge</option>
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
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
