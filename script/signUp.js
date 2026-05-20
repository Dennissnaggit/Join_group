import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
const successMessage = document.getElementById("successMessage");
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;
  const acceptedPrivacy = document.getElementById("checkDefault").checked;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name,
    });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    console.log("User gespeichert:", user.uid);

    successMessage.classList.add("show");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);

  } catch (error) {
    console.error("Firebase Fehler:", error.code, error.message);
    alert(error.message);
  }
});