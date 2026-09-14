const prisma = require('../prisma');

const getTables = async (req, res) => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
          },
          include: {
            orderItems: {
              include: { menuItem: true },
            },
            waiter: {
              select: { id: true, name: true },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });
    return res.json(tables);
  } catch (error) {
    console.error('getTables error:', error);
    return res.status(500).json({ message: 'Failed to fetch tables.' });
  }
};

const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location, status } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number is required.' });
    }

    const existing = await prisma.restaurantTable.findUnique({ where: { tableNumber } });
    if (existing) {
      return res.status(400).json({ message: 'A table with this number already exists.' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber,
        capacity: capacity ? parseInt(capacity) : 4,
        location: location || 'Main Dining',
        status: status || 'AVAILABLE',
      },
    });

    return res.status(201).json(table);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create table.' });
  }
};

const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, location, status } = req.body;

    const data = {};
    if (tableNumber) data.tableNumber = tableNumber;
    if (capacity) data.capacity = parseInt(capacity);
    if (location) data.location = location;
    if (status) data.status = status;

    const table = await prisma.restaurantTable.update({
      where: { id: parseInt(id) },
      data,
    });

    return res.json(table);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update table.' });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'].includes(status)) {
      return res.status(400).json({ message: 'Invalid table status.' });
    }

    const table = await prisma.restaurantTable.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    // Broadcast table status update to connected clients via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('table_status_changed', table);
    }

    return res.json(table);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update status.' });
  }
};

const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.restaurantTable.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Table removed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete table.' });
  }
};

module.exports = {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
};
