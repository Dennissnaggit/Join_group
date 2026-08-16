import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const passwordToggle = document.getElementById("toggleLoginPassword");
const messageBox = document.getElementById("signupMessage");

passwordToggle?.addEventListener("click", () => {
  const passwordIsVisible = passwordInput.type === "text";
  passwordInput.type = passwordIsVisible ? "password" : "text";
  passwordToggle.setAttribute("aria-pressed", String(!passwordIsVisible));
  passwordToggle.setAttribute(
    "aria-label",
    passwordIsVisible ? "Passwort anzeigen" : "Passwort verbergen",
  );
  passwordInput.focus();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetValidation();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    if (!email) {
      emailInput.classList.add("is-invalid");
    }
    if (!password) {
      passwordInput.classList.add("is-invalid");
    }
    showMessage("Bitte gib E-Mail und Passwort ein.", "error");
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    let userName = user.email;
    if (userSnap.exists()) {
      const userData = userSnap.data();
      userName = userData.name || user.email;
    }
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: userName,
        isGuest: false,
      }),
    );
    localStorage.setItem("userName", userName);
    showMessage("Login erfolgreich.", "success");
    setTimeout(() => {
      window.location.href = "./pages/summary.html";
    }, 800);
  } catch (error) {
    console.error(error);
    emailInput.classList.add("is-invalid");
    passwordInput.classList.add("is-invalid");
    showMessage("Der Login ist fehlgeschlagen.", "error");
  }
});
function showMessage(message, type = "success") {
  if (!messageBox) {
    console.error("Das Element #signupMessage wurde nicht gefunden.");
    return;
  }
  messageBox.textContent = message;
  messageBox.className = `success-message success-message--${type} show`;
  window.clearTimeout(showMessage.timeout);
  showMessage.timeout = window.setTimeout(() => {
    messageBox.classList.remove("show");
  }, 3000);
}
function resetValidation() {
  emailInput.classList.remove("is-invalid");
  passwordInput.classList.remove("is-invalid");
}
emailInput.addEventListener("input", resetValidation);
passwordInput.addEventListener("input", resetValidation);
