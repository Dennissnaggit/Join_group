/**
 * Shared mutable state + callback slots for the board module.
 * All board sub-modules import from here to avoid circular dependencies.
 */

export const state = {
  tasks: [],
  searchValue: "",
  contacts: [],

  // Drag & Drop
  draggedTaskId: null,
  ignoreNextCardClick: false,
  touchDraggedTaskId: null,
  touchDropListId: null,
  touchStartX: 0,
  touchStartY: 0,
  isTouchDragging: false,
};

/**
 * Callback slots – set by board.js after wiring up all modules.
 * Use callbacks.renderBoard() instead of importing renderBoard directly
 * to avoid circular dependency chains.
 */
export const callbacks = {
  renderBoard: null,
};
