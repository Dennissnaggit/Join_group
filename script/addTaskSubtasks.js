import { taskElements as elements, cloneTaskTemplate } from "./addTaskElements.js";


/** Verknüpft Eingabe und Liste mit den Subtask-Aktionen.
 */
export function setupSubtasks() {
  elements.subtaskInput.addEventListener("input", handleSubtaskInput);
  elements.subtaskInput.addEventListener("keydown", handleSubtaskInputKeydown);
  elements.subtaskList.addEventListener("click", handleSubtaskAction);
  elements.subtaskList.addEventListener("dblclick", handleSubtaskDoubleClick);
  window.clearSubtaskInput = clearSubtaskInput;
  window.addSubtask = addSubtask;
}


/** Entfernt Eingabefehler und aktualisiert die Aktionssymbole.
 */
function handleSubtaskInput() {
  clearSubtaskError(elements.subtaskInput);
  updateSubtaskActions();
}


/** Zeigt Aktionen nur für eine nicht leere Eingabe.
 */
function updateSubtaskActions() {
  const hasText = Boolean(elements.subtaskInput.value.trim());
  elements.subtaskActions.classList.toggle("d-none", !hasText);
  elements.subtaskActions.classList.toggle("d-flex", hasText);
}


/** Fügt bei Enter einen Subtask hinzu, ohne das Formular abzusenden.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function handleSubtaskInputKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSubtask();
}


/** Markiert ein leeres Subtask-Feld und zeigt den Fehlertext.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 */
export function showSubtaskError(field) {
  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", elements.subtaskError.id);
  elements.subtaskError.textContent = "A subtask title is required.";
  elements.subtaskError.classList.add("show");
  field.focus();
}


/** Entfernt Feldfehler und blendet den gemeinsamen Text bei gültigen Feldern aus.
 * @param {HTMLInputElement} field - Zu prüfendes Formularfeld.
 */
function clearSubtaskError(field) {
  field.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  if (document.querySelector("#subtaskList .is-invalid, #subtaskInput.is-invalid")) return;
  elements.subtaskError.textContent = "";
  elements.subtaskError.classList.remove("show");
}


/** Leert die Subtask-Eingabe und ihre Fehlermarkierung.
 */
function clearSubtaskInput() {
  elements.subtaskInput.value = "";
  clearSubtaskError(elements.subtaskInput);
  updateSubtaskActions();
}


/** Fügt einen nicht leeren Subtask aus dem HTML-Template ein.
 */
function addSubtask() {
  const text = elements.subtaskInput.value.trim();
  if (!text) return showSubtaskError(elements.subtaskInput);
  const item = cloneTaskTemplate("subtaskItemTemplate");
  item.querySelector(".subtask-text").textContent = `• ${text}`;
  elements.subtaskList.appendChild(item);
  clearSubtaskInput();
}


/** Führt die Aktion des angeklickten Subtask-Symbols aus.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function handleSubtaskAction(event) {
  const action = event.target.closest("[data-subtask-action]");
  if (!action) return;
  const item = action.closest("li");
  const handlers = { edit: editSubtask, remove: removeSubtask, save: saveSubtaskEdit, cancel: cancelSubtaskEdit };
  handlers[action.dataset.subtaskAction]?.(item);
}


/** Startet die Bearbeitung bei einem Doppelklick auf den Text.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function handleSubtaskDoubleClick(event) {
  const text = event.target.closest(".subtask-text");
  if (text) editSubtask(text.closest("li"));
}


/** Entfernt einen Subtask und einen möglichen Bearbeitungsfehler.
 * @param {HTMLElement} item - Subtask-Eintrag der Liste.
 */
function removeSubtask(item) {
  const input = item.querySelector(".subtask-edit-input");
  item.remove();
  if (input) clearSubtaskError(input);
}


/** Ersetzt den Subtask-Text durch eine bearbeitbare Eingabe.
 * @param {HTMLElement} item - Subtask-Eintrag der Liste.
 */
