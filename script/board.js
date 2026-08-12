/**
 * board.js – Entry point for the board page.
 *
 * Imports all board sub-modules from ./board/, wires up callbacks
 * to break circular dependencies, and starts the application.
 */

import { state, callbacks } from "./board/board-state.js";
import { loadTasksFromFirestore, loadContactsFromFirestore } from "./board/board-firestore.js";
import { renderBoard } from "./board/board-render.js";
import { setupBoardDropZones } from "./board/board-drag.js";
import { setupBoardTaskOverlay, openTaskOverlay } from "./board/board-modal.js";
import { setupAddTaskOverlay, openAddTaskModal } from "./board/board-add-task.js";

// Wire the renderBoard callback so sub-modules can call it
// without importing board-render.js directly (avoids circular deps).
callbacks.renderBoard = renderBoard;

// Expose openAddTaskModal for onclick attributes in board.html.
window.openAddTaskModal = openAddTaskModal;


// ── Initialisation ─────────────────────────────────────────────────────────

async function initBoard() {
  setupBoardSearch();
  setupBoardDropZones();
  setupBoardTaskOverlay();
  setupAddTaskOverlay();
  setupCardClickDelegation();

  try {
    await Promise.all([
      loadTasksFromFirestore(),
      loadContactsFromFirestore(),
    ]);
  } catch (err) {
    console.error("Board: Fehler beim Laden:", err);
  }

  renderBoard();
}


// ── Search ─────────────────────────────────────────────────────────────────

function setupBoardSearch() {
  const input = document.getElementById("boardSearchInput");
  if (!input) return;
  input.addEventListener("input", e => {
    state.searchValue = e.target.value.trim().toLowerCase();
    renderBoard();
  });
}


// ── Card click via event delegation ────────────────────────────────────────

/**
 * Listens on the document for clicks on .board-task-card elements.
 * Keeps board-render.js free of overlay imports (no circular deps).
 */
function setupCardClickDelegation() {
  document.addEventListener("click", e => {
    const card = e.target.closest(".board-task-card");
    if (!card) return;
    if (state.ignoreNextCardClick || state.isTouchDragging) return;
    openTaskOverlay(card.dataset.taskId);
  });
}


initBoard();
