let boardTasks = [
  {
    id: "task-1",
    title: "Kochwelt Page & Recipe Recommender",
    description: "Build start page with recipe recommendation section.",
    type: "User Story",
    status: "in-progress",
    priority: "urgent",
    assignedTo: ["AM", "EM", "MB"],
  },
  {
    id: "task-2",
    title: "HTML Base Template Creation",
    description: "Create reusable HTML base templates.",
    type: "Technical Task",
    status: "await-feedback",
    priority: "medium",
    assignedTo: ["AM", "EM", "MB"],
  },
  {
    id: "task-3",
    title: "Daily Kochwelt Recipe",
    description: "Implement daily recipe and portion calculator.",
    type: "User Story",
    status: "await-feedback",
    priority: "low",
    assignedTo: ["AM", "EM", "MB"],
  },
  {
    id: "task-4",
    title: "CSS Architecture Planning",
    description: "Define CSS naming rules and folder structure.",
    type: "Technical Task",
    status: "done",
    priority: "medium",
    assignedTo: ["AM", "EM", "MB"],
  },
];

let boardSearchValue = "";

/** Initializes board page behavior. */
function initBoard() {
  setupBoardSearch();
  renderBoard();
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

  let typeClass = task.type === "Technical Task" ? "technical-task" : "user-story";
  let userText = task.assignedTo.join(", ");

  card.innerHTML = `
    <span class="board-task-type ${typeClass}">${task.type}</span>
    <h3 class="board-task-title">${task.title}</h3>
    <p class="board-task-description">${task.description}</p>
    <div class="board-task-priority-row">
      ${buildPriorityButtons(task)}
    </div>
    <div class="board-task-footer">
      <p class="board-task-users">${userText}</p>
      <select class="board-task-move" aria-label="Move task">
        ${buildStatusOptions(task.status)}
      </select>
    </div>
  `;

  let moveSelect = card.querySelector(".board-task-move");
  moveSelect.addEventListener("change", (event) => {
    moveTaskToStatus(task.id, event.target.value);
  });

  let priorityButtons = card.querySelectorAll(".board-priority-btn");
  priorityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateTaskPriority(task.id, button.dataset.priority);
    });
  });

  return card;
}

/** Builds icon-only buttons for task priority. */
function buildPriorityButtons(task) {
  let priorities = ["urgent", "medium", "low"];

  return priorities
    .map((priority) => {
      let isActive = task.priority === priority;
      return `
        <button
          type="button"
          class="board-priority-btn"
          data-priority="${priority}"
          aria-label="Set ${getPriorityLabel(priority)} priority"
        >
          <img
            class="board-task-priority-icon"
            src="${getPriorityIconPath(priority, isActive)}"
            alt="${getPriorityLabel(priority)}"
          >
        </button>
      `;
    })
    .join("");
}

/** Returns the Add Task icon path for one priority value and state. */
function getPriorityIconPath(priority, isActive) {
  let iconMap = {
    urgent: {
      active: "../assets/AdTask/prioUrgentActive.png",
      inactive: "../assets/AdTask/prioUrgentNotActive.png",
    },
    medium: {
      active: "../assets/AdTask/prioMedActive.png",
      inactive: "../assets/AdTask/prioMedNotActive.png",
    },
    low: {
      active: "../assets/AdTask/prioLowActive.png",
      inactive: "../assets/AdTask/prioLowNotActive.png",
    },
  };

  let priorityIcons = iconMap[priority] || iconMap.medium;
  return isActive ? priorityIcons.active : priorityIcons.inactive;
}

/** Returns text label for one priority value. */
function getPriorityLabel(priority) {
  let labelMap = {
    urgent: "Hard",
    medium: "Medium",
    low: "Easy",
  };

  return labelMap[priority] || "Medium";
}

/** Builds select options for all task statuses. */
function buildStatusOptions(currentStatus) {
  let statuses = [
    { value: "todo", label: "To do" },
    { value: "in-progress", label: "In progress" },
    { value: "await-feedback", label: "Await feedback" },
    { value: "done", label: "Done" },
  ];

  return statuses
    .map((status) => {
      let selected = status.value === currentStatus ? "selected" : "";
      return `<option value="${status.value}" ${selected}>${status.label}</option>`;
    })
    .join("");
}

/** Updates one task status and re-renders the board. */
function moveTaskToStatus(taskId, newStatus) {
  let task = boardTasks.find((entry) => entry.id === taskId);
  if (!task) return;

  task.status = newStatus;
  renderBoard();
}

/** Updates one task priority and re-renders the board. */
function updateTaskPriority(taskId, newPriority) {
  let task = boardTasks.find((entry) => entry.id === taskId);
  if (!task) return;

  task.priority = newPriority;
  renderBoard();
}