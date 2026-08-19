export const GUEST_CONTACTS_KEY = "contacts";
export const GUEST_TASKS_KEY = "tasks";

export const GUEST_CONTACTS_SEED = [
  { id: "guest-contact-1", name: "Max Mustermann", email: "max@guest.join", phone: "+49 170 1000001", color: "#ff7a00" },
  { id: "guest-contact-2", name: "Erika Muster", email: "erika@guest.join", phone: "+49 170 1000002", color: "#2fd7c4" },
  { id: "guest-contact-3", name: "Alex Demo", email: "alex@guest.join", phone: "+49 170 1000003", color: "#5a42b2" },
  { id: "guest-contact-4", name: "Sofia Berger", email: "sofia@guest.join", phone: "+49 170 1000004", color: "#e74c3c" },
  { id: "guest-contact-5", name: "David Klein", email: "david@guest.join", phone: "+49 170 1000005", color: "#3498db" },
];

export const GUEST_TASKS_SEED = [
  {
    id: "guest-task-1", title: "Welcome Task", description: "This is a demo task for guest mode.",
    type: "User Story", status: "todo", priority: "medium", assignedTo: ["Max Mustermann"],
    dueDate: "2026-08-20", subtasks: [{ title: "Open board", done: true }, { title: "Move card", done: false }],
  },
  {
    id: "guest-task-2", title: "Prepare Feedback", description: "Review progress with team.",
    type: "Technical Task", status: "in-progress", priority: "urgent", assignedTo: ["Erika Muster", "Alex Demo"],
    dueDate: "2026-08-18", subtasks: [{ title: "Collect notes", done: false }],
  },
  {
    id: "guest-task-3", title: "Client Review", description: "Waiting for feedback.",
    type: "User Story", status: "await-feedback", priority: "low", assignedTo: ["Alex Demo"],
    dueDate: "2026-08-25", subtasks: [],
  },
  {
    id: "guest-task-4", title: "Done Example", description: "Completed task sample.",
    type: "Technical Task", status: "done", priority: "medium", assignedTo: ["Max Mustermann"],
    dueDate: "2026-08-10", subtasks: [{ title: "Close task", done: true }],
  },
  {
    id: "guest-task-5", title: "Plan Team Meeting", description: "Prepare the next team meeting agenda.",
    type: "User Story", status: "todo", priority: "medium", assignedTo: ["Sofia Berger", "David Klein"],
    dueDate: "2026-08-28", subtasks: [{ title: "Draft agenda", done: false }],
  },
];

export function isGuestSession() {
  try {
    const current = JSON.parse(localStorage.getItem("currentUser") || "null");
    return !!(current && (current.isGuest || current.name === "Guest User"));
  } catch {
    return false;
  }
}

export function readGuestList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeGuestList(key, list) {
  localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
}

function ensureMinimum(key, seed, minimum = 5) {
  const list = readGuestList(key);
  const existingIds = new Set(list.map(item => item?.id));

  for (const item of seed) {
    if (list.length >= minimum) break;
    if (!existingIds.has(item.id)) list.push({ ...item });
  }

  writeGuestList(key, list);
  return list;
}

export function ensureGuestContacts() {
  return ensureMinimum(GUEST_CONTACTS_KEY, GUEST_CONTACTS_SEED);
}

export function ensureGuestTasks() {
  return ensureMinimum(GUEST_TASKS_KEY, GUEST_TASKS_SEED);
}

export function ensureGuestData() {
  ensureGuestContacts();
  ensureGuestTasks();
}
