import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let boardTasks = [];

let boardSearchValue = "";

let draggedTaskId = null;
let ignoreNextCardClick = false;

let touchDraggedTaskId = null;
let touchDropListId = null;
let touchStartX = 0;
let touchStartY = 0;
let isTouchDragging = false;


/* =========================================================
   INITIALIZATION
========================================================= */

/**
 * Initializes board page behavior.
 */
async function initBoard() {
  setupBoardSearch();
  setupBoardDropZones();
  setupBoardTaskOverlay();

  try {
    await loadBoardTasksFromFirestore();
  } catch (error) {
    console.error(
      "Board: Tasks konnten nicht geladen werden:",
      error
    );
  }

  renderBoard();
}

initBoard();


/* =========================================================
   AUTH
========================================================= */

/**
 * Wartet darauf, dass Firebase Authentication
 * den aktuellen User geladen hat.
 */
function waitForAuthUser() {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      }
    );
  });
}


/* =========================================================
   FIRESTORE - LOAD TASKS
========================================================= */

/**
 * Lädt alle Tasks des eingeloggten Users.
 *
 * Firestore:
 *
 * users
 *   └── uid
 *       └── tasks
 *           └── taskId
 */
async function loadBoardTasksFromFirestore() {
  const user = await waitForAuthUser();

  if (!user) {
    console.error(
      "Board: Kein Benutzer eingeloggt."
    );

    boardTasks = [];
    return;
  }

  console.log(
    "Board lädt Tasks für User:",
    user.uid
  );

  const tasksCollection = collection(
    db,
    "users",
    user.uid,
    "tasks"
  );

  const snapshot =
    await getDocs(tasksCollection);

  boardTasks = snapshot.docs.map(
    (taskDocument) => {
      return normalizeBoardTask(
        taskDocument.id,
        taskDocument.data()
      );
    }
  );

  console.log(
    "Geladene Board Tasks:",
    boardTasks
  );
}


/**
 * Wandelt einen Firestore Task in das Format um,
 * das vom Board erwartet wird.
 */
function normalizeBoardTask(id, data) {
  return {
    id: id,

    title:
      data.title || "",

    description:
      data.description || "",

    type:
      getTaskType(data),

    status:
      data.status || "todo",

    priority:
      data.priority || "medium",

    assignedTo:
      Array.isArray(data.assignedTo)
        ? data.assignedTo
        : [],

    dueDate:
      data.dueDate || "",

    subtasks:
      normalizeSubtasks(data.subtasks),
  };
}


/**
 * Ermittelt den Task-Typ.
 */
function getTaskType(data) {
  if (data.type) {
    return data.type;
  }

  const categoryMap = {
    kategorie1: "User Story",
    kategorie2: "Technical Task",

    "User Story": "User Story",
    "Technical Task": "Technical Task",
  };

  return (
    categoryMap[data.category] ||
    "User Story"
  );
}


/**
 * Normalisiert Subtasks.
 *
 * Unterstützt sowohl:
 *
 * completed: false
 *
 * als auch:
 *
 * done: false
 */
function normalizeSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) {
    return [];
  }

  return subtasks.map((subtask) => {
    return {
      title:
        subtask.title || "",

      done:
        subtask.done ??
        subtask.completed ??
        false,
    };
  });
}


/* =========================================================
   BOARD SEARCH
========================================================= */

/**
 * Adds input event listener for board search.
 */
function setupBoardSearch() {
  const searchInput =
    document.getElementById(
      "boardSearchInput"
    );

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener(
    "input",
    (event) => {
      boardSearchValue =
        event.target.value
          .trim()
          .toLowerCase();

      renderBoard();
    }
  );
}


/* =========================================================
   BOARD OVERLAY SETUP
========================================================= */

/**
 * Sets up close behavior for board task overlay.
 */
