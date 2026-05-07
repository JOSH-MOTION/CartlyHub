// ============================================================
// MARKETPLACE CATEGORIES WITH ATTRIBUTES
// Each attribute serves two purposes:
//   1. Listing form — seller fills in when posting
//   2. Filter sidebar — buyer uses to search/narrow
//
// Attribute types:
//   text         → free text input
//   number       → numeric input
//   single-select → radio / dropdown (pick one)
//   multi-select  → checkboxes (pick many)
//   range        → min/max slider (price, mileage, year, etc.)
//   boolean      → yes/no toggle
//   date         → date picker
//
// Fields per attribute:
//   id           → unique key
//   label        → display name
//   type         → input type (see above)
//   options      → array of choices (for select types)
//   required     → seller must fill this before posting
//   filterable   → show in buyer filter sidebar
//   placeholder  → hint text inside input
// ============================================================

// ─── SHARED / REUSABLE ATTRIBUTE SETS ───────────────────────
const CONDITION = {
  id: "condition",
  label: "Condition",
  type: "single-select",
  options: ["Brand New", "Foreign Used", "Locally Used", "Refurbished"],
  required: true,
  filterable: true,
  placeholder: "Select condition",
};

const PRICE = {
  id: "price",
  label: "Price",
  type: "number",
  required: true,
  filterable: true,
  placeholder: "Enter price",
};

const PRICE_RANGE = {
  id: "price_range",
  label: "Price Range",
  type: "range",
  required: false,
  filterable: true,
};

const BRAND = {
  id: "brand",
  label: "Brand",
  type: "text",
  required: false,
  filterable: true,
  placeholder: "e.g. Samsung, Nike, Zara",
};

const COLOR = {
  id: "color",
  label: "Color",
  type: "multi-select",
  options: [
    "Black", "White", "Red", "Blue", "Green", "Yellow",
    "Orange", "Purple", "Pink", "Brown", "Grey", "Gold",
    "Silver", "Multicolor", "Other",
  ],
  required: false,
  filterable: true,
  placeholder: "Select color(s)",
};

const CLOTHING_SIZE = {
  id: "size",
  label: "Size",
  type: "multi-select",
  options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size", "Custom"],
  required: true,
  filterable: true,
  placeholder: "Select size(s)",
};

const SHOE_SIZE = {
  id: "shoe_size",
  label: "Shoe Size",
  type: "multi-select",
  options: [
    "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47",
  ],
  required: true,
  filterable: true,
  placeholder: "Select size(s)",
};

const GENDER = {
  id: "gender",
  label: "Gender",
  type: "single-select",
  options: ["Men", "Women", "Unisex", "Boys", "Girls"],
  required: true,
  filterable: true,
  placeholder: "Select gender",
};

const MATERIAL = {
  id: "material",
  label: "Material",
  type: "multi-select",
  options: [
    "Cotton", "Polyester", "Linen", "Silk", "Wool", "Lace",
    "Chiffon", "Velvet", "Denim", "Leather", "Ankara/Kente",
    "Knitwear", "Synthetic", "Other",
  ],
  required: false,
  filterable: true,
  placeholder: "Select material(s)",
};

const NEGOTIABLE = {
  id: "negotiable",
  label: "Price Negotiable",
  type: "boolean",
  required: false,
  filterable: true,
};

const DELIVERY = {
  id: "delivery",
  label: "Delivery Available",
  type: "boolean",
  required: false,
  filterable: true,
};

const LOCATION = {
  id: "location",
  label: "Location / Region",
  type: "text",
  required: true,
  filterable: true,
  placeholder: "e.g. Accra, Lagos, Kumasi",
};

// ─── MAIN CATEGORIES ────────────────────────────────────────

