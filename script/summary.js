/**
 * Main initialization for Summary page
 */
function initSummary() {
  setGreeting();
  displayUserName();
  renderSummaryNumbers();
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
  let activeUserRaw = localStorage.getItem("activeUser");
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

/**
 * Logic to count tasks and update the dashboard numbers
 */
function renderSummaryNumbers() {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

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
    tasks.filter((t) => t.status === "progress").length
  );
  updateElementText(
    "feedback-count",
    tasks.filter((t) => t.status === "feedback").length
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
