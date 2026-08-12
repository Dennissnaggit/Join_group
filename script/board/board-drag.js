import { state, callbacks } from "./board-state.js";
import { saveTaskStatus } from "./board-firestore.js";

const STATUS_MAP = {
  boardColumnTodo:          "todo",
  boardColumnInProgress:    "in-progress",
  boardColumnAwaitFeedback: "await-feedback",
  boardColumnDone:          "done",
};

/** Returns the task status string for a given column element ID. */
export function getStatusFromTaskList(id) {
  return STATUS_MAP[id] || null;
}

/** Registers dragover / drop / dragenter / dragleave on all task list columns. */
export function setupBoardDropZones() {
  document.querySelectorAll(".board-task-list").forEach(list => {
    list.addEventListener("dragover",  e => e.preventDefault());
    list.addEventListener("drop",      handleListDrop);
    list.addEventListener("dragenter", () => list.classList.add("board-task-list-drop-active"));
    list.addEventListener("dragleave", e => {
      if (!list.contains(e.relatedTarget))
        list.classList.remove("board-task-list-drop-active");
    });
  });
}

function clearDropActive() {
  document.querySelectorAll(".board-task-list-drop-active")
    .forEach(el => el.classList.remove("board-task-list-drop-active"));
}

function handleListDrop(event) {
  event.preventDefault();
  const list      = event.currentTarget;
  const newStatus = getStatusFromTaskList(list.id);
  const taskId    = state.draggedTaskId || event.dataTransfer.getData("text/plain");
  list.classList.remove("board-task-list-drop-active");

  if (!taskId || !newStatus) return;
  moveTaskToStatus(taskId, newStatus);
  state.draggedTaskId = null;
}

function moveTaskToStatus(taskId, newStatus) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = newStatus;
  callbacks.renderBoard?.();

  // Animate the freshly rendered card with a spring-drop-in
  const dropped = document.querySelector(`[data-task-id="${taskId}"]`);
  if (dropped) {
    dropped.classList.add("board-task-drop-in");
    dropped.addEventListener(
      "animationend",
      () => dropped.classList.remove("board-task-drop-in"),
      { once: true }
    );
  }

  saveTaskStatus(taskId, newStatus).catch(err => console.error("Status speichern fehlgeschlagen:", err));
}

// ── Desktop drag handlers ──────────────────────────────────────────────────

export function handleTaskDragStart(event) {
  const card = event.currentTarget;
  state.draggedTaskId = card.dataset.taskId;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggedTaskId);
  state.ignoreNextCardClick = true;
  // :active CSS already applied rotation instantly on mousedown — ghost has it
  card.classList.add("board-task-dragging");
}

export function handleTaskDragEnd(event) {
  event.currentTarget.classList.remove("board-task-dragging");
  clearDropActive();
  setTimeout(() => { state.ignoreNextCardClick = false; }, 120);
}

// ── Mobile touch handlers ──────────────────────────────────────────────────

export function handleTaskTouchStart(event) {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  state.touchDraggedTaskId = event.currentTarget.dataset.taskId;
  state.touchStartX        = touch.clientX;
  state.touchStartY        = touch.clientY;
  state.touchDropListId    = null;
  state.isTouchDragging    = false;
}

export function handleTaskTouchMove(event) {
  if (!state.touchDraggedTaskId || event.touches.length !== 1) return;
  const touch = event.touches[0];
  const dx    = Math.abs(touch.clientX - state.touchStartX);
  const dy    = Math.abs(touch.clientY - state.touchStartY);

  if (!state.isTouchDragging && (dx > 8 || dy > 8)) {
    state.isTouchDragging    = true;
    state.ignoreNextCardClick = true;
  }
  if (!state.isTouchDragging) return;

  event.preventDefault();
  clearDropActive();

  const el   = document.elementFromPoint(touch.clientX, touch.clientY);
  const list = el?.closest(".board-task-list");
  if (list) {
    list.classList.add("board-task-list-drop-active");
    state.touchDropListId = list.id;
  } else {
    state.touchDropListId = null;
  }
}

export function handleTaskTouchEnd(event) {
  if (!state.touchDraggedTaskId) return;

  if (state.isTouchDragging && state.touchDropListId) {
    const newStatus = getStatusFromTaskList(state.touchDropListId);
    if (newStatus) moveTaskToStatus(state.touchDraggedTaskId, newStatus);
    event.preventDefault();
  }

  state.touchDraggedTaskId  = null;
  state.touchDropListId     = null;
  state.isTouchDragging     = false;
  clearDropActive();
  setTimeout(() => { state.ignoreNextCardClick = false; }, 120);
}
