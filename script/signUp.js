import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const successMessage = document.getElementById("successMessage");
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById(
    "signupConfirmPassword",
  ).value;
  const acceptedPrivacy = document.getElementById("checkDefault").checked;

  if (!name || !email || !password || !confirmPassword) {
    alert("Bitte fülle alle Felder aus.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Die Passwörter stimmen nicht überein.");
    return;
  }

  if (!acceptedPrivacy) {
    alert("Bitte akzeptiere die Privacy Policy.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await updateProfile(userCredential.user, {
      displayName: name,
    });

    successMessage.classList.add("show");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
    console.log("Neuer User:", userCredential.user);
  } catch (error) {
    console.error(error);

    if (error.code === "auth/email-already-in-use") {
      alert("Diese E-Mail wird bereits verwendet.");
    } else if (error.code === "auth/weak-password") {
      alert("Das Passwort ist zu schwach.");
    } else if (error.code === "auth/invalid-email") {
      alert("Die E-Mail-Adresse ist ungültig.");
    } else {
      alert("Fehler beim Registrieren: " + error.message);
    }
  }
});