function setupBoardTaskOverlay() {
  const overlay =
    document.getElementById(
      "boardTaskOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.remove("is-open");

  overlay.addEventListener(
    "click",
    (event) => {
      if (
        event.target.id ===
        "boardTaskOverlay"
      ) {
        closeTaskOverlay();
      }
    }
  );
}


/* =========================================================
   DROP ZONES
========================================================= */

/**
 * Sets up all board columns as drop zones.
 */
function setupBoardDropZones() {
  const taskLists =
    document.querySelectorAll(
      ".board-task-list"
    );

  taskLists.forEach((taskList) => {
    taskList.addEventListener(
      "dragover",
      handleListDragOver
    );

    taskList.addEventListener(
      "drop",
      handleListDrop
    );

    taskList.addEventListener(
      "dragenter",
      handleListDragEnter
    );

    taskList.addEventListener(
      "dragleave",
      handleListDragLeave
    );
  });
}


/**
 * Allows dropping on a column.
 */
function handleListDragOver(event) {
  event.preventDefault();
}


/**
 * Marks list active while dragging.
 */
function handleListDragEnter(event) {
  const taskList = event.currentTarget;

  taskList.classList.add(
    "board-task-list-drop-active"
  );
}


/**
 * Removes active marker when leaving.
 */
function handleListDragLeave(event) {
  const taskList = event.currentTarget;

  if (
    taskList.contains(
      event.relatedTarget
    )
  ) {
    return;
  }

  taskList.classList.remove(
    "board-task-list-drop-active"
  );
}


/**
 * Drops task into a new status column.
 */
function handleListDrop(event) {
  event.preventDefault();

  const taskList =
    event.currentTarget;

  const newStatus =
    getStatusFromTaskList(
      taskList.id
    );

  const droppedTaskId =
    draggedTaskId ||
    event.dataTransfer.getData(
      "text/plain"
    );

  taskList.classList.remove(
    "board-task-list-drop-active"
  );

  if (
    !droppedTaskId ||
    !newStatus
  ) {
    return;
  }

  moveTaskToStatus(
    droppedTaskId,
    newStatus
  );

  draggedTaskId = null;
}


/**
 * Maps column ID to task status.
 */
function getStatusFromTaskList(
  taskListId
) {
  const statusMap = {
    boardColumnTodo:
      "todo",

    boardColumnInProgress:
      "in-progress",

    boardColumnAwaitFeedback:
      "await-feedback",

    boardColumnDone:
      "done",
  };

  return (
    statusMap[taskListId] ||
    null
  );
}


/* =========================================================
   RENDER BOARD
========================================================= */

/**
 * Renders all board columns.
 */
function renderBoard() {
  renderColumn(
    "todo",
    "boardColumnTodo"
  );

  renderColumn(
    "in-progress",
    "boardColumnInProgress"
  );

  renderColumn(
    "await-feedback",
    "boardColumnAwaitFeedback"
  );

  renderColumn(
    "done",
    "boardColumnDone"
  );
}


/**
 * Renders one board column.
 */
function renderColumn(
  status,
  columnId
) {
  const column =
    document.getElementById(
      columnId
    );

  if (!column) {
    return;
  }

  const tasks =
    getFilteredTasksByStatus(
      status
    );

  column.innerHTML = "";

  if (tasks.length === 0) {
    column.innerHTML = `
      <div
        class="board-empty"
        role="status"
        aria-live="polite"
      >
        <span>
          ${getEmptyStateMessage(status)}
        </span>
      </div>
    `;

    return;
  }

  tasks.forEach((task) => {
    column.appendChild(
      createTaskCard(task)
    );
  });
}


/**
 * Returns tasks filtered by status
 * and search value.
 */
function getFilteredTasksByStatus(
  status
) {
  return boardTasks.filter(
    (task) => {
      const matchesStatus =
        task.status === status;

      if (!matchesStatus) {
        return false;
      }

      if (!boardSearchValue) {
        return true;
      }

      const titleMatch =
        task.title
          .toLowerCase()
          .includes(
            boardSearchValue
          );

      const descriptionMatch =
        task.description
          .toLowerCase()
          .includes(
            boardSearchValue
          );

      return (
        titleMatch ||
        descriptionMatch
      );
    }
  );
}


/**
 * Empty state message.
 */
function getEmptyStateMessage(
  status
) {
  const labelMap = {
    todo:
      "To do",

    "in-progress":
      "In progress",

    "await-feedback":
      "Await feedback",

    done:
      "Done",
  };

  return `No tasks in ${
    labelMap[status] ||
    status
  }`;
}


/* =========================================================
   TASK CARD
========================================================= */

/**
 * Creates one task card.
 */
function createTaskCard(task) {
  const card =
    document.createElement(
      "article"
    );

  card.className =
    "board-task-card";

  card.draggable = true;

  card.dataset.taskId =
    task.id;

  const typeClass =
    task.type ===
    "Technical Task"
      ? "technical-task"
      : "user-story";

  card.innerHTML = `
    <span
      class="board-task-type ${typeClass}"
    >
      ${task.type}
    </span>

    <h3 class="board-task-title">
      ${task.title}
    </h3>

    <p class="board-task-description">
      ${task.description}
    </p>

    ${buildSubtasksSection(task)}

    <div class="board-task-footer">

      <div class="board-task-users">
        ${buildAvatarGroup(
          task.assignedTo
        )}
      </div>

      <div class="board-task-right">

        <img
          class="
            board-task-priority-icon
            board-task-priority-fixed
          "
          src="${getPriorityIconPath(
            task.priority
          )}"
          alt="${getPriorityLabel(
            task.priority
          )} priority"
          title="${getPriorityLabel(
            task.priority
          )} priority"
        >

      </div>

    </div>
  `;

  card.addEventListener(
    "dragstart",
    handleTaskDragStart
  );

  card.addEventListener(
    "dragend",
    handleTaskDragEnd
  );

  card.addEventListener(
    "click",
    () => {
      if (
        ignoreNextCardClick ||
        isTouchDragging
      ) {
        return;
      }

      openTaskOverlay(
        task.id
      );
    }
  );

  card.addEventListener(
    "touchstart",
    handleTaskTouchStart,
    {
      passive: true,
    }
  );

  card.addEventListener(
    "touchmove",
    handleTaskTouchMove,
    {
      passive: false,
    }
  );

  card.addEventListener(
    "touchend",
    handleTaskTouchEnd,
    {
      passive: false,
    }
  );

  return card;
}


/* =========================================================
   DESKTOP DRAG & DROP
========================================================= */

function handleTaskDragStart(event) {
  const card =
    event.currentTarget;

  draggedTaskId =
    card.dataset.taskId;

  event.dataTransfer.effectAllowed =
    "move";

  event.dataTransfer.setData(
    "text/plain",
    draggedTaskId
  );

  card.classList.add(
    "board-task-dragging"
  );

  ignoreNextCardClick = true;
}


function handleTaskDragEnd(event) {
  const card =
    event.currentTarget;

  card.classList.remove(
    "board-task-dragging"
  );

  document
    .querySelectorAll(
      ".board-task-list-drop-active"
    )
    .forEach((taskList) => {
      taskList.classList.remove(
        "board-task-list-drop-active"
      );
    });

  setTimeout(() => {
    ignoreNextCardClick =
      false;
  }, 120);
}


/* =========================================================
   MOBILE DRAG & DROP
========================================================= */

function handleTaskTouchStart(event) {
  if (
    event.touches.length !== 1
  ) {
    return;
  }

  const touch =
    event.touches[0];

  const card =
    event.currentTarget;

  touchDraggedTaskId =
    card.dataset.taskId;

  touchStartX =
    touch.clientX;

  touchStartY =
    touch.clientY;

  touchDropListId =
    null;

  isTouchDragging =
    false;
}


function handleTaskTouchMove(event) {
  if (
    !touchDraggedTaskId ||
    event.touches.length !== 1
  ) {
    return;
  }

  const touch =
    event.touches[0];

  const deltaX =
    Math.abs(
      touch.clientX -
        touchStartX
    );

  const deltaY =
    Math.abs(
      touch.clientY -
        touchStartY
    );

  if (
    !isTouchDragging &&
    (deltaX > 8 ||
      deltaY > 8)
  ) {
    isTouchDragging = true;
    ignoreNextCardClick = true;
  }

  if (!isTouchDragging) {
    return;
  }

  event.preventDefault();

  const targetElement =
    document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

  const targetTaskList =
    targetElement
      ? targetElement.closest(
          ".board-task-list"
        )
      : null;

  document
    .querySelectorAll(
      ".board-task-list-drop-active"
    )
    .forEach((taskList) => {
      taskList.classList.remove(
        "board-task-list-drop-active"
      );
    });

  if (targetTaskList) {
    targetTaskList.classList.add(
      "board-task-list-drop-active"
    );

    touchDropListId =
      targetTaskList.id;
  } else {
    touchDropListId =
      null;
  }
}


function handleTaskTouchEnd(event) {
  if (!touchDraggedTaskId) {
    return;
  }

  if (
    isTouchDragging &&
    touchDropListId
  ) {
    const newStatus =
      getStatusFromTaskList(
        touchDropListId
      );

    if (newStatus) {
      moveTaskToStatus(
        touchDraggedTaskId,
        newStatus
      );
    }

    event.preventDefault();
  }

  touchDraggedTaskId =
    null;

  touchDropListId =
    null;

  isTouchDragging =
    false;

  document
    .querySelectorAll(
      ".board-task-list-drop-active"
    )
    .forEach((taskList) => {
      taskList.classList.remove(
        "board-task-list-drop-active"
      );
    });

  setTimeout(() => {
    ignoreNextCardClick =
      false;
  }, 120);
}


/* =========================================================
   SUBTASKS
========================================================= */

/**
 * Builds subtask progress section.
 */
function buildSubtasksSection(task) {
  const subtaskList =
    Array.isArray(task.subtasks)
      ? task.subtasks
      : [];

  const subtasksTotal =
    subtaskList.length;

  const subtasksDone =
    subtaskList.filter(
      (subtask) =>
        subtask.done
    ).length;

  if (!subtasksTotal) {
    return "";
  }

  const progress =
    Math.round(
      (
        subtasksDone /
        subtasksTotal
      ) * 100
    );

  return `
    <div class="board-subtasks-row">

      <div
        class="board-subtasks-bar"
        aria-hidden="true"
      >
        <div
          class="board-subtasks-fill"
          style="width: ${progress}%"
        ></div>
      </div>

      <p class="board-subtasks-text">
        ${subtasksDone}/${subtasksTotal}
        Subtasks
      </p>

    </div>
  `;
}


/* =========================================================
   ASSIGNED USERS
========================================================= */

/**
 * Builds avatar circles.
 */
function buildAvatarGroup(users) {
  if (!Array.isArray(users)) {
    return "";
  }

  return users
    .map(
      (user, index) => {
        const initials =
          getInitials(user);

        return `
          <span
            class="board-avatar"
            style="
              background-color:
                ${getAvatarColor(user)};
              z-index:
                ${100 - index};
            "
            title="${user}"
          >
            ${initials}
          </span>
        `;
      }
    )
    .join("");
}


/**
 * Returns initials from name.
 *
 * Dennis Müller -> DM
 * Dennis -> D
 */
function getInitials(name) {
  if (!name) {
    return "?";
  }

  const parts =
    String(name)
      .trim()
      .split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0]
      .charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}


