import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Starter' },
    update: {
      priceNgnMonthly: 15000,
      priceNgnYearly: 150000,
      priceUsdMonthly: 15,
      priceUsdYearly: 150,
      maxProducts: 30,
      features: {
        ai_conversations: '1,000 AI conversations/month',
        products: 'Up to 30 products',
        chat_widget: 'Chat widget included',
        users: '1 user',
        storage: '1,024 MB storage',
        support: 'Email support',
      },
    },
    create: {
      name: 'Starter',
      description: 'Perfect for solo entrepreneurs and small shops',
      priceNgnMonthly: 15000,
      priceNgnYearly: 150000,
      priceUsdMonthly: 15,
      priceUsdYearly: 150,
      features: {
        ai_conversations: '1,000 AI conversations/month',
        products: 'Up to 30 products',
        chat_widget: 'Chat widget included',
        users: '1 user',
        storage: '1,024 MB storage',
        support: 'Email support',
      },
      maxAiConversations: 1000,
      maxProducts: 30,
      maxWhatsappAccounts: 1,
      maxUsers: 1,
      maxStorageMb: 1024,
      maxBroadcastsMonthly: 0,
      apiAccess: false,
      customAiTraining: false,
      prioritySupport: false,
      displayOrder: 1,
    },
  });

  const businessPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Business' },
    update: {
      priceNgnMonthly: 20000,
      priceNgnYearly: 200000,
      priceUsdMonthly: 20,
      priceUsdYearly: 200,
      maxProducts: 50,
      features: {
        ai_conversations: '5,000 AI conversations/month',
        products: 'Up to 50 products',
        chat_widget: 'Chat widget included',
        users: '5 users',
        storage: '5,120 MB storage',
        broadcasts: '500 broadcasts/month',
        payment_integrations: 'Payment integrations',
        crm: 'CRM features',
        support: 'Priority support',
      },
    },
    create: {
      name: 'Business',
      description: 'Best for growing SMEs and retail businesses',
      priceNgnMonthly: 20000,
      priceNgnYearly: 200000,
      priceUsdMonthly: 20,
      priceUsdYearly: 200,
      features: {
        ai_conversations: '5,000 AI conversations/month',
        products: 'Up to 50 products',
        chat_widget: 'Chat widget included',
        users: '5 users',
        storage: '5,120 MB storage',
        broadcasts: '500 broadcasts/month',
        payment_integrations: 'Payment integrations',
        crm: 'CRM features',
        support: 'Priority support',
      },
      maxAiConversations: 5000,
      maxProducts: 50,
      maxWhatsappAccounts: 1,
      maxUsers: 5,
      maxStorageMb: 5120,
      maxBroadcastsMonthly: 500,
      apiAccess: false,
      customAiTraining: false,
      prioritySupport: true,
      displayOrder: 2,
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Premium' },
    update: {
      priceNgnMonthly: 30000,
      priceNgnYearly: 300000,
      priceUsdMonthly: 30,
      priceUsdYearly: 300,
      maxProducts: 200,
      features: {
        ai_conversations: '20,000 AI conversations/month',
        products: 'Up to 200 products',
        chat_widget: 'Chat widget included',
        users: 'Unlimited users',
        storage: '20,480 MB storage',
        broadcasts: 'Unlimited broadcasts',
        api_access: 'API access',
        custom_ai: 'Custom AI training',
        analytics: 'Advanced analytics',
        support: 'Priority support',
      },
    },
    create: {
      name: 'Premium',
      description: 'For established businesses with advanced needs',
      priceNgnMonthly: 30000,
      priceNgnYearly: 300000,
      priceUsdMonthly: 30,
      priceUsdYearly: 300,
      features: {
        ai_conversations: '20,000 AI conversations/month',
        products: 'Up to 200 products',
        chat_widget: 'Chat widget included',
        users: 'Unlimited users',
        storage: '20,480 MB storage',
        broadcasts: 'Unlimited broadcasts',
        api_access: 'API access',
        custom_ai: 'Custom AI training',
        analytics: 'Advanced analytics',
        support: 'Priority support',
      },
      maxAiConversations: 20000,
      maxProducts: 200,
      maxWhatsappAccounts: 3,
      maxUsers: -1,
      maxStorageMb: 20480,
      maxBroadcastsMonthly: -1,
      apiAccess: true,
      customAiTraining: true,
      prioritySupport: true,
      displayOrder: 3,
    },
  });

  console.log('Subscription plans created:', starterPlan.name, businessPlan.name, premiumPlan.name);

  // 2. Demo Tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Business',
      subdomain: 'demo',
      industry: 'Retail',
      timezone: 'Africa/Lagos',
      defaultCurrency: 'NGN',
      phone: '+2348012345678',
      email: 'demo@tekhuna.ai',
      address: 'Lagos, Nigeria',
      settings: {
        businessHours: { open: '08:00', close: '18:00' },
        welcomeMessage: 'Welcome to Demo Business!',
      },
      isActive: true,
      onboardingComplete: true,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Demo tenant created:', demoTenant.name);

  // 3. Admin User for demo tenant
  const passwordHash = await bcrypt.hash('johndoe123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email_tenantId: { email: 'john@doe.com', tenantId: demoTenant.id } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'john@doe.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TENANT_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Admin user created:', adminUser.email);

  // 3a-2. Platform Super Admin
  const superAdminHash = await bcrypt.hash('SuperAdmin@2026!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@tekhuna.com', tenantId: demoTenant.id } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@tekhuna.com',
      passwordHash: superAdminHash,
      firstName: 'Platform',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('Super admin created:', superAdmin.email);

  // 3b. Demo User (demo@tekhuna.ng)
  const demoPasswordHash = await bcrypt.hash('Demo@2026!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email_tenantId: { email: 'demo@tekhuna.ng', tenantId: demoTenant.id } },
    update: { passwordHash: demoPasswordHash },
    create: {
      tenantId: demoTenant.id,
      email: 'demo@tekhuna.ng',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'Admin',
      role: UserRole.TENANT_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Demo user created:', demoUser.email);

  // 4. Subscription for demo tenant
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: businessPlan.id,
      status: 'active',
      billingCycle: 'monthly',
      priceAmount: 15000,
      currency: 'NGN',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  // 5. Sample Categories
  const electronicsCategory = await prisma.productCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: demoTenant.id,
      name: 'Electronics',
      description: 'Electronic gadgets and accessories',
      icon: 'Laptop',
      displayOrder: 1,
    },
  });

  const clothingCategory = await prisma.productCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      tenantId: demoTenant.id,
      name: 'Clothing',
      description: 'Fashion and apparel',
      icon: 'Shirt',
      displayOrder: 2,
    },
  });

  const foodCategory = await prisma.productCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      tenantId: demoTenant.id,
      name: 'Food & Beverages',
      description: 'Food items and drinks',
      icon: 'UtensilsCrossed',
      displayOrder: 3,
    },
  });

  console.log('Categories created');

  // 6. Sample Products
  const products = [
    { name: 'iPhone 15 Pro', description: 'Latest Apple iPhone with A17 Pro chip', sku: 'ELEC-001', price: 850000, costPrice: 750000, currency: 'NGN', stockQuantity: 25, categoryId: electronicsCategory.id, isFeatured: true },
    { name: 'Samsung Galaxy S24', description: 'Samsung flagship with AI features', sku: 'ELEC-002', price: 650000, costPrice: 550000, currency: 'NGN', stockQuantity: 30, categoryId: electronicsCategory.id, isFeatured: true },
    { name: 'AirPods Pro 2', description: 'Apple wireless earbuds with noise cancellation', sku: 'ELEC-003', price: 180000, costPrice: 150000, currency: 'NGN', stockQuantity: 50, categoryId: electronicsCategory.id },
    { name: 'MacBook Air M3', description: 'Thin and light laptop with M3 chip', sku: 'ELEC-004', price: 1200000, costPrice: 1050000, currency: 'NGN', stockQuantity: 8, categoryId: electronicsCategory.id, isFeatured: true },
    { name: 'Ankara Dress', description: 'Beautiful African print dress', sku: 'CLO-001', price: 15000, costPrice: 8000, currency: 'NGN', stockQuantity: 100, categoryId: clothingCategory.id },
    { name: 'Agbada Set', description: 'Traditional Nigerian formal wear', sku: 'CLO-002', price: 45000, costPrice: 25000, currency: 'NGN', stockQuantity: 20, categoryId: clothingCategory.id, isFeatured: true },
    { name: 'Polo T-Shirt', description: 'Classic cotton polo shirt', sku: 'CLO-003', price: 8000, costPrice: 4000, currency: 'NGN', stockQuantity: 200, categoryId: clothingCategory.id },
    { name: 'Jollof Rice Pack', description: 'Ready-to-cook jollof rice pack (5kg)', sku: 'FOD-001', price: 5000, costPrice: 3000, currency: 'NGN', stockQuantity: 150, categoryId: foodCategory.id },
    { name: 'Suya Spice Mix', description: 'Authentic Nigerian suya pepper blend', sku: 'FOD-002', price: 2500, costPrice: 1200, currency: 'NGN', stockQuantity: 5, categoryId: foodCategory.id, lowStockThreshold: 10 },
    { name: 'Palm Oil (5L)', description: 'Premium quality red palm oil', sku: 'FOD-003', price: 8000, costPrice: 5500, currency: 'NGN', stockQuantity: 3, categoryId: foodCategory.id, lowStockThreshold: 10 },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: demoTenant.id, sku: p.sku },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          tenantId: demoTenant.id,
          categoryId: p.categoryId,
          name: p.name,
          description: p.description,
          sku: p.sku,
          price: p.price,
          costPrice: p.costPrice,
          currency: p.currency,
          stockQuantity: p.stockQuantity,
          lowStockThreshold: p.lowStockThreshold ?? 10,
          isFeatured: p.isFeatured ?? false,
        },
      });
    }
  }
  console.log('Products created');

  // 7. Sample Customers
  const customers = [
    { phone: '+2348011111111', name: 'Adebayo Johnson', email: 'adebayo@gmail.com', segment: 'VIP', totalOrders: 12, lifetimeValue: 2500000 },
    { phone: '+2348022222222', name: 'Ngozi Okafor', email: 'ngozi@gmail.com', segment: 'Regular', totalOrders: 5, lifetimeValue: 450000 },
    { phone: '+2348033333333', name: 'Chidi Eze', email: 'chidi@gmail.com', segment: 'New', totalOrders: 1, lifetimeValue: 85000 },
    { phone: '+2348044444444', name: 'Fatima Bello', email: 'fatima@gmail.com', segment: 'VIP', totalOrders: 8, lifetimeValue: 1800000 },
    { phone: '+2348055555555', name: 'Emeka Nwosu', email: 'emeka@gmail.com', segment: 'Regular', totalOrders: 3, lifetimeValue: 250000 },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { tenantId_phone: { tenantId: demoTenant.id, phone: c.phone } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        phone: c.phone,
        name: c.name,
        email: c.email,
        segment: c.segment,
        totalOrders: c.totalOrders,
        lifetimeValue: c.lifetimeValue,
        acquisitionSource: 'webchat',
        lastInteractionAt: new Date(),
      },
    });
  }
  console.log('Customers created');

  // 8. AI Config for demo tenant
  await prisma.aIConfig.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      assistantName: 'Demo AI Assistant',
      assistantPersonality: 'Friendly, helpful, and knowledgeable about products. Speaks Nigerian English and understands Pidgin.',
      responseTone: 'friendly',
      enableNigerianContext: true,
      autoReplyEnabled: true,
      greetingMessage: 'Hello! Welcome to Demo Business. How can I help you today?',
      awayMessage: 'We are currently closed. Our business hours are 8am - 6pm WAT. We will respond when we are back!',
      fallbackMessage: 'I am not sure I understand. Let me connect you with a human agent.',
    },
  });

  console.log('AI Config created');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });