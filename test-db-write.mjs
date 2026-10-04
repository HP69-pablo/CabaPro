import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvdRO5QBHP0BJ59F5LPDsbKH5kauT-L_0",
  authDomain: "ai-studio-applet-webapp-17af3.firebaseapp.com",
  databaseURL: "https://ai-studio-applet-webapp-17af3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ai-studio-applet-webapp-17af3",
  storageBucket: "ai-studio-applet-webapp-17af3.firebasestorage.app",
  messagingSenderId: "1029961024458",
  appId: "1:1029961024458:web:aad1cee16d739a37268533"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-7e815059-c8c5-4656-a1b6-9258e93510fa");

async function runTest() {
  console.log("=== FIREBASE DATABASE WRITE TEST ===");
  console.log("Database ID:", "ai-studio-7e815059-c8c5-4656-a1b6-9258e93510fa");

  let user;
  const testEmail = "test_verification@cabapro.com";
  const testPass = "TestPassword123!";

  try {
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPass);
    user = cred.user;
    console.log("✓ Firebase Auth: Created test user", user.uid);
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, testEmail, testPass);
      user = cred.user;
      console.log("✓ Firebase Auth: Signed in test user", user.uid);
    } else {
      console.error("✗ Auth failed:", e.code, e.message);
      return;
    }
  }

  console.log("Writing test document to 'requests' collection...");
  try {
    const docRef = await addDoc(collection(db, "requests"), {
      userId: user.uid,
      userName: "Automated Diagnostic",
      productName: "Test Verification Item",
      fromCountry: "France",
      toCity: "Algiers",
      budget: 100,
      reward: 20,
      status: "active",
      createdAt: new Date()
    });
    console.log("✓ SUCCESS: Document successfully written to Firestore! Doc ID:", docRef.id);

    // Clean up test document
    await deleteDoc(doc(db, "requests", docRef.id));
    console.log("✓ SUCCESS: Test document cleaned up.");
    console.log("\n--> DATABASE IS FULLY FUNCTIONAL AND READY FOR APP USE! <--");
  } catch (err) {
    console.error("✗ WRITE FAILED:", err.code, err.message);
    if (err.code === "permission-denied") {
      console.log("\n--> ACTION NEEDED: Security rules are currently blocking writes.");
      console.log("--> Please open Firebase Console > Firestore > Security tab and publish the rules.");
    }
  }
}

runTest();
