const prisma = require('../prisma');

const getSettings = async (req, res) => {
  try {
    let settings = await prisma.restaurantSetting.findFirst();
    if (!settings) {
      settings = await prisma.restaurantSetting.create({
        data: {
          id: 1,
          restaurantName: 'Restoza',
          tagline: 'Fine Dining • Culinary Excellence',
          taxRate: 10.0,
          serviceChargeRate: 5.0,
          currencySymbol: '৳',
          address: 'Plot 42, Road 11, Banani / Gulshan 2, Dhaka',
          phone: '+880 1711-234567',
          email: 'reservations@restoza.com',
        },
      });
    }
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch restaurant settings.' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { restaurantName, tagline, taxRate, serviceChargeRate, currencySymbol, address, phone, email } = req.body;

    const data = {};
    if (restaurantName) data.restaurantName = restaurantName;
    if (tagline) data.tagline = tagline;
    if (taxRate !== undefined) data.taxRate = parseFloat(taxRate);
    if (serviceChargeRate !== undefined) data.serviceChargeRate = parseFloat(serviceChargeRate);
    if (currencySymbol) data.currencySymbol = currencySymbol;
    if (address) data.address = address;
    if (phone) data.phone = phone;
    if (email) data.email = email;

    const updated = await prisma.restaurantSetting.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data,
      },
    });

    return res.json({
      message: 'Restaurant settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ message: 'Failed to update restaurant settings.' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
