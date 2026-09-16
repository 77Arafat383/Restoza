const prisma = require('../prisma');

// Get all ingredient shopping requests
const getIngredientRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.ingredientRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(requests);
  } catch (error) {
    console.error('getIngredientRequests error:', error);
    return res.status(500).json({ message: 'Failed to fetch ingredient requests.' });
  }
};

// Create a new ingredient shopping request (Kitchen Chef)
const createIngredientRequest = async (req, res) => {
  try {
    const { items, ingredient, quantity, notes } = req.body;

    let parsedItems = [];
    if (Array.isArray(items) && items.length > 0) {
      parsedItems = items.filter((it) => it.name && it.name.trim());
    } else if (ingredient && quantity) {
      parsedItems = [{ name: ingredient.trim(), quantity: quantity.trim() }];
    }

    if (parsedItems.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient with quantity is required.' });
    }

    const requestedBy = req.user ? `${req.user.name}` : 'Executive Chef';

    // Summary strings for quick table view
    const summaryIngredient = parsedItems.map((i) => i.name).join(', ');
    const summaryQuantity = `${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''}`;

    const newRequest = await prisma.ingredientRequest.create({
      data: {
        items: parsedItems,
        ingredient: summaryIngredient,
        quantity: summaryQuantity,
        notes: notes ? notes.trim() : null,
        requestedBy,
        status: 'PENDING',
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('ingredient_request_created', newRequest);
    }

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error('createIngredientRequest error:', error);
    return res.status(500).json({
      message: error?.message || 'Failed to create ingredient request.',
      details: error.toString(),
    });
  }
};

// Update request status (Manager)
const updateIngredientRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const updated = await prisma.ingredientRequest.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('ingredient_request_updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('updateIngredientRequestStatus error:', error);
    return res.status(500).json({ message: 'Failed to update ingredient request status.' });
  }
};

// Delete ingredient request
const deleteIngredientRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ingredientRequest.delete({
      where: { id: parseInt(id) },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('ingredient_request_deleted', id);
    }

    return res.json({ message: 'Ingredient request deleted successfully.' });
  } catch (error) {
    console.error('deleteIngredientRequest error:', error);
    return res.status(500).json({ message: 'Failed to delete ingredient request.' });
  }
};

module.exports = {
  getIngredientRequests,
  createIngredientRequest,
  updateIngredientRequestStatus,
  deleteIngredientRequest,
};
