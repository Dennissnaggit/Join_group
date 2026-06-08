import { auth } from "./firebase.js";

import {
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

async function logout() {
  try {
    await signOut(auth);

    localStorage.removeItem("userName");
    localStorage.removeItem("currentUser");

    console.log("Erfolgreich ausgeloggt");

    window.location.href = "../index.html";
  } catch (error) {
    console.error("Logout fehlgeschlagen:", error);
  }
}

// global verfügbar machen
window.logout = logout;