export type NutrientInfo = {
  displayName: string;
  description: string;
  sources: string[];
  rda: number;
};

export const nutrientInformation: Record<string, NutrientInfo> = {
  iron_mg: {
    displayName: 'Iron',
    description:
      'Iron is an essential mineral that your body needs to produce hemoglobin, a protein in red blood cells that carries oxygen from your lungs to all parts of your body. It is also necessary for physical growth, neurological development, cellular functioning, and the synthesis of some hormones.',
    sources: ['Red meat', 'Spinach', 'Lentils', 'Tofu', 'Fortified cereals'],
    rda: 18,
  },
  magnesium_mg: {
    displayName: 'Magnesium',
    description:
      'Magnesium is a vital mineral involved in over 300 enzyme reactions in the human body. It is essential for regulating muscle and nerve function, blood sugar levels, and blood pressure, as well as making protein, bone, and DNA.',
    sources: [
      'Pumpkin seeds',
      'Spinach',
      'Black beans',
      'Almonds',
      'Dark chocolate',
    ],
    rda: 420,
  },
  zinc_mg: {
    displayName: 'Zinc',
    description:
      'Zinc is a trace mineral that is required for cellular metabolism, immune function, protein synthesis, wound healing, and DNA synthesis. Your body also needs it for a proper sense of taste and smell, and it plays a crucial role during pregnancy, childhood, and adolescence for proper growth.',
    sources: ['Oysters', 'Beef', 'Pumpkin seeds', 'Lentils', 'Chickpeas'],
    rda: 11,
  },
  calcium_mg: {
    displayName: 'Calcium',
    description:
      'Calcium is the most abundant mineral in the body, vital for building and maintaining strong bones and teeth. Your body also relies on calcium to help muscles and blood vessels contract and expand, to secrete hormones and enzymes, and to send messages through the nervous system.',
    sources: [
      'Dairy milk',
      'Yogurt',
      'Fortified plant milks',
      'Sardines',
      'Kale',
    ],
    rda: 1000,
  },
  potassium_mg: {
    displayName: 'Potassium',
    description:
      'Potassium is an essential electrolyte that helps maintain normal levels of fluid inside our cells. It is critical for proper kidney and heart function, muscle contraction, and nerve transmission, and it helps mitigate the blood-pressure-raising effects of sodium.',
    sources: ['Bananas', 'Potatoes', 'Spinach', 'Avocados', 'Sweet potatoes'],
    rda: 3400,
  },
  selenium_ug: {
    displayName: 'Selenium',
    description:
      'Selenium is a trace mineral that is nutritionally essential for humans and acts as a powerful antioxidant. It plays a critical role in reproduction, thyroid gland function, DNA production, and protecting the body from damage caused by free radicals and infection.',
    sources: ['Brazil nuts', 'Tuna', 'Halibut', 'Eggs', 'Sunflower seeds'],
    rda: 55,
  },
  iodine_ug: {
    displayName: 'Iodine',
    description:
      "Iodine is a trace element naturally present in some foods that the body needs to make thyroid hormones. These hormones control the body's metabolism and many other important functions, and they are especially critical for proper bone and brain development during pregnancy and infancy.",
    sources: ['Seaweed', 'Iodized salt', 'Cod', 'Dairy milk', 'Shrimp'],
    rda: 150,
  },
  copper_mg: {
    displayName: 'Copper',
    description:
      'Copper is a trace mineral that works with iron to help the body form red blood cells. It also helps keep the blood vessels, nerves, immune system, and bones healthy, and is involved in iron absorption and energy production.',
    sources: [
      'Oysters',
      'Shiitake mushrooms',
      'Cashews',
      'Dark chocolate',
      'Sesame seeds',
    ],
    rda: 0.9,
  },
  manganese_mg: {
    displayName: 'Manganese',
    description:
      "Manganese is a trace mineral required for the normal functioning of your brain, nervous system, and many of your body's enzyme systems. It plays a role in fat and carbohydrate metabolism, calcium absorption, and blood sugar regulation.",
    sources: ['Mussels', 'Hazelnuts', 'Pecans', 'Brown rice', 'Chickpeas'],
    rda: 2.3,
  },
  vitamin_a_ug_rae: {
    displayName: 'Vitamin A',
    description:
      'Vitamin A is a fat-soluble vitamin that is critical for maintaining healthy vision, especially in low light. It also plays a vital role in ensuring the normal function of your immune system, cellular communication, and the healthy formation and maintenance of the heart, lungs, and other organs.',
    sources: ['Sweet potatoes', 'Carrots', 'Beef liver', 'Spinach', 'Mangoes'],
    rda: 900,
  },
  vitamin_c_mg: {
    displayName: 'Vitamin C',
    description:
      'Vitamin C, also known as ascorbic acid, is a water-soluble vitamin that acts as an antioxidant, helping to protect cells from the damage caused by free radicals. The body needs Vitamin C to make collagen (a protein required to help wounds heal) and it improves the absorption of iron from plant-based foods.',
    sources: [
      'Citrus fruits',
      'Bell peppers',
      'Strawberries',
      'Broccoli',
      'Kiwi',
    ],
    rda: 90,
  },
  vitamin_d_ug: {
    displayName: 'Vitamin D',
    description:
      'Vitamin D is a fat-soluble vitamin that your body produces when your skin is exposed to sunlight, though it can also be obtained from food. It is primarily needed to help the gut absorb calcium and phosphorus, which are necessary for building and maintaining strong, healthy bones.',
    sources: [
      'Salmon',
      'Fortified milk',
      'Egg yolks',
      'Sardines',
      'UV-exposed mushrooms',
    ],
    rda: 15,
  },
  vitamin_e_mg_alpha_te: {
    displayName: 'Vitamin E',
    description:
      'Vitamin E is a fat-soluble nutrient found in many foods that acts primarily as an antioxidant, protecting cells from oxidative damage. Your body also needs it to boost its immune system so that it can fight off invading bacteria and viruses, and it helps widen blood vessels to prevent blood from clotting within them.',
    sources: [
      'Sunflower seeds',
      'Almonds',
      'Spinach',
      'Avocados',
      'Peanut butter',
    ],
    rda: 15,
  },
  vitamin_k_ug: {
    displayName: 'Vitamin K',
    description:
      'Vitamin K is a group of fat-soluble vitamins that play a crucial role in blood clotting, preventing excessive bleeding. It is also an important nutrient for building and maintaining healthy bones and regulating blood calcium levels.',
    sources: ['Kale', 'Spinach', 'Broccoli', 'Brussels sprouts', 'Natto'],
    rda: 120,
  },
  thiamine_b1_mg: {
    displayName: 'Vitamin B1 (Thiamine)',
    description:
      'Thiamine, or Vitamin B1, is a water-soluble vitamin that helps turn the food you eat into the energy you need. It is essential for the growth, development, and function of cells in your body, and plays a key role in nerve, muscle, and heart function.',
    sources: [
      'Pork',
      'Enriched pasta',
      'Black beans',
      'Macadamia nuts',
      'Green peas',
    ],
    rda: 1.2,
  },
  riboflavin_b2_mg: {
    displayName: 'Vitamin B2 (Riboflavin)',
    description:
      'Riboflavin, or Vitamin B2, works with other B vitamins to help your body build red blood cells and support cellular functions that give you energy. It aids in the breakdown of proteins, fats, and carbohydrates, and is essential for maintaining healthy skin, eyes, and nerve functions.',
    sources: ['Dairy milk', 'Yogurt', 'Beef liver', 'Almonds', 'Spinach'],
    rda: 1.3,
  },
  niacin_b3_mg: {
    displayName: 'Vitamin B3 (Niacin)',
    description:
      'Niacin, or Vitamin B3, is a water-soluble vitamin used by the body to turn food into energy. It helps keep your nervous system, digestive system, and skin healthy, and is often used to help manage cholesterol levels in the body.',
    sources: ['Chicken breast', 'Turkey', 'Salmon', 'Brown rice', 'Peanuts'],
    rda: 16,
  },
  vitamin_b6_mg: {
    displayName: 'Vitamin B6',
    description:
      'Vitamin B6 is a water-soluble vitamin that is significant to protein, fat, and carbohydrate metabolism and the creation of red blood cells and neurotransmitters. Your body cannot produce vitamin B6, so you must obtain it from foods or supplements to support brain health and immune function.',
    sources: ['Chickpeas', 'Beef liver', 'Tuna', 'Salmon', 'Poultry'],
    rda: 1.3,
  },
  folate_ug_dfe: {
    displayName: 'Vitamin B9 (Folate)',
    description:
      'Folate, or Vitamin B9, is naturally present in many foods and is needed to make DNA and other genetic material. It is critically important for cell division and is vital during periods of rapid growth, such as pregnancy, to help prevent neural tube defects.',
    sources: [
      'Spinach',
      'Asparagus',
      'Black-eyed peas',
      'Brussels sprouts',
      'Avocado',
    ],
    rda: 400,
  },
  vitamin_b12_ug: {
    displayName: 'Vitamin B12',
    description:
      'Vitamin B12 is a crucial water-soluble vitamin that your body needs but cannot produce. It is essential for the healthy functioning of the brain and nervous system, the formation of red blood cells, and the creation and regulation of DNA.',
    sources: [
      'Clams',
      'Beef liver',
      'Nutritional yeast',
      'Salmon',
      'Dairy milk',
    ],
    rda: 2.4,
  },
};
