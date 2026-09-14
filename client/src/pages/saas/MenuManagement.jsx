import React, { useState, useEffect } from 'react';
import { menuAPI, settingsAPI } from '../../services/api';
import {
  Utensils, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search,
  Clock, DollarSign, Image as ImageIcon, Sparkles, X, AlertCircle
} from 'lucide-react';

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '৳' });
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    discount: '',
    preparationTime: 15,
    description: '',
    ingredients: '',
    imageUrl: '',
    isAvailable: true,
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes, settingsRes] = await Promise.all([
        menuAPI.getItems(),
        menuAPI.getCategories(),
        settingsAPI.getSettings(),
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      price: '',
      discount: 0,
      preparationTime: 15,
      description: '',
      ingredients: '',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      isAvailable: true,
    });
    setIsItemModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      discount: item.discount || 0,
      preparationTime: item.preparationTime || 15,
      description: item.description || '',
      ingredients: item.ingredients || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuAPI.updateItem(editingItem.id, formData);
      } else {
        await menuAPI.createItem(formData);
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item.');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await menuAPI.toggleAvailability(id);
      fetchData();
    } catch (err) {
      alert('Failed to toggle availability.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu dish?')) return;
    try {
      await menuAPI.deleteItem(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await menuAPI.createCategory({ name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      setIsCatModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category.');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCat = selectedCat === 'all' || item.categoryId === parseInt(selectedCat);
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const currency = settings.currencySymbol || '৳';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-400" />
            Digital Menu Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure restaurant dishes, culinary pricing, discounts, and inventory availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            + New Category
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-glow-gold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-restoza-dark-900 border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id.toString())}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === c.id.toString()
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {c.name} ({c._count?.items || 0})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish or ingredient..."
            className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl bg-restoza-dark-900 border transition-all flex flex-col justify-between ${
              item.isAvailable ? 'border-white/10 hover:border-amber-500/40' : 'border-red-900/30 opacity-70 bg-black/50'
            }`}
          >
            <div>
              <div className="flex gap-3">
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-black"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-sm text-white truncate font-serif">{item.name}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-amber-300">
                      {item.category?.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {item.preparationTime}m
                    </span>
                    {item.discount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400">
                        -{currency}{item.discount} OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {item.ingredients && (
                <p className="text-[11px] text-slate-500 mt-2.5 italic truncate">
                  Ing: {item.ingredients}
                </p>
              )}
            </div>

            {/* Actions Bar */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-white">
                  {currency}{item.price - (item.discount || 0)}
                </span>
                {item.discount > 0 && (
                  <span className="text-xs text-slate-500 line-through ml-1.5">
                    {currency}{item.price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Availability Toggle */}
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  title={item.isAvailable ? 'Mark as Out of Stock' : 'Mark as Available'}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                    item.isAvailable
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-red-950/60 border-red-500/30 text-red-300 hover:bg-red-900/60'
                  }`}
                >
                  {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Create / Edit Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-restoza-dark-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-white mb-4">
              {editingItem ? 'Modify Culinary Item' : 'Create New Menu Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Wagyu Ribeye Steak"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Discount Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief flavor description..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  ></textarea>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Ingredients (comma separated)</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="Wagyu beef, Truffle oil, Sea salt..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-glow-gold"
                >
                  Save Item
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* New Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-restoza-dark-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCatModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-serif font-bold text-white mb-3">Add Menu Category</h3>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Seafood & Grills"
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Fresh coastal catch..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
