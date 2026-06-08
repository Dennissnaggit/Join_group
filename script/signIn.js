import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Bitte gib E-Mail und Passwort ein.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let userName = user.email;

    if (userSnap.exists()) {
      const userData = userSnap.data();
      userName = userData.name;
    }

    localStorage.setItem("currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: userName,
      isGuest: false
    }));

    localStorage.setItem("userName", userName);

    window.location.href = "./pages/summary.html";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      alert("E-Mail oder Passwort ist falsch.");
    } else if (error.code === "auth/invalid-email") {
      alert("Die E-Mail-Adresse ist ungültig.");
    } else {
      alert("Fehler beim Login: " + error.message);
    }
  }
});