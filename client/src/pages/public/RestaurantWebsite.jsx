import React, { useState, useEffect } from 'react';
import RestozaLogo from '../../components/common/RestozaLogo';
import { menuAPI, tableAPI, orderAPI, settingsAPI, feedbackAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  ShoppingBag, Search, Clock, Plus, Minus, Trash2, Check, Star,
  MapPin, Phone, Mail, ArrowRight, ShieldCheck, ChefHat, Sparkles,
  X, CheckCircle, Flame, UtensilsCrossed
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RestaurantWebsite({ onOpenAuth, onEnterSaas, isStaff, userRole }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState({
    restaurantName: 'Restoza',
    tagline: 'Fine Dining • Culinary Excellence',
    currencySymbol: '৳',
    taxRate: 10,
    serviceChargeRate: 5,
    address: 'Plot 42, Road 11, Banani / Gulshan 2, Dhaka',
    phone: '+880 1711-234567',
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstruction, setSpecialInstruction] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Active Order Tracking Modal
  const [activeOrder, setActiveOrder] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({ total: 0, averageRating: 5.0 });

  // Guest Feedback Form
  const [fbName, setFbName] = useState('');
  const [fbFoodRating, setFbFoodRating] = useState(5);
  const [fbServiceRating, setFbServiceRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [fbSuccess, setFbSuccess] = useState(false);

  const { socket } = useSocket();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Listen for socket events to update active order
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (order) => {
      if (activeOrder && activeOrder.id === order.id) {
        setActiveOrder(order);
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    return () => socket.off('order_status_updated', handleStatusUpdate);
  }, [socket, activeOrder]);

  const loadData = async () => {
    try {
      const [catsRes, itemsRes, tablesRes, settingsRes, fbRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getItems({ availableOnly: 'true' }),
        tableAPI.getTables(),
        settingsAPI.getSettings(),
        feedbackAPI.getFeedbacks(),
      ]);

      setCategories(catsRes.data);
      setMenuItems(itemsRes.data);
      setTables(tablesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (fbRes.data) {
        setFeedbacks(fbRes.data.feedbacks || []);
        setFeedbackStats(fbRes.data.stats || { total: 0, averageRating: 5.0 });
      }
    } catch (err) {
      console.error('Failed to load website initial data:', err);
    }
  };

  // Cart Handlers
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === itemId) {
            const currentQty = parseInt(i.quantity) || 1;
            const newQty = currentQty + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const setExactQuantity = (itemId, val) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          if (val === '') return { ...i, quantity: '' };
          const parsed = parseInt(val, 10);
          if (isNaN(parsed) || parsed <= 0) return { ...i, quantity: 1 };
          return { ...i, quantity: Math.min(999, parsed) };
        }
        return i;
      })
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * (parseInt(item.quantity) || 1), 0);
  const cartDiscount = cart.reduce((sum, item) => sum + (item.discount || 0) * (parseInt(item.quantity) || 1), 0);
  const discountedSubtotal = Math.max(0, cartSubtotal - cartDiscount);
  const cartTax = (discountedSubtotal * (settings.taxRate / 100));
  const cartServiceCharge = orderType === 'DINE_IN' ? (discountedSubtotal * (settings.serviceChargeRate / 100)) : 0;
  const cartTotal = discountedSubtotal + cartTax + cartServiceCharge;

  // Handle Order Placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    if (orderType === 'DINE_IN' && !selectedTableId) {
      alert('Please select your dining table number.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderPayload = {
        tableId: orderType === 'DINE_IN' ? parseInt(selectedTableId) : null,
        orderType,
        customerName: customerName || 'Valued Guest',
        customerPhone,
        specialInstruction,
        items: cart.map((i) => ({
          menuItemId: i.id,
          quantity: parseInt(i.quantity) || 1,
          specialInstruction: i.notes || null,
        })),
      };

      const res = await orderAPI.createOrder(orderPayload);
      setActiveOrder(res.data);
      setCart([]);
      setIsCartOpen(false);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#be123c', '#ffffff'],
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Handle Feedback Submission
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await feedbackAPI.submitFeedback({
        customerName: fbName || 'Guest Diner',
        foodRating: fbFoodRating,
        serviceRating: fbServiceRating,
        overallRating: Math.round((fbFoodRating + fbServiceRating) / 2),
        comment: fbComment,
        orderId: activeOrder?.id || null,
      });
      setFbSuccess(true);
      setTimeout(() => {
        setIsFeedbackOpen(false);
        setFbSuccess(false);
        setFbComment('');
        loadData(); // reload reviews
      }, 2000);
    } catch (err) {
      alert('Failed to submit review.');
    }
  };

  // Filtered Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === parseInt(selectedCategory);
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const currency = settings.currencySymbol || '৳';

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-slate-100 selection:bg-restoza-burgundy-600 selection:text-white">

      {/* Top Banner & Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0e0e13]/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <RestozaLogo size="md" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#menu" className="hover:text-amber-400 transition-colors">Menu</a>
            <a href="#experience" className="hover:text-amber-400 transition-colors">Fine Dining</a>
            <a href="#reviews" className="hover:text-amber-400 transition-colors">Guest Reviews</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 text-slate-200 hover:text-amber-400 transition-all"
              aria-label="View Order Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-restoza-burgundy-600 text-white font-bold text-[11px] rounded-full flex items-center justify-center animate-pulse">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* If user is logged in, show SaaS dashboard button; otherwise show Staff Login */}
            {isStaff ? (
              <button
                onClick={onEnterSaas}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold shadow-glow-gold transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Operations SaaS ({userRole})</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28">
        {/* Background Visual Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-restoza-burgundy-900/40 via-amber-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Culinary Artistry & Artisanal Ingredients
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-[1.15]">
                Taste The Height of <br className="hidden sm:inline" />
                <span className="gold-gradient-text">Gastronomic Luxury</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl">
                Experience wood-fired sourdough pizzas, dry-aged Wagyu delicacies, handcrafted pastas, and artisanal drinks served in an intimate velvet-gold ambiance.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#menu"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-restoza-burgundy-700 to-restoza-burgundy-900 hover:from-restoza-burgundy-600 hover:to-restoza-burgundy-800 text-white font-semibold text-sm shadow-glow-burgundy flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Order Digital Menu</span>
                </a>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/15 hover:border-amber-500/40 text-slate-200 hover:text-white font-medium text-sm transition-all"
                >
                  View Dining Cart ({cart.length})
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-md mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl font-bold font-serif text-amber-400">
                    {feedbackStats.averageRating || '4.9'}★
                  </p>
                  <p className="text-xs text-slate-400">Guest Rating</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-serif text-white">20+</p>
                  <p className="text-xs text-slate-400">Artisan Dishes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-serif text-white">15 min</p>
                  <p className="text-xs text-slate-400">Average Serving</p>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-restoza-burgundy-600 to-amber-500 blur-2xl opacity-30 transform -rotate-3 scale-95"></div>
                <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                  <img
                    src="/restoza-brand.jpg"
                    alt="Restoza Fine Dining Emblem"
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Signature Dining</span>
                    <h3 className="text-white text-lg font-serif font-bold">Restoza Banani & Gulshan</h3>
                    <p className="text-xs text-slate-300">Open Daily • 12:00 PM – 11:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Digital Menu Section */}
      <section id="menu" className="py-16 bg-[#0e0e13]/60 border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1.5">
                <Flame className="w-3.5 h-3.5" />
                Live Digital Catalog
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Chef's Handcrafted Menu
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Order directly to your table or for takeaway. No login required for diners!
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search burger, pizza, steak..."
                className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id.toString()
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
              >
                {cat.name} ({cat._count?.items || 0})
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-restoza-dark-900 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 flex flex-col shadow-lg hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 uppercase tracking-wider">
                    {item.category?.name || 'Artisan'}
                  </span>

                  {/* Preparation Time */}
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {item.preparationTime}m
                  </span>

                  {/* Discount Badge */}
                  {item.discount > 0 && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-bold bg-restoza-burgundy-600 text-white">
                      Save {currency}{item.discount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors font-serif">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    {item.ingredients && (
                      <p className="text-[11px] text-slate-500 mt-2 italic">
                        Ingredients: {item.ingredients}
                      </p>
                    )}
                  </div>

                  {/* Price & Add Button */}
                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-white">
                          {currency}{item.price - (item.discount || 0)}
                        </span>
                        {item.discount > 0 && (
                          <span className="text-xs text-slate-500 line-through">
                            {currency}{item.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-glow-gold active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-base">No culinary items match your search or filter.</p>
            </div>
          )}

        </div>
      </section>

      {/* Active Order Live Tracker (Floating card when an order is placed) */}
      {activeOrder && (
        <div className="fixed bottom-5 left-5 z-40 max-w-sm w-full bg-restoza-dark-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Live Order #{activeOrder.orderNumber}
              </span>
              <h4 className="text-sm font-bold text-white mt-1">
                {activeOrder.table ? `Table ${activeOrder.table.tableNumber}` : 'Takeaway Order'}
              </h4>
            </div>
            <button
              onClick={() => setActiveOrder(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-semibold text-amber-300 pb-1">
              <span>Status:</span>
              <span className="uppercase">{activeOrder.status}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500"
                style={{
                  width:
                    activeOrder.status === 'PENDING' ? '25%' :
                      activeOrder.status === 'CONFIRMED' ? '40%' :
                        activeOrder.status === 'PREPARING' ? '65%' :
                          activeOrder.status === 'READY' ? '85%' :
                            activeOrder.status === 'SERVED' || activeOrder.status === 'COMPLETED' ? '100%' : '15%',
                }}
              ></div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total: {currency}{activeOrder.total}</span>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Leave Feedback</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-restoza-dark-900 border-l border-white/10 h-full flex flex-col p-6 shadow-2xl">

            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-serif font-bold text-white">Your Dining Order</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 divide-y divide-white/5">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-xs text-amber-400 font-medium">
                      {currency}{item.price - (item.discount || 0)} each
                    </p>
                    <input
                      type="text"
                      placeholder="Special note (e.g. no onions)"
                      value={item.notes || ''}
                      onChange={(e) => {
                        const note = e.target.value;
                        setCart((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, notes: note } : i))
                        );
                      }}
                      className="mt-1.5 w-full text-[11px] bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Quantity Controls & Remove Action */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:text-amber-400 text-slate-400 transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={item.quantity}
                        onChange={(e) => setExactQuantity(item.id, e.target.value)}
                        onBlur={() => {
                          if (!item.quantity || parseInt(item.quantity) <= 0) {
                            setExactQuantity(item.id, 1);
                          }
                        }}
                        className="w-8 text-center text-xs font-semibold text-white bg-transparent border-0 focus:outline-none focus:bg-white/10 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:text-amber-400 text-slate-400 transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm">Your order cart is empty.</p>
                  <p className="text-xs text-slate-500 mt-1">Browse our menu and add your favorite dishes.</p>
                </div>
              )}
            </div>

            {/* Order Form & Checkout Footer */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-3">
                {/* Order Type Selector */}
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setOrderType('DINE_IN')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${orderType === 'DINE_IN'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Dine-In Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('TAKEAWAY')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${orderType === 'TAKEAWAY'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Takeaway / To-Go
                  </button>
                </div>

                {/* Table Picker if Dine-in */}
                {orderType === 'DINE_IN' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Select Your Table</label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choose dining table --</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          Table {t.tableNumber} ({t.capacity} seats - {t.location}) - [{t.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Diner Name & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Financial Summary */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{currency}{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discounts</span>
                      <span>-{currency}{cartDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>VAT / Tax ({settings.taxRate}%)</span>
                    <span>{currency}{cartTax.toFixed(2)}</span>
                  </div>
                  {orderType === 'DINE_IN' && (
                    <div className="flex justify-between text-slate-400">
                      <span>Service Charge ({settings.serviceChargeRate}%)</span>
                      <span>{currency}{cartServiceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white pt-1.5 border-t border-white/10 text-sm">
                    <span>Grand Total</span>
                    <span className="text-amber-400">{currency}{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-glow-gold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingOrder ? (
                    <span>Transmitting Order to Kitchen...</span>
                  ) : (
                    <>
                      <span>Place Order & Send to Kitchen</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Guest Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-restoza-dark-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              How was your experience?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Your feedback directly assists our executive chefs and dining team.
            </p>

            {fbSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Thank You!</h4>
                <p className="text-xs text-slate-300">Your review has been published.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Food Rating */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Food Quality Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFbFoodRating(num)}
                        className="p-1.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${num <= fbFoodRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Rating */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Service & Ambiance</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFbServiceRating(num)}
                        className="p-1.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${num <= fbServiceRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Comments & Notes</label>
                  <textarea
                    rows={3}
                    value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)}
                    placeholder="Tell us about the flavor, service, or atmosphere..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-restoza-burgundy-700 hover:bg-restoza-burgundy-800 text-white font-semibold text-xs transition-colors"
                >
                  Submit Guest Review
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Guest Reviews Showcase */}
      <section id="reviews" className="py-16 bg-[#0a0a0d] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Verified Dining Reviews
            </span>
            <h2 className="text-3xl font-serif font-bold text-white mt-1">
              Loved by Food Connoisseurs
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Over {feedbackStats.total || '150+'} happy diners rated us an average of {feedbackStats.averageRating || '4.9'} out of 5 stars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {feedbacks.slice(0, 3).map((f) => (
              <div
                key={f.id}
                className="p-6 rounded-2xl bg-restoza-dark-900 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-3">
                    {Array.from({ length: f.overallRating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-200 italic leading-relaxed">
                    "{f.comment || 'Outstanding food quality and world class service.'}"
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{f.customerName}</span>
                  <span className="text-slate-500">Verified Diner</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 text-xs font-semibold text-amber-400 hover:text-white transition-all"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Write Your Own Experience Review</span>
            </button>
          </div>
        </div>
      </section>

      {/* Experience & Atmosphere */}
      <section id="experience" className="py-16 bg-[#0e0e13] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                Atmosphere & Ambiance
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Fine Dining Meets Contemporary Elegance
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                At Restoza, every evening is crafted as an immersion into culinary artistry. From intimate window-side seating overlooking the city skyline to spacious VIP velvet booths and open patio dining, our spaces cater to celebrations and executive dinners alike.
              </p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Farm-to-table organic produce & artisanal cured meats</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Real-time digital ordering without waiting for menus</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Private dining rooms & bespoke curated chef degustation menus</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600"
                alt="Dining Room Ambiance"
                className="rounded-2xl object-cover h-56 w-full shadow-lg border border-white/10 hover:opacity-95 transition-opacity"
              />
              <img
                src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600"
                alt="Bar & Cocktails"
                className="rounded-2xl object-cover h-56 w-full shadow-lg border border-white/10 hover:opacity-95 transition-opacity mt-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Location */}
      <footer id="contact" className="bg-[#07070a] border-t border-white/10 pt-16 pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

            <div className="md:col-span-1 space-y-3">
              <RestozaLogo size="md" />
              <p className="text-slate-400 text-xs leading-relaxed">
                {settings.tagline || 'Fine Dining • Culinary Excellence'}
              </p>

            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider text-xs mb-3">Reservations & Hours</h4>
              <p className="text-slate-300">Mon – Fri: 12:00 PM – 11:00 PM</p>
              <p className="text-slate-300 mt-1">Sat – Sun: 11:30 AM – 11:45 PM</p>
              <p className="text-amber-400 mt-2">Dine-In • Takeaway • Private Events</p>
            </div>

            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider text-xs mb-3">Address & Contact</h4>
              <p className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>{settings.address}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300 mt-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>{settings.phone}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300 mt-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>{settings.email || 'hello@restoza.com'}</span>
              </p>
            </div>

          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 Restoza Restaurant Management System. All rights reserved.</p>
            <p className="text-slate-400">
              Tax ({settings.taxRate}%) & Service Charge ({settings.serviceChargeRate}%) editable by Manager.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
