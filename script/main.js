import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Eingeloggt:", user.uid);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      console.log("Userdaten:", userData);

      // Namen anzeigen
      document.getElementById("username").textContent = userData.name;

      // E-Mail anzeigen
      document.getElementById("userEmail").textContent = userData.email;

      //Uid anzeigen 
      document.getElementById("userId").textContent = "User ID: " + user.uid;

    } else {
      console.log("Kein User-Dokument gefunden.");
    }

  } else {
    console.log("Nicht eingeloggt");
    window.location.href = "../index.html";
  }
});

