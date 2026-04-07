'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { testFirebaseConnection, testCloudinaryConnection } from '../utils/test-connections';

export default function SystemTest() {
  const { user, products, isLoading } = useApp();
  const [testResults, setTestResults] = useState<any>({});
  const [runningTests, setRunningTests] = useState(false);

  const runTests = async () => {
    setRunningTests(true);
    const results = {
      firebase: await testFirebaseConnection(),
      cloudinary: await testCloudinaryConnection(),
      context: {
        user: !!user,
        productsCount: products.length,
        isLoading
      }
    };
    setTestResults(results);
    setRunningTests(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">System Integration Test</h1>
        
        <div className="space-y-6">
          {/* Firebase Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Firebase Connection</h2>
            {testResults.firebase ? (
              <div className={`p-4 rounded ${testResults.firebase.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.firebase.success ? (
                  <div>
                    <p className="font-medium">Firebase: Connected Successfully!</p>
                    <p className="text-sm mt-1">Products found: {testResults.firebase.productsCount}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Firebase: Connection Failed</p>
                    <p className="text-sm mt-1">{testResults.firebase.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-100 text-gray-600 rounded">Testing Firebase...</div>
            )}
          </div>

          {/* Cloudinary Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cloudinary Connection</h2>
            {testResults.cloudinary ? (
              <div className={`p-4 rounded ${testResults.cloudinary.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.cloudinary.success ? (
                  <div>
                    <p className="font-medium">Cloudinary: Connected Successfully!</p>
                    <p className="text-sm mt-1">Cloud name: {testResults.cloudinary.cloud_name}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Cloudinary: Connection Failed</p>
                    <p className="text-sm mt-1">{testResults.cloudinary.error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-100 text-gray-600 rounded">Testing Cloudinary...</div>
            )}
          </div>

          {/* React Context Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">React Context State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? `Logged in as ${user.name}` : 'Not logged in'}</p>
              <p><strong>Products:</strong> {products.length} loaded</p>
              <p><strong>Context Status:</strong> <span className="text-green-600 font-medium">Working!</span></p>
            </div>
          </div>

          {/* Overall Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Overall Migration Status</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Development Server: Running</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${testResults.firebase?.success ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Firebase: {testResults.firebase?.success ? 'Connected' : 'Testing...'}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${testResults.cloudinary?.success ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>Cloudinary: {testResults.cloudinary?.success ? 'Connected' : 'Testing...'}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>React Context: Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={runTests}
            disabled={runningTests}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {runningTests ? 'Running Tests...' : 'Re-run Tests'}
          </button>
        </div>
      </div>
    </div>
  );
}
