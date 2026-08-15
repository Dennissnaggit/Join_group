import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


/**
 * Main initialization for Add Task page
 */
async function initAddTask() {
    if (typeof init === "function") {
        await init();
    }

    await waitForAuth();

    await loadContacts();
}

initAddTask();

function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe =
            auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
    });
}


/* =========================================================
   ELEMENTE
========================================================= */

const addTaskForm = document.getElementById("addTaskForm");
const clearBtn = document.querySelector(".clearBtn");

const input = document.getElementById("subtaskInput");
const inputActions = document.getElementById("inputActions");

const assignedToWrapper =
    document.getElementById("assignedToWrapper");

const assignedToToggle =
    document.getElementById("assignedToToggle");

const assignedToDropdown =
    document.getElementById("assignedToDropdown");

const assignedToSearch =
    document.getElementById("assignedToSearch");

const assignedToOptions =
    document.getElementById("assignedToOptions");

const assignedToSelected =
    document.getElementById("assignedToSelected");


let availableContacts = [];

let selectedContactIds = [];

const dueDateInput = document.getElementById(
  "exampleFormControlInput1"
);
const titleInput = document.getElementById("TitleOfTask");
const categoryInput = document.getElementById("category");
const requiredTaskFields = [titleInput, dueDateInput, categoryInput];
const taskFieldErrors = {
  TitleOfTask: document.getElementById("TitleOfTaskError"),
  exampleFormControlInput1: document.getElementById(
    "exampleFormControlInput1Error"
  ),
  category: document.getElementById("categoryError"),
};


/* =========================================================
   SUBTASKS
========================================================= */

/**
 * Zeigt / versteckt die Buttons im Subtask Input.
 */
input.addEventListener("input", function () {
  if (this.value.trim()) {
    inputActions.classList.remove("d-none");
    inputActions.classList.add("d-flex");
  } else {
    inputActions.classList.add("d-none");
    inputActions.classList.remove("d-flex");
  }
});


/**
 * Subtask mit Enter hinzufügen.
 */
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && this.value.trim()) {
    event.preventDefault();
    addSubtask();
  }
});


/**
 * Subtask Input leeren.
 */
function clearSubtaskInput() {
  input.value = "";

  inputActions.classList.add("d-none");
  inputActions.classList.remove("d-flex");
}


/**
 * Neuen Subtask hinzufügen.
 */
function addSubtask() {
  const text = input.value.trim();

  if (!text) {
    return;
  }

  const li = document.createElement("li");

  li.className =
    "list-group-item d-flex justify-content-between align-items-center subtask-item";

  li.innerHTML = `
    <span class="subtask-text">• ${text}</span>

    <div class="subtask-actions">
      <img
        src="../assets/AdTask/edit.png"
        class="action-icon"
        onclick="editSubtask(this)"
        alt="Bearbeiten"
      >

      <div class="action-divider"></div>

      <img
        src="../assets/AdTask/close.png"
        class="action-icon"
        onclick="removeSubtask(this)"
        alt="Löschen"
      >
    </div>
  `;

  document
    .getElementById("subtaskList")
    .appendChild(li);

  clearSubtaskInput();
}


/**
 * Subtask entfernen.
 */
function removeSubtask(icon) {
  icon.closest("li").remove();
}


/**
 * Subtask bearbeiten.
 */
function editSubtask(icon) {
  const li = icon.closest("li");

  const text = li
    .querySelector(".subtask-text")
    .textContent
    .replace("•", "")
    .trim();

  input.value = text;
  input.focus();

  li.remove();

  inputActions.classList.remove("d-none");
  inputActions.classList.add("d-flex");
}


/*
 * Weil add_task.js jetzt type="module" ist,
 * müssen Funktionen für onclick="" explizit
 * an window gehängt werden.
 */
window.clearSubtaskInput = clearSubtaskInput;
window.addSubtask = addSubtask;
window.removeSubtask = removeSubtask;
window.editSubtask = editSubtask;


/* =========================================================
   PRIORITY
========================================================= */

document
  .querySelectorAll('input[name="priority"]')
  .forEach((radio) => {
    radio.addEventListener("change", () => {
      document.querySelector(".urgentBtn img").src =
        radio.id === "urgent"
          ? "../assets/AdTask/prioUrgentActive.png"
          : "../assets/AdTask/prioUrgentNotActive.png";

      document.querySelector(".mediumBtn img").src =
        radio.id === "medium"
          ? "../assets/AdTask/prioMedActive.png"
          : "../assets/AdTask/prioMedNotActive.png";

      document.querySelector(".lowBtn img").src =
        radio.id === "low"
          ? "../assets/AdTask/prioLowActive.png"
          : "../assets/AdTask/prioLowNotActive.png";
    });
  });

