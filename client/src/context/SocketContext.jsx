import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected to server');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket] Disconnected from server');
    });

    s.on('new_order', (order) => {
      setLastNotification({
        type: 'ORDER',
        title: 'New Order Received',
        message: `Order #${order.orderNumber} placed for ${order.table ? order.table.tableNumber : 'Takeaway'}`,
        timestamp: new Date(),
        data: order,
      });
    });

    s.on('order_status_updated', (order) => {
      setLastNotification({
        type: 'STATUS',
        title: 'Order Status Changed',
        message: `Order #${order.orderNumber} is now ${order.status}`,
        timestamp: new Date(),
        data: order,
      });
    });

    s.on('bill_generated', (bill) => {
      setLastNotification({
        type: 'BILL',
        title: 'Bill Requested',
        message: `Bill ${bill.billNumber} generated for ${bill.order?.table?.tableNumber || 'Order'}`,
        timestamp: new Date(),
        data: bill,
      });
    });

    s.on('payment_completed', ({ bill }) => {
      setLastNotification({
        type: 'PAYMENT',
        title: 'Payment Succeeded',
        message: `Invoice ${bill.billNumber} settled successfully.`,
        timestamp: new Date(),
        data: bill,
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const clearNotification = () => setLastNotification(null);

  return (
    <SocketContext.Provider value={{ socket, connected, lastNotification, clearNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext) || {};
};
