import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

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
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Eingeloggt:", userCredential.user);
// User in der Datenban anlegen 


 

    window.location.href = "../pages/main.html";

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