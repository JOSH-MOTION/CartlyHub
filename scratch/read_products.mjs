import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts[1].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, "reinvestments"));
  console.log("=== REINVESTMENTS ===");
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(JSON.stringify({ id: doc.id, ...data }, null, 2));
  });
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
