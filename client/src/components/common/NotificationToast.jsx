import React, { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Bell, CheckCircle2, AlertCircle, Receipt, X } from 'lucide-react';

export default function NotificationToast() {
  const { lastNotification, clearNotification } = useSocket();

  useEffect(() => {
    if (lastNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification]);

  if (!lastNotification) return null;

  const getIcon = () => {
    switch (lastNotification.type) {
      case 'ORDER':
        return <Bell className="w-5 h-5 text-amber-400" />;
      case 'STATUS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'BILL':
      case 'PAYMENT':
        return <Receipt className="w-5 h-5 text-restoza-burgundy-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
      <div className="flex items-start gap-3 p-4 bg-restoza-dark-900/95 border border-amber-500/40 rounded-xl shadow-2xl backdrop-blur-md max-w-sm">
        <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            {lastNotification.title}
          </p>
          <p className="text-sm text-slate-200 mt-0.5 break-words">
            {lastNotification.message}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Just now
          </span>
        </div>
        <button
          onClick={clearNotification}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
