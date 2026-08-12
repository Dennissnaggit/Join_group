import { auth, db } from "../firebase.js";
import { state } from "./board-state.js";

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


/** Loads all tasks for the current user from Firestore into state.tasks. */
export async function loadTasksFromFirestore() {
  const user = await waitForAuthUser();
  if (!user) { state.tasks = []; return; }

  const snap = await getDocs(collection(db, "users", user.uid, "tasks"));
  state.tasks = snap.docs.map(d => normalizeBoardTask(d.id, d.data()));
}


/**
 * Loads all contacts for the current user from Firestore into state.contacts.
 * Firestore path: users/{uid}/contacts/{contactId}
 */
export async function loadContactsFromFirestore() {
  const user = await waitForAuthUser();
  if (!user) { state.contacts = []; return; }

  const snap = await getDocs(collection(db, "users", user.uid, "contacts"));
  state.contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


/** Persists a task's status change to Firestore. */
export async function saveTaskStatus(taskId, status) {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid, "tasks", taskId), { status });
}


/** Deletes a task document from Firestore. */
export async function deleteTaskFromFirestore(taskId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  await deleteDoc(doc(db, "users", user.uid, "tasks", taskId));
}


/** Creates a new task document in Firestore and returns the new document ID. */
export async function createTaskInFirestore(taskData) {
  const user = auth.currentUser;
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
  if (!user) throw new Error("Not logged in");
  await updateDoc(doc(db, "users", user.uid, "tasks", taskId), updates);
}
