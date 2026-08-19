import { auth, db } from "../firebase.js";
import { state } from "./board-state.js";
import {
  GUEST_CONTACTS_KEY, GUEST_TASKS_KEY, ensureGuestData,
  isGuestSession, readGuestList, writeGuestList,
} from "../guest-data.js";

import {
  collection, getDocs, doc,
  updateDoc, deleteDoc, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

/** Resolves once Firebase Auth has determined the current user. */
export function waitForAuthUser() {
  return new Promise(resolve => {
    if (auth.currentUser) { resolve(auth.currentUser); return; }
    const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
  });
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
  if (isGuestSession()) {
    ensureGuestData();
    state.tasks = readGuestList(GUEST_TASKS_KEY).map(t => normalizeBoardTask(t.id, t));
    return;
  }

  const user = await waitForAuthUser();
  if (!user) throw new Error("Not logged in");

  try {
    const snap = await getDocs(collection(db, "users", user.uid, "tasks"));
    state.tasks = snap.docs.map(d => normalizeBoardTask(d.id, d.data()));
  } catch (err) {
    state.tasks = [];
    throw err;
  }
}


/**
 * Loads all contacts from the shared Firestore collection into state.contacts.
 */
export async function loadContactsFromFirestore() {
  if (isGuestSession()) {
    ensureGuestData();
    state.contacts = readGuestList(GUEST_CONTACTS_KEY)
      .map(c => normalizeContact(c.id, c))
      .filter(c => !!c.name);
    return;
  }

  const user = await waitForAuthUser();
  if (!user) throw new Error("Not logged in");

  try {
    const snap = await getDocs(collection(db, "users", user.uid, "contacts"));
    state.contacts = snap.docs
      .map(d => normalizeContact(d.id, d.data()))
      .filter(c => !!c.name);
  } catch (err) {
    state.contacts = [];
    throw err;
  }
}


/** Persists a task's status change to Firestore. */
export async function saveTaskStatus(taskId, status) {
  const user = auth.currentUser;
  if (isGuestSession()) {
    const list = readGuestList(GUEST_TASKS_KEY);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status };
    writeGuestList(GUEST_TASKS_KEY, list);
    return;
  }
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid, "tasks", taskId), { status });
}


/** Deletes a task document from Firestore. */
export async function deleteTaskFromFirestore(taskId) {
  const user = auth.currentUser;
  if (isGuestSession()) {
    const list = readGuestList(GUEST_TASKS_KEY).filter(t => t.id !== taskId);
    writeGuestList(GUEST_TASKS_KEY, list);
    return;
  }
  if (!user) throw new Error("Not logged in");
  await deleteDoc(doc(db, "users", user.uid, "tasks", taskId));
}


/** Creates a new task document in Firestore and returns the new document ID. */
export async function createTaskInFirestore(taskData) {
  const user = auth.currentUser;
  if (isGuestSession()) {
    const id = `guest-task-${crypto.randomUUID()}`;
    const list = readGuestList(GUEST_TASKS_KEY);
    list.push({ id, ...taskData });
    writeGuestList(GUEST_TASKS_KEY, list);
    return id;
  }
  if (!user) throw new Error("Not logged in");

  const ref = await addDoc(
    collection(db, "users", user.uid, "tasks"),
    { ...taskData, createdBy: user.uid, createdAt: serverTimestamp() },
  );
  return ref.id;
}


/** Updates specific fields of an existing task document in Firestore. */
export async function updateTaskInFirestore(taskId, updates) {
  const user = auth.currentUser;
  if (isGuestSession()) {
    const list = readGuestList(GUEST_TASKS_KEY);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...updates };
    writeGuestList(GUEST_TASKS_KEY, list);
    return;
  }
  if (!user) throw new Error("Not logged in");
  await updateDoc(doc(db, "users", user.uid, "tasks", taskId), updates);
}
