let boardTasks = [
  {
    id: "task-1",
    title: "Kochwelt Page & Recipe Recommender",
    description: "Build start page with recipe recommendation section.",
    type: "User Story",
    status: "in-progress",
    priority: "urgent",
    assignedTo: ["AM", "EM", "MB"],
    dueDate: "2023-09-02",
    subtasks: [
      { title: "Set up API endpoint", done: true },
      { title: "Connect recommendation UI", done: false },
    ],
  },
  {
    id: "task-2",
    title: "HTML Base Template Creation",
    description: "Create reusable HTML base templates.",
    type: "Technical Task",
    status: "await-feedback",
    priority: "medium",
    assignedTo: ["AM", "EM", "MB"],
    dueDate: "2023-09-03",
    subtasks: [],
  },
  {
    id: "task-3",
    title: "Daily Kochwelt Recipe",
    description: "Implement daily recipe and portion calculator.",
    type: "User Story",
    status: "await-feedback",
    priority: "low",
    assignedTo: ["AM", "EM", "MB"],
    dueDate: "2023-09-04",
    subtasks: [],
  },
  {
    id: "task-4",
    title: "CSS Architecture Planning",
    description: "Define CSS naming rules and folder structure.",
    type: "Technical Task",
    status: "done",
    priority: "medium",
    assignedTo: ["AM", "EM", "MB"],
    dueDate: "2023-09-02",
    subtasks: [
      { title: "Establish CSS Methodology", done: true },
      { title: "Setup Base Styles", done: true },
    ],
  },
];

let boardSearchValue = "";
let draggedTaskId = null;
let ignoreNextCardClick = false;
let touchDraggedTaskId = null;
let touchDropListId = null;
let touchStartX = 0;
let touchStartY = 0;
let isTouchDragging = false;

/** Initializes board page behavior. */
function initBoard() {
  setupBoardSearch();
  setupBoardDropZones();
  setupBoardTaskOverlay();
  renderBoard();
}

/** Sets up close behavior for the board task overlay. */
function setupBoardTaskOverlay() {
  let overlay = document.getElementById("boardTaskOverlay");
  if (!overlay) return;

  overlay.classList.remove("is-open");

  overlay.addEventListener("click", (event) => {
    if (event.target.id === "boardTaskOverlay") {
      closeTaskOverlay();
    }
  });
}

/** Sets up all board columns as drop zones. */
function setupBoardDropZones() {
  let taskLists = document.querySelectorAll(".board-task-list");

  taskLists.forEach((taskList) => {
    taskList.addEventListener("dragover", handleListDragOver);
    taskList.addEventListener("drop", handleListDrop);
    taskList.addEventListener("dragenter", handleListDragEnter);
    taskList.addEventListener("dragleave", handleListDragLeave);
  });
}

/** Allows dropping on a column. */
function handleListDragOver(event) {
  event.preventDefault();
}

/** Marks list as active while dragging card over it. */
function handleListDragEnter(event) {
  let taskList = event.currentTarget;
  taskList.classList.add("board-task-list-drop-active");
}

/** Removes active marker when leaving a list. */
function handleListDragLeave(event) {
  let taskList = event.currentTarget;
  if (taskList.contains(event.relatedTarget)) return;
  taskList.classList.remove("board-task-list-drop-active");
}

/** Drops task into a new status column. */
function handleListDrop(event) {
  event.preventDefault();
  let taskList = event.currentTarget;
  let newStatus = getStatusFromTaskList(taskList.id);
  let droppedTaskId = draggedTaskId || event.dataTransfer.getData("text/plain");

  taskList.classList.remove("board-task-list-drop-active");
  if (!droppedTaskId || !newStatus) return;

  moveTaskToStatus(droppedTaskId, newStatus);
  draggedTaskId = null;
}

/** Maps a task list id to a board status. */
function getStatusFromTaskList(taskListId) {
  let statusMap = {
    boardColumnTodo: "todo",
    boardColumnInProgress: "in-progress",
    boardColumnAwaitFeedback: "await-feedback",
    boardColumnDone: "done",
  };

  return statusMap[taskListId] || null;
}

/** Adds input event listener for board search. */
function setupBoardSearch() {
  let searchInput = document.getElementById("boardSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    boardSearchValue = event.target.value.trim().toLowerCase();
    renderBoard();
  });
}

