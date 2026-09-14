import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { Settings, Percent, DollarSign, Building, Phone, Mail, MapPin, Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    restaurantName: 'Restoza',
    tagline: 'Fine Dining • Culinary Excellence',
    taxRate: 10,
    serviceChargeRate: 5,
    currencySymbol: '৳',
    address: 'Plot 42, Road 11, Banani / Gulshan 2, Dhaka',
    phone: '+880 1711-234567',
    email: 'reservations@restoza.com',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getSettings();
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await settingsAPI.updateSettings(settings);
      if (res.data?.settings) setSettings(res.data.settings);
      setSuccessMsg('Tax, service charge, and restaurant settings saved to PostgreSQL database!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to update settings. Check admin permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  // Live simulation calculator
  const sampleSubtotal = 1000;
  const sampleTax = sampleSubtotal * ((parseFloat(settings.taxRate) || 0) / 100);
  const sampleServiceCharge = sampleSubtotal * ((parseFloat(settings.serviceChargeRate) || 0) / 100);
  const sampleTotal = sampleSubtotal + sampleTax + sampleServiceCharge;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          Financial Taxes & Restaurant Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust the restaurant VAT/Tax rate and service charge percentage. These rates apply live across the digital ordering menu, POS bills, and printed thermal receipts.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Tax & Financial Charges Section (Core User Requirement) */}
        <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-amber-500/30 shadow-xl space-y-5">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              Tax & Service Charge Rates (Admin Editable)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured values will automatically calculate on all customer orders & cashier receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* VAT / Tax Rate */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                VAT / Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/50 border border-amber-500/40 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Government statutory VAT rate</span>
            </div>

            {/* Service Charge Rate */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                Service Charge (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={settings.serviceChargeRate}
                  onChange={(e) => setSettings({ ...settings, serviceChargeRate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/50 border border-amber-500/40 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Staff hospitality service charge</span>
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                placeholder="৳"
                className="w-full px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: ৳ (BDT)</span>
            </div>
          </div>

          {/* Live Receipt Preview Calculation */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs">
            <p className="font-semibold text-amber-400 mb-2">Live Calculation Preview (for sample {settings.currencySymbol}1,000 subtotal):</p>
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Base Subtotal:</span>
                <span>{settings.currencySymbol}{sampleSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({settings.taxRate}%):</span>
                <span className="text-amber-300">+{settings.currencySymbol}{sampleTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge ({settings.serviceChargeRate}%):</span>
                <span className="text-amber-300">+{settings.currencySymbol}{sampleServiceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 text-sm">
                <span>Effective Customer Bill:</span>
                <span className="text-emerald-400">{settings.currencySymbol}{sampleTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Identity & Information */}
        <div className="p-6 rounded-3xl bg-restoza-dark-900 border border-white/10 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              Restaurant Branding & Contact
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These details appear on guest invoices, website headers, and thermal receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-glow-gold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Database...' : 'Save Financial & Tax Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