export const categories = [

  // ══════════════════════════════════════════════════════════
  // 1. FASHION & APPAREL
  // ══════════════════════════════════════════════════════════
  {
    id: "fashion",
    name: "Fashion & Apparel",
    icon: "Shirt",
    subcategories: [

      {
        id: "womens_clothing",
        name: "Women's Clothing",
        subcategories: [
          {
            id: "dresses",
            name: "Dresses",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "style",
                label: "Dress Style",
                type: "multi-select",
                options: [
                  "Ankara / Kente", "Maxi", "Midi", "Mini", "Bodycon",
                  "A-Line", "Wrap", "Shirt Dress", "Office Wear",
                  "Casual", "Evening / Party", "Wedding / Bridal",
                  "Jumpsuit", "Playsuit", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select dress style",
              },
              {
                id: "occasion",
                label: "Occasion",
                type: "multi-select",
                options: [
                  "Everyday / Casual", "Work / Office", "Party / Night Out",
                  "Wedding", "Traditional Event", "Beach / Holiday", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select occasion",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "tops_blouses",
            name: "Tops & Blouses",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "top_style",
                label: "Top Style",
                type: "multi-select",
                options: [
                  "Blouse", "Crop Top", "Tank Top", "Off-Shoulder",
                  "Peplum", "Shirt", "T-Shirt", "Polo", "Ankara Top",
                  "Corset", "Bodysuit", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select top style",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "pants_jeans_women",
            name: "Pants & Jeans",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "pants_style",
                label: "Style",
                type: "multi-select",
                options: [
                  "Skinny Jeans", "Straight Jeans", "Wide Leg",
                  "Palazzo", "Trousers", "Leggings", "Joggers",
                  "Culottes", "Shorts", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select style",
              },
              {
                id: "waist_size",
                label: "Waist Size",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 28, 30, 32",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "skirts",
            name: "Skirts",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "skirt_style",
                label: "Skirt Style",
                type: "multi-select",
                options: [
                  "Mini", "Midi", "Maxi", "A-Line", "Pencil",
                  "Wrap", "Pleated", "Ankara", "Denim", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select skirt style",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "activewear_women",
            name: "Activewear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR,
              {
                id: "activewear_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Sports Bra", "Leggings", "Shorts", "Tank Top",
                  "Hoodie", "Tracksuit", "Gym Set", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "swimwear_women",
            name: "Swimwear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR,
              {
                id: "swim_style",
                label: "Style",
                type: "multi-select",
                options: [
                  "Bikini", "One-Piece", "Tankini", "Swim Shorts",
                  "Cover-Up", "Rash Guard", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select style",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "lingerie_sleepwear",
            name: "Lingerie & Sleepwear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR,
              {
                id: "lingerie_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Bra", "Panties / Underwear", "Bra & Panty Set",
                  "Pajamas", "Nightgown", "Robe", "Shapewear",
                  "Camisole", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "outerwear_women",
            name: "Outerwear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "outerwear_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Jacket", "Coat", "Blazer", "Cardigan",
                  "Hoodie", "Puffer", "Raincoat", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "maternity",
            name: "Maternity",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR,
              {
                id: "maternity_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Dress", "Top", "Pants", "Skirt", "Swimwear",
                  "Nightwear", "Set / Bundle", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "mens_clothing",
        name: "Men's Clothing",
        subcategories: [
          {
            id: "shirts_men",
            name: "Shirts & Tops",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "shirt_style",
                label: "Shirt Style",
                type: "multi-select",
                options: [
                  "T-Shirt", "Polo Shirt", "Casual Shirt", "Corporate Shirt",
                  "Senator / Kaftan", "Agbada", "Ankara Top",
                  "Dashiki", "Hoodie", "Sweatshirt", "Tank Top", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select shirt style",
              },
              {
                id: "sleeve",
                label: "Sleeve Length",
                type: "single-select",
                options: ["Short Sleeve", "Long Sleeve", "Sleeveless"],
                required: false,
                filterable: true,
                placeholder: "Select sleeve length",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "pants_men",
            name: "Pants & Jeans",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "pants_style_men",
                label: "Style",
                type: "multi-select",
                options: [
                  "Slim Jeans", "Straight Jeans", "Chinos", "Trousers",
                  "Joggers", "Cargo Pants", "Shorts", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select style",
              },
              {
                id: "waist",
                label: "Waist Size",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 30, 32, 34, 36",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "suits_blazers_men",
            name: "Suits & Blazers",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "suit_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "2-Piece Suit", "3-Piece Suit", "Blazer",
                  "Tuxedo", "Traditional / Senator Suit", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "activewear_men",
            name: "Activewear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR,
              {
                id: "active_type_men",
                label: "Type",
                type: "multi-select",
                options: [
                  "Shorts", "Tracksuit", "Jersey", "Compression Top",
                  "Training Pants", "Gym Set", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "underwear_men",
            name: "Underwear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR,
              {
                id: "underwear_type",
                label: "Type",
                type: "multi-select",
                options: ["Boxers", "Briefs", "Trunks", "Vest", "Set", "Other"],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "traditional_men",
            name: "Traditional & Cultural Wear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "traditional_style",
                label: "Style",
                type: "multi-select",
                options: [
                  "Agbada", "Senator / Kaftan", "Dashiki", "Kente Set",
                  "Smock (Fugu)", "Boubou", "Buba & Sokoto", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select style",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "kids_clothing",
        name: "Kids' Clothing",
        subcategories: [
          {
            id: "girls_clothing",
            name: "Girls' Clothing",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "kids_age",
                label: "Age Range",
                type: "single-select",
                options: [
                  "0–6 months", "6–12 months", "1–2 years", "2–3 years",
                  "3–5 years", "5–7 years", "7–10 years", "10–12 years",
                  "12–16 years",
                ],
                required: true,
                filterable: true,
                placeholder: "Select age range",
              },
              {
                id: "girls_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Dress", "Top", "Pants", "Skirt", "Jacket",
                  "School Uniform", "Swimwear", "Nightwear", "Set", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "boys_clothing",
            name: "Boys' Clothing",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "boys_age",
                label: "Age Range",
                type: "single-select",
                options: [
                  "0–6 months", "6–12 months", "1–2 years", "2–3 years",
                  "3–5 years", "5–7 years", "7–10 years", "10–12 years",
                  "12–16 years",
                ],
                required: true,
                filterable: true,
                placeholder: "Select age range",
              },
              {
                id: "boys_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "T-Shirt", "Shirt", "Pants", "Shorts", "Jacket",
                  "School Uniform", "Swimwear", "Nightwear", "Set", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "baby_clothing",
            name: "Baby & Toddler",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "baby_age",
                label: "Age",
                type: "single-select",
                options: [
                  "Newborn (0–3m)", "3–6 months", "6–9 months",
                  "9–12 months", "12–18 months", "18–24 months",
                ],
                required: true,
                filterable: true,
                placeholder: "Select age",
              },
              {
                id: "baby_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Onesie", "Romper", "Set", "Dress", "Top & Bottom",
                  "Sleepsuit", "Jacket", "Accessories", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "shoes_footwear",
        name: "Shoes & Footwear",
        subcategories: [
          {
            id: "womens_shoes",
            name: "Women's Shoes",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, SHOE_SIZE, COLOR,
              {
                id: "shoe_type_women",
                label: "Shoe Type",
                type: "multi-select",
                options: [
                  "Heels", "Sandals", "Flats", "Sneakers", "Boots",
                  "Mules", "Wedges", "Loafers", "Slippers",
                  "Platform Shoes", "Ankle Boots", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select shoe type",
              },
              {
                id: "heel_height",
                label: "Heel Height",
                type: "single-select",
                options: ["Flat", "Low (1–3cm)", "Mid (3–6cm)", "High (6cm+)"],
                required: false,
                filterable: true,
                placeholder: "Select heel height",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "mens_shoes",
            name: "Men's Shoes",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, SHOE_SIZE, COLOR,
              {
                id: "shoe_type_men",
                label: "Shoe Type",
                type: "multi-select",
                options: [
                  "Sneakers", "Loafers", "Oxfords", "Derby",
                  "Boots", "Sandals", "Slippers", "Athletic",
                  "Moccasins", "Chelsea Boots", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select shoe type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "kids_shoes",
            name: "Kids' Shoes",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "kids_shoe_size",
                label: "Shoe Size",
                type: "multi-select",
                options: [
                  "Size 20", "21", "22", "23", "24", "25", "26",
                  "27", "28", "29", "30", "31", "32", "33", "34", "35",
                ],
                required: true,
                filterable: true,
                placeholder: "Select size",
              },
              {
                id: "kids_shoe_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Sneakers", "Sandals", "School Shoes",
                  "Boots", "Slippers", "Baby Shoes", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "bags_accessories",
        name: "Bags & Accessories",
        subcategories: [
          {
            id: "handbags",
            name: "Handbags & Purses",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "bag_style",
                label: "Bag Style",
                type: "multi-select",
                options: [
                  "Tote", "Shoulder Bag", "Crossbody", "Clutch",
                  "Satchel", "Bucket Bag", "Mini Bag", "Ankara Bag",
                  "Evening Bag", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select bag style",
              },
              {
                id: "bag_material",
                label: "Material",
                type: "multi-select",
                options: [
                  "Leather", "Faux Leather", "Canvas", "Fabric",
                  "Suede", "Straw / Wicker", "Patent", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select material",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "backpacks",
            name: "Backpacks",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "backpack_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "School Backpack", "Laptop Backpack", "Travel Backpack",
                  "Mini Backpack", "Hiking Backpack", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "jewelry",
            name: "Jewelry",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "jewelry_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Necklace", "Bracelet", "Earrings", "Ring",
                  "Anklet", "Bangle", "Brooch", "Set / Bundle",
                  "Waist Beads", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "jewelry_material",
                label: "Material",
                type: "multi-select",
                options: [
                  "Gold", "Silver", "Rose Gold", "Stainless Steel",
                  "Beads", "Copper", "Plated", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select material",
              },
              GENDER, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "watches",
            name: "Watches",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "watch_type",
                label: "Watch Type",
                type: "single-select",
                options: ["Analog", "Digital", "Smartwatch", "Hybrid"],
                required: true,
                filterable: true,
                placeholder: "Select watch type",
              },
              GENDER, BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "belts_scarves",
            name: "Belts, Scarves & Hats",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "accessory_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Belt", "Scarf / Wrap", "Hat", "Cap", "Headband",
                  "Sunglasses", "Hair Accessories", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              GENDER, BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "luggage",
            name: "Luggage & Travel Bags",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "luggage_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Suitcase", "Carry-On", "Duffel Bag", "Travel Backpack",
                  "Trolley Bag", "Garment Bag", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "luggage_size",
                label: "Size",
                type: "single-select",
                options: ["Small (Cabin)", "Medium", "Large", "Extra Large"],
                required: false,
                filterable: true,
                placeholder: "Select size",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "traditional_wear",
        name: "Traditional & Cultural Wear",
        subcategories: [
          {
            id: "african_traditional",
            name: "African Traditional Wear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, CLOTHING_SIZE, COLOR, MATERIAL,
              {
                id: "traditional_type",
                label: "Style",
                type: "multi-select",
                options: [
                  "Kente", "Ankara / Aso-Oke", "Dashiki", "Agbada",
                  "Smock (Fugu)", "Kaba & Slit", "Boubou",
                  "Buba & Iro", "Cultural Beads / Accessories",
                  "Festival Wear", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select style",
              },
              GENDER, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "wholesale_clothing",
            name: "Wholesale & Bulk Clothing",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "bulk_type",
                label: "Type",
                type: "multi-select",
                options: ["Bales", "Dozens", "Mixed Packs", "Clearance Lots", "Other"],
                required: true,
                filterable: true,
                placeholder: "Select bulk type",
              },
              {
                id: "quantity_bulk",
                label: "Quantity / Units",
                type: "text",
                required: true,
                filterable: false,
                placeholder: "e.g. 50 pieces, 1 bale",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

    ],
  },

  // ══════════════════════════════════════════════════════════
  // 2. ELECTRONICS & TECH
  // ══════════════════════════════════════════════════════════
  {
    id: "electronics",
    name: "Electronics & Tech",
    icon: "Smartphone",
    subcategories: [

      {
        id: "phones_tablets",
        name: "Phones & Tablets",
        subcategories: [
          {
            id: "smartphones",
            name: "Smartphones",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "phone_brand",
                label: "Brand",
                type: "single-select",
                options: [
                  "Samsung", "Apple (iPhone)", "Tecno", "Infinix", "Itel",
                  "Xiaomi", "Huawei", "Oppo", "Realme", "OnePlus",
                  "Nokia", "Motorola", "Sony", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select brand",
              },
              {
                id: "storage",
                label: "Storage (GB)",
                type: "single-select",
                options: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
                required: false,
                filterable: true,
                placeholder: "Select storage",
              },
              {
                id: "ram",
                label: "RAM (GB)",
                type: "single-select",
                options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"],
                required: false,
                filterable: true,
                placeholder: "Select RAM",
              },
              {
                id: "network",
                label: "Network",
                type: "multi-select",
                options: ["2G", "3G", "4G / LTE", "5G"],
                required: false,
                filterable: true,
                placeholder: "Select network",
              },
              {
                id: "sim_slots",
                label: "SIM Slots",
                type: "single-select",
                options: ["Single SIM", "Dual SIM", "Triple SIM"],
                required: false,
                filterable: true,
                placeholder: "Select SIM slots",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "tablets",
            name: "Tablets",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "tablet_brand",
                label: "Brand",
                type: "single-select",
                options: [
                  "Apple (iPad)", "Samsung", "Lenovo", "Huawei",
                  "Amazon", "Microsoft", "Xiaomi", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select brand",
              },
              {
                id: "screen_size_tablet",
                label: "Screen Size",
                type: "single-select",
                options: [
                  "Under 8 inch", "8–9 inch", "10–11 inch",
                  "12–13 inch", "13+ inch",
                ],
                required: false,
                filterable: true,
                placeholder: "Select screen size",
              },
              {
                id: "connectivity",
                label: "Connectivity",
                type: "multi-select",
                options: ["WiFi Only", "WiFi + Cellular", "5G"],
                required: false,
                filterable: true,
                placeholder: "Select connectivity",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "phone_accessories",
            name: "Phone Accessories",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "accessory_type_phone",
                label: "Accessory Type",
                type: "multi-select",
                options: [
                  "Case / Cover", "Screen Protector", "Charger",
                  "Power Bank", "Cable", "Earphones", "Pop Socket",
                  "Car Mount", "Memory Card", "SIM Card", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select accessory type",
              },
              {
                id: "compatible_brand",
                label: "Compatible With",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. iPhone 14, Samsung S23",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "computers",
        name: "Computers & Laptops",
        subcategories: [
          {
            id: "laptops",
            name: "Laptops",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "laptop_brand",
                label: "Brand",
                type: "single-select",
                options: [
                  "Apple (MacBook)", "Dell", "HP", "Lenovo", "Asus",
                  "Acer", "Microsoft (Surface)", "MSI", "Toshiba",
                  "Samsung", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select brand",
              },
              {
                id: "processor",
                label: "Processor",
                type: "single-select",
                options: [
                  "Intel Core i3", "Intel Core i5", "Intel Core i7",
                  "Intel Core i9", "AMD Ryzen 5", "AMD Ryzen 7",
                  "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3",
                  "Celeron / Pentium", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select processor",
              },
              {
                id: "laptop_ram",
                label: "RAM (GB)",
                type: "single-select",
                options: ["4GB", "8GB", "16GB", "32GB", "64GB"],
                required: false,
                filterable: true,
                placeholder: "Select RAM",
              },
              {
                id: "laptop_storage",
                label: "Storage",
                type: "single-select",
                options: [
                  "128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD",
                  "500GB HDD", "1TB HDD", "2TB HDD",
                ],
                required: false,
                filterable: true,
                placeholder: "Select storage",
              },
              {
                id: "screen_size_laptop",
                label: "Screen Size",
                type: "single-select",
                options: [
                  "11–12 inch", "13–14 inch", "15–16 inch", "17+ inch",
                ],
                required: false,
                filterable: true,
                placeholder: "Select screen size",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "desktops",
            name: "Desktops & All-in-Ones",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "desktop_brand",
                label: "Brand",
                type: "single-select",
                options: [
                  "HP", "Dell", "Lenovo", "Apple (iMac)",
                  "Asus", "Acer", "Custom Build", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select brand",
              },
              {
                id: "desktop_type",
                label: "Type",
                type: "single-select",
                options: ["Tower Desktop", "All-in-One", "Mini PC"],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "computer_accessories",
            name: "Computer Accessories",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "computer_acc_type",
                label: "Accessory Type",
                type: "multi-select",
                options: [
                  "Monitor", "Keyboard", "Mouse", "Webcam",
                  "External Hard Drive", "USB Hub", "Printer",
                  "RAM", "SSD / HDD", "Graphics Card",
                  "Cooling Fan", "UPS / Battery Backup", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select accessory type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "tv_audio",
        name: "TV & Audio",
        subcategories: [
          {
            id: "televisions",
            name: "Televisions",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "tv_brand",
                label: "Brand",
                type: "single-select",
                options: [
                  "Samsung", "LG", "Sony", "Hisense", "TCL",
                  "Panasonic", "Skyworth", "Syinix", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select brand",
              },
              {
                id: "screen_size_tv",
                label: "Screen Size",
                type: "single-select",
                options: [
                  "24 inch", "32 inch", "40 inch", "43 inch",
                  "50 inch", "55 inch", "65 inch", "75 inch", "85+ inch",
                ],
                required: true,
                filterable: true,
                placeholder: "Select screen size",
              },
              {
                id: "tv_type",
                label: "TV Type",
                type: "multi-select",
                options: ["Smart TV", "Android TV", "4K UHD", "OLED", "QLED", "LED", "Other"],
                required: false,
                filterable: true,
                placeholder: "Select TV type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "audio",
            name: "Audio & Sound",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "audio_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Bluetooth Speaker", "Home Theater", "Soundbar",
                  "Wired Headphones", "Wireless Headphones",
                  "Earbuds / TWS", "Car Speaker", "Subwoofer",
                  "DJ Equipment", "Microphone", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "cameras",
        name: "Cameras & Photography",
        subcategories: [
          {
            id: "cameras_main",
            name: "Cameras",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "camera_type",
                label: "Camera Type",
                type: "single-select",
                options: [
                  "DSLR", "Mirrorless", "Point & Shoot",
                  "Action Camera (GoPro)", "Drone / Aerial", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select camera type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "camera_accessories",
            name: "Camera Accessories",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "cam_acc_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Lens", "Tripod", "Memory Card", "Camera Bag",
                  "Flash / Strobe", "Gimbal", "Filter", "Battery", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "gaming",
        name: "Gaming",
        subcategories: [
          {
            id: "consoles",
            name: "Consoles",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "console_brand",
                label: "Console",
                type: "single-select",
                options: [
                  "PlayStation 5", "PlayStation 4", "Xbox Series X/S",
                  "Xbox One", "Nintendo Switch", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select console",
              },
              {
                id: "bundle",
                label: "Bundle Includes",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 2 controllers, 5 games",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "games",
            name: "Games & Controllers",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "game_platform",
                label: "Platform",
                type: "multi-select",
                options: ["PS5", "PS4", "Xbox", "Nintendo Switch", "PC"],
                required: true,
                filterable: true,
                placeholder: "Select platform",
              },
              {
                id: "game_genre",
                label: "Genre",
                type: "multi-select",
                options: [
                  "Action", "Sports", "RPG", "Racing",
                  "Fighting", "Shooter", "Adventure", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select genre",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "smart_home",
        name: "Smart Home & IoT",
        subcategories: [
          {
            id: "smart_devices",
            name: "Smart Devices",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "smart_type",
                label: "Device Type",
                type: "multi-select",
                options: [
                  "Smart Speaker", "Smart Bulb", "Smart Plug",
                  "Security Camera", "Smart Lock", "Doorbell Camera",
                  "Smart Thermostat", "Robot Vacuum", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select device type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "gadgets_tech",
        name: "Gadgets & Novelty Tech",
        subcategories: [
          {
            id: "cool_gadgets",
            name: "Cool Gadgets",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "gadget_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Smart Rings", "VR / AR Headsets", "Pocket Projectors",
                  "Digital Notepads", "Trackers (AirTags, etc.)",
                  "Handheld Fans", "Electric Scooters / Hoverboards",
                  "Retro Consoles", "Other Unique Tech",
                ],
                required: true,
                filterable: true,
                placeholder: "Select gadget type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 3. HOME & GARDEN
  // ══════════════════════════════════════════════════════════
  {
    id: "home",
    name: "Home & Garden",
    icon: "Home",
    subcategories: [

      {
        id: "furniture",
        name: "Furniture",
        subcategories: [
          {
            id: "sofas_couches",
            name: "Sofas & Couches",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "sofa_type",
                label: "Type",
                type: "single-select",
                options: [
                  "2-Seater", "3-Seater", "L-Shaped / Corner",
                  "Sectional", "Sofa Bed", "Armchair", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "sofa_material",
                label: "Material",
                type: "single-select",
                options: [
                  "Leather", "Fabric", "Velvet", "Faux Leather", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select material",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "beds",
            name: "Beds & Mattresses",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "bed_size",
                label: "Bed Size",
                type: "single-select",
                options: [
                  "Single", "Twin", "Full", "Queen", "King",
                  "Super King", "Baby / Cot",
                ],
                required: true,
                filterable: true,
                placeholder: "Select size",
              },
              {
                id: "bed_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Bed Frame Only", "Mattress Only", "Bed + Mattress",
                  "Bunk Bed", "Storage Bed", "Divan Bed",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "dining_tables",
            name: "Dining Tables & Chairs",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "dining_seats",
                label: "Seating Capacity",
                type: "single-select",
                options: ["2 Seater", "4 Seater", "6 Seater", "8 Seater", "10+ Seater"],
                required: false,
                filterable: true,
                placeholder: "Select seating",
              },
              {
                id: "dining_material",
                label: "Material",
                type: "single-select",
                options: ["Wood", "Glass", "Marble", "Metal", "Mixed"],
                required: false,
                filterable: true,
                placeholder: "Select material",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "wardrobes_storage",
            name: "Wardrobes & Storage",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "wardrobe_type",
                label: "Type",
                type: "single-select",
                options: [
                  "Wardrobe", "Chest of Drawers", "Bookshelf",
                  "TV Stand", "Cabinet", "Sideboard", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "office_furniture_home",
            name: "Desks & Office Furniture",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "desk_type",
                label: "Type",
                type: "single-select",
                options: [
                  "Study Desk", "Office Desk", "Standing Desk",
                  "Office Chair", "Filing Cabinet", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "kitchen_dining",
        name: "Kitchen & Dining",
        subcategories: [
          {
            id: "kitchen_appliances",
            name: "Kitchen Appliances",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "appliance_type",
                label: "Appliance Type",
                type: "multi-select",
                options: [
                  "Blender", "Juicer", "Food Processor", "Microwave",
                  "Air Fryer", "Electric Kettle", "Toaster",
                  "Rice Cooker", "Pressure Cooker", "Electric Cooker",
                  "Gas Cooker / Stove", "Oven", "Refrigerator / Fridge",
                  "Freezer", "Washing Machine", "Dishwasher", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select appliance type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "cookware",
            name: "Cookware & Utensils",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "cookware_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Pots & Pans", "Frying Pan", "Wok", "Bakeware",
                  "Cutlery (Spoons, Forks, Knives)", "Plates & Bowls",
                  "Cups & Mugs", "Glassware / Tumblers", "Serving Dishes",
                  "Kitchen Gadgets (Peelers, Graters, etc.)",
                  "Food Containers & Jars", "Chopping Boards",
                  "Water Bottles & Flasks", "Dish Racks", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "kitchen_essentials",
            name: "Kitchen Stuffs & Essentials",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "kitchen_stuff_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Kitchen Linens (Aprons, Towels)", "Trash Cans",
                  "Organizers & Racks", "Kitchen Lighting",
                  "Sink Accessories", "Gas Cylinders & Accessories",
                  "Cleaning Stuffs (Sponges, Brushes)", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "home_decor",
        name: "Home Decor",
        subcategories: [
          {
            id: "decor_items",
            name: "Decor & Accessories",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "decor_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Wall Art / Painting", "Mirror", "Clock",
                  "Candles & Diffusers", "Vases & Planters",
                  "Curtains & Blinds", "Rugs & Carpets",
                  "Cushions & Throws", "Photo Frames",
                  "Artificial Plants", "Sculptures", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "decor_style",
                label: "Style",
                type: "single-select",
                options: [
                  "Modern", "Traditional / African", "Minimalist",
                  "Bohemian", "Rustic", "Luxury", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select style",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "bedding_bath",
            name: "Bedding & Bath",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "bedding_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Bed Sheet Set", "Duvet & Cover", "Pillow",
                  "Blanket / Throw", "Towel Set", "Bath Mat",
                  "Shower Curtain", "Mattress Protector", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "garden_outdoor",
        name: "Garden & Outdoor",
        subcategories: [
          {
            id: "garden_tools",
            name: "Gardening",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "garden_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Gardening Tools", "Seeds & Bulbs", "Fertilizers",
                  "Pots & Planters", "Soil & Compost",
                  "Watering Equipment", "Lawn Mower", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "outdoor_living",
            name: "Outdoor & BBQ",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "outdoor_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Outdoor Furniture", "BBQ / Grill",
                  "Outdoor Lighting", "Gazebo / Tent",
                  "Hammock", "Garden Fountain", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "cleaning_laundry",
        name: "Cleaning & Laundry",
        subcategories: [
          {
            id: "cleaning_equipment",
            name: "Cleaning Equipment",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "cleaning_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Vacuum Cleaner", "Mop & Broom", "Steam Cleaner",
                  "Pressure Washer", "Washing Machine",
                  "Tumble Dryer", "Iron & Ironing Board",
                  "Cleaning Supplies", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

    ],
  },

  // ══════════════════════════════════════════════════════════
  // 4. BEAUTY & PERSONAL CARE
  // ══════════════════════════════════════════════════════════
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    icon: "Heart",
    subcategories: [

      {
        id: "skincare",
        name: "Skincare",
        subcategories: [
          {
            id: "face_skincare",
            name: "Face Care",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "skincare_type",
                label: "Product Type",
                type: "multi-select",
                options: [
                  "Moisturizer / Cream", "Serum", "Toner", "Cleanser",
                  "Face Wash", "Face Mask", "Sunscreen / SPF",
                  "Eye Cream", "Exfoliator / Scrub",
                  "Acne Treatment", "Dark Spot Corrector",
                  "Face Oil", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product type",
              },
              {
                id: "skin_type",
                label: "Skin Type",
                type: "multi-select",
                options: [
                  "Oily", "Dry", "Combination", "Sensitive",
                  "Normal", "All Skin Types",
                ],
                required: false,
                filterable: true,
                placeholder: "Select skin type",
              },
              {
                id: "skin_concern",
                label: "Skin Concern",
                type: "multi-select",
                options: [
                  "Dark Spots / Hyperpigmentation", "Acne & Blemishes",
                  "Anti-Aging", "Brightening / Glow", "Hydration",
                  "Even Skin Tone", "Pores", "Redness", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select concern",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "body_skincare",
            name: "Body Care",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "body_care_type",
                label: "Product Type",
                type: "multi-select",
                options: [
                  "Body Lotion / Cream", "Body Oil", "Body Butter",
                  "Body Wash / Shower Gel", "Soap", "Body Scrub",
                  "Hand Cream", "Foot Cream", "Deodorant", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "haircare",
        name: "Haircare",
        subcategories: [
          {
            id: "hair_products",
            name: "Hair Products",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "hair_product_type",
                label: "Product Type",
                type: "multi-select",
                options: [
                  "Shampoo", "Conditioner", "Hair Mask / Treatment",
                  "Hair Oil", "Leave-In Conditioner",
                  "Edge Control / Gel", "Hair Spray",
                  "Hair Dye / Color", "Relaxer / Perm",
                  "Growth Treatment", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product type",
              },
              {
                id: "hair_type",
                label: "Hair Type",
                type: "multi-select",
                options: [
                  "Natural Hair (4C/4B)", "Relaxed Hair",
                  "Wavy", "Curly", "Locs / Dreadlocks",
                  "All Hair Types",
                ],
                required: false,
                filterable: true,
                placeholder: "Select hair type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "hair_extensions",
            name: "Hair Extensions & Wigs",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "hair_ext_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Wigs (Human Hair)", "Wigs (Synthetic)",
                  "Weave / Bundles", "Braiding Hair",
                  "Clip-In Extensions", "Frontal / Closure",
                  "Crochet Hair", "Twist / Loc Hair", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "hair_length",
                label: "Hair Length",
                type: "single-select",
                options: [
                  "8–10 inch", "10–12 inch", "14–16 inch",
                  "18–20 inch", "22–24 inch", "26+ inch",
                ],
                required: false,
                filterable: true,
                placeholder: "Select length",
              },
              {
                id: "hair_texture",
                label: "Texture",
                type: "single-select",
                options: [
                  "Straight", "Body Wave", "Deep Wave",
                  "Kinky Curly", "Afro", "Yaki", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select texture",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "hair_tools",
            name: "Hair Tools",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "hair_tool_type",
                label: "Tool Type",
                type: "multi-select",
                options: [
                  "Hair Dryer", "Flat Iron / Straightener",
                  "Curling Iron / Wand", "Hair Clippers",
                  "Blow Dryer Brush", "Hot Comb", "Detangling Brush",
                  "Blow Dry Diffuser", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select tool type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "makeup",
        name: "Makeup",
        subcategories: [
          {
            id: "face_makeup",
            name: "Face Makeup",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "face_makeup_type",
                label: "Product",
                type: "multi-select",
                options: [
                  "Foundation", "Concealer", "BB Cream / CC Cream",
                  "Primer", "Setting Powder", "Setting Spray",
                  "Contour", "Blush", "Bronzer / Highlighter", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product",
              },
              {
                id: "shade_range",
                label: "Shade Range",
                type: "single-select",
                options: [
                  "Light", "Light-Medium", "Medium",
                  "Medium-Dark", "Dark", "Deep Dark",
                ],
                required: false,
                filterable: true,
                placeholder: "Select shade range",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "eye_lip_makeup",
            name: "Eyes & Lips",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "eye_lip_type",
                label: "Product",
                type: "multi-select",
                options: [
                  "Lipstick", "Lip Gloss", "Lip Liner",
                  "Mascara", "Eyeshadow Palette", "Eyeliner",
                  "Eyebrow Pencil / Powder", "False Lashes",
                  "Eye Primer", "Nail Polish", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "makeup_tools",
            name: "Makeup Tools & Brushes",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "makeup_tool_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Brush Set", "Sponge / Beauty Blender",
                  "Makeup Bag", "Mirror", "Lash Tools",
                  "Nail Art Tools", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "mens_grooming",
        name: "Men's Grooming",
        subcategories: [
          {
            id: "grooming_products",
            name: "Grooming Products",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "grooming_type",
                label: "Product Type",
                type: "multi-select",
                options: [
                  "Razor / Shaving Kit", "Shaving Cream / Gel",
                  "Beard Oil", "Beard Balm", "Beard Wax",
                  "Clippers / Trimmer", "Electric Shaver",
                  "Aftershave", "Men's Face Cream",
                  "Hair Pomade / Wax", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
        id: "oral_care",
        name: "Oral Care",
        subcategories: [
          {
            id: "oral_products",
            name: "Oral Care Products",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "oral_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Toothbrush (Manual)", "Electric Toothbrush",
                  "Toothpaste", "Mouthwash", "Floss",
                  "Teeth Whitening Kit", "Tongue Scraper",
                  "Water Flosser", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

    ],
  },

  // ══════════════════════════════════════════════════════════
  // 5. FOOD & GROCERIES
  // ══════════════════════════════════════════════════════════
  {
    id: "food",
    name: "Food & Groceries",
    icon: "ShoppingBag",
    subcategories: [
      {
        id: "fresh_produce",
        name: "Fresh Produce",
        subcategories: [
          {
            id: "fruits_veg",
            name: "Fruits & Vegetables",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "produce_type",
                label: "Type",
                type: "single-select",
                options: ["Fruits", "Vegetables", "Herbs", "Organic"],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "unit",
                label: "Sold By",
                type: "single-select",
                options: ["Per Kg", "Per Piece", "Per Bag", "Per Crate", "Per Bundle"],
                required: true,
                filterable: false,
                placeholder: "Select unit",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "meat_seafood",
        name: "Meat & Seafood",
        subcategories: [
          {
            id: "meat",
            name: "Meat & Seafood",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "meat_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Beef", "Chicken", "Pork", "Lamb / Goat",
                  "Turkey", "Fish", "Shrimp / Prawns",
                  "Crab / Lobster", "Tilapia", "Catfish",
                  "Smoked Fish", "Dried Fish", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select meat type",
              },
              {
                id: "meat_unit",
                label: "Sold By",
                type: "single-select",
                options: ["Per Kg", "Per Piece", "Per Pack", "Whole", "Per Tray"],
                required: true,
                filterable: false,
                placeholder: "Select unit",
              },
              {
                id: "halal",
                label: "Halal",
                type: "boolean",
                required: false,
                filterable: true,
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "pantry",
        name: "Pantry & Dry Goods",
        subcategories: [
          {
            id: "dry_goods",
            name: "Pantry Staples",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "pantry_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Rice", "Flour", "Pasta / Noodles",
                  "Beans & Lentils", "Oats", "Cornmeal / Banku Mix",
                  "Fufu / Pounded Yam Flour", "Spices & Seasonings",
                  "Cooking Oil", "Tomato Paste / Sauce",
                  "Canned Goods", "Sugar & Salt",
                  "Baking Supplies", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "beverages",
        name: "Beverages",
        subcategories: [
          {
            id: "drinks",
            name: "Drinks",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "beverage_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Water", "Juice", "Soft Drink / Soda",
                  "Coffee", "Tea / Herbal Tea", "Energy Drink",
                  "Beer", "Wine", "Spirits / Whisky",
                  "Smoothies & Health Drinks",
                  "Milk / Dairy Drinks", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "snacks",
        name: "Snacks & Confectionery",
        subcategories: [
          {
            id: "snacks_main",
            name: "Snacks",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "snack_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Chips / Crisps", "Chocolate", "Candy / Sweets",
                  "Cookies / Biscuits", "Nuts & Seeds",
                  "Popcorn", "Crackers", "Dried Fruit",
                  "Chin Chin", "Kelewele / Street Snacks", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "ready_to_eat",
        name: "Ready-to-Eat & Catering",
        subcategories: [
          {
            id: "cooked_food",
            name: "Cooked Meals & Catering",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "meal_type",
                label: "Meal / Service Type",
                type: "multi-select",
                options: [
                  "Local Dishes (Jollof, Banku, Fufu, etc.)",
                  "Continental / Fast Food", "Pastries & Cakes",
                  "Healthy Meals / Salads", "Catering Service (Event)",
                  "Meal Prep Subscriptions", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 6. HEALTH & WELLNESS
  // ══════════════════════════════════════════════════════════
  {
    id: "health",
    name: "Health & Wellness",
    icon: "Activity",
    subcategories: [
      {
        id: "vitamins_supplements",
        name: "Vitamins & Supplements",
        subcategories: [
          {
            id: "supplements",
            name: "Supplements",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "supplement_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Multivitamins", "Vitamin C", "Vitamin D",
                  "Omega-3 / Fish Oil", "Probiotics", "Calcium",
                  "Iron", "Folic Acid", "Protein Powder",
                  "Pre-Workout", "BCAA", "Weight Loss Supplements",
                  "Herbal / Natural Supplements", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "supplement_form",
                label: "Form",
                type: "single-select",
                options: ["Tablet / Capsule", "Powder", "Liquid / Syrup", "Gummies"],
                required: false,
                filterable: true,
                placeholder: "Select form",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "fitness_equipment",
        name: "Fitness Equipment",
        subcategories: [
          {
            id: "gym_equipment",
            name: "Gym & Fitness Equipment",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "fitness_type",
                label: "Equipment Type",
                type: "multi-select",
                options: [
                  "Dumbbells", "Barbell & Weight Plates",
                  "Resistance Bands", "Yoga Mat",
                  "Jump Rope", "Pull-Up Bar",
                  "Treadmill", "Exercise Bike",
                  "Rowing Machine", "Bench",
                  "Kettlebell", "Ab Roller",
                  "Gym Gloves", "Gym Bag", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select equipment type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "medical_supplies",
        name: "Medical Supplies",
        subcategories: [
          {
            id: "medical",
            name: "Medical & First Aid",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "medical_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "First Aid Kit", "Blood Pressure Monitor",
                  "Thermometer", "Glucose Monitor",
                  "Pulse Oximeter", "Wheelchair",
                  "Crutches", "Hearing Aid",
                  "Nebulizer", "Bandages / Dressings",
                  "Surgical Mask", "Gloves", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      
      {
        id: "mental_wellness",
        name: "Mental Wellness",
        subcategories: [
          {
            id: "wellness_products",
            name: "Wellness & Relaxation",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "wellness_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Aromatherapy / Essential Oils", "Diffuser",
                  "Meditation Aid", "Sleep Aid",
                  "Stress Ball", "Weighted Blanket",
                  "Herbal Tea (Wellness)", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },

      {
  id: "sexual_wellness",
  name: "Sexual Wellness",
  subcategories: [
    {
      id: "sexual_wellness_products",
      name: "Sexual Wellness Products",
      attributes: [
        PRICE, PRICE_RANGE, CONDITION,
        {
          id: "sw_product_type",
          label: "Product Type",
          type: "multi-select",
          options: [
            "Personal Massager",
            "Couples Device",
            "Lubricant",
            "Condoms & Protection",
            "Fertility & Ovulation",
            "Intimate Wash / Care",
            "Warming / Cooling Gel",
            "Supplement / Libido Support",
            "Accessory",
            "Other",
          ],
          required: true,
          filterable: true,
          placeholder: "Select product type",
        },
        GENDER,
        {
          id: "sw_material",
          label: "Material",
          type: "multi-select",
          options: [
            "Body-Safe Silicone",
            "ABS Plastic",
            "Glass",
            "Metal",
            "Natural / Organic",
            "Latex",
            "Latex-Free",
            "Other",
          ],
          required: false,
          filterable: true,
          placeholder: "Select material",
        },
        {
          id: "sw_features",
          label: "Features",
          type: "multi-select",
          options: [
            "Waterproof",
            "Rechargeable / USB",
            "Battery-Operated",
            "Noise-Quiet",
            "App-Controlled",
            "Discreet Packaging",
            "Travel-Sized",
          ],
          required: false,
          filterable: true,
          placeholder: "Select features",
        },
        BRAND, NEGOTIABLE, DELIVERY, LOCATION,
      ],
    },
  ],
},
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 7. SPORTS & OUTDOORS
  // ══════════════════════════════════════════════════════════
  {
    id: "sports",
    name: "Sports & Outdoors",
    icon: "Trophy",
    subcategories: [
      {
        id: "team_sports",
        name: "Team Sports",
        subcategories: [
          {
            id: "team_sports_equipment",
            name: "Team Sports Equipment",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "sport",
                label: "Sport",
                type: "single-select",
                options: [
                  "Football / Soccer", "Basketball", "Rugby",
                  "Cricket", "Volleyball", "Hockey",
                  "Baseball", "Handball", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select sport",
              },
              {
                id: "equipment_type",
                label: "Equipment Type",
                type: "multi-select",
                options: [
                  "Ball", "Jersey / Kit", "Boots / Shoes",
                  "Goalkeeper Gloves", "Shin Guards",
                  "Goal Post", "Pump", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select equipment",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "outdoor_adventure",
        name: "Outdoor & Adventure",
        subcategories: [
          {
            id: "outdoor_gear",
            name: "Outdoor Gear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "outdoor_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Tent", "Sleeping Bag", "Camping Cookware",
                  "Hiking Boots", "Backpack (Hiking)",
                  "Climbing Gear", "Cycling Equipment",
                  "Running Shoes", "Water Bottle / Hydration",
                  "Navigation / GPS", "Head Torch", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "water_sports",
        name: "Water Sports",
        subcategories: [
          {
            id: "water_sports_equip",
            name: "Water Sports Equipment",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "water_sport",
                label: "Type",
                type: "multi-select",
                options: [
                  "Swimming Gear", "Surfboard", "Kayak / Canoe",
                  "Scuba Diving Gear", "Fishing Rod & Tackle",
                  "Life Jacket", "Snorkel Set", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 8. KIDS & BABY
  // ══════════════════════════════════════════════════════════
  {
    id: "kids",
    name: "Kids & Baby",
    icon: "🧸",
    subcategories: [
      {
        id: "toys_games",
        name: "Toys & Games",
        subcategories: [
          {
            id: "toys",
            name: "Toys",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "toy_type",
                label: "Toy Type",
                type: "multi-select",
                options: [
                  "Action Figures", "Dolls & Accessories",
                  "Building Blocks / LEGO", "Board Games",
                  "Educational Toys", "Remote Control Toys",
                  "Arts & Crafts", "Outdoor Play",
                  "Puzzles", "Musical Toys",
                  "Stuffed Animals / Plush", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select toy type",
              },
              {
                id: "age_group",
                label: "Age Group",
                type: "multi-select",
                options: [
                  "0–2 years", "3–5 years",
                  "6–8 years", "9–12 years", "13+ years",
                ],
                required: true,
                filterable: true,
                placeholder: "Select age group",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "baby_essentials",
        name: "Baby Essentials",
        subcategories: [
          {
            id: "baby_products",
            name: "Baby Products",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "baby_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Diapers & Wipes", "Baby Food & Formula",
                  "Bottles & Feeding", "Baby Monitor",
                  "Baby Carrier / Wrap", "Swings & Bouncers",
                  "Baby Bath Set", "Baby Skincare",
                  "Nursing / Breastfeeding", "Pacifiers", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "nursery",
        name: "Nursery & Strollers",
        subcategories: [
          {
            id: "nursery_items",
            name: "Nursery & Travel",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "nursery_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Crib / Cot", "Changing Table",
                  "Nursing Chair / Rocking Chair",
                  "Stroller / Pram", "Car Seat",
                  "Baby Bouncer", "Play Yard / Playpen",
                  "Baby Bedding", "Nursery Decor", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 9. VEHICLES
  // ══════════════════════════════════════════════════════════
  {
    id: "vehicles",
    name: "Vehicles",
    icon: "Car",
    subcategories: [
      {
        id: "cars",
        name: "Cars",
        subcategories: [
          {
            id: "cars_for_sale",
            name: "Cars for Sale",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "car_make",
                label: "Make / Brand",
                type: "single-select",
                options: [
                  "Toyota", "Honda", "Hyundai", "Kia", "Nissan",
                  "Mercedes-Benz", "BMW", "Lexus", "Ford",
                  "Chevrolet", "Volkswagen", "Audi", "Peugeot",
                  "Mitsubishi", "Suzuki", "Mazda", "Jeep",
                  "Land Rover", "Porsche", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select make",
              },
              {
                id: "car_model",
                label: "Model",
                type: "text",
                required: true,
                filterable: false,
                placeholder: "e.g. Camry, Corolla, Civic",
              },
              {
                id: "car_year",
                label: "Year",
                type: "range",
                required: true,
                filterable: true,
                placeholder: "e.g. 2018",
              },
              {
                id: "car_condition",
                label: "Condition",
                type: "single-select",
                options: [
                  "Brand New", "Foreign Used (Tokunbo)",
                  "Locally Used (Nigerian/Ghanaian Used)",
                ],
                required: true,
                filterable: true,
                placeholder: "Select condition",
              },
              {
                id: "mileage",
                label: "Mileage (km)",
                type: "number",
                required: false,
                filterable: true,
                placeholder: "e.g. 45000",
              },
              {
                id: "transmission",
                label: "Transmission",
                type: "single-select",
                options: ["Automatic", "Manual", "Semi-Automatic"],
                required: true,
                filterable: true,
                placeholder: "Select transmission",
              },
              {
                id: "fuel_type",
                label: "Fuel Type",
                type: "single-select",
                options: ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"],
                required: true,
                filterable: true,
                placeholder: "Select fuel type",
              },
              {
                id: "body_type",
                label: "Body Type",
                type: "single-select",
                options: [
                  "Sedan", "SUV / Jeep", "Hatchback", "Pickup Truck",
                  "Van / Minivan", "Coupe", "Convertible", "Wagon",
                ],
                required: false,
                filterable: true,
                placeholder: "Select body type",
              },
              {
                id: "color_car",
                label: "Color",
                type: "single-select",
                options: [
                  "Black", "White", "Silver / Grey", "Red",
                  "Blue", "Green", "Gold / Champagne", "Brown", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select color",
              },
              {
                id: "registered",
                label: "Registered",
                type: "boolean",
                required: false,
                filterable: true,
              },
              {
                id: "ac",
                label: "Air Conditioning",
                type: "boolean",
                required: false,
                filterable: true,
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "motorcycles",
        name: "Motorcycles & Tricycles",
        subcategories: [
          {
            id: "motos",
            name: "Motorcycles & Bikes",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "moto_type",
                label: "Type",
                type: "single-select",
                options: [
                  "Motorcycle (Okada)", "Tricycle (Keke)",
                  "Dirt Bike", "Sport Bike", "Scooter",
                  "Electric Bike", "Bicycle", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "moto_brand",
                label: "Brand",
                type: "single-select",
                options: [
                  "Bajaj", "Honda", "Yamaha", "Haojue",
                  "TVS", "Jincheng", "Qlink", "Daylong", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select brand",
              },
              {
                id: "moto_year",
                label: "Year",
                type: "number",
                required: false,
                filterable: true,
                placeholder: "e.g. 2020",
              },
              {
                id: "engine_cc",
                label: "Engine (CC)",
                type: "single-select",
                options: ["50cc", "100cc", "125cc", "150cc", "200cc", "250cc+"],
                required: false,
                filterable: true,
                placeholder: "Select engine size",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "trucks_buses",
        name: "Trucks, Buses & Commercial",
        subcategories: [
          {
            id: "commercial_vehicles",
            name: "Commercial Vehicles",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "commercial_type",
                label: "Type",
                type: "single-select",
                options: [
                  "Bus / Minibus", "Truck / Lorry",
                  "Pickup Truck (Commercial)",
                  "Tanker", "Trailer", "Tractor",
                  "Forklift", "Van (Commercial)", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "comm_brand",
                label: "Brand",
                type: "text",
                required: false,
                filterable: true,
                placeholder: "e.g. Tata, Mercedes, Man Diesel",
              },
              {
                id: "comm_year",
                label: "Year",
                type: "number",
                required: false,
                filterable: true,
                placeholder: "e.g. 2015",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "vehicle_parts",
        name: "Spare Parts & Accessories",
        subcategories: [
          {
            id: "spare_parts",
            name: "Spare Parts",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "parts_type",
                label: "Part Type",
                type: "multi-select",
                options: [
                  "Engine Parts", "Brakes", "Tyres / Rims",
                  "Battery", "Exhaust", "Suspension",
                  "Gearbox", "Body Parts / Panel",
                  "Lights & Electrical", "Filters",
                  "Oil & Lubricants", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select part type",
              },
              {
                id: "compatible_car",
                label: "Compatible With",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. Toyota Camry 2015",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "car_accessories",
            name: "Car Accessories",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "car_acc_type",
                label: "Accessory Type",
                type: "multi-select",
                options: [
                  "Seat Covers", "Car Mats", "Dash Cam",
                  "Car Audio / Speakers", "Phone Holder",
                  "Car Charger", "Window Tint", "Air Freshener",
                  "Steering Wheel Cover", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 10. PROPERTY & REAL ESTATE
  // ══════════════════════════════════════════════════════════
  {
    id: "property",
    name: "Property & Real Estate",
    icon: "Building",
    subcategories: [
      {
        id: "houses_for_sale",
        name: "Houses for Sale",
        subcategories: [
          {
            id: "residential_sale",
            name: "Residential for Sale",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "property_type_sale",
                label: "Property Type",
                type: "single-select",
                options: [
                  "Apartment / Flat", "Detached House",
                  "Semi-Detached", "Townhouse / Terrace",
                  "Duplex", "Bungalow", "Villa",
                  "Penthouse", "Studio", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select property type",
              },
              {
                id: "bedrooms",
                label: "Bedrooms",
                type: "single-select",
                options: ["Studio", "1", "2", "3", "4", "5", "6+"],
                required: true,
                filterable: true,
                placeholder: "Number of bedrooms",
              },
              {
                id: "bathrooms",
                label: "Bathrooms",
                type: "single-select",
                options: ["1", "2", "3", "4", "5+"],
                required: false,
                filterable: true,
                placeholder: "Number of bathrooms",
              },
              {
                id: "land_size",
                label: "Land Size",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 500 sqm, 1 plot",
              },
              {
                id: "furnished",
                label: "Furnished",
                type: "single-select",
                options: ["Fully Furnished", "Semi-Furnished", "Unfurnished"],
                required: false,
                filterable: true,
                placeholder: "Select furnishing",
              },
              {
                id: "amenities",
                label: "Amenities",
                type: "multi-select",
                options: [
                  "Parking", "Swimming Pool", "Generator / Inverter",
                  "Borehole / Water", "Security / Guards",
                  "CCTV", "Gym", "Garden", "Boys Quarters", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select amenities",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "houses_for_rent",
        name: "Houses for Rent",
        subcategories: [
          {
            id: "residential_rent",
            name: "Residential for Rent",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "rent_period",
                label: "Rent Period",
                type: "single-select",
                options: ["Per Month", "Per Year", "2 Years", "Per Night"],
                required: true,
                filterable: true,
                placeholder: "Select rent period",
              },
              {
                id: "property_type_rent",
                label: "Property Type",
                type: "single-select",
                options: [
                  "Apartment / Flat", "Self-Contained",
                  "Room & Parlour", "Shared Room",
                  "Detached House", "Semi-Detached",
                  "Duplex", "Studio", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select property type",
              },
              {
                id: "bedrooms_rent",
                label: "Bedrooms",
                type: "single-select",
                options: ["Studio / Self-Con", "1", "2", "3", "4", "5+"],
                required: true,
                filterable: true,
                placeholder: "Number of bedrooms",
              },
              {
                id: "furnished_rent",
                label: "Furnished",
                type: "single-select",
                options: ["Fully Furnished", "Semi-Furnished", "Unfurnished"],
                required: false,
                filterable: true,
                placeholder: "Select furnishing",
              },
              {
                id: "amenities_rent",
                label: "Amenities",
                type: "multi-select",
                options: [
                  "Parking", "Generator / Inverter",
                  "Borehole / Water", "Security", "CCTV",
                  "Internet / WiFi", "A/C", "Tiled Floors", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select amenities",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "land",
        name: "Land & Plots",
        subcategories: [
          {
            id: "land_sale",
            name: "Land for Sale",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "land_type",
                label: "Land Type",
                type: "single-select",
                options: [
                  "Residential Plot", "Commercial Land",
                  "Agricultural Land", "Industrial Land",
                  "Mixed Use", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select land type",
              },
              {
                id: "land_area",
                label: "Land Area",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 1 Plot (100x50ft), 500 sqm",
              },
              {
                id: "title",
                label: "Title / Documentation",
                type: "multi-select",
                options: [
                  "C of O (Certificate of Occupancy)",
                  "Deed of Assignment",
                  "Gazette", "Freehold",
                  "Leasehold", "Survey Plan",
                  "Indenture", "Site Plan", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select title type",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "commercial_property",
        name: "Commercial Property",
        subcategories: [
          {
            id: "commercial",
            name: "Commercial Property",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "commercial_prop_type",
                label: "Type",
                type: "single-select",
                options: [
                  "Office Space", "Shop / Store",
                  "Warehouse", "Factory / Industrial",
                  "Event Hall", "Hotel / Guest House",
                  "Filling Station", "Plaza / Mall Unit", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "comm_purpose",
                label: "Purpose",
                type: "single-select",
                options: ["For Sale", "For Rent", "For Lease"],
                required: true,
                filterable: true,
                placeholder: "For sale or rent?",
              },
              {
                id: "floor_area",
                label: "Floor Area",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 200 sqm",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "shortlet",
        name: "Short-Let & Vacation",
        subcategories: [
          {
            id: "shortlet_apartments",
            name: "Short-Let Apartments",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "shortlet_type",
                label: "Property Type",
                type: "single-select",
                options: [
                  "Studio Apartment", "1-Bedroom Apartment",
                  "2-Bedroom Apartment", "3+ Bedroom Apartment",
                  "Duplex", "Penthouse", "Villa", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "shortlet_period",
                label: "Minimum Stay",
                type: "single-select",
                options: ["Per Night", "Per Weekend", "Weekly", "Monthly"],
                required: true,
                filterable: true,
                placeholder: "Select minimum stay",
              },
              {
                id: "shortlet_amenities",
                label: "Amenities",
                type: "multi-select",
                options: [
                  "WiFi", "A/C", "Swimming Pool", "Gym",
                  "Generator / Inverter", "DSTV / Netflix",
                  "Kitchen", "Parking", "Security", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select amenities",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 11. JOBS
  // ══════════════════════════════════════════════════════════
  {
    id: "jobs",
    name: "Jobs",
    icon: "Briefcase",
    subcategories: [
      {
        id: "jobs_listings",
        name: "Job Listings",
        subcategories: [
          {
            id: "job_post",
            name: "Jobs",
            attributes: [
              {
                id: "job_type",
                label: "Job Type",
                type: "single-select",
                options: [
                  "Full-Time", "Part-Time", "Contract",
                  "Freelance / Remote", "Internship", "Volunteer",
                ],
                required: true,
                filterable: true,
                placeholder: "Select job type",
              },
              {
                id: "industry",
                label: "Industry",
                type: "single-select",
                options: [
                  "Technology & IT", "Finance & Banking",
                  "Sales & Marketing", "Healthcare",
                  "Education & Training", "Hospitality & Tourism",
                  "Construction & Engineering", "Media & Creative",
                  "Logistics & Transport", "Manufacturing",
                  "Agriculture", "Legal",
                  "Oil & Gas", "Retail",
                  "NGO / Non-Profit", "Government / Public Sector",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select industry",
              },
              {
                id: "experience_level",
                label: "Experience Level",
                type: "single-select",
                options: [
                  "Entry Level (0–1 yrs)", "Junior (1–3 yrs)",
                  "Mid-Level (3–5 yrs)", "Senior (5–10 yrs)",
                  "Executive / Director (10+ yrs)",
                ],
                required: false,
                filterable: true,
                placeholder: "Select experience level",
              },
              {
                id: "salary_range",
                label: "Salary Range",
                type: "range",
                required: false,
                filterable: true,
              },
              {
                id: "education",
                label: "Minimum Education",
                type: "single-select",
                options: [
                  "No Requirement", "WASSCE / O-Level",
                  "OND / HND", "Bachelor's Degree",
                  "Master's Degree", "PhD", "Professional Certificate",
                ],
                required: false,
                filterable: true,
                placeholder: "Select education",
              },
              LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 12. SERVICES
  // ══════════════════════════════════════════════════════════
  {
    id: "services",
    name: "Services",
    icon: "Wrench",
    subcategories: [
      {
        id: "beauty_services",
        name: "Beauty & Wellness Services",
        subcategories: [
          {
            id: "spa_salon",
            name: "Spa & Salon",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "spa_service_type",
                label: "Service Type",
                type: "multi-select",
                options: [
                  "Haircut & Styling", "Hair Braiding / Weaving",
                  "Locs / Dreadlocks", "Hair Coloring",
                  "Makeup (Bridal)", "Makeup (Everyday)",
                  "Facial / Skin Treatment",
                  "Massage (Body)", "Massage (Deep Tissue)",
                  "Manicure & Pedicure", "Nail Art",
                  "Waxing / Threading", "Eyebrow Shaping",
                  "Eyelash Extensions",
                  "Steam Bath / Sauna",
                  "Men's Haircut / Barbing",
                  "Beard Grooming", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select service(s)",
              },
              {
                id: "service_duration",
                label: "Duration",
                type: "single-select",
                options: [
                  "Under 30 min", "30–60 min",
                  "1–2 hours", "2–3 hours", "Half Day", "Full Day",
                ],
                required: false,
                filterable: true,
                placeholder: "Select duration",
              },
              {
                id: "home_service",
                label: "Home Service Available",
                type: "boolean",
                required: false,
                filterable: true,
              },
              LOCATION,
            ],
          },
        ],
      },
      {
        id: "home_services",
        name: "Home & Repair Services",
        subcategories: [
          {
            id: "repairs_maintenance",
            name: "Repairs & Maintenance",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "repair_type",
                label: "Service Type",
                type: "multi-select",
                options: [
                  "Plumbing", "Electrical / Wiring",
                  "AC Installation & Repair",
                  "Painting", "Tiling",
                  "Carpentry & Furniture",
                  "Appliance Repair", "Phone / Laptop Repair",
                  "Cleaning (Deep Clean)", "Cleaning (Regular)",
                  "Fumigation / Pest Control",
                  "Generator Repair", "Borehole Drilling",
                  "Interior Design", "Home Renovation",
                  "Roofing", "Welding & Fabrication", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select service type",
              },
              {
                id: "emergency",
                label: "Emergency / 24hr Available",
                type: "boolean",
                required: false,
                filterable: true,
              },
              LOCATION,
            ],
          },
        ],
      },
      {
        id: "professional_services",
        name: "Professional Services",
        subcategories: [
          {
            id: "business_professional",
            name: "Business & Professional",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "professional_type",
                label: "Service Type",
                type: "multi-select",
                options: [
                  "Accounting & Bookkeeping",
                  "Legal / Lawyer",
                  "HR & Recruitment",
                  "Business Registration / CAC",
                  "Tax & Financial Advisory",
                  "Insurance",
                  "Marketing & Advertising",
                  "Social Media Management",
                  "SEO & Digital Marketing",
                  "Website Design & Development",
                  "App Development",
                  "Graphic Design",
                  "Content Writing / Copywriting",
                  "Translation & Interpretation",
                  "IT Support & Networking",
                  "Consulting", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select service type",
              },
              LOCATION,
            ],
          },
        ],
      },
      {
        id: "education_tutoring",
        name: "Education & Tutoring",
        subcategories: [
          {
            id: "tutoring",
            name: "Tutoring & Lessons",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "tutor_subject",
                label: "Subject / Area",
                type: "multi-select",
                options: [
                  "Mathematics", "English Language",
                  "Sciences (Physics, Chemistry, Biology)",
                  "Social Studies / History",
                  "Primary School Subjects",
                  "WASSCE / BECE Prep",
                  "University Courses",
                  "Computer / Coding",
                  "French / Foreign Language",
                  "Music (Instrument / Vocal)",
                  "Art & Drawing", "Dance",
                  "Driving Lessons",
                  "Business & Professional Skills",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select subject",
              },
              {
                id: "tutor_mode",
                label: "Mode",
                type: "single-select",
                options: ["In-Person", "Online", "Both"],
                required: true,
                filterable: true,
                placeholder: "Select mode",
              },
              {
                id: "student_level",
                label: "Student Level",
                type: "multi-select",
                options: [
                  "Nursery / Kindergarten",
                  "Primary School",
                  "Junior Secondary (JSS / JHS)",
                  "Senior Secondary (SSS / SHS)",
                  "University / Tertiary",
                  "Adult / Professional",
                ],
                required: false,
                filterable: true,
                placeholder: "Select student level",
              },
              LOCATION,
            ],
          },
        ],
      },
      {
        id: "health_services",
        name: "Health & Medical Services",
        subcategories: [
          {
            id: "medical_services",
            name: "Medical Services",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "medical_service_type",
                label: "Service Type",
                type: "multi-select",
                options: [
                  "General Practitioner / Doctor",
                  "Dentist", "Eye Care / Optician",
                  "Physiotherapy",
                  "Nursing / Home Care",
                  "Mental Health / Counseling",
                  "Lab Tests & Diagnostics",
                  "Pharmacy",
                  "Dietitian / Nutritionist",
                  "Traditional / Herbal Medicine",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select service type",
              },
              LOCATION,
            ],
          },
        ],
      },
      {
        id: "event_services",
        name: "Events & Entertainment",
        subcategories: [
          {
            id: "events",
            name: "Event Services",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "event_type",
                label: "Service Type",
                type: "multi-select",
                options: [
                  "Event Planning / Coordination",
                  "Catering & Food",
                  "Photography", "Videography",
                  "DJ & Music",
                  "MC / Host",
                  "Live Band",
                  "Decoration & Floral",
                  "Hall / Venue Rental",
                  "Cake & Pastries",
                  "Makeup (Events)",
                  "Ushering & Waiters",
                  "Sound & Lighting",
                  "Bouncy Castle / Entertainment",
                  "Printing & Branding",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select service type",
              },
              {
                id: "event_for",
                label: "Event Type",
                type: "multi-select",
                options: [
                  "Wedding", "Birthday Party",
                  "Corporate Event", "Burial / Funeral",
                  "Baby Shower", "Naming Ceremony",
                  "Graduation", "Outdoor Event",
                  "Concert", "Other",
                ],
                required: false,
                filterable: true,
                placeholder: "Select event type",
              },
              LOCATION,
            ],
          },
        ],
      },
      {
        id: "transport_logistics",
        name: "Transport & Logistics",
        subcategories: [
          {
            id: "transport",
            name: "Transport Services",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "transport_type",
                label: "Service Type",
                type: "multi-select",
                options: [
                  "Ride-Hailing / Taxi",
                  "Bus Charter / Hire",
                  "Truck / Haulage",
                  "Delivery / Dispatch (Motorcycle)",
                  "Delivery / Dispatch (Van / Car)",
                  "Moving & Relocation",
                  "Freight & Shipping",
                  "Airport Transfer",
                  "School Bus",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select service type",
              },
              LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 13. AGRICULTURE & FARMING
  // ══════════════════════════════════════════════════════════
  {
    id: "agriculture",
    name: "Agriculture & Farming",
    icon: "Sprout",
    subcategories: [
      {
        id: "livestock",
        name: "Livestock & Poultry",
        subcategories: [
          {
            id: "animals",
            name: "Animals",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "animal_type",
                label: "Animal Type",
                type: "single-select",
                options: [
                  "Cattle / Cow", "Goat", "Sheep",
                  "Pig", "Chicken / Poultry",
                  "Turkey", "Duck",
                  "Rabbit", "Fish (Farm)",
                  "Snail", "Grasscutter / Cane Rat", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select animal type",
              },
              {
                id: "animal_quantity",
                label: "Quantity",
                type: "number",
                required: false,
                filterable: false,
                placeholder: "e.g. 10",
              },
              {
                id: "vaccinated",
                label: "Vaccinated",
                type: "boolean",
                required: false,
                filterable: true,
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "farm_produce",
        name: "Farm Produce (Wholesale)",
        subcategories: [
          {
            id: "wholesale_produce",
            name: "Wholesale Produce",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "produce_category",
                label: "Produce",
                type: "multi-select",
                options: [
                  "Maize / Corn", "Rice (Paddy)", "Cassava",
                  "Yam", "Plantain / Banana",
                  "Tomatoes", "Pepper", "Onions",
                  "Cocoa", "Shea Nuts",
                  "Groundnuts / Peanuts",
                  "Palm Oil / Palm Nuts",
                  "Soybeans", "Vegetables", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select produce",
              },
              {
                id: "produce_unit",
                label: "Sold By",
                type: "single-select",
                options: [
                  "Per Kg", "Per Bag (50kg)", "Per Tonne",
                  "Per Crate", "Per Bundle", "Per Piece",
                ],
                required: true,
                filterable: false,
                placeholder: "Select unit",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "farm_equipment",
        name: "Farm Equipment & Inputs",
        subcategories: [
          {
            id: "agric_equipment",
            name: "Farm Equipment",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "farm_equip_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Tractor", "Plough", "Harvester",
                  "Irrigation Equipment", "Sprayer",
                  "Fertilizer & Chemicals",
                  "Seeds & Seedlings",
                  "Greenhouse / Nets",
                  "Fish Pond Equipment",
                  "Poultry Equipment",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 14. POWER & SOLAR ENERGY
  // ══════════════════════════════════════════════════════════
  {
    id: "power_energy",
    name: "Power & Solar Energy",
    icon: "Zap",
    subcategories: [
      {
        id: "solar",
        name: "Solar Equipment",
        subcategories: [
          {
            id: "solar_products",
            name: "Solar Products",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "solar_type",
                label: "Product Type",
                type: "multi-select",
                options: [
                  "Solar Panel", "Solar Inverter",
                  "Solar Battery", "Complete Solar Kit / System",
                  "Solar Street Light",
                  "Solar Water Pump",
                  "Solar Water Heater",
                  "Solar Charge Controller",
                  "Solar Cables & Accessories",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product type",
              },
              {
                id: "solar_capacity",
                label: "Capacity",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 200W panel, 3.5kVA inverter",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "generators",
        name: "Generators",
        subcategories: [
          {
            id: "generators_main",
            name: "Generators",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "gen_type",
                label: "Type",
                type: "single-select",
                options: [
                  "Petrol Generator", "Diesel Generator",
                  "Gas Generator", "Inverter Generator",
                  "Industrial Generator", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "gen_capacity",
                label: "Capacity (KVA)",
                type: "single-select",
                options: [
                  "1–2 KVA", "2.5–3.5 KVA", "5–7.5 KVA",
                  "10–12.5 KVA", "20–40 KVA", "50 KVA+",
                ],
                required: false,
                filterable: true,
                placeholder: "Select capacity",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "inverters_batteries",
        name: "Inverters & Batteries",
        subcategories: [
          {
            id: "inverters",
            name: "Inverters & UPS",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "inverter_type",
                label: "Type",
                type: "single-select",
                options: ["Inverter", "UPS", "Battery Backup System"],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "inverter_capacity",
                label: "Capacity (VA / KVA)",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 1.5KVA, 5KVA",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
          {
            id: "batteries",
            name: "Batteries",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "battery_type",
                label: "Battery Type",
                type: "single-select",
                options: [
                  "Car / Automotive Battery",
                  "Deep Cycle Battery",
                  "Lithium Battery",
                  "Gel Battery",
                  "Tubular Battery",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "battery_ah",
                label: "Capacity (Ah)",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 100Ah, 200Ah",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 15. BOOKS & MEDIA
  // ══════════════════════════════════════════════════════════
  {
    id: "books",
    name: "Books & Media",
    icon: "Book",
    subcategories: [
      {
        id: "books_main",
        name: "Books",
        subcategories: [
          {
            id: "books_all",
            name: "Books",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "book_genre",
                label: "Genre",
                type: "multi-select",
                options: [
                  "Fiction", "Non-Fiction", "Biography / Memoir",
                  "Self-Help / Motivation",
                  "Business & Finance",
                  "Academic / Textbook",
                  "Children's Book",
                  "Comics & Graphic Novel",
                  "Religion & Spirituality",
                  "African Literature",
                  "Science & Technology",
                  "History & Politics",
                  "Health & Wellness",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select genre",
              },
              {
                id: "book_format",
                label: "Format",
                type: "single-select",
                options: ["Paperback", "Hardcover", "E-Book", "Audiobook"],
                required: false,
                filterable: true,
                placeholder: "Select format",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 16. OFFICE & BUSINESS
  // ══════════════════════════════════════════════════════════
  {
    id: "office",
    name: "Office & Business",
    icon: "Printer",
    subcategories: [
      {
        id: "office_furniture_main",
        name: "Office Furniture",
        subcategories: [
          {
            id: "office_furn",
            name: "Office Furniture",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION, COLOR,
              {
                id: "office_furn_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Office Chair", "Office Desk",
                  "Standing Desk", "Filing Cabinet",
                  "Bookshelf", "Conference Table",
                  "Reception Furniture", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "office_electronics",
        name: "Office Electronics",
        subcategories: [
          {
            id: "office_elec",
            name: "Office Machines",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "office_elec_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Printer", "Scanner", "Photocopier",
                  "Projector", "Shredder",
                  "Label Maker", "POS Machine",
                  "CCTV System", "Intercom", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "office_supplies_main",
        name: "Office Supplies",
        subcategories: [
          {
            id: "office_supplies",
            name: "Stationery & Supplies",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "supply_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Paper & Notebooks", "Pens & Markers",
                  "Staplers & Clips", "Envelopes",
                  "Tape & Adhesive", "Packaging Supplies",
                  "Signage / Banners", "Stamps & Ink",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 17. PETS
  // ══════════════════════════════════════════════════════════
  {
    id: "pets",
    name: "Pet Supplies",
    icon: "Dog",
    subcategories: [
      {
        id: "pets_for_sale",
        name: "Pets for Sale",
        subcategories: [
          {
            id: "pets_sale",
            name: "Pets",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "pet_type",
                label: "Animal",
                type: "single-select",
                options: [
                  "Dog", "Cat", "Rabbit",
                  "Parrot / Bird", "Turtle",
                  "Hamster / Guinea Pig",
                  "Fish (Ornamental)",
                  "Reptile", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select animal",
              },
              {
                id: "pet_breed",
                label: "Breed",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. German Shepherd, Maltese",
              },
              {
                id: "pet_age",
                label: "Age",
                type: "single-select",
                options: [
                  "0–3 months", "3–6 months",
                  "6–12 months", "1–2 years", "2+ years",
                ],
                required: false,
                filterable: true,
                placeholder: "Select age",
              },
              {
                id: "vaccinated_pet",
                label: "Vaccinated",
                type: "boolean",
                required: false,
                filterable: true,
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "pet_supplies",
        name: "Pet Supplies & Accessories",
        subcategories: [
          {
            id: "pet_products",
            name: "Pet Products",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "pet_product_for",
                label: "For",
                type: "single-select",
                options: ["Dogs", "Cats", "Birds", "Fish", "Small Animals", "All Pets"],
                required: true,
                filterable: true,
                placeholder: "Select pet type",
              },
              {
                id: "pet_product_type",
                label: "Product Type",
                type: "multi-select",
                options: [
                  "Food & Treats", "Cage / Kennel / Bed",
                  "Leash & Collar", "Toys",
                  "Grooming Products",
                  "Aquarium & Fish Tank",
                  "Vitamins & Health",
                  "Clothing & Accessories", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select product type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 18. INDUSTRIAL & TOOLS
  // ══════════════════════════════════════════════════════════
  {
    id: "industrial",
    name: "Industrial & Tools",
    icon: "Wrench",
    subcategories: [
      {
        id: "hand_tools",
        name: "Hand Tools",
        subcategories: [
          {
            id: "hand_tools_main",
            name: "Hand Tools",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "hand_tool_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Screwdrivers", "Hammers", "Wrenches",
                  "Pliers", "Measuring Tape", "Level",
                  "Chisels", "Files & Rasps",
                  "Tool Set / Kit", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "power_tools",
        name: "Power Tools",
        subcategories: [
          {
            id: "power_tools_main",
            name: "Power Tools",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "power_tool_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Drill / Impact Driver", "Angle Grinder",
                  "Circular Saw", "Jigsaw",
                  "Nail Gun", "Sander",
                  "Heat Gun", "Rotary Hammer",
                  "Tile Cutter", "Welding Machine",
                  "Air Compressor", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "safety_equipment",
        name: "Safety Equipment",
        subcategories: [
          {
            id: "safety_gear",
            name: "Safety Gear",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "safety_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Safety Helmet", "Gloves",
                  "Safety Vest", "Goggles / Face Shield",
                  "Ear Protection", "Safety Boots",
                  "Harness / Fall Protection",
                  "Fire Extinguisher",
                  "First Aid Kit (Industrial)",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              BRAND, NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "building_materials",
        name: "Building Materials",
        subcategories: [
          {
            id: "building_mat",
            name: "Building Materials",
            attributes: [
              PRICE, PRICE_RANGE, CONDITION,
              {
                id: "material_type",
                label: "Material Type",
                type: "multi-select",
                options: [
                  "Cement", "Sand & Gravel",
                  "Iron Rods / Reinforcement",
                  "Roofing Sheets",
                  "Wood / Timber / Plywood",
                  "Tiles (Floor & Wall)",
                  "Paint", "Plumbing Pipes & Fittings",
                  "Electrical Wires & Cables",
                  "Glass", "Insulation",
                  "Bricks & Blocks", "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select material",
              },
              {
                id: "material_quantity",
                label: "Quantity / Unit",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. 50 bags, 10 bundles",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════
  // 19. DIGITAL GOODS
  // ══════════════════════════════════════════════════════════
  {
    id: "digital",
    name: "Digital Goods",
    icon: "Monitor",
    subcategories: [
      {
        id: "gift_cards",
        name: "Gift Cards & Vouchers",
        subcategories: [
          {
            id: "gift_cards_main",
            name: "Gift Cards",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "gift_card_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "iTunes / Apple Gift Card",
                  "Google Play Gift Card",
                  "Amazon Gift Card",
                  "Steam Gift Card",
                  "Netflix Voucher",
                  "Spotify Voucher",
                  "PlayStation / Xbox Gift Card",
                  "Shopping Gift Card",
                  "Food Delivery Voucher",
                  "Fuel Voucher",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select gift card type",
              },
              {
                id: "gift_card_value",
                label: "Card Value",
                type: "text",
                required: false,
                filterable: false,
                placeholder: "e.g. $25, $50, $100",
              },
              NEGOTIABLE, DELIVERY, LOCATION,
            ],
          },
        ],
      },
      {
        id: "software",
        name: "Software & Subscriptions",
        subcategories: [
          {
            id: "software_main",
            name: "Software & Apps",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "software_type",
                label: "Type",
                type: "multi-select",
                options: [
                  "Antivirus / Security",
                  "Office / Productivity",
                  "Design Software",
                  "Accounting Software",
                  "Streaming Subscription",
                  "Cloud Storage",
                  "VPN",
                  "SaaS / Business Tool",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select type",
              },
              {
                id: "software_duration",
                label: "License Duration",
                type: "single-select",
                options: [
                  "1 Month", "3 Months", "6 Months",
                  "1 Year", "Lifetime",
                ],
                required: false,
                filterable: true,
                placeholder: "Select duration",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
      {
        id: "online_courses",
        name: "Online Courses",
        subcategories: [
          {
            id: "courses",
            name: "Courses & Training",
            attributes: [
              PRICE, PRICE_RANGE,
              {
                id: "course_category",
                label: "Category",
                type: "multi-select",
                options: [
                  "Tech & Programming",
                  "Business & Entrepreneurship",
                  "Finance & Investing",
                  "Creative Arts & Design",
                  "Marketing & Social Media",
                  "Health & Fitness",
                  "Language Learning",
                  "Personal Development",
                  "Academic / School Support",
                  "Other",
                ],
                required: true,
                filterable: true,
                placeholder: "Select category",
              },
              {
                id: "course_format",
                label: "Format",
                type: "single-select",
                options: ["Video Course", "Live Class", "PDF / E-Book", "Bootcamp"],
                required: false,
                filterable: true,
                placeholder: "Select format",
              },
              NEGOTIABLE, LOCATION,
            ],
          },
        ],
      },
    ],
  },
  {
    id: "photography",
    name: "Photography & Media",
    icon: "Camera",
    subcategories: [
      {
        id: "photography_services",
        name: "Photography & Videography",
        attributes: [
          PRICE, PRICE_RANGE,
          {
            id: "photo_service_type",
            label: "Service Type",
            type: "multi-select",
            options: [
              "Event Photography", "Wedding Photography",
              "Studio / Portrait", "Product / Commercial",
              "Drone / Aerial Shots", "Videography / Cinematography",
              "Photo / Video Editing", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select service type",
          },
          LOCATION,
        ],
      },
    ],
  },
  {
    id: "laundry",
    name: "Laundry & Cleaning",
    icon: "Sparkles",
    subcategories: [
      {
        id: "laundry_cleaning",
        name: "Laundry, Dry Cleaning & Washing",
        attributes: [
          PRICE, PRICE_RANGE,
          {
            id: "cleaning_service_type",
            label: "Service Type",
            type: "multi-select",
            options: [
              "Laundry (Wash & Fold)", "Dry Cleaning",
              "Car Wash & Detailing", "Home / Office Cleaning",
              "Fumigation & Pest Control", "Rug & Sofa Cleaning",
              "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select service type",
          },
          LOCATION,
        ],
      },
    ],
  },
  {
    id: "wholesale",
    name: "Wholesale & Bulk",
    icon: "Package",
    subcategories: [
      {
        id: "wholesale_clothing_main",
        name: "Wholesale Clothing",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION, COLOR,
          {
            id: "bulk_type",
            label: "Type",
            type: "multi-select",
            options: ["Bales", "Dozens", "Mixed Packs", "Clearance Lots", "Other"],
            required: true,
            filterable: true,
            placeholder: "Select bulk type",
          },
          NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
      {
        id: "wholesale_food_main",
        name: "Wholesale Food",
        attributes: [
          PRICE, PRICE_RANGE,
          {
            id: "produce_unit",
            label: "Sold By",
            type: "single-select",
            options: [
              "Per Kg", "Per Bag (50kg)", "Per Tonne",
              "Per Crate", "Per Bundle", "Per Piece",
            ],
            required: true,
            filterable: false,
            placeholder: "Select unit",
          },
          NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
    ],
  },
  {
    id: "instruments",
    name: "Music & Instruments",
    icon: "Music",
    subcategories: [
      {
        id: "instruments_main",
        name: "Musical Instruments",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION,
          {
            id: "instrument_type",
            label: "Instrument",
            type: "multi-select",
            options: [
              "Guitar (Acoustic)", "Guitar (Electric)",
              "Bass Guitar", "Keyboard / Piano",
              "Drums / Drum Kit", "Saxophone",
              "Trumpet", "Violin", "Flute",
              "DJ Equipment", "Microphone",
              "Traditional / Percussion",
              "Music Accessories", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select instrument",
          },
          BRAND, NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
    ],
  },
  {
    id: "fragrances_main",
    name: "Perfumes & Fragrances",
    icon: "Gem",
    subcategories: [
      {
        id: "perfumes_colognes",
        name: "Perfumes & Colognes",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION,
          {
            id: "fragrance_type",
            label: "Type",
            type: "single-select",
            options: [
              "Eau de Parfum (EDP)", "Eau de Toilette (EDT)",
              "Parfum / Extrait", "Body Spray", "Deodorant",
              "Roll-On", "Oil Perfume", "Bakhoor / Incense", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select type",
          },
          GENDER,
          {
            id: "scent_family",
            label: "Scent Family",
            type: "multi-select",
            options: [
              "Floral", "Woody", "Musky", "Fresh / Citrus",
              "Oriental / Spicy", "Fruity", "Aquatic", "Oud", "Other",
            ],
            required: false,
            filterable: true,
            placeholder: "Select scent family",
          },
          {
            id: "bottle_size",
            label: "Size (ml)",
            type: "single-select",
            options: ["30ml", "50ml", "75ml", "100ml", "125ml", "200ml+"],
            required: false,
            filterable: true,
            placeholder: "Select size",
          },
          BRAND, NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
    ],
  },
  {
    id: "electrical_lighting",
    name: "Electrical & Lighting",
    icon: "Zap",
    subcategories: [
      {
        id: "elec_supplies",
        name: "Electrical Supplies",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION,
          {
            id: "elec_type",
            label: "Type",
            type: "multi-select",
            options: [
              "Wires & Cables", "Switches & Sockets",
              "Circuit Breakers / MCB", "Distribution Boards",
              "Conduit & Fittings", "Extension Boards",
              "Voltage Stabilizers", "Inverters", "Solar Panels",
              "Solar Batteries", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select type",
          },
          BRAND, NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
      {
        id: "lighting_main",
        name: "Lighting & Bulbs",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION,
          {
            id: "light_type",
            label: "Type",
            type: "multi-select",
            options: [
              "LED Bulbs", "Energy Savers", "Chandeliers",
              "Ceiling Lights", "Wall Lamps", "Flood Lights",
              "Street Lights", "Smart Lighting", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select type",
          },
          BRAND, NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
    ],
  },
  {
    id: "car_parts_oils",
    name: "Car Parts & Oils",
    icon: "Wrench",
    subcategories: [
      {
        id: "spare_parts_main",
        name: "Spare Parts",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION,
          {
            id: "parts_type_main",
            label: "Part Type",
            type: "multi-select",
            options: [
              "Engine Parts", "Brakes", "Tyres / Rims",
              "Battery", "Exhaust", "Suspension",
              "Gearbox", "Body Parts / Panel",
              "Lights & Electrical", "Filters",
              "Spark Plugs", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select part type",
          },
          {
            id: "compat",
            label: "Compatible With",
            type: "text",
            required: false,
            filterable: false,
            placeholder: "e.g. Toyota Camry 2015",
          },
          NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
      {
        id: "oils_fluids",
        name: "Oils & Fluids",
        attributes: [
          PRICE, PRICE_RANGE, CONDITION,
          {
            id: "oil_type",
            label: "Fluid Type",
            type: "multi-select",
            options: [
              "Engine Oil", "Transmission Fluid",
              "Brake Fluid", "Coolant / Anti-freeze",
              "Power Steering Fluid", "Grease", "Other",
            ],
            required: true,
            filterable: true,
            placeholder: "Select fluid type",
          },
          BRAND, NEGOTIABLE, DELIVERY, LOCATION,
        ],
      },
    ],
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────

/**
 * Flatten all categories into a single array with level info.
 * Useful for search, dropdowns, and navigation.
 */
export const getFlattenedCategories = () => {
  const flat = [];

  categories.forEach((main) => {
    flat.push({ id: main.id, name: main.name, level: 1, icon: main.icon });

    if (main.subcategories) {
      main.subcategories.forEach((sub) => {
        flat.push({ id: sub.id, name: sub.name, parentId: main.id, level: 2 });

        if (sub.subcategories) {
          sub.subcategories.forEach((leaf) => {
            flat.push({
              id: leaf.id,
              name: leaf.name,
              parentId: sub.id,
              grandParentId: main.id,
              level: 3,
              attributes: leaf.attributes || [],
            });
          });
        }
      });
    }
  });

  return flat;
};

/**
 * Get attributes for a given leaf category ID.
 * Use this to render the listing form and filter sidebar.
 *
 * @param {string} leafId - The ID of the leaf subcategory
 * @returns {Array} - Array of attribute objects, or []
 */
export const getAttributesForCategory = (leafId) => {
  for (const main of categories) {
    for (const sub of main.subcategories || []) {
      for (const leaf of sub.subcategories || []) {
        if (leaf.id === leafId) return leaf.attributes || [];
      }
    }
  }
  return [];
};

/**
 * Get only filterable attributes for the buyer filter sidebar.
 */
export const getFilterableAttributes = (leafId) => {
  return getAttributesForCategory(leafId).filter((a) => a.filterable);
};

/**
 * Get only required attributes for the seller listing form validation.
 */
export const getRequiredAttributes = (leafId) => {
  return getAttributesForCategory(leafId).filter((a) => a.required);
};

/**
 * Find a category by ID (any level).
 */
export const findCategoryById = (id) => {
  return getFlattenedCategories().find((c) => c.id === id) || null;
};

export default categories;