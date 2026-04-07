'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';

export default function CheckFirebaseData() {
  const [existingProducts, setExistingProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const checkExistingData = async () => {
    try {
      setLoading(true);
      
      // Check for existing products
      const productsQuery = query(collection(db, 'products'), where('isActive', '==', true));
      const productsSnapshot = await getDocs(productsQuery);
      
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
      
      setExistingProducts(products);
      
      // Check for categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoryList = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
      
      setCategories(categoryList);
      
      console.log('Firebase Data Check:', {
        productsCount: products.length,
        categoriesCount: categoryList.length,
        products: products.slice(0, 3).map(product => product.variants.map(variant => `${variant.size} - ${variant.color} - ₵${variant.price} - Stock: ${variant.stock}`)) // Show first 3 products
      });
      
      if (products.length > 0) {
        toast.success(`Found ${products.length} existing products in Firebase!`);
      } else {
        toast.info('No products found in Firebase yet');
      }
      
      if (categoryList.length > 0) {
        toast.info(`Found ${categoryList.length} categories in Firebase!`);
      } else {
        toast.info('No categories found in Firebase yet');
      }
      
    } catch (error) {
      console.error('Error checking Firebase data:', error);
      toast.error('Failed to check Firebase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExistingData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Data Check</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Existing Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Existing Products in Firebase</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Checking Firebase for existing products...</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-4">
                  {existingProducts.length > 0 
                    ? `🎉 Found ${existingProducts.length} products in Firebase!`
                    : '📝 No products found in Firebase yet'
                  }
                </p>
                
                {existingProducts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Sample Products:</h3>
                    {existingProducts.slice(0, 3).map((product) => (
                      <div key={product.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                            <p className="text-xl font-bold text-green-600 mt-2">
                              <strong>Base Price:</strong> ₵{product.basePrice?.toLocaleString()}
                            </p>
                          </div>
                          {product.isFeatured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={checkExistingData}
              disabled={loading}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Refresh Firebase Data'}
            </button>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Categories in Firebase</h2>
            
            <div className="space-y-4">
              <p className="text-lg font-medium mb-4">
                {categories.length > 0 
                  ? `📂 Found ${categories.length} categories!`
                  : '📝 No categories found yet'
                }
              </p>
              
              {categories.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {categories.slice(0, 5).map((category) => (
                    <div key={category.id} className="border rounded-lg p-3">
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <a
            href="/admin/upload"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            📦 Upload New Product
          </a>
          <a
            href="/firebase-test"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            🧪 Test Firebase Connection
          </a>
        </div>
      </div>
    </div>
  );
}
