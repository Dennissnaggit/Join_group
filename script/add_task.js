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

  if (!title) {
  showFormMessage("Bitte gib einen Titel ein.");
  return;
}

if (!description) {
  showFormMessage("Bitte gib eine Beschreibung ein.");
  return;
}

if (!dueDate) {
  showFormMessage("Bitte wähle ein Fälligkeitsdatum.");
  return;
}

if (!category) {
  showFormMessage("Bitte wähle eine Kategorie.");
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

<<<<<<< HEAD
  window.location.href = "./board.html";
}

function showFormMessage(message) {
  const messageBox = document.getElementById("formMessage");
  const messageText = document.getElementById("formMessageText");

  if (!messageBox || !messageText) return;

  messageText.textContent = message;
  messageBox.classList.add("show");

  setTimeout(() => {
    messageBox.classList.remove("show");
  }, 3000);
}

function showFormMessage(message) {
  const messageBox = document.getElementById("formMessage");
  const messageText = document.getElementById("formMessageText");

  if (!messageBox || !messageText) return;

  messageText.textContent = message;
  messageBox.classList.add("show");

  clearTimeout(messageBox.hideTimeout);

  messageBox.hideTimeout = setTimeout(() => {
    messageBox.classList.remove("show");
  }, 3000);
}
=======
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
>>>>>>> 4d76bd24a74abe7321f3f430cbe25b836f9c9587