/**
 * Lädt alle Kontakte des aktuell eingeloggten Users.
 */
async function loadContacts() {
    const user = auth.currentUser;

    if (!user) {
        console.error("Kontakte konnten nicht geladen werden: Kein User eingeloggt.");
        return;
    }

    try {
        const contactsCollection = collection(
            db,
            "users",
            user.uid,
            "contacts"
        );

        const snapshot = await getDocs(contactsCollection);

        availableContacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        availableContacts.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        renderAssignedToOptions();
    } catch (error) {
        console.error(
            "Fehler beim Laden der Kontakte:",
            error
        );
    }
}
/* =========================================================
   ASSIGNED TO DROPDOWN
========================================================= */
function renderAssignedToOptions(searchValue = "") {
    const normalizedSearch =
        searchValue.trim().toLowerCase();

    const filteredContacts =
        availableContacts.filter((contact) =>
            contact.name
                .toLowerCase()
                .includes(normalizedSearch)
        );

    if (filteredContacts.length === 0) {
        assignedToOptions.innerHTML = `
            <p class="bat-no-contacts">
                No contacts found
            </p>
        `;

        return;
    }

    assignedToOptions.innerHTML =
        filteredContacts
            .map(createAssignedContactTemplate)
            .join("");
}

function createAssignedContactTemplate(contact) {
    const selected =
        selectedContactIds.includes(contact.id);

    const initials =
        getContactInitials(contact.name);

    return `
        <div
            class="bat-contact-option ${selected ? "selected" : ""}"
            data-contact-id="${contact.id}"
        >

            <div class="bat-contact-name-wrap">

                <div
                    class="bat-contact-avatar"
                    style="background-color: ${contact.color}"
                >
                    ${initials}
                </div>

                <span>${contact.name}</span>

            </div>

            <div class="bat-checkbox">
                ${selected ? "✓" : ""}
            </div>

        </div>
    `;
}

function getContactInitials(name) {
    const parts =
        name.trim().split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .charAt(0)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}

assignedToOptions.addEventListener(
    "click",
    (event) => {
        const option =
            event.target.closest(
                ".bat-contact-option"
            );

        if (!option) {
            return;
        }

        const contactId =
            option.dataset.contactId;

        toggleAssignedContact(contactId);
    }
);

function toggleAssignedContact(contactId) {
    if (selectedContactIds.includes(contactId)) {
        selectedContactIds =
            selectedContactIds.filter(
                (id) => id !== contactId
            );
    } else {
        selectedContactIds.push(contactId);
    }

    renderAssignedToOptions(
        assignedToSearch.value
    );

    renderSelectedContacts();
}

function renderSelectedContacts() {
    assignedToSelected.innerHTML =
        selectedContactIds
            .map((contactId) => {

                const contact =
                    availableContacts.find(
                        (contact) =>
                            contact.id === contactId
                    );

                if (!contact) {
                    return "";
                }

                const initials =
                    getContactInitials(
                        contact.name
                    );

                return `
                    <div
                        class="bat-selected-avatar"
                        style="background-color: ${contact.color}"
                        title="${contact.name}"
                    >
                        ${initials}
                    </div>
                `;
            })
            .join("");
}

assignedToToggle.addEventListener(
    "click",
    (event) => {
        event.stopPropagation();

        assignedToDropdown.classList.toggle(
            "d-none"
        );

        if (
            !assignedToDropdown.classList.contains(
                "d-none"
            )
        ) {
            assignedToSearch.focus();
        }
    }
);

assignedToSearch.addEventListener("input", () => {
    renderAssignedToOptions(
        assignedToSearch.value
    );
});


document.addEventListener("click", (event) => {
    if (
        !event.target.closest(
            "#assignedToWrapper"
        )
    ) {
        assignedToDropdown.classList.add(
            "d-none"
        );
    }
});

/* =========================================================
   DATUM
========================================================= */

/**
 * Vergangene Tage im Datepicker deaktivieren.
 */
const today = new Date();

today.setMinutes(
  today.getMinutes() - today.getTimezoneOffset()
);

dueDateInput.min =
  today.toISOString().split("T")[0];


/* =========================================================
   CLEAR FORM
========================================================= */

clearBtn.addEventListener("click", () => {
  resetAddTaskForm();
});


/**
 * Komplettes Add-Task-Formular zurücksetzen.
 */
