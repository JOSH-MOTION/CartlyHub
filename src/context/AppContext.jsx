'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const AppContext = createContext(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // User & Auth State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [settings, setSettings] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  // Admin State
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [manualSales, setManualSales] = useState([]);
  const [orders, setOrders] = useState([]);

  // Computed values
  const cartTotal = cart.reduce((total, item) => total + (item.variant?.price || item.product?.basePrice || 0) * item.quantity, 0);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  
  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        });
        
        // Load user profile from Firestore
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setProfile({
              ...userData,
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : (typeof userData.createdAt === 'string' ? new Date(userData.createdAt) : new Date()),
              updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : (typeof userData.updatedAt === 'string' ? new Date(userData.updatedAt) : new Date()),
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore listeners
  useEffect(() => {
    const listeners = [];

    // Products listener
    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
        };
      });
      setProducts(productsData);
    });
    listeners.push(unsubscribeProducts);

    // Categories listener
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
        };
      });
      setCategories(categoriesData);
    });
    listeners.push(unsubscribeCategories);

    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Cart Actions
  const addToCart = (productId, variantId, quantity) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const variant = product.variants?.find(v => v.id === variantId);
    if (!variant) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.productId === productId && item.variantId === variantId
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { productId, variantId, quantity, product, variant }];
      }
    });
  };

  const removeFromCart = (variantId) => {
    setCart(prevCart => prevCart.filter(item => item.variantId !== variantId));
  };

  const updateQuantity = (variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCart(prevCart => prevCart.map(item =>
      item.variantId === variantId
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const setCartOpen = (open) => {
    setIsCartOpen(open);
  };

  // Wishlist Actions
  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Auth Actions
  const signIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        email: user.email,
        name: name,
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const setAuthOpen = (open) => {
    setIsAuthOpen(open);
  };

  const contextValue = {
    // User & Auth
    user,
    profile,
    isAuthOpen,
    isLoading,
    
    // Data
    products,
    categories,
    promotions,
    settings,
    
    // Cart
    cart,
    cartTotal,
    totalItems,
    isCartOpen,
    
    // Admin
    inventoryProducts,
    expenses,
    manualSales,
    orders,
    
    // Wishlist
    wishlist,
    
    // Actions
    signIn,
    signUp,
    signOut: signOutUser,
    setAuthOpen,
    
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCartOpen,
    
    toggleWishlist,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
