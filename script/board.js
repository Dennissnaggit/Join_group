let boardTasks = [
  {
    id: "task-1",
    title: "Kochwelt Page & Recipe Recommender",
    description: "Build start page with recipe recommendation section.",
    type: "User Story",
    status: "in-progress",
    assignedTo: ["AM", "EM", "MB"],
  },
  {
    id: "task-2",
    title: "HTML Base Template Creation",
    description: "Create reusable HTML base templates.",
    type: "Technical Task",
    status: "await-feedback",
    assignedTo: ["AM", "EM", "MB"],
  },
  {
    id: "task-3",
    title: "Daily Kochwelt Recipe",
    description: "Implement daily recipe and portion calculator.",
    type: "User Story",
    status: "await-feedback",
    assignedTo: ["AM", "EM", "MB"],
  },
  {
    id: "task-4",
    title: "CSS Architecture Planning",
    description: "Define CSS naming rules and folder structure.",
    type: "Technical Task",
    status: "done",
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

  return card;
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