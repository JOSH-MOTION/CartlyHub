/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The shuffled array.
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Calculates and formats the time duration since a given date.
 * @param {Date|string|Object} createdAt - The start date.
 * @returns {string} - Formatted duration string.
 */
export const getTimeOnPlatform = (createdAt) => {
  if (!createdAt) return "Joined recently";
  
  let start;
  if (createdAt?.toDate) {
    start = createdAt.toDate();
  } else {
    start = new Date(createdAt);
  }

  if (isNaN(start.getTime())) return "Joined recently";

  const now = new Date();
  const diffInMs = now - start;
  
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} on CartlyHub`;
  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} on CartlyHub`;
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} on CartlyHub`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} on CartlyHub`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} on CartlyHub`;
  
  return "Joined recently";
};

/**
 * Formats a date into a "time ago" string.
 * @param {Date|string|Object} date - The date to format.
 * @returns {string} - Formatted time ago string.
 */
export const getTimeAgo = (date) => {
  if (!date) return "Just now";
  
  let start;
  if (date?.toDate) {
    start = date.toDate();
  } else {
    start = new Date(date);
  }

  if (isNaN(start.getTime())) return "Just now";

  const now = new Date();
  const diffInSeconds = Math.floor((now - start) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return start.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
};

/**
 * Validates a list of variant objects for Cartly Hub stock guidelines.
 * Strict "NO MEDIUMS" rule.
 * Large sizes must be kept to a minimum compared to XL/XXL.
 * Primary focus is XL and XXL.
 * @param {Array} variants - Array of variant objects { size, stock, qty, ... }
 * @returns {Object} - Sizing analysis details.
 */
export const validateInventorySizes = (variants) => {
  if (!variants || !Array.isArray(variants)) {
    return { hasMedium: false, hasLarge: false, largeQty: 0, xlXxlQty: 0, isWeightedXlXxl: true };
  }

  let hasMedium = false;
  let hasLarge = false;
  let largeQty = 0;
  let xlXxlQty = 0;

  for (const v of variants) {
    const sizeUpper = (v.size || "").trim().toUpperCase();
    const qty = Number(v.stock !== undefined ? v.stock : (v.qty !== undefined ? v.qty : 0));

    // Check for Medium: exact matches for "M", "MED", "MEDIUM"
    if (sizeUpper === "M" || sizeUpper === "MED" || sizeUpper === "MEDIUM") {
      hasMedium = true;
    }
    // Check for Large: exact matches for "L", "LARGE" (avoiding matching XL/XXL)
    if (sizeUpper === "L" || sizeUpper === "LARGE") {
      hasLarge = true;
      largeQty += qty;
    }
    // Check for XL/XXL focus
    if (["XL", "XXL", "2XL", "XXXL", "3XL", "X-LARGE", "XX-LARGE", "XXX-LARGE"].includes(sizeUpper)) {
      xlXxlQty += qty;
    }
  }

  return {
    hasMedium,
    hasLarge,
    largeQty,
    xlXxlQty,
    isWeightedXlXxl: xlXxlQty >= largeQty
  };
};
