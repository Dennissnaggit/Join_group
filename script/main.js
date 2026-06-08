import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const guestUser = JSON.parse(localStorage.getItem("currentUser"));

if (guestUser && guestUser.name === "Guest User") {
  document.getElementById("userNameDisplay").textContent = guestUser.name;
} else {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "../index.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      document.getElementById("userNameDisplay").textContent = userData.name;
      localStorage.setItem("userName", userData.name);
    }
  });
}