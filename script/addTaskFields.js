import { taskElements as elements } from "./addTaskElements.js";
import { validateSubtasks } from "./addTaskSubtasks.js";

const requiredFields = [elements.title, elements.dueDate, elements.category];
const fieldErrors = {
  TitleOfTask: document.getElementById("TitleOfTaskError"),
  exampleFormControlInput1: document.getElementById("exampleFormControlInput1Error"),
  category: document.getElementById("categoryError"),
};
const priorityImages = { urgent: "Urgent", medium: "Med", low: "Low" };


/** Initialisiert Prioritäten, Kategorie und eigene Feldvalidierung.
 */
export function setupTaskFields() {
  document.querySelectorAll('input[name="priority"]').forEach(radio => radio.addEventListener("change", () => updatePriorityIcons(radio.id)));
  elements.categoryToggle.addEventListener("click", toggleCategoryDropdown);
  elements.categoryOptions.addEventListener("click", selectCategory);
  elements.categoryWrapper.addEventListener("keydown", handleCategoryKeydown);
  document.addEventListener("click", closeCategoryOutside);
  elements.dueDate.min = getTodayDate();
  setupFieldValidation();
}


/** Aktualisiert die drei Prioritätssymbole anhand der Auswahl.
 * @param {string} [priority="medium"] - Ausgewählte Priorität.
 */
export function updatePriorityIcons(priority = "medium") {
  Object.entries(priorityImages).forEach(([id, image]) => {
    const state = id === priority ? "Active" : "NotActive";
    document.querySelector(`.${id}Btn img`).src = `../assets/AdTask/prio${image}${state}.png`;
  });
}


/** Liefert das heutige lokale Datum für die minimale Fälligkeit.
 * @returns {string} Lokales Datum im Format YYYY-MM-DD.
 */
function getTodayDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}


/** Schließt die Kategorienliste und aktualisiert den ARIA-Zustand.
 */
export function closeCategoryDropdown() {
  elements.categoryOptions.classList.add("d-none");
  elements.categoryToggle.setAttribute("aria-expanded", "false");
}


/** Öffnet die Kategorienliste und schließt die Kontaktliste.
 */
function openCategoryDropdown() {
  elements.categoryOptions.classList.remove("d-none");
  elements.categoryToggle.setAttribute("aria-expanded", "true");
  elements.assignedDropdown.classList.add("d-none");
}


/** Wechselt den Zustand der Kategorienliste.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function toggleCategoryDropdown(event) {
  event.stopPropagation();
  if (elements.categoryOptions.classList.contains("d-none")) openCategoryDropdown();
  else closeCategoryDropdown();
}


/** Übernimmt die ausgewählte Kategorie in das Formular.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function selectCategory(event) {
  event.stopPropagation();
  const option = event.target.closest("[data-value]");
  if (!option) return;
  elements.category.value = option.dataset.value;
  elements.categoryText.textContent = option.textContent.trim();
  elements.category.dispatchEvent(new Event("change", { bubbles: true }));
  closeCategoryDropdown();
  elements.categoryToggle.focus();
}


/** Schließt die Kategorienliste mit Escape.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function handleCategoryKeydown(event) {
  if (event.key !== "Escape") return;
  closeCategoryDropdown();
  elements.categoryToggle.focus();
}


/** Schließt die Kategorienliste bei einem Klick außerhalb.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function closeCategoryOutside(event) {
  if (!event.target.closest("#categoryDropdownWrapper")) closeCategoryDropdown();
}


/** Verknüpft Formularfelder mit Fehlerbereinigung und Prüfung.
 */
function setupFieldValidation() {
  elements.title.addEventListener("input", () => clearTaskFieldError(elements.title));
  elements.title.addEventListener("blur", () => validateTaskField(elements.title));
  elements.dueDate.addEventListener("change", () => clearTaskFieldError(elements.dueDate));
  elements.dueDate.addEventListener("blur", () => validateTaskField(elements.dueDate));
  elements.category.addEventListener("change", () => clearTaskFieldError(elements.category));
  elements.categoryToggle.addEventListener("blur", validateCategoryOnBlur);
}


/** Prüft die Kategorie erst nach Verlassen ihres gesamten Dropdowns.
 */
function validateCategoryOnBlur() {
  window.setTimeout(() => {
    if (!elements.categoryWrapper.contains(document.activeElement)) validateTaskField(elements.category);
  }, 0);
}


/** Liefert das sichtbare Bedienelement eines Formularfeldes.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 * @returns {HTMLElement} Sichtbares Eingabeelement.
 */
function getVisibleField(field) {
  return field === elements.category ? elements.categoryToggle : field;
}


/** Zeigt die eigene Fehlermeldung eines Formularfeldes.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 * @param {string} message - Anzuzeigender Fehlertext.
 */
function showTaskFieldError(field, message) {
  const visible = getVisibleField(field);
  const error = fieldErrors[field.id];
  visible.classList.add("is-invalid");
  visible.setAttribute("aria-invalid", "true");
  visible.setAttribute("aria-describedby", error.id);
  error.textContent = message;
  error.classList.add("show");
}


/** Entfernt die Fehlermarkierung und Meldung eines Formularfeldes.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 */
function clearTaskFieldError(field) {
  const visible = getVisibleField(field);
  visible.classList.remove("is-invalid");
  visible.removeAttribute("aria-invalid");
  visible.removeAttribute("aria-describedby");
  fieldErrors[field.id].textContent = "";
  fieldErrors[field.id].classList.remove("show");
}


/** Setzt Kategorie, Priorität und Feldfehler zurück.
 */
export function resetTaskFields() {
  elements.categoryText.textContent = "Select task category";
  closeCategoryDropdown();
  requiredFields.forEach(clearTaskFieldError);
  updatePriorityIcons();
}


/** Liefert den Fehlertext für Pflichtfelder und vergangene Daten.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 * @returns {string} Fehlertext oder leerer String.
 */
function getTaskFieldError(field) {
  if (field === elements.title && !field.value.trim()) return "This field is required.";
  if (field !== elements.title && !field.value) return "This field is required.";
  if (field === elements.dueDate && field.value < field.min) return "Please select a current or future date.";
  return "";
}


/** Prüft ein Feld und aktualisiert seine eigene Fehlermeldung.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 * @returns {boolean} Ob das Feld gültig ist.
 */
function validateTaskField(field) {
  const error = getTaskFieldError(field);
  if (error) showTaskFieldError(field, error);
  else clearTaskFieldError(field);
  return !error;
}


/** Prüft Pflichtfelder und Subtasks vor dem Speichern.
 * @returns {boolean} Ob das Formular gültig ist.
 */
export function validateAddTaskForm() {
  requiredFields.forEach(validateTaskField);
  const invalid = requiredFields.find(getTaskFieldError);
  if (invalid) {
    getVisibleField(invalid).focus();
    return false;
  }
  return validateSubtasks();
}


/** Liefert die ausgewählte Priorität mit Medium als Standardwert.
 * @returns {string} Ausgewählte Priorität.
 */
export function getPriority() {
  return document.querySelector('input[name="priority"]:checked')?.id || "medium";
}
