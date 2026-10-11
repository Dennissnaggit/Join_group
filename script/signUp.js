// === Firebase-Module ===

import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { createInitialUserData } from "./signupData.js";
import { setupPasswordToggle } from "./authPassword.js";

// === Formularelemente und Meldungsstatus ===

const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const nameInput = document.getElementById("signupName");
const emailInput = document.getElementById("signupEmail");
const passwordInput = document.getElementById("signupPassword");
const confirmPasswordInput = document.getElementById(
  "signupConfirmPassword"
);
const privacyCheckbox = document.getElementById("checkDefault");
const fieldErrors = {
  signupName: document.getElementById("signupNameError"),
  signupEmail: document.getElementById("signupEmailError"),
  signupPassword: document.getElementById("signupPasswordError"),
  signupConfirmPassword: document.getElementById("signupConfirmPasswordError"),
  checkDefault: document.getElementById("checkDefaultError"),
};

let messageTimeout;

// === Registrierung: Ablauf und Rückmeldung ===

signupForm.addEventListener("submit", handleSignup);


/** Verhindert das Neuladen, prüft das Formular und steuert Registrierung und Buttonstatus.
 * @param {Event} event - Formularereignis.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
async function handleSignup(event) {
  event.preventDefault();
  hideMessage();
  resetInvalidFields();
  if (!validateSignupForm()) return;

  await submitSignup();
}


/** Führt die Registrierung aus und stellt den Button anschließend wieder her.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
async function submitSignup() {
  try {
    setSubmitButtonState(true);
    await registerUser();
    handleSignupSuccess();
  } catch (error) {
    handleSignupError(error);
  } finally {
    setSubmitButtonState(false);
  }
}


/** Sperrt den Button während der Registrierung und passt seine Beschriftung an.
 * @param {boolean} isSubmitting - Ob die Registrierung läuft.
 */
function setSubmitButtonState(isSubmitting) {
  const submitButton = signupForm.querySelector('button[type="submit"]');
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Signing Up..." : "Sign Up";
}


/** Erstellt das Firebase-Konto und speichert anschließend Anzeigenamen und Startdaten.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
async function registerUser() {
  const name = nameInput.value.trim();
  const { user } = await createUserWithEmailAndPassword(
    auth,
    emailInput.value.trim(),
    passwordInput.value
  );
  await updateProfile(user, { displayName: name });
  await createInitialUserData(user, name);
}


/** Zeigt die Erfolgsmeldung, leert das Formular und leitet nach zwei Sekunden zur Startseite weiter.
 */
function handleSignupSuccess() {
  showMessage("You signed up successfully.", "success");
  signupForm.reset();
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 2000);
}


/** Protokolliert den Fehler und zeigt ihn am passenden Feld oder als allgemeine Meldung.
 * @param {Error} error - Aufgetretener Fehler.
 */
function handleSignupError(error) {
  console.error("Firebase Fehler:", error.code, error.message);
  const message = getFirebaseErrorMessage(error.code);
  const target = getFirebaseErrorTarget(error.code);
  if (target) {
    showFieldError(target, message);
  } else {
    showMessage(message, "error");
  }
}

// === Allgemeine Erfolgs- und Fehlermeldungen ===


/** Blendet eine Meldung ein; allgemeine Fehlermeldungen verschwinden nach vier Sekunden.
 * @param {string} message - Anzuzeigender Text.
 * @param {string} type - Darstellungsart der Meldung.
 */
function showMessage(message, type) {
  clearTimeout(messageTimeout);
  signupMessage.textContent = message;
  signupMessage.classList.remove("show", "success-message--success", "success-message--error");
  signupMessage.classList.add(`success-message--${type === "success" ? "success" : "error"}`);
  // Browser muss die entfernte Klasse kurz verarbeiten.
  requestAnimationFrame(() => signupMessage.classList.add("show"));
  if (type === "error") {
    messageTimeout = setTimeout(hideMessage, 4000);
  }
}


/** Blendet die allgemeine Meldung aus.
 */
function hideMessage() {
  signupMessage.classList.remove("show");
}

// === Formularvalidierung und Fehler an Eingabefeldern ===


/** Prüft alle Eingaben und die Datenschutzzustimmung, zeigt Fehler und fokussiert das erste fehlerhafte Feld.
 * @returns {boolean} Ob das Formular gültig ist.
 */
function validateSignupForm() {
  const errors = [];
  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
    const error = getFieldValidationError(input);
    if (error) errors.push([input, error]);
  });
  if (!privacyCheckbox.checked) {
    errors.push([privacyCheckbox, "Please accept the Privacy Policy."]);
  }
  errors.forEach(([input, message]) => showFieldError(input, message));
  if (errors.length) errors[0][0].focus();
  return errors.length === 0;
}


