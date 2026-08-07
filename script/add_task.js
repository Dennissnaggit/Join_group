// Firebase 

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
  await init();
}

initAddTask();

// Dropdown schließen, wenn außerhalb geklickt wird
document.addEventListener("click", (e) => {
  if (!e.target.closest(".multi-select")) {
    dropdown.classList.remove("active");
  }
});

// Subtask hinzufügen
const input = document.getElementById("subtaskInput");
const inputActions = document.getElementById("inputActions");

input.addEventListener("input", function () {
    if (this.value.trim()) {
        inputActions.classList.remove("d-none");
        inputActions.classList.add("d-flex");
    } else {
        inputActions.classList.add("d-none");
        inputActions.classList.remove("d-flex");
    }
});

input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && this.value.trim()) {
        addSubtask();
    }
});

function clearSubtaskInput() {
    input.value = "";
    inputActions.classList.add("d-none");
    inputActions.classList.remove("d-flex");
}

function addSubtask() {
    const text = input.value.trim();

    if (!text) return;

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

    document.getElementById("subtaskList").appendChild(li);

    input.value = "";
    inputActions.classList.add("d-none");
    inputActions.classList.remove("d-flex");
}

function removeSubtask(icon) {
    icon.closest("li").remove();
}

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

//Prio img tausch

document.querySelectorAll('input[name="priority"]').forEach((radio) => {
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

// Assigned To Dropdown
const inputFieldMulti = document.getElementById("inputFieldMultiSelect");
const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("dropdown");
const selectedItems = document.getElementById("selectedItems");
const checkboxes = document.querySelectorAll(
  '.dropdown input[type="checkbox"]'
);
const labels = document.querySelectorAll(".dropdown label");

const uncheckedImg = "../assets/AdTask/personUnchecked.png";
const checkedImg = "../assets/AdTask/personChecked.png";

inputFieldMulti.addEventListener("click", () => {
  dropdown.classList.add("active");
  searchInput.focus();
});

function updateSelectedItems() {
  selectedItems.innerHTML = "";

  checkboxes.forEach((checkbox) => {
    const label = checkbox.closest("label");
    const img = label.querySelector(".checkbox-img");

    img.src = checkbox.checked ? checkedImg : uncheckedImg;

    if (checkbox.checked) {
      const circle = document.createElement("div");
      circle.classList.add("circle");
      circle.textContent = checkbox.value.charAt(0).toUpperCase();
      circle.title = checkbox.value;

      selectedItems.appendChild(circle);
    }
  });
}

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", updateSelectedItems);
});

searchInput.addEventListener("input", () => {
  const searchValue = searchInput.value.toLowerCase();

  labels.forEach((label) => {
    const name = label.querySelector(".name-wrap").textContent.toLowerCase();

    label.style.display = name.includes(searchValue) ? "flex" : "none";
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".multi-select")) {
    dropdown.classList.remove("active");
  }
});

// Clear Button
const clearBtn = document.querySelector(".clearBtn");
const addTaskForm = document.getElementById("addTaskForm");

addTaskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await createTask();
});

clearBtn.addEventListener("click", () => {
  // Normale Formularfelder zurücksetzen
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

    const img = checkbox.closest("label").querySelector(".checkbox-img");
    img.src = uncheckedImg;
  });

  selectedItems.innerHTML = "";

  // Suche zurücksetzen
  searchInput.value = "";

  // Alle ausgeblendeten Kontakte wieder anzeigen
  labels.forEach((label) => {
    label.style.display = "flex";
  });

  // Dropdown schließen
  dropdown.classList.remove("active");

  // Subtasks löschen
  document.getElementById("subtaskList").innerHTML = "";

  // Subtask Input + Actions zurücksetzen
  input.value = "";
  inputActions.classList.add("d-none");
});

// Datum: vergangene Tage deaktivieren
const dueDateInput = document.getElementById("exampleFormControlInput1");

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

dueDateInput.min = today.toISOString().split("T")[0];

//Task speichern 

async function createTask() {
  const user = auth.currentUser;

  if (!user) {
    console.error("Kein User eingeloggt.");
    return;
  }

  const title = document
    .getElementById("TitleOfTask")
    .value
    .trim();

  const description = document
    .getElementById("exampleFormControlTextarea1")
    .value
    .trim();

  const dueDate = document
    .getElementById("exampleFormControlInput1")
    .value;

  const category = document
    .getElementById("category")
    .value;

  const priority =
    document.querySelector('input[name="priority"]:checked')?.id ||
    "medium";

  const assignedTo = [
    ...document.querySelectorAll(
      '#dropdown input[type="checkbox"]:checked'
    ),
  ].map((checkbox) => checkbox.value);

  const subtasks = [
    ...document.querySelectorAll("#subtaskList .subtask-text"),
  ].map((element) => ({
    title: element.textContent.replace("•", "").trim(),
    completed: false,
  }));

  const task = {
    title,
    description,
    dueDate,
    priority,
    category,
    assignedTo,
    subtasks,
    createdAt: serverTimestamp(),
  };

  console.log("Task vor Firebase:", task);
  console.log("Aktueller User:", user.uid);

  try {
    const docRef = await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "tasks"
      ),
      task
    );

    console.log(
      "Task erfolgreich erstellt:",
      docRef.id
    );

    addTaskForm.reset();

  } catch (error) {
    console.error(
      "Fehler beim Erstellen des Tasks:",
      error
    );
  }
}

window.addSubtask = addSubtask;
window.clearSubtaskInput = clearSubtaskInput;
window.editSubtask = editSubtask;
window.removeSubtask = removeSubtask;