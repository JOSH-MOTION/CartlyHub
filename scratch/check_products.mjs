import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const snap = await getDocs(collection(db, 'products'), limit(5));
    console.log("--- PRODUCT DATA CHECK ---");
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`costPrice: ${data.costPrice} (Type: ${typeof data.costPrice})`);
      console.log(`cost_price: ${data.cost_price} (Type: ${typeof data.cost_price})`);
      console.log(`basePrice: ${data.basePrice} (Type: ${typeof data.basePrice})`);
      console.log("---");
    });
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

check();
