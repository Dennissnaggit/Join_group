function initAddTask() {
  console.log("App initialized - Add Task Section");
  // Dennis and Jannis: You can start writing your contact list logic here...
}
// Damit die Seite Problemlos lädt bitte die die innitfunction so bennen
const inputField = document.getElementById("inputField");
const dropdown = document.getElementById("dropdown");
const selectedItems = document.getElementById("selectedItems");
const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');

// Dropdown öffnen/schließen
inputField.addEventListener("click", () => {
  dropdown.classList.toggle("active");
});

// Kreise aktualisieren
function updateSelectedItems() {
  selectedItems.innerHTML = "";

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const circle = document.createElement("div");
      circle.classList.add("circle");
      circle.textContent = checkbox.value.charAt(0).toUpperCase();

      // Optional Tooltip mit vollständigem Namen
      circle.title = checkbox.value;

      selectedItems.appendChild(circle);
    }
  });
}

// Checkboxen überwachen
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", updateSelectedItems);
});

// Dropdown schließen, wenn außerhalb geklickt wird
document.addEventListener("click", (e) => {
  if (!e.target.closest(".multi-select")) {
    dropdown.classList.remove("active");
  }
});

//subtask hinzufügen
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
