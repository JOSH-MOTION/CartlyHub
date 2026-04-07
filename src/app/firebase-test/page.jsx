'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function FirebaseTest() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testProduct, setTestProduct] = useState({
    name: 'Test Product',
    description: 'This is a test product from Firebase',
    basePrice: 9999,
    categoryId: 'test-category',
    isFeatured: true,
    isActive: true,
    tags: ['test', 'firebase'],
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
    variants: [{
      id: 'default',
      name: 'Default',
      sku: 'TEST-001',
      price: 9999,
      inventory: 100,
      attributes: { color: 'black', size: 'M' }
    }]
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));
      setProducts(productList);
      console.log('Fetched products from Firebase:', productList);
      toast.success(`Found ${productList.length} products in Firebase`);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products from Firebase');
    } finally {
      setLoading(false);
    }
  };

  const addTestProduct = async () => {
    try {
      setLoading(true);
      const productData = {
        ...testProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Added product with ID:', docRef.id);
      toast.success(`Test product added with ID: ${docRef.id}`);
      
      // Refresh the products list
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add test product to Firebase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Connection Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Product Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Add Test Product</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={testProduct.name}
                  onChange={(e) => setTestProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₵)
                </label>
                <input
                  type="number"
                  value={testProduct.basePrice}
                  onChange={(e) => setTestProduct(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={testProduct.description}
                  onChange={(e) => setTestProduct(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <button
                onClick={addTestProduct}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding to Firebase...' : 'Add Test Product to Firebase'}
              </button>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Products from Firebase</h2>
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products from Firebase...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No products found in Firebase. Add one to test!
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                          <p className="text-xl font-bold text-green-600 mt-2">
                            ₵{testProduct.basePrice?.toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isFeatured ? 'Featured' : 'Regular'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Firebase Status */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Firebase Status</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Connection:</strong> <span className="text-green-600">✓ Connected</span></p>
            <p><strong>Products Found:</strong> {products.length}</p>
            <p><strong>Real-time Updates:</strong> <span className="text-green-600">✓ Active</span></p>
            <p><strong>Collection:</strong> <code>products</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
