import { auth, db } from "../firebase.js";
import { state } from "./board-state.js";

import {
  collection, getDocs, doc,
  updateDoc, deleteDoc, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const GUEST_TASKS_KEY = "tasks";
const GUEST_CONTACTS_KEY = "contacts";

const GUEST_CONTACTS_SEED = [
  { id: "guest-contact-1", name: "Max Mustermann", email: "max@guest.join", phone: "+49 170 1000001", color: "#ff7a00" },
  { id: "guest-contact-2", name: "Erika Muster", email: "erika@guest.join", phone: "+49 170 1000002", color: "#2fd7c4" },
  { id: "guest-contact-3", name: "Alex Demo", email: "alex@guest.join", phone: "+49 170 1000003", color: "#5a42b2" },
];

const GUEST_TASKS_SEED = [
  {
    id: "guest-task-1",
    title: "Welcome Task",
    description: "This is a demo task for guest mode.",
    type: "User Story",
    status: "todo",
    priority: "medium",
    assignedTo: ["Max Mustermann"],
    dueDate: "2026-08-20",
    subtasks: [{ title: "Open board", done: true }, { title: "Move card", done: false }],
  },
  {
    id: "guest-task-2",
    title: "Prepare Feedback",
    description: "Review progress with team.",
    type: "Technical Task",
    status: "in-progress",
    priority: "urgent",
    assignedTo: ["Erika Muster", "Alex Demo"],
    dueDate: "2026-08-18",
    subtasks: [{ title: "Collect notes", done: false }],
  },
  {
    id: "guest-task-3",
    title: "Client Review",
    description: "Waiting for feedback.",
    type: "User Story",
    status: "await-feedback",
    priority: "low",
    assignedTo: ["Alex Demo"],
    dueDate: "2026-08-25",
    subtasks: [],
  },
  {
    id: "guest-task-4",
    title: "Done Example",
    description: "Completed task sample.",
    type: "Technical Task",
    status: "done",
    priority: "medium",
    assignedTo: ["Max Mustermann"],
    dueDate: "2026-08-10",
    subtasks: [{ title: "Close task", done: true }],
  },
];


/** Resolves once Firebase Auth has determined the current user. */
export function waitForAuthUser() {
  return new Promise(resolve => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
}

function isGuestSession() {
  try {
    const current = JSON.parse(localStorage.getItem("currentUser") || "null");
    return !!(current && (current.isGuest || current.name === "Guest User"));
  } catch {
    return false;
  }
}

function readGuestList(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeGuestList(key, list) {
  localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
}

function ensureGuestData() {
  const contacts = readGuestList(GUEST_CONTACTS_KEY);
  if (!contacts.length) writeGuestList(GUEST_CONTACTS_KEY, GUEST_CONTACTS_SEED);

  const tasks = readGuestList(GUEST_TASKS_KEY);
  if (!tasks.length) writeGuestList(GUEST_TASKS_KEY, GUEST_TASKS_SEED);
}


/** Normalises raw Firestore data into the board task shape. */
function normalizeBoardTask(id, data) {
  const categoryMap = {
    kategorie1: "User Story", kategorie2: "Technical Task",
    "User Story": "User Story", "Technical Task": "Technical Task",
  };
  return {
    id,
    title:      data.title       || "",
    description:data.description || "",
    type:       data.type || categoryMap[data.category] || "User Story",
    status:     normalizeTaskStatus(data.status),
    priority:   data.priority || "medium",
    assignedTo: Array.isArray(data.assignedTo) ? data.assignedTo : [],
    dueDate:    data.dueDate || "",
    subtasks:   normalizeSubtasks(data.subtasks),
  };
}

function normalizeTaskStatus(status) {
  const statusMap = {
    todo: "todo",
    "to-do": "todo",
    progress: "in-progress",
    inprogress: "in-progress",
    "in progress": "in-progress",
    "in-progress": "in-progress",
    feedback: "await-feedback",
    awaitfeedback: "await-feedback",
    "await feedback": "await-feedback",
    "await-feedback": "await-feedback",
    done: "done",
  };

  return statusMap[String(status || "todo").trim().toLowerCase()] || "todo";
}

function normalizeSubtasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => ({ title: s.title || "", done: s.done ?? s.completed ?? false }));
}

function normalizeContact(id, data) {
  const firstName = String(data?.firstName || "").trim();
  const lastName = String(data?.lastName || "").trim();
  const combinedName = `${firstName} ${lastName}`.trim();
  const name = String(data?.name || data?.fullName || combinedName || data?.email || "").trim();

  return {
    id,
    ...data,
    name,
    color: data?.color || "",
  };
}


/** Loads all tasks from the shared Firestore collection into state.tasks. */
export async function loadTasksFromFirestore() {
  await waitForAuthUser();
  try {
    const snap = await getDocs(collection(db, "tasks"));
    state.tasks = snap.docs.map(d => normalizeBoardTask(d.id, d.data()));
  } catch (err) {
    if (!isGuestSession()) {
      state.tasks = [];
      throw err;
    }
    ensureGuestData();
    state.tasks = readGuestList(GUEST_TASKS_KEY).map(t => normalizeBoardTask(t.id, t));
  }
}


/**
 * Loads all contacts from the shared Firestore collection into state.contacts.
 */
export async function loadContactsFromFirestore() {
  await waitForAuthUser();
  try {
    const snap = await getDocs(collection(db, "contacts"));
    state.contacts = snap.docs
      .map(d => normalizeContact(d.id, d.data()))
      .filter(c => !!c.name);
  } catch (err) {
    if (!isGuestSession()) {
      state.contacts = [];
      throw err;
    }
    ensureGuestData();
    state.contacts = readGuestList(GUEST_CONTACTS_KEY)
      .map(c => normalizeContact(c.id, c))
      .filter(c => !!c.name);
  }
}


/** Persists a task's status change to Firestore. */
export async function saveTaskStatus(taskId, status) {
  const user = auth.currentUser;
  if (!user) {
    if (!isGuestSession()) return;
    const list = readGuestList(GUEST_TASKS_KEY);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status };
    writeGuestList(GUEST_TASKS_KEY, list);
    return;
  }
  await updateDoc(doc(db, "tasks", taskId), { status });
}