/**
 * Returns deterministic avatar color.
 */
function getAvatarColor(name) {
  const colors = [
    "#ff7a00",
    "#2fd7c4",
    "#5a42b2",
    "#ff5eb3",
    "#6e52ff",
    "#00bee8",
    "#1fd7c1",
    "#ffbb2b",
  ];

  let hash = 0;

  const value =
    String(name || "");

  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    hash =
      value.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  const index =
    Math.abs(hash) %
    colors.length;

  return colors[index];
}


/**
 * Returns display name.
 */
function getUserName(user) {
  return user || "Unknown";
}


/* =========================================================
   PRIORITY
========================================================= */

function getPriorityIconPath(
  priority
) {
  const iconMap = {
    urgent:
      "../assets/icons/board/high.png",

    medium:
      "../assets/icons/board/medium.png",

    low:
      "../assets/icons/board/low.png",
  };

  return (
    iconMap[priority] ||
    iconMap.medium
  );
}


function getPriorityLabel(priority) {
  const labelMap = {
    urgent:
      "Urgent",

    medium:
      "Medium",

    low:
      "Low",
  };

  return (
    labelMap[priority] ||
    "Medium"
  );
}


/* =========================================================
   OVERLAY ICONS
========================================================= */

function getOverlayPriorityIconMarkup(
  priority
) {
  const iconMap = {
    urgent:
      '<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 11l6-6 6 6" fill="none" stroke="#FF3D00" stroke-width="2" stroke-linecap="round"/><path d="M4 16l6-6 6 6" fill="none" stroke="#FF3D00" stroke-width="2" stroke-linecap="round"/></svg>',

    medium:
      '<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8h12" fill="none" stroke="#FFA800" stroke-width="2" stroke-linecap="round"/><path d="M4 12h12" fill="none" stroke="#FFA800" stroke-width="2" stroke-linecap="round"/></svg>',

    low:
      '<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 9l6 6 6-6" fill="none" stroke="#7AE229" stroke-width="2" stroke-linecap="round"/><path d="M4 4l6 6 6-6" fill="none" stroke="#7AE229" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  return (
    iconMap[priority] ||
    iconMap.medium
  );
}


