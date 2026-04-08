import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
  const shirtId = "LX32VE5kjWNHhyZOxMqB";
  try {
    const snap = await getDoc(doc(db, 'products', shirtId));
    if (snap.exists()) {
      const data = snap.data();
      console.log(`PRODUCT ID: ${shirtId}`);
      console.log(`NAME: ${data.name}`);
      console.log("VARIANTS:");
      console.dir(data.variants, { depth: null });
    } else {
      console.log("Product not found");
    }
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

check();
