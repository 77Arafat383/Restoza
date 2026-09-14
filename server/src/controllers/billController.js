const prisma = require('../prisma');

const generateBillNumber = async () => {
  const count = await prisma.bill.count();
  return `INV-2026-${(1000 + count + 1).toString()}`;
};

const getBills = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { id: true, name: true } },
            orderItems: { include: { menuItem: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(bills);
  } catch (error) {
    console.error('getBills error:', error);
    return res.status(500).json({ message: 'Failed to fetch bills.' });
  }
};

const generateBill = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        table: true,
        orderItems: { include: { menuItem: true } },
        bills: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // If bill already exists for this order, return existing bill
    if (order.bills && order.bills.length > 0) {
      const existingBill = await prisma.bill.findUnique({
        where: { id: order.bills[0].id },
        include: { order: { include: { table: true, orderItems: { include: { menuItem: true } } } }, payments: true },
      });
      return res.json(existingBill);
    }

    const settings = await prisma.restaurantSetting.findFirst() || {
      taxRate: 10.0,
      serviceChargeRate: 5.0,
    };

    const subtotal = order.subtotal;
    const discount = order.discount;
    const discounted = Math.max(0, subtotal - discount);
    const tax = Math.round((discounted * (settings.taxRate / 100)) * 100) / 100;
    const serviceCharge = order.orderType === 'DINE_IN' 
      ? Math.round((discounted * (settings.serviceChargeRate / 100)) * 100) / 100 
      : 0;
    const total = Math.round((discounted + tax + serviceCharge) * 100) / 100;

    const billNumber = await generateBillNumber();

    const newBill = await prisma.bill.create({
      data: {
        orderId: order.id,
        billNumber,
        subtotal,
        discount,
        tax,
        serviceCharge,
        total,
        status: 'UNPAID',
      },
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { id: true, name: true } },
            orderItems: { include: { menuItem: true } },
          },
        },
        payments: true,
      },
    });

    // Notify cashier
    const io = req.app.get('io');
    if (io) {
      io.emit('bill_generated', newBill);
    }

    return res.status(201).json(newBill);
  } catch (error) {
    console.error('generateBill error:', error);
    return res.status(500).json({ message: 'Failed to generate bill.' });
  }
};

const processPayment = async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod = 'CASH', amount, transactionId } = req.body;

    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(billId) },
      include: { order: true },
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    const paymentAmount = amount !== undefined ? parseFloat(amount) : bill.total;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        billId: bill.id,
        amount: paymentAmount,
        paymentMethod,
        paymentStatus: 'PAID',
        transactionId: transactionId || `TXN-${Date.now().toString().slice(-6)}`,
        paidAt: new Date(),
      },
    });

    // Update bill status to PAID
    const updatedBill = await prisma.bill.update({
      where: { id: bill.id },
      data: { status: 'PAID' },
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { id: true, name: true } },
            orderItems: { include: { menuItem: true } },
          },
        },
        payments: true,
      },
    });

    // Update corresponding order status to COMPLETED
    await prisma.order.update({
      where: { id: bill.orderId },
      data: { status: 'COMPLETED' },
    });

    // Release table or mark as CLEANING
    if (bill.order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: bill.order.tableId },
        data: { status: 'CLEANING' },
      });
      const io = req.app.get('io');
      if (io) {
        io.emit('table_status_changed', { id: bill.order.tableId, status: 'CLEANING' });
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('payment_completed', { bill: updatedBill, payment });
    }

    return res.json({
      message: 'Payment processed successfully',
      bill: updatedBill,
      payment,
    });
  } catch (error) {
    console.error('processPayment error:', error);
    return res.status(500).json({ message: 'Failed to process payment.' });
  }
};

const getThermalReceipt = async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(billId) },
      include: {
        order: {
          include: {
            table: true,
            waiter: { select: { id: true, name: true } },
            orderItems: { include: { menuItem: true } },
          },
        },
        payments: true,
      },
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    const settings = await prisma.restaurantSetting.findFirst() || {
      restaurantName: 'Restoza',
      tagline: 'Fine Dining • Culinary Excellence',
      taxRate: 10.0,
      serviceChargeRate: 5.0,
      currencySymbol: '৳',
      address: 'Plot 42, Road 11, Banani / Gulshan 2, Dhaka',
      phone: '+880 1711-234567',
      email: 'reservations@restoza.com',
    };

    const receipt = {
      restaurant: settings,
      billNumber: bill.billNumber,
      orderNumber: bill.order.orderNumber,
      tableNumber: bill.order.table ? bill.order.table.tableNumber : 'Takeaway / Bar',
      waiter: bill.order.waiter ? bill.order.waiter.name : 'Counter Staff',
      customer: bill.order.customerName,
      date: bill.createdAt,
      items: bill.order.orderItems.map((oi) => ({
        name: oi.menuItem.name,
        quantity: oi.quantity,
        unitPrice: oi.unitPrice,
        subtotal: oi.subtotal,
        instruction: oi.specialInstruction,
      })),
      subtotal: bill.subtotal,
      discount: bill.discount,
      tax: bill.tax,
      taxRate: settings.taxRate,
      serviceCharge: bill.serviceCharge,
      serviceChargeRate: settings.serviceChargeRate,
      total: bill.total,
      currency: settings.currencySymbol,
      status: bill.status,
      payments: bill.payments,
    };

    return res.json(receipt);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate receipt data.' });
  }
};

module.exports = {
  getBills,
  generateBill,
  processPayment,
  getThermalReceipt,
};