function getOverlayDeleteIconMarkup() {
  return `
    <svg
      class="board-modal-action-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M7 21c-.55 0-1.02-.2-1.41-.59C5.2 20.02 5 19.55 5 19V6h14v13c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H7Zm2-4h2V9H9v8Zm4 0h2V9h-2v8ZM5 4h4V3h6v1h4v2H5V4Z"
        fill="#2A3647"
      />
    </svg>
  `;
}


function getOverlayEditIconMarkup() {
  return `
    <svg
      class="board-modal-action-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1 1 0 0 0 0-1.42l-2.5-2.5a1 1 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-2.13Z"
        fill="#2A3647"
      />
    </svg>
  `;
}


/* =========================================================
   UPDATE STATUS
========================================================= */

/**
 * Moves task to another column
 * and updates Firestore.
 */
function moveTaskToStatus(
  taskId,
  newStatus
) {
  const task =
    boardTasks.find(
      (entry) =>
        entry.id === taskId
    );

  if (!task) {
    return;
  }

  task.status =
    newStatus;

  renderBoard();

  void saveBoardTaskStatusToFirestore(
    taskId,
    newStatus
  );
}


/**
 * Saves task status in Firestore.
 */
async function saveBoardTaskStatusToFirestore(
  taskId,
  status
) {
  const user =
    auth.currentUser;

  if (!user) {
    console.error(
      "Status konnte nicht gespeichert werden: Kein User eingeloggt."
    );

    return;
  }

  try {
    const taskRef = doc(
      db,
      "users",
      user.uid,
      "tasks",
      taskId
    );

    await updateDoc(
      taskRef,
      {
        status: status,
      }
    );

    console.log(
      "Task Status gespeichert:",
      taskId,
      status
    );
  } catch (error) {
    console.error(
      "Fehler beim Speichern des Task Status:",
      error
    );
  }
}


