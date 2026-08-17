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

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideMessage();
  resetInvalidFields();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const acceptedPrivacy = privacyCheckbox.checked;
  const validationErrors = [];

  // Eigene Validierung vor Firebase
  if (!name) {
    validationErrors.push([nameInput, "Please enter your name."]);
  }

  if (!email) {
    validationErrors.push([
      emailInput,
      "Please enter your email address.",
    ]);
  } else if (!isValidEmail(email)) {
    validationErrors.push([
      emailInput,
      "Please enter a valid email address.",
    ]);
  }

  if (!password) {
    validationErrors.push([
      passwordInput,
      "Please enter a password.",
    ]);
  } else if (password.length < 6) {
    validationErrors.push([
      passwordInput,
      "Your password must contain at least 6 characters.",
    ]);
  }

  if (!confirmPassword) {
    validationErrors.push([
      confirmPasswordInput,
      "Please confirm your password.",
    ]);
  } else if (password !== confirmPassword) {
    validationErrors.push([
      confirmPasswordInput,
      "The passwords do not match.",
    ]);
  }

  if (!acceptedPrivacy) {
    validationErrors.push([
      privacyCheckbox,
      "Please accept the Privacy Policy.",
    ]);
  }

  if (validationErrors.length) {
    validationErrors.forEach(([input, message]) => {
      showFieldError(input, message);
    });

    validationErrors[0][0].focus();
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

    await createInitialUserData(user, name);

    showMessage("You signed up successfully.", "success");

    signupForm.reset();

    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
  } catch (error) {
    console.error("Firebase Fehler:", error.code, error.message);
    const message = getFirebaseErrorMessage(error.code);
    const target = getFirebaseErrorTarget(error.code);

    if (target) {
      showFieldError(target, message);
    } else {
      showMessage(message, "error");
    }
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

function showFieldError(input, message) {
  input.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", `${input.id}Error`);
  fieldErrors[input.id].textContent = message;
  fieldErrors[input.id].classList.add("show");
  input.focus();
}

function resetInvalidFields() {
  [nameInput, emailInput, passwordInput, confirmPasswordInput, privacyCheckbox]
    .forEach((input) => {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      fieldErrors[input.id].textContent = "";
      fieldErrors[input.id].classList.remove("show");
    });
}

[nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
  input.addEventListener("input", () => clearFieldError(input));
});
privacyCheckbox.addEventListener("change", () =>
  clearFieldError(privacyCheckbox)
);

function clearFieldError(input) {
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  fieldErrors[input.id].textContent = "";
  fieldErrors[input.id].classList.remove("show");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFutureDate(daysFromToday) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

async function createInitialUserData(user, name) {
  const batch = writeBatch(db);
  const userRef = doc(db, "users", user.uid);
  const contacts = [
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
  const tasks = [
    {
      id: "example-task-1",
      title: "Explore Join",
      description: "Get familiar with the board and move this task.",
      type: "User Story",
      category: "kategorie1",
      status: "todo",
      priority: "medium",
      assignedTo: ["Max Mustermann"],
      dueDate: getFutureDate(3),
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
      dueDate: getFutureDate(7),
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
      dueDate: getFutureDate(14),
      subtasks: [],
    },
  ];

  batch.set(userRef, {
    uid: user.uid,
    name,
    email: user.email,
    createdAt: serverTimestamp(),
  });

  contacts.forEach(({ id, ...contact }) => {
    batch.set(doc(userRef, "contacts", id), contact);
  });

  tasks.forEach(({ id, ...task }) => {
    batch.set(doc(userRef, "tasks", id), {
      ...task,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

function getFirebaseErrorTarget(errorCode) {
  if (errorCode === "auth/weak-password") return passwordInput;
  if (["auth/email-already-in-use", "auth/invalid-email"].includes(errorCode)) {
    return emailInput;
  }
  return null;
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
const togglePassword = document.getElementById("togglePassword");
const togglePasswordUp = document.getElementById("togglePasswordUp");

function setupPasswordToggle(input, toggleButton) {
  if (!input || !toggleButton) return () => {};

  const updateIcon = () => {
    toggleButton.classList.toggle(
      "password-toggle--has-value",
      input.value.length > 0
    );
  };

  input.addEventListener("input", updateIcon);
  toggleButton.addEventListener("click", () => {
    const passwordIsVisible = input.type === "text";
    input.type = passwordIsVisible ? "password" : "text";
    toggleButton.setAttribute("aria-pressed", String(!passwordIsVisible));
    toggleButton.setAttribute(
      "aria-label",
      passwordIsVisible ? "Passwort anzeigen" : "Passwort verbergen"
    );
    input.focus();
  });

  updateIcon();
  return updateIcon;
}

const updatePasswordIcon = setupPasswordToggle(passwordInput, togglePassword);
const updateConfirmPasswordIcon = setupPasswordToggle(
  confirmPasswordInput,
  togglePasswordUp
);

signupForm.addEventListener("reset", () => {
  requestAnimationFrame(() => {
    updatePasswordIcon();
    updateConfirmPasswordIcon();
  });
});