/** Renders all board columns. */
function renderBoard() {
  renderColumn("todo", "boardColumnTodo");
  renderColumn("in-progress", "boardColumnInProgress");
  renderColumn("await-feedback", "boardColumnAwaitFeedback");
  renderColumn("done", "boardColumnDone");
}

/** Renders one board column by status. */
function renderColumn(status, columnId) {
  let column = document.getElementById(columnId);
  if (!column) return;

  let tasks = getFilteredTasksByStatus(status);
  column.innerHTML = "";

  if (tasks.length === 0) {
    column.innerHTML = '<p class="board-empty">No tasks in this section</p>';
    return;
  }

  tasks.forEach((task) => {
    column.appendChild(createTaskCard(task));
  });
}

/** Returns tasks filtered by status and search value. */
function getFilteredTasksByStatus(status) {
  return boardTasks.filter((task) => {
    let matchesStatus = task.status === status;
    if (!matchesStatus) return false;

    if (!boardSearchValue) return true;

    let titleMatch = task.title.toLowerCase().includes(boardSearchValue);
    let descriptionMatch = task.description.toLowerCase().includes(boardSearchValue);
    return titleMatch || descriptionMatch;
  });
}

/** Creates and returns one task card element. */
function createTaskCard(task) {
  let card = document.createElement("article");
  card.className = "board-task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  let typeClass = task.type === "Technical Task" ? "technical-task" : "user-story";

  card.innerHTML = `
    <span class="board-task-type ${typeClass}">${task.type}</span>
    <h3 class="board-task-title">${task.title}</h3>
    <p class="board-task-description">${task.description}</p>
    ${buildSubtasksSection(task)}
    <div class="board-task-footer">
      <div class="board-task-users">${buildAvatarGroup(task.assignedTo)}</div>
      <div class="board-task-right">
        <img
          class="board-task-priority-icon board-task-priority-fixed"
          src="${getPriorityIconPath(task.priority)}"
          alt="${getPriorityLabel(task.priority)} priority"
          title="${getPriorityLabel(task.priority)} priority"
        >
      </div>
    </div>
  `;

  card.addEventListener("dragstart", handleTaskDragStart);
  card.addEventListener("dragend", handleTaskDragEnd);
  card.addEventListener("click", () => {
    if (ignoreNextCardClick || isTouchDragging) return;
    openTaskOverlay(task.id);
  });
  card.addEventListener("touchstart", handleTaskTouchStart, { passive: true });
  card.addEventListener("touchmove", handleTaskTouchMove, { passive: false });
  card.addEventListener("touchend", handleTaskTouchEnd, { passive: false });

  return card;
}

/** Starts dragging one task card. */
function handleTaskDragStart(event) {
  let card = event.currentTarget;
  draggedTaskId = card.dataset.taskId;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedTaskId);
  card.classList.add("board-task-dragging");
  ignoreNextCardClick = true;
}

/** Ends dragging and resets visual states. */
function handleTaskDragEnd(event) {
  let card = event.currentTarget;
  card.classList.remove("board-task-dragging");

  document
    .querySelectorAll(".board-task-list-drop-active")
    .forEach((taskList) => taskList.classList.remove("board-task-list-drop-active"));

  setTimeout(() => {
    ignoreNextCardClick = false;
  }, 120);
}

/** Starts touch drag on mobile. */
function handleTaskTouchStart(event) {
  if (event.touches.length !== 1) return;

  let touch = event.touches[0];
  let card = event.currentTarget;

  touchDraggedTaskId = card.dataset.taskId;
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchDropListId = null;
  isTouchDragging = false;
}

/** Tracks touch move and active drop list for mobile drag. */
function handleTaskTouchMove(event) {
  if (!touchDraggedTaskId || event.touches.length !== 1) return;

  let touch = event.touches[0];
  let deltaX = Math.abs(touch.clientX - touchStartX);
  let deltaY = Math.abs(touch.clientY - touchStartY);

  if (!isTouchDragging && (deltaX > 8 || deltaY > 8)) {
    isTouchDragging = true;
    ignoreNextCardClick = true;
  }

  if (!isTouchDragging) return;

  event.preventDefault();

  let targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
  let targetTaskList = targetElement ? targetElement.closest(".board-task-list") : null;

  document
    .querySelectorAll(".board-task-list-drop-active")
    .forEach((taskList) => taskList.classList.remove("board-task-list-drop-active"));

  if (targetTaskList) {
    targetTaskList.classList.add("board-task-list-drop-active");
    touchDropListId = targetTaskList.id;
  } else {
    touchDropListId = null;
  }
}