function editSubtask(item) {
  const text = item.querySelector(".subtask-text");
  if (!text || item.classList.contains("is-editing")) return;
  const input = createSubtaskEditInput(text.textContent.replace("•", "").trim());
  text.replaceWith(input);
  setSubtaskEditActions(item, true);
  input.focus();
  input.select();
}


/** Erstellt eine Eingabe mit dem Originalwert zum späteren Abbrechen.
 * @param {string} text - Subtask-Text.
 * @returns {HTMLInputElement} Neue Bearbeitungseingabe.
 */
function createSubtaskEditInput(text) {
  const input = cloneTaskTemplate("subtaskEditInputTemplate");
  input.value = text;
  input.dataset.originalValue = text;
  input.addEventListener("input", () => clearSubtaskError(input));
  input.addEventListener("keydown", handleSubtaskEditKeydown);
  return input;
}


/** Wechselt die Symbole und den Bearbeitungszustand eines Subtasks.
 * @param {HTMLElement} item - Subtask-Eintrag der Liste.
 * @param {boolean} editing - Ob der Eintrag bearbeitet wird.
 */
function setSubtaskEditActions(item, editing) {
  const templateId = editing ? "subtaskEditActionsTemplate" : "subtaskActionsTemplate";
  item.querySelector(".subtask-actions").replaceWith(cloneTaskTemplate(templateId));
  item.classList.toggle("is-editing", editing);
}


/** Speichert mit Enter oder verwirft Änderungen mit Escape.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function handleSubtaskEditKeydown(event) {
  const item = event.currentTarget.closest("li");
  if (event.key === "Enter") {
    event.preventDefault();
    saveSubtaskEdit(item);
  }
  if (event.key === "Escape") cancelSubtaskEdit(item);
}


/** Speichert nur nicht leere Subtask-Texte.
 * @param {HTMLElement} item - Subtask-Eintrag der Liste.
 */
function saveSubtaskEdit(item) {
  const input = item.querySelector(".subtask-edit-input");
  const text = input.value.trim();
  if (!text) return showSubtaskError(input);
  finishSubtaskEdit(item, text);
}


/** Stellt den Originaltext eines bearbeiteten Subtasks wieder her.
 * @param {HTMLElement} item - Subtask-Eintrag der Liste.
 */
function cancelSubtaskEdit(item) {
  const input = item.querySelector(".subtask-edit-input");
  finishSubtaskEdit(item, input.dataset.originalValue);
}


/** Beendet die Bearbeitung und stellt die normalen Aktionen wieder her.
 * @param {HTMLElement} item - Subtask-Eintrag der Liste.
 * @param {string} text - Subtask-Text.
 */
function finishSubtaskEdit(item, text) {
  const input = item.querySelector(".subtask-edit-input");
  const label = cloneTaskTemplate("subtaskItemTemplate").querySelector(".subtask-text");
  label.textContent = `• ${text}`;
  clearSubtaskError(input);
  input.replaceWith(label);
  setSubtaskEditActions(item, false);
}


/** Entfernt alle Subtasks und setzt die Eingabe zurück.
 */
export function resetSubtasks() {
  elements.subtaskList.replaceChildren();
  clearSubtaskInput();
}


/** Verhindert das Absenden eines leeren Subtasks in Bearbeitung.
 * @returns {boolean} Ob alle Subtasks gültig sind.
 */
export function validateSubtasks() {
  const empty = [...elements.subtaskList.querySelectorAll(".subtask-edit-input")].find(input => !input.value.trim());
  if (empty) showSubtaskError(empty);
  return !empty;
}


/** Liest die Subtask-Texte für die Speicherung aus der Liste.
 * @returns {Array<object>} Zu speichernde Subtasks.
 */
export function getSubtasks() {
  return [...elements.subtaskList.querySelectorAll(".subtask-text, .subtask-edit-input")].map(readSubtask);
}


/** Wandelt einen Subtask-Eintrag in die gespeicherte Datenstruktur um.
 * @param {HTMLElement} element - Element mit dem Subtask-Text.
 * @returns {object} Subtask-Daten.
 */
function readSubtask(element) {
  const text = element.matches("input") ? element.value : element.textContent;
  return { title: text.replace("•", "").trim(), completed: false };
}