/** Deletes a task document from Firestore. */
export async function deleteTaskFromFirestore(taskId) {
  const user = auth.currentUser;
  if (!user) {
    if (!isGuestSession()) throw new Error("Not logged in");
    const list = readGuestList(GUEST_TASKS_KEY).filter(t => t.id !== taskId);
    writeGuestList(GUEST_TASKS_KEY, list);
    return;
  }
  await deleteDoc(doc(db, "tasks", taskId));
}


/** Creates a new task document in Firestore and returns the new document ID. */
export async function createTaskInFirestore(taskData) {
  const user = auth.currentUser;
  if (!user) {
    if (!isGuestSession()) throw new Error("Not logged in");
    const id = `guest-task-${crypto.randomUUID()}`;
    const list = readGuestList(GUEST_TASKS_KEY);
    list.push({ id, ...taskData });
    writeGuestList(GUEST_TASKS_KEY, list);
    return id;
  }

  const ref = await addDoc(
    collection(db, "tasks"),
    { ...taskData, createdBy: user.uid, createdAt: serverTimestamp() },
  );
  return ref.id;
}


/** Updates specific fields of an existing task document in Firestore. */
export async function updateTaskInFirestore(taskId, updates) {
  const user = auth.currentUser;
  if (!user) {
    if (!isGuestSession()) throw new Error("Not logged in");
    const list = readGuestList(GUEST_TASKS_KEY);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...updates };
    writeGuestList(GUEST_TASKS_KEY, list);
    return;
  }
  await updateDoc(doc(db, "tasks", taskId), updates);
}