function resetAddTaskForm() {
    addTaskForm.reset();
    resetTaskFieldErrors();

    // Priority zurücksetzen
    document.querySelector(".urgentBtn img").src =
        "../assets/AdTask/prioUrgentNotActive.png";

    document.querySelector(".mediumBtn img").src =
        "../assets/AdTask/prioMedNotActive.png";

    document.querySelector(".lowBtn img").src =
        "../assets/AdTask/prioLowNotActive.png";

    // Assigned To zurücksetzen
    selectedContactIds = [];

    assignedToSearch.value = "";

    assignedToSelected.innerHTML = "";

    assignedToDropdown.classList.add("d-none");

    renderAssignedToOptions();

    // Subtasks löschen
    document.getElementById(
        "subtaskList"
    ).innerHTML = "";

    input.value = "";

    inputActions.classList.add("d-none");
    inputActions.classList.remove("d-flex");
}


/* =========================================================
   TASK DATEN AUS FORMULAR HOLEN
========================================================= */

/**
 * Alle Subtasks aus dem DOM holen.
 */
function getSubtasks() {
  const subtaskElements =
    document.querySelectorAll(
      "#subtaskList .subtask-text"
    );

  return [...subtaskElements].map(
    (subtaskElement) => {
      return {
        title: subtaskElement.textContent
          .replace("•", "")
          .trim(),

        completed: false,
      };
    }
  );
}


/**
 * Alle ausgewählten Kontakte holen.
 */
function getAssignedTo() {
    return [...selectedContactIds];
}


/**
 * Ausgewählte Priorität holen.
 */
function getPriority() {
  return (
    document.querySelector(
      'input[name="priority"]:checked'
    )?.id || "medium"
  );
}


/* =========================================================
   FIRESTORE
========================================================= */

/**
 * Task in Firestore speichern.
 *
 * Struktur:
 *
 * users
 *   └── USER_UID
 *       └── tasks
 *           └── TASK_ID
 */
async function createTask() {
  const user = auth.currentUser;

  if (!user) {
    console.error(
      "Task konnte nicht erstellt werden: Kein User eingeloggt."
    );

    alert("Du bist nicht eingeloggt.");

    return;
  }

  const title = document
    .getElementById("TitleOfTask")
    .value
    .trim();

  const description = document
    .getElementById(
      "exampleFormControlTextarea1"
    )
    .value
    .trim();

  const dueDate = document.getElementById(
    "exampleFormControlInput1"
  ).value;

  const category =
    document.getElementById("category").value;

  const task = {
    title: title,
    description: description,
    dueDate: dueDate,
    priority: getPriority(),
    category: category,
    assignedTo: getAssignedTo(),
    subtasks: getSubtasks(),

    createdBy: user.uid,
    createdAt: serverTimestamp(),
  };

  console.log("User UID:", user.uid);
  console.log("Task wird gespeichert:", task);

  try {
    const tasksCollection = collection(
      db,
      "users",
      user.uid,
      "tasks"
    );

    const docRef = await addDoc(
      tasksCollection,
      task
    );

    console.log(
      "Task erfolgreich erstellt!"
    );

    console.log(
      "Task ID:",
      docRef.id
    );

    window.location.href = "board.html";

return docRef.id;
  } catch (error) {
    console.error(
      "Fehler beim Speichern des Tasks:",
      error
    );

    alert(
      "Beim Speichern des Tasks ist ein Fehler aufgetreten."
    );
  }
}


/* =========================================================
   FORM SUBMIT
========================================================= */

function showTaskFieldError(field, message) {
  const errorElement = taskFieldErrors[field.id];

  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", errorElement.id);
  errorElement.textContent = message;
  errorElement.classList.add("show");
}

function clearTaskFieldError(field) {
  const errorElement = taskFieldErrors[field.id];

  field.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  errorElement.textContent = "";
  errorElement.classList.remove("show");
}

function resetTaskFieldErrors() {
  requiredTaskFields.forEach(clearTaskFieldError);
}

function validateAddTaskForm() {
  resetTaskFieldErrors();

  if (!titleInput.value.trim()) {
    showTaskFieldError(titleInput, "This field is required.");
  }

  if (!dueDateInput.value) {
    showTaskFieldError(dueDateInput, "This field is required.");
  } else if (dueDateInput.value < dueDateInput.min) {
    showTaskFieldError(dueDateInput, "Please select a current or future date.");
  }

  if (!categoryInput.value) {
    showTaskFieldError(categoryInput, "This field is required.");
  }

  const firstInvalidField = requiredTaskFields.find((field) =>
    field.classList.contains("is-invalid")
  );

  firstInvalidField?.focus();
  return !firstInvalidField;
}

titleInput.addEventListener("input", () => clearTaskFieldError(titleInput));
dueDateInput.addEventListener("change", () =>
  clearTaskFieldError(dueDateInput)
);
categoryInput.addEventListener("change", () =>
  clearTaskFieldError(categoryInput)
);

addTaskForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!validateAddTaskForm()) {
      return;
    }

    console.log(
      "Create Task Button geklickt"
    );

    await createTask();
  }
);
