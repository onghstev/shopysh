-- Seed sub-categories for VPS.
-- Super Admin tenant: a6f03f3f-a95c-4e56-8624-fc665e3187a1
-- Run inside the db container:
--   cat /tmp/seed_subcategories.sql | docker exec -i shopysh-db-1 psql -U shopysh -d shopysh

SET search_path TO public;

DO $$
DECLARE
  t_id TEXT := 'a6f03f3f-a95c-4e56-8624-fc665e3187a1';
  p_id TEXT;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  -- ── Food & Beverages ──────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Food & Beverages' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Fresh Produce','Fruits, vegetables, tubers and raw farm produce',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Grains & Staples','Rice, beans, maize, millet, oats and other dry staples',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Snacks & Confectionery','Biscuits, crisps, chin-chin, puff-puff and packaged snacks',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Beverages & Drinks','Water, soft drinks, juices, energy drinks, teas and coffees',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Cooking Oils & Spices','Palm oil, groundnut oil, seasonings, pepper mixes and condiments',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Dairy & Eggs','Milk, yoghurt, butter, cheese and eggs',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Frozen & Ready Meals','Frozen fish, meat, ready-to-cook meals and processed foods',7,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Bakery & Bread','Bread, cakes, pastries, pies and baked goods',8,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Fashion & Clothing ────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Fashion & Clothing' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Men''s Clothing','Men''s shirts, trousers, suits, casual wear and formal attire',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Women''s Clothing','Women''s dresses, blouses, skirts, office wear and casual outfits',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Children''s Clothing','Kids'' wear for infants, toddlers, boys and girls',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Traditional & Ankara','Aso-oke, Ankara prints, Agbada, Kaftan and cultural attire',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Footwear','Shoes, sandals, sneakers, heels, boots and slippers',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Bags & Purses','Handbags, backpacks, clutches, wallets and travel bags',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Belts, Hats & Caps','Leather belts, caps, hats, head-ties and headwear',7,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Health & Wellness ─────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Health & Wellness' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Vitamins & Supplements','Multivitamins, iron, omega-3 and nutritional supplements',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Herbal & Natural Remedies','Moringa, bitter leaf, garlic, aloe vera and traditional herbal products',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Fitness Equipment','Dumbbells, resistance bands, skipping ropes and home gym gear',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Medical Supplies','First-aid kits, thermometers, blood pressure monitors and OTC medications',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Weight Management','Meal replacement shakes, detox teas and slimming products',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Feminine Care','Sanitary pads, tampons, menstrual cups and feminine hygiene products',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Beauty & Personal Care ────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Beauty & Personal Care' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Skincare','Moisturisers, serums, sunscreen, toners and face washes',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Haircare','Shampoos, conditioners, hair oils, wigs, weaves and hair extensions',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Makeup & Cosmetics','Foundation, lipstick, mascara, eyeshadow and cosmetic brushes',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Perfumes & Fragrances','Men''s and women''s perfumes, body mist, deodorants and roll-ons',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Grooming & Shaving','Razors, shaving cream, clippers, beard oil and men''s grooming kits',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Nail Care','Nail polish, gel nails, nail art kits and nail care accessories',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Body Care','Body lotion, scrubs, bath soaps, shower gels and body oils',7,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Phones & Tablets ─────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Phones & Tablets' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Smartphones','Android and iOS phones for all budgets',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Tablets & iPads','Android tablets, iPads and e-readers',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Phone Cases & Covers','Protective cases, screen protectors and decorative covers',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Chargers & Cables','USB chargers, charging cables, power banks and wireless chargers',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'SIM & Network Accessories','SIM card holders, signal boosters and mobile network accessories',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Earphones & Headsets','Wired earphones, wireless earbuds and hands-free headsets',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Electronics & Gadgets ─────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Electronics & Gadgets' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'TVs & Displays','LED, OLED and smart TVs across all screen sizes',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Audio & Speakers','Bluetooth speakers, soundbars, home theatre systems and headphones',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Cameras & Photography','Digital cameras, DSLR, action cameras and camera accessories',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Smart Home Devices','Smart plugs, security cameras, smart bulbs and home automation',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Power & Energy','Inverters, solar panels, generators, stabilisers and UPS systems',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Gaming','Game consoles, controllers, games and gaming accessories',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Computers & Accessories ───────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Computers & Accessories' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Laptops','Windows, macOS and Chromebook laptops for home, office and students',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Desktop Computers','All-in-one and tower desktop PCs',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Printers & Scanners','Inkjet, laser printers, copiers and scanners',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Keyboards & Mice','Wired and wireless keyboards, mice and mouse pads',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Networking','Routers, Wi-Fi extenders, switches and network cables',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Storage Devices','External hard drives, SSDs, USB flash drives and memory cards',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Computer Parts','RAM, CPUs, GPUs, motherboards and internal computer components',7,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Home & Living ─────────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Home & Living' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Furniture','Sofas, beds, tables, chairs and wardrobes',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Bedding & Mattresses','Mattresses, pillows, bed sheets, duvets and duvet covers',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Kitchenware','Pots, pans, cutlery, kitchen utensils and cookware sets',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Home Décor','Curtains, rugs, picture frames, vases, candles and wall art',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Storage & Organisation','Shelving units, storage boxes, hangers and closet organisers',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Lighting','Indoor lamps, LED bulbs, ceiling lights and outdoor lighting',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Small Appliances','Blenders, toasters, irons, kettles, fans and microwaves',7,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Cleaning & Household Supplies ─────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Cleaning & Household Supplies' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Detergents & Soaps','Laundry detergents, dishwashing liquids and bar soaps',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Disinfectants & Sanitisers','Floor cleaners, bleach, disinfectant sprays and hand sanitisers',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Cleaning Tools','Mops, brooms, brushes, sponges and cleaning cloths',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Bins & Waste Management','Waste bins, bin liners, dustpans and litter disposal',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Air Fresheners','Sprays, plug-ins, gel fresheners and room deodorisers',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Pest Control','Insect killers, mosquito coils, rat poison and pest repellents',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Agriculture & Farm Produce ────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Agriculture & Farm Produce' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Seeds & Seedlings','Vegetable seeds, fruit tree seedlings and planting materials',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Fertilisers & Soil','NPK fertilisers, organic compost, topsoil and soil amendments',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Pesticides & Herbicides','Crop protection chemicals, weed killers and fungicides',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Farming Tools','Hoes, cutlasses, watering cans, sprayers and hand tools',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Livestock & Poultry Feeds','Chicken feed, pig feed, cattle feed and animal supplements',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Irrigation & Greenhouse','Drip kits, water pumps, hoses and greenhouse materials',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Baby & Kids ───────────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Baby & Kids' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Baby Food & Formula','Infant formula, baby cereals, purees and weaning foods',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Diapers & Wipes','Disposable and cloth diapers, baby wipes and changing accessories',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Toys & Games','Educational toys, dolls, cars, board games and outdoor play equipment',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Baby Feeding','Bottles, sippy cups, breast pumps, bibs and feeding sets',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Baby Safety & Health','Baby monitors, car seats, thermometers and baby safety products',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'School Supplies','Bags, stationery, lunch boxes, water bottles and school essentials',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Sports & Fitness ──────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Sports & Fitness' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Gym Equipment','Weights, barbells, benches, treadmills and home gym sets',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Sportswear','Jerseys, tracksuits, shorts, sport shoes and compression wear',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Outdoor & Adventure','Camping gear, hiking boots, tents and outdoor equipment',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Team Sports','Football, basketball, volleyball, cricket and team sport accessories',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Cycling','Bicycles, helmets, cycling accessories and spare parts',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Water Sports','Swimming gear, life jackets, fishing equipment and water toys',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Automotive & Vehicle Parts ────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Automotive & Vehicle Parts' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Engine & Transmission','Engine oil, filters, spark plugs and transmission parts',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Tyres & Wheels','Car tyres, rims, wheel covers and tyre accessories',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Car Interior','Seat covers, floor mats, steering wheel covers and interior accessories',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Car Exterior','Bumpers, mirrors, side skirts, wipers and exterior accessories',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Electrical & Lighting','Car batteries, bulbs, headlights and vehicle electrical parts',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Lubricants & Fluids','Engine oil, brake fluid, coolant, grease and car care chemicals',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Tools & Safety','Jack stands, spanners, jump cables and roadside safety kits',7,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Building & Construction ───────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Building & Construction' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Cement & Concrete','Cement bags, sand, gravel, concrete blocks and building aggregates',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Roofing & Ceilings','Roofing sheets, tiles, false ceiling boards and gutters',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Paints & Finishes','Emulsion, gloss, primers, varnishes and painting accessories',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Plumbing','Pipes, fittings, water tanks, valves and plumbing tools',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Electrical Fittings','Wires, switches, sockets, circuit breakers and conduit pipes',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Tiles & Flooring','Ceramic tiles, marble, granite, vinyl flooring and adhesives',6,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Doors & Windows','Metal doors, wooden doors, window frames, locks and handles',7,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Power Tools','Drills, grinders, saws, sanders and power tool accessories',8,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Jewelry & Accessories ─────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Jewelry & Accessories' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Necklaces & Pendants','Gold, silver, beaded and fashion necklaces',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Rings','Engagement rings, wedding bands and fashion rings',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Earrings','Studs, drops, hoops and statement earrings',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Bracelets & Bangles','Beaded bracelets, bangles, cuffs and charm bracelets',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Watches','Analogue, digital and smartwatches for men and women',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Sunglasses & Eyewear','Fashion sunglasses, reading glasses and optical frames',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Books & Stationery ────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Books & Stationery' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Textbooks & Academic','University textbooks, academic journals and study guides',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Novels & Fiction','African literature, bestsellers, romance and thriller novels',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Business & Self-help','Entrepreneurship, finance, leadership and motivational books',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Office Stationery','Pens, notebooks, staplers, files, binders and desk accessories',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'School Supplies','Exercise books, calculators, rulers, geometry sets and art supplies',5,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Arts & Crafts ─────────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Arts & Crafts' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Paintings & Prints','Original artworks, canvas prints, watercolours and oil paintings',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Sculptures & Carvings','Wood carvings, bronze sculptures and decorative objects',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Craft Supplies','Beads, fabric, paint sets, glue guns, yarn and DIY craft kits',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Photography','Framed photos, photo prints and photography prints',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Handmade Items','Hand-sewn bags, pottery, woven baskets and artisan goods',5,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Traditional & Cultural Items ──────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Traditional & Cultural Items' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'African Fabrics','Ankara, kente, adire, aso-oke and traditional African prints',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Cultural Artifacts','Masks, tribal art, heritage objects and cultural memorabilia',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Traditional Attire','Agbada, babariga, dashiki, kaftan and ceremonial dress',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Beadwork & Adornments','Beaded jewelry, waist beads and ceremonial adornments',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Musical Instruments','Talking drums, djembe, kora, shakers and traditional instruments',5,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Industrial & Business Supplies ────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Industrial & Business Supplies' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Office Furniture','Desks, office chairs, filing cabinets and workstations',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Printing & Signage','Printers, toners, banners, business cards and branding materials',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Packaging Materials','Boxes, bubble wrap, tape, polybags and shipping supplies',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Safety & PPE','Helmets, gloves, safety boots, vests and protective equipment',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Industrial Tools','Welding equipment, angle grinders, generators and heavy tools',5,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Cleaning & Janitorial','Commercial mops, industrial cleaners and facility management supplies',6,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Gifts & Novelties ─────────────────────────────────────────────────────
  SELECT id INTO p_id FROM "ProductCategory" WHERE "tenantId"=t_id AND name='Gifts & Novelties' AND "parentId" IS NULL;
  IF p_id IS NOT NULL THEN
    INSERT INTO "ProductCategory"("id","tenantId","name","description","displayOrder","parentId","isActive","createdAt","updatedAt")
    VALUES
      (gen_random_uuid(),t_id,'Gift Sets & Hampers','Curated gift boxes, hampers for birthdays, weddings and celebrations',1,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Seasonal Gifts','Christmas, Valentine, Eid, New Year and seasonal gift items',2,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Personalised Gifts','Custom engraved, printed and personalised gift items',3,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Novelty & Fun Items','Funny mugs, gadgets, quirky gifts and novelty products',4,p_id,true,NOW(),NOW()),
      (gen_random_uuid(),t_id,'Flowers & Plants','Fresh flowers, artificial flowers, potted plants and bouquets',5,p_id,true,NOW(),NOW())
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

SELECT 'Done — sub-categories seeded.' AS result;
