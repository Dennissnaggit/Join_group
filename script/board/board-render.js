import { state } from "./board-state.js";
import { getInitials, getAvatarColor, getPriorityIconPath, getPriorityLabel } from "./board-helpers.js";
import {
  handleTaskDragStart, handleTaskDragEnd,
  handleTaskTouchStart, handleTaskTouchMove, handleTaskTouchEnd,
  handleTaskTouchCancel,
} from "./board-drag.js";

const COLUMNS = [
  { status: "todo",           id: "boardColumnTodo" },
  { status: "in-progress",    id: "boardColumnInProgress" },
  { status: "await-feedback", id: "boardColumnAwaitFeedback" },
  { status: "done",           id: "boardColumnDone" },
];

const STATUS_LABELS = {
  "todo": "To do", "in-progress": "In progress",
  "await-feedback": "Await feedback", "done": "Done",
};

/** Re-renders all four board columns. */
export function renderBoard() {
  COLUMNS.forEach(({ status, id }) => renderColumn(status, id));
}

function renderColumn(status, columnId) {
  const column = document.getElementById(columnId);
  if (!column) return;

  const tasks = getFilteredTasksByStatus(status);
  column.innerHTML = "";

  if (!tasks.length) {
    column.innerHTML = `<div class="board-empty" role="status"><span>No tasks in ${STATUS_LABELS[status] || status}</span></div>`;
    return;
  }
  tasks.forEach(task => column.appendChild(createTaskCard(task)));
}

function getFilteredTasksByStatus(status) {
  return state.tasks.filter(task => {
    if (task.status !== status) return false;
    if (!state.searchValue) return true;
    return task.title.toLowerCase().includes(state.searchValue)
      || task.description.toLowerCase().includes(state.searchValue);
  });
}

/** Creates a draggable task card DOM element for the given task. */
export function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "board-task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  const typeClass = task.type === "Technical Task" ? "technical-task" : "user-story";
  card.innerHTML = buildCardHTML(task, typeClass);

  attachDragListeners(card);
  return card;
}

function buildCardHTML(task, typeClass) {
  return `
    <span class="board-task-type ${typeClass}">${task.type}</span>
    <h3 class="board-task-title">${task.title}</h3>
    <p class="board-task-description">${task.description}</p>
    ${buildSubtasksBar(task)}
    <div class="board-task-footer">
      <div class="board-task-users">${buildAvatarGroup(task.assignedTo)}</div>
      <div class="board-task-right">
        <img class="board-task-priority-icon board-task-priority-fixed"
          src="${getPriorityIconPath(task.priority)}"
          alt="${getPriorityLabel(task.priority)} priority"
          title="${getPriorityLabel(task.priority)} priority">
      </div>
    </div>`;
}

function attachDragListeners(card) {
  card.addEventListener("dragstart", handleTaskDragStart);
  card.addEventListener("dragend",   handleTaskDragEnd);
  card.addEventListener("touchstart", handleTaskTouchStart, { passive: true });
  card.addEventListener("touchmove",  handleTaskTouchMove,  { passive: false });
  card.addEventListener("touchend",   handleTaskTouchEnd,   { passive: false });
  card.addEventListener("touchcancel", handleTaskTouchCancel);
}

/** Builds the subtask progress bar HTML, or empty string if no subtasks. */
export function buildSubtasksBar(task) {
  const list  = Array.isArray(task.subtasks) ? task.subtasks : [];
  const total = list.length;
  if (!total) return "";

  const done     = list.filter(s => s.done).length;
  const progress = Math.round((done / total) * 100);

  return `
    <div class="board-subtasks-row">
      <div class="board-subtasks-bar" aria-hidden="true">
        <div class="board-subtasks-fill" style="width:${progress}%"></div>
      </div>
      <p class="board-subtasks-text">${done}/${total} Subtasks</p>
    </div>`;
}

/** Builds stacked avatar circles for the given list of user names. */
export function buildAvatarGroup(users) {
  if (!Array.isArray(users) || !users.length) return "";
  return users.map((user, i) => {
    const contact = state.contacts.find(c => c.name === user || c.id === user);
    const displayName = contact?.name || user;
    const color = contact?.color || getAvatarColor(displayName);
    return (
    `<span class="board-avatar"
      style="background-color:${color};z-index:${100 - i}"
      title="${displayName}">${getInitials(displayName)}</span>`
    );
  }).join("");
}
