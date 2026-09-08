// === Firebase-Module ===

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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

// Verhindert das Neuladen, prüft das Formular und steuert Registrierung und Buttonstatus.
async function handleSignup(event) {
  event.preventDefault();
  hideMessage();
  resetInvalidFields();
  if (!validateSignupForm()) return;

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

// Sperrt den Button während der Registrierung und passt seine Beschriftung an.
function setSubmitButtonState(isSubmitting) {
  const submitButton = signupForm.querySelector('button[type="submit"]');
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Signing Up..." : "Sign Up";
}

// Erstellt das Firebase-Konto und speichert anschließend Anzeigenamen und Startdaten.
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

// Zeigt die Erfolgsmeldung, leert das Formular und leitet nach zwei Sekunden zur Startseite weiter.
function handleSignupSuccess() {
  showMessage("You signed up successfully.", "success");
  signupForm.reset();
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 2000);
}

// Protokolliert den Fehler und zeigt ihn am passenden Feld oder als allgemeine Meldung.
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

// Blendet eine Meldung ein; allgemeine Fehlermeldungen verschwinden nach vier Sekunden.
function showMessage(message, type) {
  clearTimeout(messageTimeout);
  signupMessage.textContent = message;
  signupMessage.classList.remove(
    "show",
    "success-message--success",
    "success-message--error"
  );
  signupMessage.classList.add(`success-message--${type === "success" ? "success" : "error"}`);
  // Browser muss die entfernte Klasse kurz verarbeiten.
  requestAnimationFrame(() => signupMessage.classList.add("show"));
  if (type === "error") {
    messageTimeout = setTimeout(hideMessage, 4000);
  }
}

// Blendet die allgemeine Meldung aus.
function hideMessage() {
  signupMessage.classList.remove("show");
}

// === Formularvalidierung und Fehler an Eingabefeldern ===

// Prüft alle Eingaben und die Datenschutzzustimmung, zeigt Fehler und fokussiert das erste fehlerhafte Feld.
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

// Markiert ein Feld als ungültig und verknüpft es für Screenreader mit seinem Fehlertext.
function showFieldError(input, message) {
  input.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", `${input.id}Error`);
  fieldErrors[input.id].textContent = message;
  fieldErrors[input.id].classList.add("show");
}

// Entfernt die Fehlermarkierungen und Fehlertexte aller Formularfelder.
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

// Entfernt Fehlermarkierung, Fehlertext und zugehörige ARIA-Attribute eines einzelnen Feldes.
function clearFieldError(input) {
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  fieldErrors[input.id].textContent = "";
  fieldErrors[input.id].classList.remove("show");
}

// Prüft ein einzelnes Feld, aktualisiert dessen Fehleranzeige und gibt zurück, ob es gültig ist.
function validateField(input) {
  const error = getFieldValidationError(input);

  if (error) {
    showFieldError(input, error);
    return false;
  }

  clearFieldError(input);
  return true;
}

// Liefert den passenden Fehlertext für Pflichtfelder, E-Mail und Passwörter oder einen leeren String.
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

// Prüft das grundlegende E-Mail-Format mit @-Zeichen und einem Punkt im Domainteil.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// === Startdaten: Beispielkontakte und Beispielaufgaben ===

// Berechnet ein Datum in der angegebenen Anzahl von Tagen ab heute in UTC im Format YYYY-MM-DD.
function getFutureDate(daysFromToday) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

// Diese Kontakte erhält jedes neue Benutzerkonto.
const exampleContacts = [
  {
    id: "example-contact-1",
    name: "Max Mustermann",
    email: "max.mustermann@example.com",
    phone: "+49 170 1234567",
    color: "#ff7a00",
  },
  {
    id: "example-contact-2",
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    phone: "+49 171 2345678",
    color: "#9327ff",
  },
  {
    id: "example-contact-3",
    name: "Peter Müller",
    email: "peter.mueller@example.com",
    phone: "+49 172 3456789",
    color: "#00bee8",
  },
];

