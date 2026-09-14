const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Restoza database...');

  // 1. Initial Restaurant Settings
  await prisma.restaurantSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
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

  // 2. Staff & Admin Accounts
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordManager = await bcrypt.hash('manager123', 10);
  const hashedPasswordWaiter = await bcrypt.hash('waiter123', 10);
  const hashedPasswordChef = await bcrypt.hash('chef123', 10);
  const hashedPasswordCashier = await bcrypt.hash('cashier123', 10);

  const users = [
    {
      name: 'Super Admin',
      email: 'admin@restoza.com',
      phone: '+880 1812-000001',
      passwordHash: hashedPasswordAdmin,
      role: 'SUPER_ADMIN',
    },
    {
      name: 'Restaurant Manager',
      email: 'manager@restoza.com',
      phone: '+880 1812-000002',
      passwordHash: hashedPasswordManager,
      role: 'MANAGER',
    },
    {
      name: 'Arafat (Lead Waiter)',
      email: 'waiter@restoza.com',
      phone: '+880 1812-000003',
      passwordHash: hashedPasswordWaiter,
      role: 'WAITER',
    },
    {
      name: 'Sarah (Floor Waiter)',
      email: 'waiter2@restoza.com',
      phone: '+880 1812-000004',
      passwordHash: hashedPasswordWaiter,
      role: 'WAITER',
    },
    {
      name: 'Executive Chef Marco',
      email: 'chef@restoza.com',
      phone: '+880 1812-000005',
      passwordHash: hashedPasswordChef,
      role: 'KITCHEN',
    },
    {
      name: 'Rina (Head Cashier)',
      email: 'cashier@restoza.com',
      phone: '+880 1812-000006',
      passwordHash: hashedPasswordCashier,
      role: 'CASHIER',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash: u.passwordHash,
      },
      create: u,
    });
  }

  // 3. Menu Categories
  const categoriesData = [
    {
      name: 'Appetizers',
      description: 'Crispy starters and artisanal bites to whet your appetite',
      icon: 'Utensils',
    },
    {
      name: 'Burgers',
      description: 'Gourmet smashed beef and succulent grilled chicken burgers',
      icon: 'Sandwich',
    },
    {
      name: 'Pizza',
      description: 'Wood-fired sourdough pizzas with imported mozzarella and herbs',
      icon: 'Pizza',
    },
    {
      name: 'Pasta',
      description: 'Handcrafted pasta tossed in velvety chef sauces',
      icon: 'Soup',
    },
    {
      name: 'Drinks',
      description: 'Handcrafted mocktails, signature brews, and chilled beverages',
      icon: 'Coffee',
    },
    {
      name: 'Desserts',
      description: 'Decadent sweet treats and artisan pastries',
      icon: 'Cake',
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.menuCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, icon: cat.icon },
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }

  // 4. Menu Items
  const menuItemsData = [
    // Appetizers
    {
      name: 'Truffle Parmesan Fries',
      category: 'Appetizers',
      price: 280,
      discount: 0,
      preparationTime: 10,
      description: 'Crispy golden fries tossed in aromatic white truffle oil, shaved parmesan, and fresh herbs.',
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Potato, Truffle oil, Aged parmesan, Parsley, Sea salt',
    },
    {
      name: 'Crispy Calamari Fritti',
      category: 'Appetizers',
      price: 420,
      discount: 20,
      preparationTime: 12,
      description: 'Tender squid rings lightly battered and flash-fried, served with lemon garlic aioli.',
      imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Squid, Lemon, Garlic aioli, Sea salt, Smoked paprika',
    },
    {
      name: 'Smoked BBQ Chicken Wings',
      category: 'Appetizers',
      price: 360,
      discount: 0,
      preparationTime: 15,
      description: 'Glazed crispy chicken wings infused with house hickory BBQ glaze and toasted sesame.',
      imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Chicken wings, Hickory BBQ, Honey, Sesame seeds',
    },

    // Burgers
    {
      name: 'Restoza Signature Wagyu Burger',
      category: 'Burgers',
      price: 590,
      discount: 50,
      preparationTime: 18,
      description: 'Juicy 180g Wagyu beef patty, caramelized onion relish, smoked cheddar, and secret truffle sauce on brioche.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Wagyu beef, Brioche bun, Smoked cheddar, Caramelized onions, Truffle mayo',
    },
    {
      name: 'Crispy Buttermilk Chicken Burger',
      category: 'Burgers',
      price: 350,
      discount: 0,
      preparationTime: 15,
      description: '24-hour buttermilk soaked chicken thigh, spicy chipotle slaw, crunchy pickles, melted gouda.',
      imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Buttermilk chicken, Brioche, Chipotle slaw, Pickles, Gouda',
    },
    {
      name: 'Smokey Bacon & Mushroom Melt',
      category: 'Burgers',
      price: 440,
      discount: 0,
      preparationTime: 16,
      description: 'Charbroiled beef patty smothered with sautéed portobello mushrooms and crispy beef bacon strips.',
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Beef patty, Beef bacon, Portobello mushrooms, Swiss cheese',
    },

    // Pizza
    {
      name: 'Margherita di Bufala',
      category: 'Pizza',
      price: 680,
      discount: 0,
      preparationTime: 20,
      description: 'San Marzano tomato sauce, authentic buffalo mozzarella, fresh sweet basil, and extra virgin olive oil.',
      imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
      ingredients: 'San Marzano tomatoes, Fresh mozzarella, Basil leaves, Olive oil',
    },
    {
      name: 'Spicy Beef Pepperoni & Jalapeño',
      category: 'Pizza',
      price: 790,
      discount: 40,
      preparationTime: 20,
      description: 'Generous artisanal beef pepperoni slices, fiery pickled jalapeños, hot honey drizzle.',
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Beef pepperoni, Jalapeños, Mozzarella, Hot chili honey',
    },
    {
      name: 'Quattro Formaggi Bianca',
      category: 'Pizza',
      price: 820,
      discount: 0,
      preparationTime: 22,
      description: 'Four cheese luxury with gorgonzola, aged parmesan, mozzarella, and creamy fontina.',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Gorgonzola, Parmesan, Mozzarella, Fontina, Rosemary',
    },

    // Pasta
    {
      name: 'Creamy Fettuccine Alfredo con Pollo',
      category: 'Pasta',
      price: 480,
      discount: 0,
      preparationTime: 18,
      description: 'Silky egg fettuccine tossed in aged parmesan butter sauce, roasted garlic, and char-grilled chicken slices.',
      imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Fettuccine, Heavy cream, Butter, Grilled chicken, Parmesan',
    },
    {
      name: 'Classic Spaghetti Alla Bolognese',
      category: 'Pasta',
      price: 520,
      discount: 30,
      preparationTime: 16,
      description: 'Slow-simmered minced beef ragu infused with rosemary, tomatoes, and freshly grated Grana Padano.',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3adc644d9fa?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Minced beef, Tomatoes, Carrots, Celery, Spaghetti, Grana Padano',
    },

    // Drinks
    {
      name: 'Virgin Passionfruit Mojito',
      category: 'Drinks',
      price: 220,
      discount: 0,
      preparationTime: 5,
      description: 'Muddled fresh mint, wild passionfruit pulp, lime juice, and sparkling club soda over crushed ice.',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Passionfruit, Mint, Lime, Cane sugar, Sparkling water',
    },
    {
      name: 'Iced Belgian Chocolate Mocha',
      category: 'Drinks',
      price: 260,
      discount: 0,
      preparationTime: 6,
      description: 'Double shot espresso blended with pure Belgian melted cocoa and chilled organic milk.',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Espresso, Belgian cocoa, Fresh milk, Whipped cream',
    },
    {
      name: 'Freshly Squeezed Valencia Orange',
      category: 'Drinks',
      price: 180,
      discount: 0,
      preparationTime: 5,
      description: '100% natural, freshly cold-pressed sweet orange juice without added sugar.',
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Valencia oranges, Mint sprig',
    },

    // Desserts
    {
      name: 'Classic Italian Tiramisu',
      category: 'Desserts',
      price: 340,
      discount: 0,
      preparationTime: 5,
      description: 'Savoiardi ladyfingers soaked in dark espresso, layered with whipped mascarpone and Valrhona cocoa.',
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Mascarpone, Espresso, Ladyfingers, Cocoa powder',
    },
    {
      name: 'Warm Belgian Molten Lava Cake',
      category: 'Desserts',
      price: 380,
      discount: 0,
      preparationTime: 12,
      description: 'Gooey molten dark chocolate center encased in rich sponge, served with Madagascar vanilla bean gelato.',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      ingredients: 'Dark chocolate, Butter, Eggs, Vanilla gelato',
    },
  ];

  for (const item of menuItemsData) {
    const catId = categoryMap[item.category];
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          categoryId: catId,
          price: item.price,
          discount: item.discount,
          preparationTime: item.preparationTime,
          description: item.description,
          imageUrl: item.imageUrl,
          ingredients: item.ingredients,
          isAvailable: true,
        },
      });
    }
  }

  // 5. Restaurant Tables (12 tables matching layout in PDF)
  const tablesData = [
    { tableNumber: 'T-01', capacity: 4, location: 'Main Dining', status: 'AVAILABLE' },
    { tableNumber: 'T-02', capacity: 2, location: 'Window View', status: 'OCCUPIED' },
    { tableNumber: 'T-03', capacity: 6, location: 'Main Dining', status: 'AVAILABLE' },
    { tableNumber: 'T-04', capacity: 4, location: 'Patio Terrace', status: 'RESERVED' },
    { tableNumber: 'T-05', capacity: 4, location: 'Main Dining', status: 'OCCUPIED' },
    { tableNumber: 'T-06', capacity: 2, location: 'Window View', status: 'CLEANING' },
    { tableNumber: 'T-07', capacity: 8, location: 'VIP Lounge', status: 'OCCUPIED' },
    { tableNumber: 'T-08', capacity: 4, location: 'Patio Terrace', status: 'AVAILABLE' },
    { tableNumber: 'T-09', capacity: 2, location: 'Window View', status: 'AVAILABLE' },
    { tableNumber: 'T-10', capacity: 6, location: 'Main Dining', status: 'AVAILABLE' },
    { tableNumber: 'T-11', capacity: 4, location: 'Main Dining', status: 'AVAILABLE' },
    { tableNumber: 'T-12', capacity: 10, location: 'VIP Lounge', status: 'RESERVED' },
  ];

  for (const t of tablesData) {
    await prisma.restaurantTable.upsert({
      where: { tableNumber: t.tableNumber },
      update: { capacity: t.capacity, location: t.location, status: t.status },
      create: t,
    });
  }

  // 6. Sample Live Orders for Demonstration
  const waiterUser = await prisma.user.findFirst({ where: { role: 'WAITER' } });
  const table2 = await prisma.restaurantTable.findUnique({ where: { tableNumber: 'T-02' } });
  const table5 = await prisma.restaurantTable.findUnique({ where: { tableNumber: 'T-05' } });
  const table7 = await prisma.restaurantTable.findUnique({ where: { tableNumber: 'T-07' } });

  const burger = await prisma.menuItem.findFirst({ where: { name: 'Restoza Signature Wagyu Burger' } });
  const fries = await prisma.menuItem.findFirst({ where: { name: 'Truffle Parmesan Fries' } });
  const mojito = await prisma.menuItem.findFirst({ where: { name: 'Virgin Passionfruit Mojito' } });
  const pizza = await prisma.menuItem.findFirst({ where: { name: 'Spicy Beef Pepperoni & Jalapeño' } });

  // Order #101: Preparing in kitchen
  if (table5 && burger && fries && mojito) {
    const existingOrder101 = await prisma.order.findUnique({ where: { orderNumber: 'ORD-101' } });
    if (!existingOrder101) {
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-101',
          tableId: table5.id,
          waiterId: waiterUser ? waiterUser.id : null,
          customerName: 'Tanvir Hossain',
          customerPhone: '+880 1712-345678',
          status: 'PREPARING',
          orderType: 'DINE_IN',
          subtotal: 1090,
          discount: 50,
          tax: 104,
          serviceCharge: 52,
          total: 1196,
          specialInstruction: 'Burgers medium-well, no raw onions please.',
          orderItems: {
            create: [
              { menuItemId: burger.id, quantity: 2, unitPrice: 540, subtotal: 1080, specialInstruction: 'Medium-well' },
              { menuItemId: fries.id, quantity: 1, unitPrice: 280, subtotal: 280, specialInstruction: 'Extra crispy' },
            ],
          },
        },
      });
    }
  }

  // Order #102: Ready to serve
  if (table2 && pizza && mojito) {
    const existingOrder102 = await prisma.order.findUnique({ where: { orderNumber: 'ORD-102' } });
    if (!existingOrder102) {
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-102',
          tableId: table2.id,
          waiterId: waiterUser ? waiterUser.id : null,
          customerName: 'Nadia Rahman',
          customerPhone: '+880 1719-876543',
          status: 'READY',
          orderType: 'DINE_IN',
          subtotal: 970,
          discount: 40,
          tax: 93,
          serviceCharge: 46.5,
          total: 1069.5,
          specialInstruction: 'Mojito extra cold with extra lime.',
          orderItems: {
            create: [
              { menuItemId: pizza.id, quantity: 1, unitPrice: 750, subtotal: 750 },
              { menuItemId: mojito.id, quantity: 1, unitPrice: 220, subtotal: 220 },
            ],
          },
        },
      });
    }
  }

  // Order #103: Served / Ready for Bill
  if (table7 && burger && pizza) {
    const existingOrder103 = await prisma.order.findUnique({ where: { orderNumber: 'ORD-103' } });
    if (!existingOrder103) {
      const order103 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-103',
          tableId: table7.id,
          waiterId: waiterUser ? waiterUser.id : null,
          customerName: 'Arafat & Group',
          customerPhone: '+880 1819-001122',
          status: 'SERVED',
          orderType: 'DINE_IN',
          subtotal: 1850,
          discount: 90,
          tax: 176,
          serviceCharge: 88,
          total: 2024,
          specialInstruction: 'Table requested bill soon.',
          orderItems: {
            create: [
              { menuItemId: burger.id, quantity: 2, unitPrice: 540, subtotal: 1080 },
              { menuItemId: pizza.id, quantity: 1, unitPrice: 750, subtotal: 750 },
            ],
          },
          bills: {
            create: {
              billNumber: 'INV-2026-00103',
              subtotal: 1850,
              discount: 90,
              tax: 176,
              serviceCharge: 88,
              total: 2024,
              status: 'UNPAID',
            },
          },
        },
      });
    }
  }

  // 7. Sample Customer Feedback
  const sampleFeedbacks = [
    {
      customerName: 'Zubair Ahmed',
      foodRating: 5,
      serviceRating: 5,
      overallRating: 5,
      comment: 'The Wagyu Burger and Truffle Fries were phenomenal! Exceptional ambiance and attentive service.',
    },
    {
      customerName: 'Farhana Sultana',
      foodRating: 5,
      serviceRating: 4,
      overallRating: 5,
      comment: 'Authentic Italian pizza crust. Sourdough flavor is spot on. Loved the virgin mojito as well!',
    },
    {
      customerName: 'Imtiaz Karim',
      foodRating: 4,
      serviceRating: 5,
      overallRating: 5,
      comment: 'Prompt service, easy digital ordering, and smooth billing experience. Highly recommended for family dinners.',
    },
  ];

  for (const fb of sampleFeedbacks) {
    const found = await prisma.feedback.findFirst({ where: { comment: fb.comment } });
    if (!found) {
      await prisma.feedback.create({ data: fb });
    }
  }

  console.log('Restoza database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