/** Markiert ein Feld als ungültig und verknüpft es für Screenreader mit seinem Fehlertext.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 * @param {string} message - Anzuzeigender Text.
 */
function showFieldError(input, message) {
  input.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", `${input.id}Error`);
  fieldErrors[input.id].textContent = message;
  fieldErrors[input.id].classList.add("show");
}


/** Entfernt die Fehlermarkierungen und Fehlertexte aller Formularfelder.
 */
function resetInvalidFields() {
  [nameInput, emailInput, passwordInput, confirmPasswordInput, privacyCheckbox]
    .forEach(clearFieldError);
}

// Beim Tippen alte Fehler entfernen und beim Verlassen eines Feldes dessen Inhalt prüfen.
[nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
  input.addEventListener("input", () => clearFieldError(input));
  input.addEventListener("blur", () => validateField(input));
});
privacyCheckbox.addEventListener("change", () =>
  clearFieldError(privacyCheckbox)
);


/** Entfernt Fehlermarkierung, Fehlertext und zugehörige ARIA-Attribute eines einzelnen Feldes.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 */
function clearFieldError(input) {
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  fieldErrors[input.id].textContent = "";
  fieldErrors[input.id].classList.remove("show");
}


/** Prüft ein einzelnes Feld, aktualisiert dessen Fehleranzeige und gibt zurück, ob es gültig ist.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 * @returns {boolean} Ob das Feld gültig ist.
 */
function validateField(input) {
  const error = getFieldValidationError(input);

  if (error) {
    showFieldError(input, error);
    return false;
  }

  clearFieldError(input);
  return true;
}


/** Liefert den passenden Fehlertext für Pflichtfelder, E-Mail und Passwörter oder einen leeren String.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 * @returns {string} Fehlertext oder leerer String.
 */
function getFieldValidationError(input) {
  const value = input.value.trim();

  if (input === nameInput && !value) return "Please enter your name.";
  if (input === emailInput && !value) return "Please enter your email address.";
  if (input === emailInput && !isValidEmail(value)) return "Please enter a valid email address.";
  if (input === passwordInput && !input.value) return "Please enter a password.";
  if (input === passwordInput && input.value.length < 6) return "Your password must contain at least 6 characters.";
  if (input === confirmPasswordInput && !input.value) return "Please confirm your password.";
  if (input === confirmPasswordInput && input.value !== passwordInput.value) return "The passwords do not match.";

  return "";
}


/** Prüft das grundlegende E-Mail-Format mit @-Zeichen und einem Punkt im Domainteil.
 * @param {string} email - Zu prüfende E-Mail-Adresse.
 * @returns {boolean} Ob das E-Mail-Format gültig ist.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// === Firebase-Fehler zuordnen und erklären ===


/** Ordnet bestimmte Firebase-Fehler dem E-Mail- oder Passwortfeld zu; sonst wird null zurückgegeben.
 * @param {string} errorCode - Firebase-Fehlercode.
 * @returns {HTMLInputElement|null} Passendes Feld oder null.
 */
function getFirebaseErrorTarget(errorCode) {
  if (errorCode === "auth/weak-password") return passwordInput;
  if (["auth/email-already-in-use", "auth/invalid-email"].includes(errorCode)) {
    return emailInput;
  }
  return null;
}


/** Übersetzt bekannte Firebase-Fehlercodes in lesbare Meldungen und liefert sonst einen allgemeinen Fehlertext.
 * @param {string} errorCode - Firebase-Fehlercode.
 * @returns {string} Lesbare Fehlermeldung.
 */
function getFirebaseErrorMessage(errorCode) {
  const messages = {
    "auth/email-already-in-use": "This email address is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "The password is too weak.",
    "auth/network-request-failed": "A network error occurred. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };
  return messages[errorCode] ?? "Sign up failed. Please try again.";
}

// === Passwortanzeige und Symbole ===

const togglePassword = document.getElementById("togglePassword");
const togglePasswordUp = document.getElementById("togglePasswordUp");

const updatePasswordIcon = setupPasswordToggle(passwordInput, togglePassword);
const updateConfirmPasswordIcon = setupPasswordToggle(
  confirmPasswordInput,
  togglePasswordUp
);

// Symbole aktualisieren, nachdem der Browser die Eingabefelder zurückgesetzt hat.
signupForm.addEventListener("reset", () => {
  requestAnimationFrame(() => {
    updatePasswordIcon();
    updateConfirmPasswordIcon();
  });
});
