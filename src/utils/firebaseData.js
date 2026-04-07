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
