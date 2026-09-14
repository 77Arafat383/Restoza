const prisma = require('../prisma');

// Categories
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch menu categories.' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const category = await prisma.menuCategory.create({
      data: { name, description, icon },
    });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create category.' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const category = await prisma.menuCategory.update({
      where: { id: parseInt(id) },
      data: { name, description, icon },
    });
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update category.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuCategory.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
};

// Menu Items
const getMenuItems = async (req, res) => {
  try {
    const { categoryId, search, availableOnly } = req.query;

    const where = {};
    if (categoryId && categoryId !== 'all') {
      where.categoryId = parseInt(categoryId);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ingredients: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (availableOnly === 'true') {
      where.isAvailable = true;
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return res.json(items);
  } catch (error) {
    console.error('getMenuItems error:', error);
    return res.status(500).json({ message: 'Failed to fetch menu items.' });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
    });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch item.' });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { categoryId, name, description, price, discount, imageUrl, preparationTime, ingredients, isAvailable } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ message: 'Category, name, and price are required.' });
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId: parseInt(categoryId),
        name,
        description,
        price: parseFloat(price),
        discount: discount ? parseFloat(discount) : 0,
        imageUrl,
        preparationTime: preparationTime ? parseInt(preparationTime) : 15,
        ingredients,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
      include: { category: true },
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('createMenuItem error:', error);
    return res.status(500).json({ message: 'Failed to create menu item.' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, discount, imageUrl, preparationTime, ingredients, isAvailable } = req.body;

    const data = {};
    if (categoryId) data.categoryId = parseInt(categoryId);
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (discount !== undefined) data.discount = parseFloat(discount);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (preparationTime !== undefined) data.preparationTime = parseInt(preparationTime);
    if (ingredients !== undefined) data.ingredients = ingredients;
    if (isAvailable !== undefined) data.isAvailable = Boolean(isAvailable);

    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data,
      include: { category: true },
    });

    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update menu item.' });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await prisma.menuItem.findUnique({ where: { id: parseInt(id) } });
    if (!current) return res.status(404).json({ message: 'Item not found.' });

    const updated = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: { isAvailable: !current.isAvailable },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to toggle availability.' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id: parseInt(id) } });
    return res.json({ message: 'Menu item deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete menu item.' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
};
