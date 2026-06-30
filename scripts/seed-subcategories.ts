/**
 * Seed sub-categories under the existing platform categories.
 * Modeled on Google My Business category hierarchy for African SMEs.
 *
 * Run locally:
 *   DATABASE_URL="postgresql://shopysh:shopysh_local@localhost:5433/shopysh?schema=public" npx tsx scripts/seed-subcategories.ts
 *
 * For VPS run scripts/seed-subcategories.sql via psql inside the db container.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Each key must match the exact parent name in the DB (from seed-categories.ts)
const SUBCATEGORIES: Record<string, { name: string; description: string; displayOrder: number }[]> = {
  'Food & Beverages': [
    { name: 'Fresh Produce',           description: 'Fruits, vegetables, tubers and raw farm produce',                               displayOrder: 1 },
    { name: 'Grains & Staples',        description: 'Rice, beans, maize, millet, oats and other dry staples',                        displayOrder: 2 },
    { name: 'Snacks & Confectionery', description: 'Biscuits, crisps, chin-chin, puff-puff and packaged snacks',                    displayOrder: 3 },
    { name: 'Beverages & Drinks',      description: 'Water, soft drinks, juices, energy drinks, teas and coffees',                   displayOrder: 4 },
    { name: 'Cooking Oils & Spices',   description: 'Palm oil, groundnut oil, seasonings, pepper mixes and condiments',              displayOrder: 5 },
    { name: 'Dairy & Eggs',            description: 'Milk, yoghurt, butter, cheese and eggs',                                       displayOrder: 6 },
    { name: 'Frozen & Ready Meals',    description: 'Frozen fish, meat, ready-to-cook meals and processed foods',                    displayOrder: 7 },
    { name: 'Bakery & Bread',          description: 'Bread, cakes, pastries, pies and baked goods',                                 displayOrder: 8 },
  ],

  'Fashion & Clothing': [
    { name: "Men's Clothing",          description: "Men's shirts, trousers, suits, casual wear and formal attire",                  displayOrder: 1 },
    { name: "Women's Clothing",        description: "Women's dresses, blouses, skirts, office wear and casual outfits",              displayOrder: 2 },
    { name: "Children's Clothing",     description: "Kids' wear for infants, toddlers, boys and girls",                             displayOrder: 3 },
    { name: 'Traditional & Ankara',    description: 'Aso-oke, Ankara prints, Agbada, Kaftan and cultural attire',                   displayOrder: 4 },
    { name: 'Footwear',                description: 'Shoes, sandals, sneakers, heels, boots and slippers',                          displayOrder: 5 },
    { name: 'Bags & Purses',           description: 'Handbags, backpacks, clutches, wallets and travel bags',                       displayOrder: 6 },
    { name: 'Belts, Hats & Caps',      description: 'Leather belts, caps, hats, head-ties and headwear',                            displayOrder: 7 },
  ],

  'Health & Wellness': [
    { name: 'Vitamins & Supplements',  description: 'Multivitamins, iron, omega-3 and nutritional supplements',                     displayOrder: 1 },
    { name: 'Herbal & Natural Remedies', description: 'Moringa, bitter leaf, garlic, aloe vera and traditional herbal products',   displayOrder: 2 },
    { name: 'Fitness Equipment',       description: 'Dumbbells, resistance bands, skipping ropes and home gym gear',                displayOrder: 3 },
    { name: 'Medical Supplies',        description: 'First-aid kits, thermometers, blood pressure monitors and OTC medications',    displayOrder: 4 },
    { name: 'Weight Management',       description: 'Meal replacement shakes, detox teas and slimming products',                    displayOrder: 5 },
    { name: 'Feminine Care',           description: 'Sanitary pads, tampons, menstrual cups and feminine hygiene products',         displayOrder: 6 },
  ],

  'Beauty & Personal Care': [
    { name: 'Skincare',                description: 'Moisturisers, serums, sunscreen, toners and face washes',                      displayOrder: 1 },
    { name: 'Haircare',                description: 'Shampoos, conditioners, hair oils, wigs, weaves and hair extensions',          displayOrder: 2 },
    { name: 'Makeup & Cosmetics',      description: 'Foundation, lipstick, mascara, eyeshadow and cosmetic brushes',                displayOrder: 3 },
    { name: 'Perfumes & Fragrances',   description: "Men's and women's perfumes, body mist, deodorants and roll-ons",              displayOrder: 4 },
    { name: 'Grooming & Shaving',      description: 'Razors, shaving cream, clippers, beard oil and men\'s grooming kits',         displayOrder: 5 },
    { name: 'Nail Care',               description: 'Nail polish, gel nails, nail art kits and nail care accessories',              displayOrder: 6 },
    { name: 'Body Care',               description: 'Body lotion, scrubs, bath soaps, shower gels and body oils',                   displayOrder: 7 },
  ],

  'Phones & Tablets': [
    { name: 'Smartphones',             description: 'Android and iOS phones for all budgets',                                       displayOrder: 1 },
    { name: 'Tablets & iPads',         description: 'Android tablets, iPads and e-readers',                                        displayOrder: 2 },
    { name: 'Phone Cases & Covers',    description: 'Protective cases, screen protectors and decorative covers',                    displayOrder: 3 },
    { name: 'Chargers & Cables',       description: 'USB chargers, charging cables, power banks and wireless chargers',             displayOrder: 4 },
    { name: 'SIM & Network Accessories', description: 'SIM card holders, signal boosters and mobile network accessories',          displayOrder: 5 },
    { name: 'Earphones & Headsets',    description: 'Wired earphones, wireless earbuds and hands-free headsets',                   displayOrder: 6 },
  ],

  'Electronics & Gadgets': [
    { name: 'TVs & Displays',          description: 'LED, OLED and smart TVs across all screen sizes',                             displayOrder: 1 },
    { name: 'Audio & Speakers',        description: 'Bluetooth speakers, soundbars, home theatre systems and headphones',           displayOrder: 2 },
    { name: 'Cameras & Photography',   description: 'Digital cameras, DSLR, action cameras and camera accessories',                displayOrder: 3 },
    { name: 'Smart Home Devices',      description: 'Smart plugs, security cameras, smart bulbs and home automation',              displayOrder: 4 },
    { name: 'Power & Energy',          description: 'Inverters, solar panels, generators, stabilisers and UPS systems',            displayOrder: 5 },
    { name: 'Gaming',                  description: 'Game consoles, controllers, games and gaming accessories',                     displayOrder: 6 },
  ],

  'Computers & Accessories': [
    { name: 'Laptops',                 description: 'Windows, macOS and Chromebook laptops for home, office and students',         displayOrder: 1 },
    { name: 'Desktop Computers',       description: 'All-in-one and tower desktop PCs',                                            displayOrder: 2 },
    { name: 'Printers & Scanners',     description: 'Inkjet, laser printers, copiers and scanners',                                displayOrder: 3 },
    { name: 'Keyboards & Mice',        description: 'Wired and wireless keyboards, mice and mouse pads',                           displayOrder: 4 },
    { name: 'Networking',              description: 'Routers, Wi-Fi extenders, switches and network cables',                        displayOrder: 5 },
    { name: 'Storage Devices',         description: 'External hard drives, SSDs, USB flash drives and memory cards',               displayOrder: 6 },
    { name: 'Computer Parts',          description: 'RAM, CPUs, GPUs, motherboards and internal computer components',              displayOrder: 7 },
  ],

  'Home & Living': [
    { name: 'Furniture',               description: 'Sofas, beds, tables, chairs and wardrobes',                                   displayOrder: 1 },
    { name: 'Bedding & Mattresses',    description: 'Mattresses, pillows, bed sheets, duvets and duvet covers',                    displayOrder: 2 },
    { name: 'Kitchenware',             description: 'Pots, pans, cutlery, kitchen utensils and cookware sets',                     displayOrder: 3 },
    { name: 'Home Décor',              description: 'Curtains, rugs, picture frames, vases, candles and wall art',                 displayOrder: 4 },
    { name: 'Storage & Organisation',  description: 'Shelving units, storage boxes, hangers and closet organisers',               displayOrder: 5 },
    { name: 'Lighting',                description: 'Indoor lamps, LED bulbs, ceiling lights and outdoor lighting',               displayOrder: 6 },
    { name: 'Small Appliances',        description: 'Blenders, toasters, irons, kettles, fans and microwaves',                    displayOrder: 7 },
  ],

  'Cleaning & Household Supplies': [
    { name: 'Detergents & Soaps',      description: 'Laundry detergents, dishwashing liquids and bar soaps',                       displayOrder: 1 },
    { name: 'Disinfectants & Sanitisers', description: 'Floor cleaners, bleach, disinfectant sprays and hand sanitisers',         displayOrder: 2 },
    { name: 'Cleaning Tools',          description: 'Mops, brooms, brushes, sponges and cleaning cloths',                         displayOrder: 3 },
    { name: 'Bins & Waste Management', description: 'Waste bins, bin liners, dustpans and litter disposal',                       displayOrder: 4 },
    { name: 'Air Fresheners',          description: 'Sprays, plug-ins, gel fresheners and room deodorisers',                      displayOrder: 5 },
    { name: 'Pest Control',            description: 'Insect killers, mosquito coils, rat poison and pest repellents',             displayOrder: 6 },
  ],

  'Agriculture & Farm Produce': [
    { name: 'Seeds & Seedlings',       description: 'Vegetable seeds, fruit tree seedlings and planting materials',               displayOrder: 1 },
    { name: 'Fertilisers & Soil',      description: 'NPK fertilisers, organic compost, topsoil and soil amendments',             displayOrder: 2 },
    { name: 'Pesticides & Herbicides', description: 'Crop protection chemicals, weed killers and fungicides',                    displayOrder: 3 },
    { name: 'Farming Tools',           description: 'Hoes, cutlasses, watering cans, sprayers and hand tools',                   displayOrder: 4 },
    { name: 'Livestock & Poultry Feeds', description: 'Chicken feed, pig feed, cattle feed and animal supplements',              displayOrder: 5 },
    { name: 'Irrigation & Greenhouse', description: 'Drip kits, water pumps, hoses and greenhouse materials',                    displayOrder: 6 },
  ],

  'Baby & Kids': [
    { name: 'Baby Food & Formula',     description: 'Infant formula, baby cereals, purees and weaning foods',                     displayOrder: 1 },
    { name: 'Diapers & Wipes',         description: 'Disposable and cloth diapers, baby wipes and changing accessories',         displayOrder: 2 },
    { name: 'Toys & Games',            description: 'Educational toys, dolls, cars, board games and outdoor play equipment',     displayOrder: 3 },
    { name: 'Baby Feeding',            description: 'Bottles, sippy cups, breast pumps, bibs and feeding sets',                  displayOrder: 4 },
    { name: 'Baby Safety & Health',    description: 'Baby monitors, car seats, thermometers and baby safety products',           displayOrder: 5 },
    { name: 'School Supplies',         description: 'Bags, stationery, lunch boxes, water bottles and school essentials',        displayOrder: 6 },
  ],

  'Sports & Fitness': [
    { name: 'Gym Equipment',           description: 'Weights, barbells, benches, treadmills and home gym sets',                  displayOrder: 1 },
    { name: 'Sportswear',              description: 'Jerseys, tracksuits, shorts, sport shoes and compression wear',             displayOrder: 2 },
    { name: 'Outdoor & Adventure',     description: 'Camping gear, hiking boots, tents and outdoor equipment',                   displayOrder: 3 },
    { name: 'Team Sports',             description: 'Football, basketball, volleyball, cricket and team sport accessories',      displayOrder: 4 },
    { name: 'Cycling',                 description: 'Bicycles, helmets, cycling accessories and spare parts',                    displayOrder: 5 },
    { name: 'Water Sports',            description: 'Swimming gear, life jackets, fishing equipment and water toys',             displayOrder: 6 },
  ],

  'Automotive & Vehicle Parts': [
    { name: 'Engine & Transmission',   description: 'Engine oil, filters, spark plugs and transmission parts',                   displayOrder: 1 },
    { name: 'Tyres & Wheels',          description: 'Car tyres, rims, wheel covers and tyre accessories',                       displayOrder: 2 },
    { name: 'Car Interior',            description: 'Seat covers, floor mats, steering wheel covers and interior accessories',  displayOrder: 3 },
    { name: 'Car Exterior',            description: 'Bumpers, mirrors, side skirts, wipers and exterior accessories',           displayOrder: 4 },
    { name: 'Electrical & Lighting',   description: 'Car batteries, bulbs, headlights and vehicle electrical parts',            displayOrder: 5 },
    { name: 'Lubricants & Fluids',     description: 'Engine oil, brake fluid, coolant, grease and car care chemicals',          displayOrder: 6 },
    { name: 'Tools & Safety',          description: 'Jack stands, spanners, jump cables and roadside safety kits',              displayOrder: 7 },
  ],

  'Building & Construction': [
    { name: 'Cement & Concrete',       description: 'Cement bags, sand, gravel, concrete blocks and building aggregates',        displayOrder: 1 },
    { name: 'Roofing & Ceilings',      description: 'Roofing sheets, tiles, false ceiling boards and gutters',                  displayOrder: 2 },
    { name: 'Paints & Finishes',       description: 'Emulsion, gloss, primers, varnishes and painting accessories',             displayOrder: 3 },
    { name: 'Plumbing',                description: 'Pipes, fittings, water tanks, valves and plumbing tools',                  displayOrder: 4 },
    { name: 'Electrical Fittings',     description: 'Wires, switches, sockets, circuit breakers and conduit pipes',             displayOrder: 5 },
    { name: 'Tiles & Flooring',        description: 'Ceramic tiles, marble, granite, vinyl flooring and adhesives',             displayOrder: 6 },
    { name: 'Doors & Windows',         description: 'Metal doors, wooden doors, window frames, locks and handles',              displayOrder: 7 },
    { name: 'Power Tools',             description: 'Drills, grinders, saws, sanders and power tool accessories',               displayOrder: 8 },
  ],

  'Jewelry & Accessories': [
    { name: 'Necklaces & Pendants',    description: 'Gold, silver, beaded and fashion necklaces',                               displayOrder: 1 },
    { name: 'Rings',                   description: 'Engagement rings, wedding bands and fashion rings',                        displayOrder: 2 },
    { name: 'Earrings',                description: 'Studs, drops, hoops and statement earrings',                               displayOrder: 3 },
    { name: 'Bracelets & Bangles',     description: 'Beaded bracelets, bangles, cuffs and charm bracelets',                    displayOrder: 4 },
    { name: 'Watches',                 description: 'Analogue, digital and smartwatches for men and women',                     displayOrder: 5 },
    { name: 'Sunglasses & Eyewear',    description: 'Fashion sunglasses, reading glasses and optical frames',                   displayOrder: 6 },
  ],

  'Books & Stationery': [
    { name: 'Textbooks & Academic',    description: 'University textbooks, academic journals and study guides',                  displayOrder: 1 },
    { name: 'Novels & Fiction',        description: 'African literature, bestsellers, romance and thriller novels',              displayOrder: 2 },
    { name: 'Business & Self-help',    description: 'Entrepreneurship, finance, leadership and motivational books',             displayOrder: 3 },
    { name: 'Office Stationery',       description: 'Pens, notebooks, staplers, files, binders and desk accessories',          displayOrder: 4 },
    { name: 'School Supplies',         description: 'Exercise books, calculators, rulers, geometry sets and art supplies',     displayOrder: 5 },
  ],

  'Arts & Crafts': [
    { name: 'Paintings & Prints',      description: 'Original artworks, canvas prints, watercolours and oil paintings',         displayOrder: 1 },
    { name: 'Sculptures & Carvings',   description: 'Wood carvings, bronze sculptures and decorative objects',                  displayOrder: 2 },
    { name: 'Craft Supplies',          description: 'Beads, fabric, paint sets, glue guns, yarn and DIY craft kits',           displayOrder: 3 },
    { name: 'Photography',             description: 'Framed photos, photo prints and photography prints',                      displayOrder: 4 },
    { name: 'Handmade Items',          description: 'Hand-sewn bags, pottery, woven baskets and artisan goods',                 displayOrder: 5 },
  ],

  'Traditional & Cultural Items': [
    { name: 'African Fabrics',         description: 'Ankara, kente, adire, aso-oke and traditional African prints',             displayOrder: 1 },
    { name: 'Cultural Artifacts',      description: 'Masks, tribal art, heritage objects and cultural memorabilia',             displayOrder: 2 },
    { name: 'Traditional Attire',      description: 'Agbada, babariga, dashiki, kaftan and ceremonial dress',                  displayOrder: 3 },
    { name: 'Beadwork & Adornments',   description: 'Beaded jewelry, waist beads and ceremonial adornments',                   displayOrder: 4 },
    { name: 'Musical Instruments',     description: 'Talking drums, djembe, kora, shakers and traditional instruments',        displayOrder: 5 },
  ],

  'Industrial & Business Supplies': [
    { name: 'Office Furniture',        description: 'Desks, office chairs, filing cabinets and workstations',                   displayOrder: 1 },
    { name: 'Printing & Signage',      description: 'Printers, toners, banners, business cards and branding materials',        displayOrder: 2 },
    { name: 'Packaging Materials',     description: 'Boxes, bubble wrap, tape, polybags and shipping supplies',                 displayOrder: 3 },
    { name: 'Safety & PPE',            description: 'Helmets, gloves, safety boots, vests and protective equipment',           displayOrder: 4 },
    { name: 'Industrial Tools',        description: 'Welding equipment, angle grinders, generators and heavy tools',           displayOrder: 5 },
    { name: 'Cleaning & Janitorial',   description: 'Commercial mops, industrial cleaners and facility management supplies',   displayOrder: 6 },
  ],

  'Gifts & Novelties': [
    { name: 'Gift Sets & Hampers',     description: 'Curated gift boxes, hampers for birthdays, weddings and celebrations',    displayOrder: 1 },
    { name: 'Seasonal Gifts',          description: 'Christmas, Valentine, Eid, New Year and seasonal gift items',             displayOrder: 2 },
    { name: 'Personalised Gifts',      description: 'Custom engraved, printed and personalised gift items',                    displayOrder: 3 },
    { name: 'Novelty & Fun Items',     description: 'Funny mugs, gadgets, quirky gifts and novelty products',                  displayOrder: 4 },
    { name: 'Flowers & Plants',        description: 'Fresh flowers, artificial flowers, potted plants and bouquets',           displayOrder: 5 },
  ],
};

async function main() {
  const superAdminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { tenantId: true },
  });

  if (!superAdminUser?.tenantId) {
    console.error('❌  No SUPER_ADMIN user found.');
    process.exit(1);
  }
  const tenantId = superAdminUser.tenantId;
  console.log(`✅  Super Admin tenant: ${tenantId}\n`);

  let created = 0;
  let skipped = 0;

  for (const [parentName, children] of Object.entries(SUBCATEGORIES)) {
    const parent = await prisma.productCategory.findFirst({
      where: { tenantId, name: parentName, parentId: null },
    });

    if (!parent) {
      console.warn(`   ⚠  Parent not found, skipping: ${parentName}`);
      continue;
    }

    for (const child of children) {
      const existing = await prisma.productCategory.findFirst({
        where: { tenantId, name: child.name, parentId: parent.id },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.productCategory.create({
        data: {
          tenantId,
          name: child.name,
          description: child.description,
          displayOrder: child.displayOrder,
          parentId: parent.id,
          isActive: true,
        },
      });
      console.log(`   ✓  ${parentName} → ${child.name}`);
      created++;
    }
  }

  console.log(`\nDone — ${created} sub-categories created, ${skipped} already existed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
