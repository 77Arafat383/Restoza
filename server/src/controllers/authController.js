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
    const { name, email, password, phone, role, isApprovedDirectly } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role && ['MANAGER', 'WAITER', 'KITCHEN', 'CASHIER'].includes(role.toUpperCase()) 
      ? role.toUpperCase() 
      : 'WAITER';

    // If registered directly by an admin/manager via dashboard, set ACTIVE directly; otherwise set PENDING_APPROVAL
    const initialStatus = isApprovedDirectly ? 'ACTIVE' : 'PENDING_APPROVAL';

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        phone,
        role: assignedRole,
        status: initialStatus,
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

    if (initialStatus === 'PENDING_APPROVAL') {
      return res.status(201).json({
        message: 'Registration submitted successfully! Your account is currently pending approval by a Manager.',
        pending: true,
        user: newUser,
      });
    }

    const token = generateToken(newUser);
    return res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Register error details:', error);
    return res.status(500).json({ message: error.message || 'Internal server error during registration.' });
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
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({ message: 'Your account registration is pending approval by a Manager.' });
    }

    if (user.status === 'FIRED') {
      return res.status(403).json({ message: 'Your account has been terminated/FIRED. Access denied.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact manager.' });
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
      salary: user.salary,
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
        salary: user.salary,
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
        salary: true,
        createdAt: true,
        staffPayments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentType: true,
            note: true,
            paidAt: true,
          },
          orderBy: { paidAt: 'desc' },
          take: 5,
        },
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
    const { name, phone, role, status, salary, password } = req.body;

    const data = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (role) data.role = role;
    if (status) data.status = status;
    if (salary !== undefined) data.salary = parseFloat(salary) || 0;
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
        salary: true,
        createdAt: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating staff member.' });
  }
};

// Record working payment / salary payout for a staff member
const payStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'CASH', paymentType = 'SALARY', note } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required.' });
    }

    const staff = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    const payment = await prisma.staffPayment.create({
      data: {
        staffId: staff.id,
        amount: parseFloat(amount),
        paymentMethod,
        paymentType,
        note: note || null,
      },
    });

    return res.status(201).json({
      message: `Payment of ৳${amount} successfully recorded for ${staff.name}`,
      payment,
    });
  } catch (error) {
    console.error('payStaff error:', error);
    return res.status(500).json({ message: 'Failed to record staff payment.' });
  }
};

// Retrieve staff payment records
const getStaffPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const where = id ? { staffId: parseInt(id) } : {};
    const payments = await prisma.staffPayment.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { paidAt: 'desc' },
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve staff payment history.' });
  }
};

// Forgot Password - Generate & Save 6-digit Code
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpires,
      },
    });

    console.log(`[AUTH] Password Reset 6-Digit Code for ${user.email}: ${resetCode}`);

    return res.json({
      message: `A 6-digit verification code has been sent to ${user.email}`,
      email: user.email,
      resetCode, // Included for frictionless testing
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to process forgot password request.' });
  }
};

// Reset Password with 6-digit Code
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, 6-digit code, and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ message: 'Invalid or expired password reset request.' });
    }

    if (user.resetCode !== code.trim()) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code.' });
    }

    if (new Date() > new Date(user.resetCodeExpires)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
};

// Change Password for Authenticated User
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Failed to change password.' });
  }
};

module.exports = {
  register,
  login,
  quickDemoLogin,
  getMe,
  getStaffList,
  updateStaff,
  payStaff,
  getStaffPayments,
  forgotPassword,
  resetPassword,
  changePassword,
};