/** Drops task into list after touch drag on mobile. */
function handleTaskTouchEnd(event) {
  if (!touchDraggedTaskId) return;

  if (isTouchDragging && touchDropListId) {
    let newStatus = getStatusFromTaskList(touchDropListId);
    if (newStatus) {
      moveTaskToStatus(touchDraggedTaskId, newStatus);
    }
    event.preventDefault();
  }

  touchDraggedTaskId = null;
  touchDropListId = null;
  isTouchDragging = false;

  document
    .querySelectorAll(".board-task-list-drop-active")
    .forEach((taskList) => taskList.classList.remove("board-task-list-drop-active"));

  setTimeout(() => {
    ignoreNextCardClick = false;
  }, 120);
}

/** Builds subtask progress section. */
function buildSubtasksSection(task) {
  let subtaskList = Array.isArray(task.subtasks) ? task.subtasks : [];
  let subtasksTotal = subtaskList.length;
  let subtasksDone = subtaskList.filter((subtask) => subtask.done).length;

  if (!subtasksTotal) return "";

  let progress = Math.round((subtasksDone / subtasksTotal) * 100);
  return `
    <div class="board-subtasks-row">
      <div class="board-subtasks-bar" aria-hidden="true">
        <div class="board-subtasks-fill" style="width: ${progress}%"></div>
      </div>
      <p class="board-subtasks-text">${subtasksDone}/${subtasksTotal} Subtasks</p>
    </div>
  `;
}

/** Builds avatar circles for assigned users. */
function buildAvatarGroup(users) {
  return users
    .map((initials, index) => {
      return `
        <span class="board-avatar" style="background-color: ${getAvatarColor(initials)}; z-index: ${100 - index};">
          ${initials}
        </span>
      `;
    })
    .join("");
}

/** Returns avatar color based on initials. */
function getAvatarColor(initials) {
  let colorMap = {
    AM: "#ff7a00",
    EM: "#2fd7c4",
    MB: "#5a42b2",
  };

  return colorMap[initials] || "#8795a8";
}

/** Returns display name for one user initials value. */
function getUserName(initials) {
  let userMap = {
    AM: "Sofia Muller (You)",
    EM: "Elena Meyer",
    MB: "Benedikt Ziegler",
  };

  return userMap[initials] || initials;
}

/** Returns the Add Task icon path for one priority value. */
function getPriorityIconPath(priority) {
  let iconMap = {
    urgent: "../assets/icons/board/high.png",
    medium: "../assets/icons/board/medium.png",
    low: "../assets/icons/board/low.png",
  };

  return iconMap[priority] || iconMap.medium;
}

/** Returns text label for one priority value. */
function getPriorityLabel(priority) {
  let labelMap = {
    urgent: "Urgent",
    medium: "Medium",
    low: "Low",
  };

  return labelMap[priority] || "Medium";
}

