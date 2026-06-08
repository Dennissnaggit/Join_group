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