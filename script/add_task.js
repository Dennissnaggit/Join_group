import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


/**
 * Main initialization for Add Task page
 */
async function initAddTask() {
  if (typeof init === "function") {
    await init();
  }
}

initAddTask();


/* =========================================================
   ELEMENTE
========================================================= */

const addTaskForm = document.getElementById("addTaskForm");
const clearBtn = document.querySelector(".clearBtn");

const input = document.getElementById("subtaskInput");
const inputActions = document.getElementById("inputActions");

const inputFieldMulti = document.getElementById(
  "inputFieldMultiSelect"
);

const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("dropdown");
const selectedItems = document.getElementById("selectedItems");

const checkboxes = document.querySelectorAll(
  '.dropdown input[type="checkbox"]'
);

const labels = document.querySelectorAll(".dropdown label");

const dueDateInput = document.getElementById(
  "exampleFormControlInput1"
);

const uncheckedImg =
  "../assets/AdTask/personUnchecked.png";

const checkedImg =
  "../assets/AdTask/personChecked.png";


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


/* =========================================================
   ASSIGNED TO DROPDOWN
========================================================= */

inputFieldMulti.addEventListener("click", (event) => {
  event.stopPropagation();

  dropdown.classList.add("active");
  searchInput.focus();
});


/**
 * Ausgewählte Kontakte darstellen.
 */
function updateSelectedItems() {
  selectedItems.innerHTML = "";

  checkboxes.forEach((checkbox) => {
    const label = checkbox.closest("label");
    const img = label.querySelector(".checkbox-img");

    img.src = checkbox.checked
      ? checkedImg
      : uncheckedImg;

    if (checkbox.checked) {
      const circle = document.createElement("div");

      circle.classList.add("circle");
      circle.textContent =
        checkbox.value.charAt(0).toUpperCase();

      circle.title = checkbox.value;

      selectedItems.appendChild(circle);
    }
  });
}


checkboxes.forEach((checkbox) => {
  checkbox.addEventListener(
    "change",
    updateSelectedItems
  );
});


/**
 * Kontakte durchsuchen.
 */
searchInput.addEventListener("input", () => {
  const searchValue =
    searchInput.value.toLowerCase();

  labels.forEach((label) => {
    const name = label
      .querySelector(".name-wrap")
      .textContent
      .toLowerCase();

    label.style.display = name.includes(searchValue)
      ? "flex"
      : "none";
  });
});


/**
 * Dropdown schließen, wenn außerhalb geklickt wird.
 */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".multi-select")) {
    dropdown.classList.remove("active");
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

  // Priority Bilder zurücksetzen
  document.querySelector(".urgentBtn img").src =
    "../assets/AdTask/prioUrgentNotActive.png";

  document.querySelector(".mediumBtn img").src =
    "../assets/AdTask/prioMedNotActive.png";

  document.querySelector(".lowBtn img").src =
    "../assets/AdTask/prioLowNotActive.png";

  // Assigned To zurücksetzen
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;

    const img = checkbox
      .closest("label")
      .querySelector(".checkbox-img");

    img.src = uncheckedImg;
  });

  selectedItems.innerHTML = "";

  // Suche zurücksetzen
  searchInput.value = "";

  // Alle Kontakte wieder anzeigen
  labels.forEach((label) => {
    label.style.display = "flex";
  });

  // Dropdown schließen
  dropdown.classList.remove("active");

  // Subtasks löschen
  document.getElementById(
    "subtaskList"
  ).innerHTML = "";

  // Subtask Input zurücksetzen
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
  return [
    ...document.querySelectorAll(
      '#dropdown input[type="checkbox"]:checked'
    ),
  ].map((checkbox) => checkbox.value);
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

    resetAddTaskForm();

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

addTaskForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    console.log(
      "Create Task Button geklickt"
    );

    await createTask();
  }
);