// daysFromToday legt fest, wie viele Tage nach der Registrierung eine Aufgabe fällig ist.
const exampleTasks = [
  {
    id: "example-task-1",
    title: "Explore Join",
    description: "Get familiar with the board and move this task.",
    type: "User Story",
    category: "kategorie1",
    status: "todo",
    priority: "medium",
    assignedTo: ["Max Mustermann"],
    daysFromToday: 3,
    subtasks: [
      { title: "Open the board", done: true },
      { title: "Move the task", done: false },
    ],
  },
  {
    id: "example-task-2",
    title: "Prepare project kickoff",
    description: "Collect the first ideas for the new project.",
    type: "Technical Task",
    category: "kategorie2",
    status: "in-progress",
    priority: "urgent",
    assignedTo: ["Anna Schmidt", "Peter Müller"],
    daysFromToday: 7,
    subtasks: [
      { title: "Create an agenda", done: false },
      { title: "Invite participants", done: false },
    ],
  },
  {
    id: "example-task-3",
    title: "Review first results",
    description: "Review the current progress with the team.",
    type: "User Story",
    category: "kategorie1",
    status: "await-feedback",
    priority: "low",
    assignedTo: ["Peter Müller"],
    daysFromToday: 14,
    subtasks: [],
  },
];

// Speichert Benutzerprofil, Beispielkontakte und Beispielaufgaben gemeinsam in einem Firestore-Batch.
async function createInitialUserData(user, name) {
  const batch = writeBatch(db);
  const userRef = doc(db, "users", user.uid);
  batch.set(userRef, {
    uid: user.uid,
    name,
    email: user.email,
    createdAt: serverTimestamp(),
  });
  addExampleContacts(batch, userRef);
  addExampleTasks(batch, userRef, user.uid);
  await batch.commit();
}

// Fügt die Beispielkontakte zum Schreibvorgang hinzu; gespeichert wird erst beim Batch-Commit.
function addExampleContacts(batch, userRef) {
  exampleContacts.forEach(({ id, ...contact }) => {
    batch.set(doc(userRef, "contacts", id), contact);
  });
}

// Ergänzt Beispielaufgaben um Fälligkeitsdatum, Ersteller und Zeitstempel und fügt sie dem Batch hinzu.
function addExampleTasks(batch, userRef, uid) {
  exampleTasks.forEach(({ id, daysFromToday, ...task }) => {
    batch.set(doc(userRef, "tasks", id), {
      ...task,
      dueDate: getFutureDate(daysFromToday),
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
  });
}

// === Firebase-Fehler zuordnen und erklären ===

// Ordnet bestimmte Firebase-Fehler dem E-Mail- oder Passwortfeld zu; sonst wird null zurückgegeben.
function getFirebaseErrorTarget(errorCode) {
  if (errorCode === "auth/weak-password") return passwordInput;
  if (["auth/email-already-in-use", "auth/invalid-email"].includes(errorCode)) {
    return emailInput;
  }
  return null;
}

// Übersetzt bekannte Firebase-Fehlercodes in lesbare Meldungen und liefert sonst einen allgemeinen Fehlertext.
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

// Verknüpft Eingabe und Umschaltbutton und gibt die Funktion zum Aktualisieren des Symbols zurück.
function setupPasswordToggle(input, toggleButton) {
  if (!input || !toggleButton) return () => {};

  // Das Symbol zeigt an, ob das Passwortfeld Text enthält.
  const updateIcon = () => {
    toggleButton.classList.toggle(
      "password-toggle--has-value",
      input.value.length > 0
    );
  };

  input.addEventListener("input", updateIcon);
  toggleButton.addEventListener("click", () => togglePasswordVisibility(input, toggleButton));

  updateIcon();
  return updateIcon;
}

// Wechselt die Passwortsichtbarkeit und aktualisiert Buttonzustand und Beschriftung für Screenreader.
function togglePasswordVisibility(input, toggleButton) {
  const passwordIsVisible = input.type === "text";
  input.type = passwordIsVisible ? "password" : "text";
  toggleButton.setAttribute("aria-pressed", String(!passwordIsVisible));
  toggleButton.setAttribute(
    "aria-label",
    passwordIsVisible ? "Passwort anzeigen" : "Passwort verbergen"
  );
  input.focus();
}

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
