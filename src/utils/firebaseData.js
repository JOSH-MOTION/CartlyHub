import { categoryService, productService } from '../services/firestore.js';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Direct Firebase data access functions
export const getCategories = async () => {
  try {
    // Get all categories without isActive filter
    const categoriesQuery = query(
      collection(db, 'categories'), 
      orderBy('name')
    );
    const querySnapshot = await getDocs(categoriesQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
      };
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getProducts = async (options = {}) => {
  try {
    const { featured, category, limit } = options;
    
    // Get all products without isActive filter
    const productsQuery = query(
      collection(db, 'products'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(productsQuery);
    
    let products = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
      };
    });
    
    // Filter out soft-deleted products
    products = products.filter(product => product.isActive !== false);
    
    // Apply filters
    if (featured) {
      products = products.filter(product => product.isFeatured);
    }
    
    if (category) {
      products = products.filter(product => product.categoryId === category);
    }
    
    if (limit) {
      products = products.slice(0, parseInt(limit));
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const createCategory = async (categoryData) => {
  try {
    const categoryId = await categoryService.create(categoryData);
    return { id: categoryId, success: true };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const productId = await productService.create(productData);
    return { id: productId, success: true };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    await productService.update(productId, productData);
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    await productService.delete(productId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    await categoryService.update(categoryId, categoryData);
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firebase Firestore security rules. Categories collection needs read/write permissions.');
    } else if (error.code === 'not-found') {
      throw new Error('Category not found');
    } else if (error.code === 'unavailable') {
      throw new Error('Firebase service unavailable. Please check your internet connection.');
    } else {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    await categoryService.delete(categoryId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const getOrders = async () => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(ordersQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
      };
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const getCustomers = async () => {
  try {
    // 1. Fetch data from both sources
    const [orders, manualSalesSnapshot] = await Promise.all([
      getOrders(),
      getDocs(query(collection(db, 'manualSales'), orderBy('createdAt', 'desc')))
    ]);

    const manualSales = manualSalesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : (typeof doc.data().createdAt === 'string' ? new Date(doc.data().createdAt) : new Date()),
    }));

    // 2. Aggregate by Phone (or Name as fallback)
    const customersMap = new Map();

    const processRecord = (record) => {
      const name = record.customerName || record.shippingAddress?.fullName || 'Unknown';
      const phone = record.customerPhone || record.shippingAddress?.phone || 'No Phone';
      const email = record.customerEmail || record.shippingAddress?.email || '';
      
      // Use Phone + Name as unique key
      const key = `${phone}_${name}`.toLowerCase();

      if (!customersMap.has(key)) {
        customersMap.set(key, {
          id: key,
          name,
          phone,
          email,
          totalSpend: 0,
          totalProfit: 0,
          orderCount: 0,
          lastOrderDate: record.createdAt,
          orders: []
        });
      }

      const customer = customersMap.get(key);
      customer.totalSpend += Number(record.totalAmount || 0);
      customer.totalProfit += Number(record.totalProfit || 0);
      customer.orderCount += 1;
      
      if (new Date(record.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = record.createdAt;
      }
      
      customer.orders.push({
        id: record.id,
        date: record.createdAt,
        amount: record.totalAmount,
        type: record.saleType || 'online'
      });
    };

    orders.forEach(processRecord);
    manualSales.forEach(processRecord);

    return Array.from(customersMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};
export const getManualSales = async () => {
  try {
    const salesQuery = query(
      collection(db, 'manualSales'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(salesQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
        source: 'manual'
      };
    });
  } catch (error) {
    console.error('Error fetching manual sales:', error);
    return [];
  }
};

export const createManualSale = async (saleData) => {
  try {
    const { items, ...rest } = saleData;
    let totalProfit = 0;
    const itemsWithSnapshots = [];

    // Check stock & deduct
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) throw new Error(`Product ${item.productName} not found`);

      const productData = productSnap.data();
      let variantIndex = -1;
      
      if (item.variantMatchIndex !== undefined && item.variantMatchIndex !== -1) {
        variantIndex = item.variantMatchIndex;
      } else if (item.variantId) {
        variantIndex = productData.variants?.findIndex(v => v.id === item.variantId);
      } else {
        variantIndex = productData.variants?.findIndex(v => v.size === item.variantInfo.size && (v.color === item.variantInfo.color || v.colorName === item.variantInfo.color));
      }

      if (variantIndex === -1) throw new Error(`Variant not found for ${item.productName}`);

      const variant = productData.variants[variantIndex];
      const costPrice = Number(productData.costPrice || productData.cost_price || productData.buying_price || productData.buyingPrice || 0);
      const sellingPrice = Number(item.price || 0);
      const quantity = Number(item.quantity || 1);
      const itemProfit = (sellingPrice - costPrice) * quantity;

      if (variant.stock < quantity) throw new Error(`Insufficient stock for ${item.productName}`);

      totalProfit += itemProfit;
      itemsWithSnapshots.push({ ...item, costPrice, profit: itemProfit });

      const updatedVariants = productData.variants.map((v, idx) => {
        if (idx === variantIndex) return { ...v, stock: Math.max(0, v.stock - quantity) };
        return v;
      });

      await updateDoc(productRef, { variants: updatedVariants, updatedAt: Timestamp.now() });
    }

    // Deep clean undefined values out of items and rest to prevent Firestore crashes
    const cleanItems = JSON.parse(JSON.stringify(itemsWithSnapshots));
    const cleanRest = JSON.parse(JSON.stringify(rest));

    const payload = {
      ...cleanRest,
      items: cleanItems,
      totalProfit,
      saleType: 'manual',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const saleRef = await addDoc(collection(db, 'manualSales'), payload);
    return { success: true, saleId: saleRef.id };
  } catch (error) {
    console.error('Error recording manual sale:', error);
    throw error;
  }
};

export const deleteManualSale = async (saleId) => {
  try {
    const saleRef = doc(db, 'manualSales', saleId);
    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) throw new Error('Sale not found');

    const saleData = saleSnap.data();

    // Restore stock
    for (const item of saleData.items || []) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const updatedVariants = productData.variants?.map((v, idx) => {
          let isMatch = false;
          if (item.variantMatchIndex !== undefined && item.variantMatchIndex !== -1) {
            isMatch = (idx === item.variantMatchIndex);
          } else if (item.variantId) {
            isMatch = (v.id === item.variantId);
          } else {
            isMatch = (v.size === item.variantInfo?.size && (v.color === item.variantInfo?.color || v.colorName === item.variantInfo?.color));
          }
          
          if (isMatch) return { ...v, stock: Math.max(0, (Number(v.stock) || 0) + (Number(item.quantity) || 0)) };
          return v;
        });
        await updateDoc(productRef, { variants: updatedVariants, updatedAt: Timestamp.now() });
      }
    }

    await deleteDoc(saleRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting manual sale:', error);
    throw error;
  }
};

export const updateManualSale = async (saleId, updates) => {
  try {
    const saleRef = doc(db, 'manualSales', saleId);
    // Filter undefined
    const cleanUpdates = {};
    Object.keys(updates).forEach(key => updates[key] !== undefined && (cleanUpdates[key] = updates[key]));
    cleanUpdates.updatedAt = Timestamp.now();

    await updateDoc(saleRef, cleanUpdates);
    return { success: true };
  } catch (error) {
    console.error('Error updating manual sale:', error);
    throw error;
  }
};