/* =========================================================
   TASK OVERLAY
========================================================= */

/**
 * Opens task detail overlay.
 */
function openTaskOverlay(taskId) {
  const task =
    boardTasks.find(
      (entry) =>
        entry.id === taskId
    );

  if (!task) {
    return;
  }

  const overlay =
    document.getElementById(
      "boardTaskOverlay"
    );

  const modalContent =
    document.getElementById(
      "boardTaskModalContent"
    );

  if (
    !overlay ||
    !modalContent
  ) {
    return;
  }

  modalContent.innerHTML =
    buildTaskOverlayContent(
      task
    );

  overlay.classList.add(
    "is-open"
  );

  document.body.classList.add(
    "board-no-scroll"
  );

  const closeButton =
    document.getElementById(
      "boardTaskOverlayClose"
    );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeTaskOverlay
    );
  }

  const deleteButton =
    document.getElementById(
      "boardTaskDelete"
    );

  if (deleteButton) {
    deleteButton.addEventListener(
      "click",
      () => {
        deleteBoardTask(
          task.id
        );
      }
    );
  }
}


/**
 * Closes task overlay.
 */
function closeTaskOverlay() {
  const overlay =
    document.getElementById(
      "boardTaskOverlay"
    );

  if (!overlay) {
    return;
  }

  overlay.classList.remove(
    "is-open"
  );

  document.body.classList.remove(
    "board-no-scroll"
  );
}


