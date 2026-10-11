import { auth } from "./firebase.js";
import { taskElements as elements } from "./addTaskElements.js";
import { setupSubtasks, resetSubtasks } from "./addTaskSubtasks.js";
import { setupAssignedContacts, loadContacts, resetAssignedContacts } from "./addTaskContacts.js";
import { setupTaskFields, resetTaskFields, validateAddTaskForm } from "./addTaskFields.js";
import { createTask } from "./addTaskData.js";

setupSubtasks();
setupAssignedContacts();
setupTaskFields();
elements.clearButton.addEventListener("click", resetAddTaskForm);
elements.form.addEventListener("submit", handleTaskSubmit);
initAddTask();


/** Lädt das gemeinsame Layout und anschließend die Kontakte.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
async function initAddTask() {
  if (typeof init === "function") await init();
  await waitForAuth();
  await loadContacts();
}


/** Wartet auf den ersten Firebase-Authentifizierungszustand.
 * @returns {Promise<object|null>} Benutzer oder abgemeldeter Zustand.
 */
function waitForAuth() {
  return new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
}


/** Setzt Formular, Felder, Kontaktauswahl und Subtasks zurück.
 */
function resetAddTaskForm() {
  elements.form.reset();
  resetTaskFields();
  resetAssignedContacts();
  resetSubtasks();
}


/** Verhindert das Standard-Absenden und speichert nur gültige Tasks.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
async function handleTaskSubmit(event) {
  event.preventDefault();
  if (validateAddTaskForm()) await createTask();
}
