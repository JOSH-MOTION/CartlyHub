const { categories } = require('./src/utils/categories.js');

try {
  console.log('Validating categories.js structure...');
  if (!Array.isArray(categories)) {
    throw new Error('categories is not an array');
  }

  categories.forEach((main, i) => {
    if (!main.id || !main.name || !main.icon) {
      console.error(`Main category at index ${i} is missing required fields:`, main);
    }
    
    if (main.subcategories) {
      main.subcategories.forEach((sub, j) => {
        if (!sub.id || !sub.name) {
          console.error(`Subcategory at index ${i}.${j} is missing required fields:`, sub);
        }
        
        // Leaf subcategories check
        if (sub.subcategories) {
          sub.subcategories.forEach((leaf, k) => {
             if (!leaf.id || !leaf.name || !leaf.attributes) {
               console.error(`Leaf category at index ${i}.${j}.${k} is missing fields:`, leaf);
             }
          });
        }
      });
    }
  });

  console.log('Validation complete. If no errors above, the structure is sound.');
} catch (err) {
  console.error('CRITICAL ERROR in categories.js:', err.message);
  process.exit(1);
}
