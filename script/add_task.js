function initAddTask() {
  console.log("App initialized - Add Task Section");

  const clearButton = document.querySelector(".clearBtn");
  const createButton = document.querySelector(".createBtn");

  if (clearButton) {
    clearButton.type = "button";
    clearButton.addEventListener("click", resetTaskForm);
  }

  if (createButton) {
    createButton.type = "button";
    createButton.addEventListener("click", saveTaskFromForm);
  }
}
document.addEventListener("click", (e) => {
  if (!e.target.closest(".multi-select")) {
    dropdown.classList.remove("active");
  }
});

const input = document.getElementById("subtaskInput");
const inputActions = document.getElementById("inputActions");

input.addEventListener("input", function () {
  if (this.value.trim()) {
    inputActions.classList.remove("d-none");
  } else {
    inputActions.classList.add("d-none");
  }
});

input.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && this.value.trim()) {
    addSubtask();
  }
});

function clearSubtaskInput() {
  input.value = "";
  inputActions.classList.add("d-none");
}

function addSubtask() {
  const text = input.value.trim();

  if (!text) return;

  const li = document.createElement("li");

  li.className =
    "list-group-item d-flex justify-content-between align-items-center subtask-item";

  li.innerHTML = `
        <span>• ${text}</span>

        <div class="subtask-actions">
            <img
                src="../assets/AdTask/edit.png"
                class="action-icon"
                onclick="editSubtask(this)"
            >

            <div class="action-divider"></div>

            <img
                src="../assets/AdTask/close.png"
                class="action-icon"
                onclick="removeSubtask(this)"
            >
        </div>
    `;

  document.getElementById("subtaskList").appendChild(li);

  input.value = "";
  inputActions.classList.add("d-none");
}

function removeSubtask(icon) {
  icon.closest("li").remove();
}

function editSubtask(icon) {
  const li = icon.closest("li");
  const text = li.querySelector("span").textContent.replace("•", "").trim();

  input.value = text;
  input.focus();

  li.remove();

  inputActions.classList.remove("d-none");
}

function resetTaskForm() {
  const titleInput = document.getElementById("TitleOfTask");
  const descriptionInput = document.getElementById("exampleFormControlTextarea1");
  const dueDateInput = document.getElementById("exampleFormControlInput1");
  const categorySelect = document.getElementById("category");

  if (titleInput) titleInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (dueDateInput) dueDateInput.value = "";
  if (categorySelect) categorySelect.value = "";

  document.querySelectorAll('input[name="priority"]').forEach((radio) => {
    radio.checked = false;
  });

  document.querySelectorAll('.dropdown input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  const subtaskList = document.getElementById("subtaskList");
  const selectedItemsContainer = document.getElementById("selectedItems");

  if (subtaskList) subtaskList.innerHTML = "";
  if (selectedItemsContainer) selectedItemsContainer.innerHTML = "";

  clearSubtaskInput();
}

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

const inputFieldMulti = document.getElementById("inputFieldMultiSelect");
const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("dropdown");
const selectedItems = document.getElementById("selectedItems");
const checkboxes = document.querySelectorAll('.dropdown input[type="checkbox"]');
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

async function saveTaskFromForm() {
  const firestoreStore = window.firestoreData;
  const title = document.getElementById("TitleOfTask").value.trim();
  const description = document.getElementById("exampleFormControlTextarea1").value.trim();
  const dueDate = document.getElementById("exampleFormControlInput1").value;
  const category = document.getElementById("category").value;
  const priority = document.querySelector('input[name="priority"]:checked')?.id || "medium";

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

  const assignedTo = Array.from(
    document.querySelectorAll('.dropdown input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value.charAt(0).toUpperCase());

  const subtasks = Array.from(document.querySelectorAll("#subtaskList li")).map((item) => ({
    title: item.querySelector("span").textContent.replace("•", "").trim(),
    done: false,
  }));

  const task = {
    id: `task-${Date.now()}`,
    title,
    description,
    type: category === "kategorie2" ? "Technical Task" : "User Story",
    status: "todo",
    priority,
    assignedTo,
    dueDate,
    subtasks,
  };

  if (firestoreStore) {
    await firestoreStore.saveUserCollectionItem("tasks", task);
  } else {
    const cachedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    cachedTasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(cachedTasks));
  }

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