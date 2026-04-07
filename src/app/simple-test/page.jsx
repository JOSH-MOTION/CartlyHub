"use client";

import { useEffect, useState } from "react";
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function SimpleTestPage() {
  const [collections, setCollections] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("🔥 Testing Firebase connection...");
        console.log("📱 Firebase DB:", db);
        
        // Test getting all collections
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        
        console.log("📦 Products snapshot:", productsSnapshot);
        console.log("📂 Categories snapshot:", categoriesSnapshot);
        
        const products = [];
        const categories = [];
        
        productsSnapshot.forEach(doc => {
          console.log("📦 Product doc:", doc.id, doc.data());
          products.push({ id: doc.id, ...doc.data() });
        });
        
        categoriesSnapshot.forEach(doc => {
          console.log("📂 Category doc:", doc.id, doc.data());
          categories.push({ id: doc.id, ...doc.data() });
        });
        
        setCollections({
          products: { count: products.length, data: products },
          categories: { count: categories.length, data: categories }
        });
        
      } catch (err) {
        console.error("❌ Firebase error:", err);
        setError(err);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8">🔥 Simple Firebase Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">📦 Products</h3>
              <p className="text-2xl font-bold">{collections.products?.count || 0}</p>
              {collections.products?.data?.map(product => (
                <div key={product.id} className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  {product.name || 'No name'} - ID: {product.id}
                </div>
              ))}
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">📂 Categories</h3>
              <p className="text-2xl font-bold">{collections.categories?.count || 0}</p>
              {collections.categories?.data?.map(category => (
                <div key={category.id} className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  {category.name || 'No name'} - ID: {category.id}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
          <p className="text-sm">Check browser console (F12) for detailed logs</p>
          <p className="text-sm">Look for:</p>
          <ul className="text-sm list-disc ml-6">
            <li>🔥 Firebase connection logs</li>
            <li>📦 Product document data</li>
            <li>📂 Category document data</li>
            <li>Any error messages</li>
          </ul>
        </div>

        <div className="mt-6">
          <a href="/debug-products" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mr-4">
            Back to Debug Page
          </a>
          <a href="/" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
