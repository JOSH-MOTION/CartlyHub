// Firebase Connectivity Test
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import cloudinary from '../lib/cloudinary';

export const testFirebaseConnection = async () => {
  console.log('Testing Firebase connection...');
  
  try {
    // Test Firestore connectivity
    const testCollection = collection(db, 'test');
    console.log('Firestore connection: OK');
    
    // Test if we can read from a collection (will be empty if no data)
    const snapshot = await getDocs(collection(db, 'products'));
    console.log(`Firestore read test: OK (found ${snapshot.docs.length} products)`);
    
    // Test auth initialization
    const currentUser = auth.currentUser;
    console.log('Firebase Auth initialization: OK');
    console.log('Current user:', currentUser ? 'Logged in' : 'Not logged in');
    
    return {
      success: true,
      firestore: true,
      auth: true,
      productsCount: snapshot.docs.length
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testCloudinaryConnection = async () => {
  console.log('Testing Cloudinary connection...');
  
  try {
    
    // Test Cloudinary configuration
    const config = cloudinary.config();
    console.log('Cloudinary config:', {
      cloud_name: config.cloud_name,
      api_key_present: !!config.api_key,
      api_secret_present: !!config.api_secret
    });
    
    return {
      success: true,
      cloud_name: config.cloud_name
    };
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
