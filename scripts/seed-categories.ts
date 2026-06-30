/**
 * Seed platform-wide product categories under the Super Admin tenant.
 * Run locally: npx tsx scripts/seed-categories.ts
 * For VPS: use the SQL equivalent below (scripts/seed-categories.sql)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Food & Beverages',               description: 'Fresh produce, packaged foods, snacks, drinks, cooking ingredients and condiments',         displayOrder: 1  },
  { name: 'Fashion & Clothing',             description: 'Men, women and children clothing, traditional wear, footwear and fashion accessories',       displayOrder: 2  },
  { name: 'Health & Wellness',              description: 'Vitamins, supplements, herbal products, fitness and general wellbeing items',                displayOrder: 3  },
  { name: 'Beauty & Personal Care',         description: 'Skincare, haircare, cosmetics, perfumes and grooming products',                             displayOrder: 4  },
  { name: 'Phones & Tablets',              description: 'Smartphones, tablets, accessories, screen protectors and mobile gadgets',                   displayOrder: 5  },
  { name: 'Electronics & Gadgets',         description: 'Consumer electronics, audio, TVs, cameras, smart devices and accessories',                  displayOrder: 6  },
  { name: 'Computers & Accessories',       description: 'Laptops, desktops, printers, keyboards, mice and computer peripherals',                    displayOrder: 7  },
  { name: 'Home & Living',                  description: 'Furniture, home décor, kitchenware, bedding, curtains and household items',                 displayOrder: 8  },
  { name: 'Cleaning & Household Supplies', description: 'Detergents, disinfectants, cleaning tools, mops, bins and laundry products',               displayOrder: 9  },
  { name: 'Agriculture & Farm Produce',    description: 'Seeds, fertilisers, farming tools, livestock feeds and fresh farm produce',                 displayOrder: 10 },
  { name: 'Baby & Kids',                   description: 'Baby food, diapers, toys, clothing, feeding accessories and children\'s items',             displayOrder: 11 },
  { name: 'Sports & Fitness',              description: 'Sportswear, gym equipment, outdoor gear, bicycles and fitness accessories',                 displayOrder: 12 },
  { name: 'Automotive & Vehicle Parts',    description: 'Car accessories, spare parts, lubricants, tyres and vehicle maintenance products',          displayOrder: 13 },
  { name: 'Building & Construction',       description: 'Cement, tiles, roofing, paints, plumbing supplies and construction materials',              displayOrder: 14 },
  { name: 'Jewelry & Accessories',         description: 'Necklaces, rings, earrings, bangles, watches and fashion jewelry',                          displayOrder: 15 },
  { name: 'Books & Stationery',            description: 'Textbooks, novels, office stationery, school supplies and educational materials',           displayOrder: 16 },
  { name: 'Arts & Crafts',                 description: 'Handmade items, craft supplies, paintings, sculptures and creative materials',              displayOrder: 17 },
  { name: 'Traditional & Cultural Items',  description: 'African fabrics, Ankara, cultural artifacts, traditional attire and heritage items',        displayOrder: 18 },
  { name: 'Industrial & Business Supplies',description: 'Office equipment, industrial tools, packaging materials and B2B supplies',                  displayOrder: 19 },
  { name: 'Gifts & Novelties',             description: 'Gift sets, novelty items, seasonal gifts, hampers and celebration items',                   displayOrder: 20 },
];

async function main() {
  // Find the Super Admin tenant
  const superAdminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { tenantId: true },
  });

  if (!superAdminUser?.tenantId) {
    console.error('❌  No SUPER_ADMIN user found. Create a Super Admin account first.');
    process.exit(1);
  }

  const tenantId = superAdminUser.tenantId;
  console.log(`✅  Super Admin tenant: ${tenantId}`);

  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const existing = await prisma.productCategory.findFirst({
      where: { tenantId, name: cat.name },
    });

    if (existing) {
      console.log(`   ⟳  Skipped (exists): ${cat.name}`);
      skipped++;
    } else {
      await prisma.productCategory.create({
        data: {
          tenantId,
          name: cat.name,
          description: cat.description,
          displayOrder: cat.displayOrder,
          isActive: true,
        },
      });
      console.log(`   ✓  Created: ${cat.name}`);
      created++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