/**
 * Builds task overlay content.
 */
function buildTaskOverlayContent(
  task
) {
  const typeClass =
    task.type ===
    "Technical Task"
      ? "technical-task"
      : "user-story";

  const users =
    (task.assignedTo || [])
      .map((user) => {
        return `
          <li
            class="board-modal-user-item"
          >
            <span
              class="board-avatar"
              style="
                background-color:
                  ${getAvatarColor(user)};
              "
            >
              ${getInitials(user)}
            </span>

            <span>
              ${getUserName(user)}
            </span>
          </li>
        `;
      })
      .join("");

  let subtasks =
    (task.subtasks || [])
      .map((subtask) => {
        return `
          <li
            class="board-modal-subtask-item"
          >

            <img
              class="board-modal-check-icon"
              src="${
                subtask.done
                  ? "../assets/AdTask/personChecked.png"
                  : "../assets/AdTask/personUnchecked.png"
              }"
              alt="${
                subtask.done
                  ? "checked"
                  : "unchecked"
              }"
            >

            <span>
              ${subtask.title}
            </span>

          </li>
        `;
      })
      .join("");

  if (!subtasks) {
    subtasks = `
      <li
        class="board-modal-no-subtasks"
      >
        No subtasks
      </li>
    `;
  }

  return `
    <div class="board-modal-head">

      <span
        class="board-task-type ${typeClass}"
      >
        ${task.type}
      </span>

      <button
        id="boardTaskOverlayClose"
        class="board-modal-close"
        type="button"
        aria-label="Close task details"
      >
        &times;
      </button>

    </div>


    <h3 class="board-modal-title">
      ${task.title}
    </h3>


    <p class="board-modal-description">
      ${task.description}
    </p>


    <div class="board-modal-row">

      <span class="board-modal-label">
        Due date:
      </span>

      <span>
        ${formatDisplayDate(
          task.dueDate
        )}
      </span>

    </div>


    <div class="board-modal-row">

      <span class="board-modal-label">
        Priority:
      </span>

      <span class="board-modal-priority">

        ${getPriorityLabel(
          task.priority
        )}

        ${getOverlayPriorityIconMarkup(
          task.priority
        )}

      </span>

    </div>


    <div class="board-modal-section">

      <p class="board-modal-label">
        Assigned To:
      </p>

      <ul class="board-modal-user-list">
        ${
          users ||
          "<li>Not assigned</li>"
        }
      </ul>

    </div>


    <div class="board-modal-section">

      <p class="board-modal-label">
        Subtasks
      </p>

      <ul class="board-modal-subtask-list">
        ${subtasks}
      </ul>

    </div>


    <div
      class="board-modal-actions"
      aria-label="Task actions"
    >

      <button
        id="boardTaskDelete"
        type="button"
        class="board-modal-action-btn"
      >
        ${getOverlayDeleteIconMarkup()}

        <span>
          Delete
        </span>
      </button>


      <span
        class="board-modal-action-divider"
        aria-hidden="true"
      ></span>


      <button
        type="button"
        class="board-modal-action-btn"
      >
        ${getOverlayEditIconMarkup()}

        <span>
          Edit
        </span>
      </button>

    </div>
  `;
}


/* =========================================================
   DELETE TASK
========================================================= */

/**
 * Deletes task from Firestore.
 */
async function deleteBoardTask(
  taskId
) {
  const user =
    auth.currentUser;

  if (!user) {
    console.error(
      "Task konnte nicht gelöscht werden: Kein User."
    );

    return;
  }

  try {
    const taskRef = doc(
      db,
      "users",
      user.uid,
      "tasks",
      taskId
    );

    await deleteDoc(taskRef);

    boardTasks =
      boardTasks.filter(
        (task) =>
          task.id !== taskId
      );

    closeTaskOverlay();
    renderBoard();

    console.log(
      "Task gelöscht:",
      taskId
    );
  } catch (error) {
    console.error(
      "Task konnte nicht gelöscht werden:",
      error
    );
  }
}


/* =========================================================
   DATE
========================================================= */

/**
 * Formats date to DD/MM/YYYY.
 */
function formatDisplayDate(value) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB"
  );
}