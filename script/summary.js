import { state } from "./board/board-state.js";
import { loadTasksFromFirestore } from "./board/board-firestore.js";

/**
 * Main initialization for Summary page
 */
async function initSummary() {
  await init();
  const tasks = await getSummaryTasks();

  setGreeting();
  displayUserName();
  renderSummaryNumbers(tasks);
}

/**
 * Sets the greeting based on the current time of day
 */
function setGreeting() {
  let hour = new Date().getHours();
  let greetingElement = document.getElementById("greetingText");
  let greeting = "Good evening,";

  if (hour < 12) greeting = "Good morning,";
  else if (hour < 18) greeting = "Good afternoon,";

  if (greetingElement) greetingElement.innerText = greeting;
}

/**
 * Retrieves the logged-in user name from LocalStorage
 */
function displayUserName() {
  let activeUserRaw = localStorage.getItem("currentUser") || localStorage.getItem("activeUser");
  let nameDisplay = document.getElementById("userNameDisplay");

  if (!nameDisplay) return;

  if (activeUserRaw) {
    try {
      let activeUser = JSON.parse(activeUserRaw);

      nameDisplay.innerText = activeUser.name || activeUser;
    } catch (e) {
      nameDisplay.innerText = activeUserRaw;
    }
  } else {
    nameDisplay.innerText = "Guest";
  }
}

function ensureGuestTasksForSummary() {
  const existing = JSON.parse(localStorage.getItem("tasks") || "[]");
  if (Array.isArray(existing) && existing.length) return;

  const guestSeed = [
    { id: "guest-task-1", status: "todo", priority: "medium", dueDate: "2026-08-20" },
    { id: "guest-task-2", status: "in-progress", priority: "urgent", dueDate: "2026-08-18" },
    { id: "guest-task-3", status: "await-feedback", priority: "low", dueDate: "2026-08-25" },
    { id: "guest-task-4", status: "done", priority: "medium", dueDate: "2026-08-10" },
  ];

  localStorage.setItem("tasks", JSON.stringify(guestSeed));
}

async function getSummaryTasks() {
  const currentUser = getCurrentUser();
  if (currentUser?.isGuest || currentUser?.name === "Guest User") {
    try {
      await loadTasksFromFirestore();
      return normalizeSummaryTasks(state.tasks);
    } catch {
      ensureGuestTasksForSummary();
      return normalizeSummaryTasks(JSON.parse(localStorage.getItem("tasks")) || []);
    }
  }

  await loadTasksFromFirestore();
  return normalizeSummaryTasks(state.tasks);
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

function normalizeSummaryTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).map(task => ({
    ...task,
    status: normalizeSummaryStatus(task?.status),
  }));
}

function normalizeSummaryStatus(status) {
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

/**
 * Logic to count tasks and update the dashboard numbers
 */
function renderSummaryNumbers(tasks = []) {
  updateElementText(
    "todo-count",
    tasks.filter((t) => t.status === "todo").length
  );
  updateElementText(
    "done-count",
    tasks.filter((t) => t.status === "done").length
  );
  updateElementText("board-count", tasks.length);
  updateElementText(
    "progress-count",
    tasks.filter((t) => t.status === "in-progress").length
  );
  updateElementText(
    "feedback-count",
    tasks.filter((t) => t.status === "await-feedback").length
  );
  updateUrgentTask(tasks);
}

/**
 * Filters and counts urgent tasks, and handles sorting.
 * The array of all task objects.
 */
function updateUrgentTask(tasks) {
  let urgent = tasks.filter((t) => t.priority === "urgent" && t.dueDate);
  updateElementText("urgent-count", urgent.length);
  let dateElement = document.querySelector(".tile-right .date");
  if (!dateElement) return;
  if (urgent.length > 0) {
    urgent.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    renderDeadlineDate(dateElement, urgent[0].dueDate);
  } else {
    dateElement.innerText = "No upcoming deadline";
  }
}

/**
 * Formats and displays the nearest deadline date.
 *  The target DOM element.
 *  The raw date string.
 */
function renderDeadlineDate(element, dateString) {
  let options = { month: "long", day: "numeric", year: "numeric" };
  let formattedDate = new Date(dateString).toLocaleDateString("en-US", options);
  element.innerText = formattedDate;
}

/**
 * Helper function to update text safely
 */
function updateElementText(id, value) {
  let element = document.getElementById(id);
  if (element) element.innerText = value;
}

window.initSummary = initSummary;
