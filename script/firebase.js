import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlWww8xW8sihvHTDwB4P_wqsEtkzMiJ-A",
  authDomain: "join-62d0d.firebaseapp.com",
  projectId: "join-62d0d",
  storageBucket: "join-62d0d.firebasestorage.app",
  messagingSenderId: "937676041201",
  appId: "1:937676041201:web:c0f5a00916ba71778a7250"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
