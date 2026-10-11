import { db } from "./firebase.js";
import { doc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// === Startdaten: Beispielkontakte und Beispielaufgaben ===


/** Berechnet ein Datum in der angegebenen Anzahl von Tagen ab heute in UTC im Format YYYY-MM-DD.
 * @param {number} daysFromToday - Tage ab dem heutigen Datum.
 * @returns {string} Datum im Format YYYY-MM-DD.
 */
function getFutureDate(daysFromToday) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

// Diese Kontakte erhält jedes neue Benutzerkonto.
const exampleContacts = [
  {
    id: "example-contact-1",
    name: "Max Mustermann",
    email: "max.mustermann@example.com",
    phone: "+49 170 1234567",
    color: "#ff7a00",
  },
  {
    id: "example-contact-2",
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    phone: "+49 171 2345678",
    color: "#9327ff",
  },
  {
    id: "example-contact-3",
    name: "Peter Müller",
    email: "peter.mueller@example.com",
    phone: "+49 172 3456789",
    color: "#00bee8",
  },
];

// daysFromToday legt fest, wie viele Tage nach der Registrierung eine Aufgabe fällig ist.
const exampleTasks = [
  {
    id: "example-task-1",
    title: "Explore Join",
    description: "Get familiar with the board and move this task.",
    type: "User Story",
    category: "kategorie1",
    status: "todo",
    priority: "medium",
    assignedTo: ["Max Mustermann"],
    daysFromToday: 3,
    subtasks: [
      { title: "Open the board", done: true },
      { title: "Move the task", done: false },
    ],
  },
  {
    id: "example-task-2",
    title: "Prepare project kickoff",
    description: "Collect the first ideas for the new project.",
    type: "Technical Task",
    category: "kategorie2",
    status: "in-progress",
    priority: "urgent",
    assignedTo: ["Anna Schmidt", "Peter Müller"],
    daysFromToday: 7,
    subtasks: [
      { title: "Create an agenda", done: false },
      { title: "Invite participants", done: false },
    ],
  },
  {
    id: "example-task-3",
    title: "Review first results",
    description: "Review the current progress with the team.",
    type: "User Story",
    category: "kategorie1",
    status: "await-feedback",
    priority: "low",
    assignedTo: ["Peter Müller"],
    daysFromToday: 14,
    subtasks: [],
  },
];


/** Speichert Benutzerprofil, Beispielkontakte und Beispielaufgaben gemeinsam in einem Firestore-Batch.
 * @param {object} user - Firebase-Benutzer.
 * @param {string} name - Anzeigename.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
export async function createInitialUserData(user, name) {
  const batch = writeBatch(db);
  const userRef = doc(db, "users", user.uid);
  batch.set(userRef, {
    uid: user.uid,
    name,
    email: user.email,
    createdAt: serverTimestamp(),
  });
  addExampleContacts(batch, userRef);
  addExampleTasks(batch, userRef, user.uid);
  await batch.commit();
}


/** Fügt die Beispielkontakte zum Schreibvorgang hinzu; gespeichert wird erst beim Batch-Commit.
 * @param {object} batch - Firestore-Schreibvorgang.
 * @param {object} userRef - Referenz des Benutzerprofils.
 */
function addExampleContacts(batch, userRef) {
  exampleContacts.forEach(({ id, ...contact }) => {
    batch.set(doc(userRef, "contacts", id), contact);
  });
}


/** Ergänzt Beispielaufgaben um Fälligkeitsdatum, Ersteller und Zeitstempel und fügt sie dem Batch hinzu.
 * @param {object} batch - Firestore-Schreibvorgang.
 * @param {object} userRef - Referenz des Benutzerprofils.
 * @param {string} uid - Benutzer-ID.
 */
function addExampleTasks(batch, userRef, uid) {
  exampleTasks.forEach(({ id, daysFromToday, ...task }) => {
    batch.set(doc(userRef, "tasks", id), {
      ...task,
      dueDate: getFutureDate(daysFromToday),
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
  });
}

