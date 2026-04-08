import { categoryService, productService } from '../services/firestore.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
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
