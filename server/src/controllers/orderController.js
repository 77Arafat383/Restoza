const prisma = require('../prisma');

// Generate unique sequential / formatted order number
const generateOrderNumber = async () => {
  const count = await prisma.order.count();
  return `ORD-${(100 + count + 1).toString()}`;
};

const getOrders = async (req, res) => {
  try {
    const { status, tableId, orderType, todayOnly } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }
    if (tableId) where.tableId = parseInt(tableId);
    if (orderType) where.orderType = orderType;

    if (todayOnly === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfDay };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        orderItems: {
          include: { menuItem: true },
        },
        bills: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        table: true,
        waiter: { select: { id: true, name: true, phone: true } },
        orderItems: {
          include: { menuItem: true },
        },
        bills: {
          include: { payments: true },
        },
        feedbacks: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order details.' });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      tableId,
      customerName,
      customerPhone,
      orderType = 'DINE_IN',
      items, // array of { menuItemId, quantity, specialInstruction }
      specialInstruction,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

    // Fetch live restaurant settings for tax and service charge rates
    const settings = await prisma.restaurantSetting.findFirst() || {
      taxRate: 10.0,
      serviceChargeRate: 5.0,
    };

    // Calculate totals based on current menu item prices in database
    let subtotal = 0;
    let totalDiscount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: parseInt(item.menuItemId) },
      });

      if (!menuItem) {
        return res.status(400).json({ message: `Menu item #${item.menuItemId} not found.` });
      }

      const qty = parseInt(item.quantity) || 1;
      const effectivePrice = menuItem.price - (menuItem.discount || 0);
      const itemSubtotal = effectivePrice * qty;

      subtotal += menuItem.price * qty;
      totalDiscount += (menuItem.discount || 0) * qty;

      orderItemsToCreate.push({
        menuItemId: menuItem.id,
        quantity: qty,
        unitPrice: menuItem.price,
        subtotal: itemSubtotal,
        specialInstruction: item.specialInstruction || null,
      });
    }

    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    const tax = Math.round((discountedSubtotal * (settings.taxRate / 100)) * 100) / 100;
    const serviceCharge = orderType === 'DINE_IN' 
      ? Math.round((discountedSubtotal * (settings.serviceChargeRate / 100)) * 100) / 100 
      : 0;
    const total = Math.round((discountedSubtotal + tax + serviceCharge) * 100) / 100;

    const orderNumber = await generateOrderNumber();
    const waiterId = req.user ? req.user.id : null;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        tableId: tableId ? parseInt(tableId) : null,
        waiterId,
        customerName: customerName || (req.user ? req.user.name : 'Guest Customer'),
        customerPhone: customerPhone || null,
        orderType,
        status: 'PENDING',
        subtotal,
        discount: totalDiscount,
        tax,
        serviceCharge,
        total,
        specialInstruction: specialInstruction || null,
        orderItems: {
          create: orderItemsToCreate,
        },
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
        waiter: { select: { id: true, name: true } },
      },
    });

    // If table assigned, mark table as OCCUPIED
    if (tableId) {
      await prisma.restaurantTable.update({
        where: { id: parseInt(tableId) },
        data: { status: 'OCCUPIED' },
      });
    }

    // Broadcast via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', newOrder);
      if (tableId) {
        io.emit('table_status_changed', { id: parseInt(tableId), status: 'OCCUPIED' });
      }
    }

    return res.status(201).json(newOrder);
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ message: 'Failed to create order.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status value.' });
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
        waiter: { select: { id: true, name: true } },
      },
    });

    // If completed or cancelled and has table, maybe mark table for cleaning or available
    if (['COMPLETED', 'CANCELLED'].includes(status) && updated.tableId) {
      await prisma.restaurantTable.update({
        where: { id: updated.tableId },
        data: { status: 'CLEANING' },
      });
      const io = req.app.get('io');
      if (io) {
        io.emit('table_status_changed', { id: updated.tableId, status: 'CLEANING' });
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ message: 'Failed to update order status.' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
};
