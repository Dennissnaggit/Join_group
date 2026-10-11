import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { setupPasswordToggle } from "./authPassword.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const passwordToggle = document.getElementById("toggleLoginPassword");
const messageBox = document.getElementById("signupMessage");
const credentialsError = document.getElementById("loginCredentialsError");
const credentialsErrorMessage = "Check your email and password. Please try again.";
let messageTimeout;

setupPasswordToggle(passwordInput, passwordToggle);
loginForm.addEventListener("submit", handleLogin);
emailInput.addEventListener("input", resetValidation);
passwordInput.addEventListener("input", resetValidation);


/**
 * Prüft die Eingaben und startet die Anmeldung.
 * @param {SubmitEvent} event - Ausgelöstes Formularereignis.
 * @returns {Promise<void>} Abschluss der Anmeldung.
 */
async function handleLogin(event) {
  event.preventDefault();
  resetValidation();
  if (!validateLoginForm()) return;
  try {
    await authenticateUser();
    handleLoginSuccess();
  } catch (error) {
    handleLoginError(error);
  }
}


/** @returns {boolean} Ob beide Anmeldefelder ausgefüllt sind. */
function validateLoginForm() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (email && password) return true;
  if (!email) emailInput.classList.add("is-invalid");
  if (!password) passwordInput.classList.add("is-invalid");
  showCredentialsError();
  return false;
}


/** @returns {Promise<void>} Abschluss der Anmeldung und lokalen Profilspeicherung. */
async function authenticateUser() {
  const { user } = await signInWithEmailAndPassword(
    auth, emailInput.value.trim(), passwordInput.value,
  );
  const userName = await getUserName(user);
  saveUserSession(user, userName);
}


/**
 * Liest den Anzeigenamen mit der E-Mail als Ersatzwert.
 * @param {import("https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js").User} user - Angemeldeter Benutzer.
 * @returns {Promise<string>} Gespeicherter Anzeigename.
 */
async function getUserName(user) {
  const userSnap = await getDoc(doc(db, "users", user.uid));
  return userSnap.exists() ? userSnap.data().name || user.email : user.email;
}


/**
 * Speichert die Sitzung für die übrigen Seiten.
 * @param {object} user - Firebase-Benutzer.
 * @param {string} userName - Anzeigename.
 */
function saveUserSession(user, userName) {
  const session = { uid: user.uid, email: user.email, name: userName, isGuest: false };
  localStorage.setItem("currentUser", JSON.stringify(session));
  localStorage.setItem("userName", userName);
}


/** Zeigt den Erfolg und leitet nach 800 ms zur Übersicht weiter. */
function handleLoginSuccess() {
  showMessage("Login erfolgreich.");
  setTimeout(() => { window.location.href = "./pages/summary.html"; }, 800);
}


/**
 * Zeigt einen Anmeldefehler und leert das Passwort.
 * @param {Error} error - Fehler der Anmeldung oder des Profilabrufs.
 */
function handleLoginError(error) {
  console.error(error);
  emailInput.classList.add("is-invalid");
  passwordInput.classList.add("is-invalid");
  passwordInput.value = "";
  showCredentialsError();
  passwordInput.focus();
}


/**
 * Zeigt eine allgemeine Meldung für drei Sekunden.
 * @param {string} message - Meldungstext.
 * @param {string} [type="success"] - Darstellungsart der Meldung.
 */
function showMessage(message, type = "success") {
  if (!messageBox) {
    console.error("Das Element #signupMessage wurde nicht gefunden.");
    return;
  }
  messageBox.textContent = message;
  messageBox.className = `success-message success-message--${type} show`;
  window.clearTimeout(messageTimeout);
  messageTimeout = window.setTimeout(() => messageBox.classList.remove("show"), 3000);
}


/** Entfernt Fehlermarkierungen und den gemeinsamen Fehlertext. */
function resetValidation() {
  [emailInput, passwordInput].forEach(clearInputError);
  credentialsError.textContent = "";
  credentialsError.classList.remove("show");
}


/**
 * Entfernt die Fehlermarkierung eines Eingabefeldes.
 * @param {HTMLInputElement} input - Zu bereinigendes Eingabefeld.
 */
function clearInputError(input) {
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
}


/** Verknüpft beide Felder mit dem gemeinsamen Fehlertext und zeigt ihn an. */
function showCredentialsError() {
  [emailInput, passwordInput].forEach((input) => {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "loginCredentialsError");
  });
  credentialsError.textContent = credentialsErrorMessage;
  credentialsError.classList.add("show");
}
