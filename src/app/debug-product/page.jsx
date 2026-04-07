'use client';

import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function DebugProduct() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const testDirectAdd = async () => {
    try {
      setLoading(true);
      setResult('Adding product to Firebase...');
      
      const testProduct = {
        name: 'Test Product ' + Date.now(),
        description: 'This is a test product added directly to Firebase',
        basePrice: 1500,
        categoryId: 'test-category',
        isFeatured: true,
        isActive: true,
        tags: ['test', 'debug'],
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
        variants: [{
          id: 'default',
          name: 'Default',
          sku: `TEST-${Date.now()}`,
          price: 1500,
          inventory: 100,
          attributes: { color: 'black', size: 'M' }
        }]
      };

      console.log('Test product data:', testProduct);
      
      const docRef = await addDoc(collection(db, 'products'), {
        ...testProduct,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      console.log('Product added with ID:', docRef.id);
      setResult(`SUCCESS! Product added with ID: ${docRef.id}`);
      toast.success(`Test product added! ID: ${docRef.id}`);
      
    } catch (error) {
      console.error('Error adding product:', error);
      setResult(`ERROR: ${error.message}`);
      toast.error(`Failed to add product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Product Add</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              This page tests direct Firebase product addition to debug the upload issue.
            </p>
            
            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Test Product Details:</h3>
              <ul className="text-sm space-y-1">
                <li><strong>Name:</strong> Test Product {new Date().toLocaleTimeString()}</li>
                <li><strong>Price:</strong> GHS 1500</li>
                <li><strong>Category:</strong> test-category</li>
                <li><strong>Featured:</strong> Yes</li>
              </ul>
            </div>
            
            <button
              onClick={testDirectAdd}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding to Firebase...' : 'Test Add Product Directly'}
            </button>
            
            {result && (
              <div className={`mt-4 p-4 rounded ${result.includes('SUCCESS') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <strong>Result:</strong> {result}
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <a
              href="/admin/upload"
              className="text-blue-600 hover:underline"
            >
              ← Back to Product Upload
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
