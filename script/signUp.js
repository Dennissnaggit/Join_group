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
const signupMessage = document.getElementById("signupMessage");

const nameInput = document.getElementById("signupName");
const emailInput = document.getElementById("signupEmail");
const passwordInput = document.getElementById("signupPassword");
const confirmPasswordInput = document.getElementById(
  "signupConfirmPassword"
);
const privacyCheckbox = document.getElementById("checkDefault");

let messageTimeout;

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideMessage();
  resetInvalidFields();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const acceptedPrivacy = privacyCheckbox.checked;

  // Eigene Validierung vor Firebase
  if (!name) {
    showMessage("Please enter your name.", "error");
    markInvalid(nameInput);
    return;
  }

  if (!email) {
    showMessage("Please enter your email address.", "error");
    markInvalid(emailInput);
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address.", "error");
    markInvalid(emailInput);
    return;
  }

  if (!password) {
    showMessage("Please enter a password.", "error");
    markInvalid(passwordInput);
    return;
  }

  if (password.length < 6) {
    showMessage("Your password must contain at least 6 characters.", "error");
    markInvalid(passwordInput);
    return;
  }

  if (!confirmPassword) {
    showMessage("Please confirm your password.", "error");
    markInvalid(confirmPasswordInput);
    return;
  }

  if (password !== confirmPassword) {
    showMessage("The passwords do not match.", "error");
    markInvalid(passwordInput);
    markInvalid(confirmPasswordInput);
    return;
  }

  if (!acceptedPrivacy) {
    showMessage("Please accept the Privacy Policy.", "error");
    privacyCheckbox.classList.add("is-invalid");
    privacyCheckbox.focus();
    return;
  }

  const submitButton = signupForm.querySelector('button[type="submit"]');

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Signing Up...";

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
      name,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    showMessage("You signed up successfully.", "success");

    signupForm.reset();

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
  } catch (error) {
    console.error("Firebase Fehler:", error.code, error.message);

    showMessage(getFirebaseErrorMessage(error.code), "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign Up";
  }
});

function showMessage(message, type) {
  clearTimeout(messageTimeout);

  signupMessage.textContent = message;

  signupMessage.classList.remove(
    "show",
    "success-message--success",
    "success-message--error"
  );

  signupMessage.classList.add(
    type === "success"
      ? "success-message--success"
      : "success-message--error"
  );

  // Browser muss die entfernte Klasse kurz verarbeiten.
  requestAnimationFrame(() => {
    signupMessage.classList.add("show");
  });

  if (type === "error") {
    messageTimeout = setTimeout(() => {
      hideMessage();
    }, 4000);
  }
}

function hideMessage() {
  signupMessage.classList.remove("show");
}

function markInvalid(input) {
  input.classList.add("is-invalid");
  input.focus();
}

function resetInvalidFields() {
  nameInput.classList.remove("is-invalid");
  emailInput.classList.remove("is-invalid");
  passwordInput.classList.remove("is-invalid");
  confirmPasswordInput.classList.remove("is-invalid");
  privacyCheckbox.classList.remove("is-invalid");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFirebaseErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email address is already registered.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "The password is too weak.";

    case "auth/network-request-failed":
      return "A network error occurred. Please try again.";

    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    default:
      return "Sign up failed. Please try again.";
  }
}
const passwordInputDown = document.getElementById("signupPassword");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    passwordInputDown.type =
      passwordInputDown.type === "password" ? "text" : "password";
  });
}
const passwordInputUp = document.getElementById("signupConfirmPassword");
const togglePasswordUp = document.getElementById("togglePasswordUp");

if (passwordInputUp && togglePasswordUp) {
  togglePasswordUp.addEventListener("click", () => {
    passwordInputUp.type =
      passwordInputUp.type === "password" ? "text" : "password";
  });
}