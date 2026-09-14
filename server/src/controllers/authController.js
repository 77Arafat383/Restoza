const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middleware/auth');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role && ['MANAGER', 'WAITER', 'KITCHEN', 'CASHIER'].includes(role.toUpperCase()) 
      ? role.toUpperCase() 
      : 'WAITER';

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
        role: assignedRole,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const token = generateToken(newUser);
    return res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };

    return res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

// Quick Demo Login (for frictionless role testing)
const quickDemoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    let targetEmail;
    switch (role) {
      case 'SUPER_ADMIN':
        targetEmail = 'admin@restoza.com';
        break;
      case 'MANAGER':
        targetEmail = 'manager@restoza.com';
        break;
      case 'WAITER':
        targetEmail = 'waiter@restoza.com';
        break;
      case 'KITCHEN':
        targetEmail = 'chef@restoza.com';
        break;
      case 'CASHIER':
        targetEmail = 'cashier@restoza.com';
        break;
      default:
        targetEmail = 'manager@restoza.com';
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      return res.status(404).json({ message: `Demo user for role ${role} not found.` });
    }

    const token = generateToken(user);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error('Quick demo login error:', error);
    return res.status(500).json({ message: 'Error performing demo login.' });
  }
};

// Get current logged-in user
const getMe = async (req, res) => {
  return res.json({ user: req.user });
};

// Staff management
const getStaffList = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
    return res.json(staff);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving staff list.' });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status, password } = req.body;

    const data = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (role) data.role = role;
    if (status) data.status = status;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating staff member.' });
  }
};

module.exports = {
  register,
  login,
  quickDemoLogin,
  getMe,
  getStaffList,
  updateStaff,
};
