import { auth, db } from "./firebase.js";
import { GUEST_TASKS_KEY as guestTasksKey, isGuestSession, readGuestList, writeGuestList } from "./guest-data.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { taskElements as elements } from "./addTaskElements.js";
import { getAssignedTo } from "./addTaskContacts.js";
import { getPriority } from "./addTaskFields.js";
import { getSubtasks } from "./addTaskSubtasks.js";


/** Speichert den Task passend zur Sitzung und öffnet anschließend das Board.
 * @returns {Promise<string|undefined>} Gespeicherte Task-ID bei Erfolg.
 */
export async function createTask() {
  if (!isGuestSession() && !auth.currentUser) return showMissingUserError();
  try {
    const task = buildTaskData();
    const id = isGuestSession() ? saveGuestTask(task) : await saveUserTask(task);
    await showTaskAddedMessage();
    window.location.href = "board.html";
    return id;
  } catch (error) {
    console.error("Fehler beim Speichern des Tasks:", error);
    alert("Beim Speichern des Tasks ist ein Fehler aufgetreten.");
  }
}


/** Meldet eine fehlende Anmeldung vor dem Speichern.
 */
function showMissingUserError() {
  console.error("Task konnte nicht erstellt werden: Kein User eingeloggt.");
  alert("Du bist nicht eingeloggt.");
}


/** Erstellt die Task-Daten aus den Formularfeldern.
 * @returns {object} Task-Daten aus dem Formular.
 */
function buildTaskData() {
  return {
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    dueDate: elements.dueDate.value,
    status: getInitialTaskStatus(),
    priority: getPriority(),
    category: elements.category.value,
    assignedTo: getAssignedTo(),
    subtasks: getSubtasks(),
  };
}


/** Übernimmt einen gültigen Board-Status aus dem URL-Parameter.
 * @returns {string} Gültiger Ausgangsstatus.
 */
function getInitialTaskStatus() {
  const statuses = new Set(["todo", "in-progress", "await-feedback", "done"]);
  const requested = new URLSearchParams(window.location.search).get("status");
  return statuses.has(requested) ? requested : "todo";
}


/** Speichert einen Gast-Task im lokalen Sitzungsbestand.
 * @param {object} task - Zu speichernde Task-Daten.
 * @returns {string} ID des gespeicherten Gast-Tasks.
 */
function saveGuestTask(task) {
  const tasks = readGuestList(guestTasksKey);
  const id = `guest-task-${crypto.randomUUID()}`;
  tasks.push({ id, ...task });
  writeGuestList(guestTasksKey, tasks);
  return id;
}


/** Speichert einen Task samt Ersteller und Zeitstempel in Firestore.
 * @param {object} task - Zu speichernde Task-Daten.
 * @returns {Promise<string>} ID des gespeicherten Tasks.
 */
async function saveUserTask(task) {
  const user = auth.currentUser;
  const data = { ...task, createdBy: user.uid, createdAt: serverTimestamp() };
  const reference = await addDoc(collection(db, "users", user.uid, "tasks"), data);
  return reference.id;
}


/** Zeigt die Erfolgsmeldung für 1200 ms vor der Weiterleitung.
 * @returns {Promise<void>} Abschluss der Anzeigedauer.
 */
function showTaskAddedMessage() {
  elements.message.classList.add("show");
  elements.message.setAttribute("aria-hidden", "false");
  return new Promise(resolve => window.setTimeout(resolve, 1200));
}
