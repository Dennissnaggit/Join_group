import { state, callbacks } from "./board-state.js";
import { saveTaskStatus } from "./board-firestore.js";

const STATUS_MAP = {
  boardColumnTodo:          "todo",
  boardColumnInProgress:    "in-progress",
  boardColumnAwaitFeedback: "await-feedback",
  boardColumnDone:          "done",
};

const TOUCH_DRAG_HOLD_MS = 140;
const TOUCH_SCROLL_INTENT_PX = 18;
const TOUCH_DRAG_START_PX = 6;

let dragPreviewEl = null;
let touchDragHoldTimer = null;
let touchDragArmed = false;
let touchDragCancelled = false;
let touchDragPreviewEl = null;
let touchDragSourceCard = null;
let touchPreviewOffsetX = 0;
let touchPreviewOffsetY = 0;
let touchScrollIntent = false;
let lastTouchY = 0;

function scrollBoardPage(deltaY) {
  const content = document.querySelector("#content.content-panel");
  if (content && content.scrollHeight > content.clientHeight) {
    content.scrollTop += deltaY;
    return;
  }
  window.scrollBy(0, deltaY);
}

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
  if (!task || task.status === newStatus) return;
  const previousStatus = task.status;
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

  saveTaskStatus(taskId, newStatus).catch(err => {
    task.status = previousStatus;
    callbacks.renderBoard?.();
    console.error("Status speichern fehlgeschlagen:", err);
  });
}

function cleanupDragPreview() {
  if (!dragPreviewEl) return;
  dragPreviewEl.remove();
  dragPreviewEl = null;
}

function cleanupTouchDragVisuals() {
  if (touchDragPreviewEl) {
    touchDragPreviewEl.remove();
    touchDragPreviewEl = null;
  }
  if (touchDragSourceCard) {
    touchDragSourceCard.classList.remove("board-touch-source");
    touchDragSourceCard = null;
  }
}

function updateTouchDragPreviewPosition(touch) {
  if (!touchDragPreviewEl) return;
  const x = touch.clientX - touchPreviewOffsetX;
  const y = touch.clientY - touchPreviewOffsetY;
  touchDragPreviewEl.style.left = `${x}px`;
  touchDragPreviewEl.style.top = `${y}px`;
}

function createTouchDragPreview(card, touch) {
  cleanupTouchDragVisuals();

  const rect = card.getBoundingClientRect();
  const clone = card.cloneNode(true);
  clone.classList.add("board-touch-drag-preview");
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;

  touchPreviewOffsetX = touch.clientX - rect.left;
  touchPreviewOffsetY = touch.clientY - rect.top;

  document.body.appendChild(clone);
  touchDragPreviewEl = clone;
  updateTouchDragPreviewPosition(touch);

  touchDragSourceCard = card;
  touchDragSourceCard.classList.add("board-touch-source");
}

function attachRotatedDragPreview(event, card) {
  if (!event.dataTransfer) return;

  cleanupDragPreview();

  const rect = card.getBoundingClientRect();
  const clone = card.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.top = "-9999px";
  clone.style.left = "-9999px";
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.transform = "rotate(-5deg)";
  clone.style.opacity = "0.95";
  clone.style.zIndex = "99999";

  document.body.appendChild(clone);
  dragPreviewEl = clone;

  event.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);
}

// ── Desktop drag handlers ──────────────────────────────────────────────────

export function handleTaskDragStart(event) {
  const card = event.currentTarget;
  state.draggedTaskId = card.dataset.taskId;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggedTaskId);
  attachRotatedDragPreview(event, card);
  state.ignoreNextCardClick = true;
  // :active CSS already applied rotation instantly on mousedown — ghost has it
  card.classList.add("board-task-dragging");
}

export function handleTaskDragEnd(event) {
  event.currentTarget.classList.remove("board-task-dragging");
  cleanupDragPreview();
  clearDropActive();
  setTimeout(() => { state.ignoreNextCardClick = false; }, 120);
}

// ── Mobile touch handlers ──────────────────────────────────────────────────

export function handleTaskTouchStart(event) {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  const card = event.currentTarget;
  state.touchDraggedTaskId = event.currentTarget.dataset.taskId;
  state.touchStartX        = touch.clientX;
  state.touchStartY        = touch.clientY;
  lastTouchY               = touch.clientY;
  state.touchDropListId    = null;
  state.isTouchDragging    = false;
  touchScrollIntent = false;

  touchDragArmed = false;
  touchDragCancelled = false;
  touchDragSourceCard = card;
  window.clearTimeout(touchDragHoldTimer);
  touchDragHoldTimer = window.setTimeout(() => {
    if (touchDragCancelled) return;
    touchDragArmed = true;
  }, TOUCH_DRAG_HOLD_MS);
}

export function handleTaskTouchMove(event) {
  if (!state.touchDraggedTaskId || event.touches.length !== 1) return;
  const touch = event.touches[0];
  const card = event.currentTarget;
  const dx    = Math.abs(touch.clientX - state.touchStartX);
  const dy    = Math.abs(touch.clientY - state.touchStartY);

  if (touchScrollIntent) {
    scrollBoardPage(lastTouchY - touch.clientY);
    lastTouchY = touch.clientY;
    event.preventDefault();
    return;
  }
  if (touchDragCancelled) return;

  if (!touchDragArmed) {
    if (dy > TOUCH_SCROLL_INTENT_PX) {
      touchScrollIntent = true;
      state.ignoreNextCardClick = true;
      window.clearTimeout(touchDragHoldTimer);
      scrollBoardPage(state.touchStartY - touch.clientY);
      lastTouchY = touch.clientY;
      event.preventDefault();
      return;
    }
    if (dx > TOUCH_SCROLL_INTENT_PX) {
      touchDragCancelled = true;
      window.clearTimeout(touchDragHoldTimer);
      cleanupTouchDragVisuals();
    }
    return;
  }

  if (!state.isTouchDragging && (dx > TOUCH_DRAG_START_PX || dy > TOUCH_DRAG_START_PX)) {
    state.isTouchDragging    = true;
    state.ignoreNextCardClick = true;
    createTouchDragPreview(card, touch);
  }
  if (!state.isTouchDragging) return;

  event.preventDefault();
  updateTouchDragPreviewPosition(touch);
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
  window.clearTimeout(touchDragHoldTimer);
  touchDragArmed = false;
  touchDragCancelled = false;
  touchScrollIntent = false;
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
  cleanupTouchDragVisuals();
  setTimeout(() => { state.ignoreNextCardClick = false; }, 120);
}

/** Resets touch drag state when the browser interrupts the gesture. */
export function handleTaskTouchCancel() {
  window.clearTimeout(touchDragHoldTimer);
  touchDragArmed = false;
  touchDragCancelled = false;
  touchScrollIntent = false;
  state.touchDraggedTaskId = null;
  state.touchDropListId = null;
  state.isTouchDragging = false;
  state.ignoreNextCardClick = false;
  clearDropActive();
  cleanupTouchDragVisuals();
}