/** Returns inline SVG icon for task overlay priority. */
function getOverlayPriorityIconMarkup(priority) {
  let iconMap = {
    urgent:
      '<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 11l6-6 6 6" fill="none" stroke="#FF3D00" stroke-width="2" stroke-linecap="round"/><path d="M4 16l6-6 6 6" fill="none" stroke="#FF3D00" stroke-width="2" stroke-linecap="round"/></svg>',
    medium:
      '<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8h12" fill="none" stroke="#FFA800" stroke-width="2" stroke-linecap="round"/><path d="M4 12h12" fill="none" stroke="#FFA800" stroke-width="2" stroke-linecap="round"/></svg>',
    low:
      '<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 9l6 6 6-6" fill="none" stroke="#7AE229" stroke-width="2" stroke-linecap="round"/><path d="M4 4l6 6 6-6" fill="none" stroke="#7AE229" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  return iconMap[priority] || iconMap.medium;
}

/** Returns inline SVG icon for delete action. */
function getOverlayDeleteIconMarkup() {
  return '<svg class="board-modal-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21c-.55 0-1.02-.2-1.41-.59C5.2 20.02 5 19.55 5 19V6h14v13c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H7Zm2-4h2V9H9v8Zm4 0h2V9h-2v8ZM5 4h4V3h6v1h4v2H5V4Z" fill="#2A3647"/></svg>';
}

/** Returns inline SVG icon for edit action. */
function getOverlayEditIconMarkup() {
  return '<svg class="board-modal-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1 1 0 0 0 0-1.42l-2.5-2.5a1 1 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-2.13Z" fill="#2A3647"/></svg>';
}

/** Updates one task status and re-renders the board. */
function moveTaskToStatus(taskId, newStatus) {
  let task = boardTasks.find((entry) => entry.id === taskId);
  if (!task) return;

  task.status = newStatus;
  renderBoard();
}

/** Opens task detail overlay for one task. */
function openTaskOverlay(taskId) {
  let task = boardTasks.find((entry) => entry.id === taskId);
  if (!task) return;

  let overlay = document.getElementById("boardTaskOverlay");
  let modalContent = document.getElementById("boardTaskModalContent");
  if (!overlay || !modalContent) return;

  modalContent.innerHTML = buildTaskOverlayContent(task);
  overlay.classList.add("is-open");
  document.body.classList.add("board-no-scroll");

  let closeButton = document.getElementById("boardTaskOverlayClose");
  if (closeButton) {
    closeButton.addEventListener("click", closeTaskOverlay);
  }
}

/** Closes the task detail overlay. */
function closeTaskOverlay() {
  let overlay = document.getElementById("boardTaskOverlay");
  if (!overlay) return;

  overlay.classList.remove("is-open");
  document.body.classList.remove("board-no-scroll");
}

/** Builds HTML content for task detail overlay. */
function buildTaskOverlayContent(task) {
  let typeClass = task.type === "Technical Task" ? "technical-task" : "user-story";
  let users = task.assignedTo
    .map(
      (initials) => `
        <li class="board-modal-user-item">
          <span class="board-avatar" style="background-color: ${getAvatarColor(initials)};">${initials}</span>
          <span>${getUserName(initials)}</span>
        </li>
      `
    )
    .join("");

  let subtasks = (task.subtasks || [])
    .map(
      (subtask) => `
        <li class="board-modal-subtask-item">
          <img
            class="board-modal-check-icon"
            src="${subtask.done ? "../assets/AdTask/personChecked.png" : "../assets/AdTask/personUnchecked.png"}"
            alt="${subtask.done ? "checked" : "unchecked"}"
          >
          <span>${subtask.title}</span>
        </li>
      `
    )
    .join("");

  if (!subtasks) {
    subtasks = '<li class="board-modal-no-subtasks">No subtasks</li>';
  }

  return `
    <div class="board-modal-head">
      <span class="board-task-type ${typeClass}">${task.type}</span>
      <button id="boardTaskOverlayClose" class="board-modal-close" type="button" aria-label="Close task details">&times;</button>
    </div>
    <h3 class="board-modal-title">${task.title}</h3>
    <p class="board-modal-description">${task.description}</p>
    <div class="board-modal-row">
      <span class="board-modal-label">Due date:</span>
      <span>${formatDisplayDate(task.dueDate)}</span>
    </div>
    <div class="board-modal-row">
      <span class="board-modal-label">Priority:</span>
      <span class="board-modal-priority">
        ${getPriorityLabel(task.priority)}
        ${getOverlayPriorityIconMarkup(task.priority)}
      </span>
    </div>
    <div class="board-modal-section">
      <p class="board-modal-label">Assigned To:</p>
      <ul class="board-modal-user-list">${users}</ul>
    </div>
    <div class="board-modal-section">
      <p class="board-modal-label">Subtasks</p>
      <ul class="board-modal-subtask-list">${subtasks}</ul>
    </div>
    <div class="board-modal-actions" aria-label="Task actions">
      <button type="button" class="board-modal-action-btn">
        ${getOverlayDeleteIconMarkup()}
        <span>Delete</span>
      </button>
      <span class="board-modal-action-divider" aria-hidden="true"></span>
      <button type="button" class="board-modal-action-btn">
        ${getOverlayEditIconMarkup()}
        <span>Edit</span>
      </button>
    </div>
  `;
}

/** Formats date string to DD/MM/YYYY. */
function formatDisplayDate(value) {
  if (!value) return "-";

  let date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
}