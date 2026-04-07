"use client";

import { useEffect, useState } from "react";
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export default function DebugProductsPage() {
  const [rawProducts, setRawProducts] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugFirebase = async () => {
      try {
        console.log("🔍 Starting Firebase debug...");
        
        // Test products collection
        console.log("📦 Fetching products...");
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        
        const products = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`📦 Product ${doc.id}:`, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });
        
        setRawProducts(products);
        console.log(`✅ Found ${products.length} products`);

        // Test categories collection
        console.log("📂 Fetching categories...");
        const categoriesQuery = query(collection(db, 'categories'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        const categories = categoriesSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`📂 Category ${doc.id}:`, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });
        
        setRawCategories(categories);
        console.log(`✅ Found ${categories.length} categories`);
        
      } catch (err) {
        console.error("❌ Firebase error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    debugFirebase();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔍 Debugging Firebase...</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center mt-4">Loading data from Firebase...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-black text-black">🔍 Firebase Debug Page</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Raw Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4">📦 Raw Products Data ({rawProducts.length})</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {rawProducts.length === 0 ? (
              <p className="text-gray-500">No products found</p>
            ) : (
              rawProducts.map((product) => (
                <div key={product.id} className="border-b pb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <strong>ID:</strong> {product.id}
                      </div>
                      <div>
                        <strong>Base Price:</strong> ₦{product.basePrice}
                      </div>
                      <div>
                        <strong>Category ID:</strong> {product.categoryId}
                      </div>
                      <div>
                        <strong>Featured:</strong> {product.isFeatured ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Active:</strong> {product.isActive ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Images:</strong> {product.images?.length || 0}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Description:</strong> {product.description}
                    </div>
                    <div className="mt-2">
                      <strong>Variants:</strong> {product.variants?.length || 0}
                      {product.variants?.map((variant, idx) => (
                        <div key={idx} className="ml-4 text-sm bg-gray-100 p-2 rounded mt-1">
                          {variant.size} - {variant.color} - ₦{variant.price} - Stock: {variant.stock}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Raw Categories */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4">📂 Raw Categories Data ({rawCategories.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rawCategories.length === 0 ? (
              <p className="text-gray-500">No categories found</p>
            ) : (
              rawCategories.map((category) => (
                <div key={category.id} className="border p-4 rounded-lg bg-gray-50">
                  <h3 className="font-bold">{category.name}</h3>
                  <div className="text-sm mt-2">
                    <div><strong>ID:</strong> {category.id}</div>
                    <div><strong>Description:</strong> {category.description}</div>
                    <div><strong>Active:</strong> {category.isActive ? 'Yes' : 'No'}</div>
                    {category.image && (
                      <div className="mt-2">
                        <strong>Image:</strong>
                        <img src={category.image} alt={category.name} className="w-16 h-16 object-cover rounded mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Links */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4">🔗 Test Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/products" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-center">
              Go to Products Page
            </a>
            <a href="/admin/categories" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-center">
              Go to Admin Categories
            </a>
            <a href="/admin/products" className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 text-center">
              Go to Admin Products
            </a>
            <a href="/" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-center">
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
