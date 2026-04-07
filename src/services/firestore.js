import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Product Services
export const productService = {
  async create(product) {
    const productData = {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'products'), productData);
    return docRef.id;
  },

  async update(id, updates) {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id) {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, { isActive: false });
  },

  async getById(id) {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      const data = productSnap.data();
      return {
        ...data,
        id: productSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    
    return null;
  },

  async getAll() {
    const productsQuery = query(
      collection(db, 'products'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(productsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  },

  async getFeatured() {
    const productsQuery = query(
      collection(db, 'products'), 
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
    const querySnapshot = await getDocs(productsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  },

  async getByCategory(categoryId) {
    const productsQuery = query(
      collection(db, 'products'), 
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(productsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  },
};

// Category Services
export const categoryService = {
  async create(category) {
    const categoryData = {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    return docRef.id;
  },

  async update(id, updates) {
    const categoryRef = doc(db, 'categories', id);
    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id) {
    const categoryRef = doc(db, 'categories', id);
    await deleteDoc(categoryRef);
  },

  async getAll() {
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  },

  async getById(id) {
    const categoryRef = doc(db, 'categories', id);
    const categorySnap = await getDoc(categoryRef);
    
    if (categorySnap.exists()) {
      const data = categorySnap.data();
      return {
        ...data,
        id: categorySnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    
    return null;
  },
};

// Promotion Services
export const promotionService = {
  async create(promotion) {
    const promotionData = {
      ...promotion,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      validFrom: promotion.validFrom ? Timestamp.fromDate(promotion.validFrom) : Timestamp.now(),
      validUntil: promotion.validUntil ? Timestamp.fromDate(promotion.validUntil) : Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'promotions'), promotionData);
    return docRef.id;
  },

  async update(id, updates) {
    const promotionRef = doc(db, 'promotions', id);
    await updateDoc(promotionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id) {
    const promotionRef = doc(db, 'promotions', id);
    await updateDoc(promotionRef, { isActive: false });
  },

  async getActive() {
    const promotionsQuery = query(
      collection(db, 'promotions'), 
      where('isActive', '==', true),
      where('validFrom', '<=', Timestamp.now()),
      where('validUntil', '>=', Timestamp.now())
    );
    const querySnapshot = await getDocs(promotionsQuery);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        validFrom: data.validFrom?.toDate() || new Date(),
        validUntil: data.validUntil?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  },

  async validateCode(code) {
    const promotionsQuery = query(
      collection(db, 'promotions'), 
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true),
      where('validFrom', '<=', Timestamp.now()),
      where('validUntil', '>=', Timestamp.now()),
      limit(1)
    );
    const querySnapshot = await getDocs(promotionsQuery);
    
    if (querySnapshot.empty) return null;
    
    const data = querySnapshot.docs[0].data();
    return {
      ...data,
      id: querySnapshot.docs[0].id,
      validFrom: data.validFrom?.toDate() || new Date(),
      validUntil: data.validUntil?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
