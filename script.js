window.addEventListener("load", () => {
  if (sessionStorage.getItem("loginAnimationDone")) {
    document.body.classList.add("animation-done");
  } else {
    setTimeout(() => {
      document.body.classList.add("animation-done");
      sessionStorage.setItem("loginAnimationDone", "true");
    }, 3700);
  }
});

let users = JSON.parse(localStorage.getItem("users")) || [
  { email: "test@test.com", password: "123", name: "Tester" },
];

/** Initializes the application components and security checks globally. */
async function init() {
  checkAuthentication();
  await includeHTML();
  setActivePage();
  
  let currentFile = window.location.pathname.split("/").pop();
  let isSpecialPage = currentFile === "legal_notice.html" || currentFile === "privacy_policy.html" || currentFile === "help.html";
  
  let urlParams = new URLSearchParams(window.location.search);
  let isExternal = urlParams.get("view") === "external" || !localStorage.getItem("currentUser");
  
  setTimeout(() => {
    if (isSpecialPage && isExternal) {
      handleExternalLayout();
    } else {
      handleInternalLayout(isSpecialPage);
    }
  }, 50);
  return true;
}

/** Loops through elements with the include attribute to trigger their loading. */
async function includeHTML() {
  let elements = document.querySelectorAll("[w3-include-html]");
  for (let i = 0; i < elements.length; i++) {
    let file = elements[i].getAttribute("w3-include-html");
    await fetchAndInject(elements[i], file);
  }
}

/** Fetches the HTML component and injects it into the target element. */
async function fetchAndInject(element, file) {
  try {
    let response = await fetch(file);
    element.innerHTML = response.ok ? await response.text() : "Page not found";
  } catch (error) {
    element.innerHTML = "Error loading component";
  }
}

/** Extracts the current filename from the URL to manage menu highlighting. */
function setActivePage() {
  let page = window.location.pathname.split("/").pop();
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  updateActiveNav(page || "summary.html");
}

/** Applies the active CSS class to the matching navigation sidebar item. */
function updateActiveNav(page) {
  let mapping = {
    "summary.html": "nav-summary",
    "add_task.html": "nav-addtask",
    "board.html": "nav-board",
    "contacts.html": "nav-contacts",
  };
  let id = mapping[page];
  if (id) document.getElementById(id)?.classList.add("active");
}

/** Redirects unauthorized visitors back to the login page if not logged in. */
function checkAuthentication() {
  let user = localStorage.getItem("currentUser");
  let currentFile = window.location.pathname.split("/").pop();
  let isLegalPage = currentFile === "legal_notice.html" || currentFile === "privacy_policy.html";
  
  if (!user && !window.location.pathname.includes("index.html") && !isLegalPage) {
    window.location.href = "../index.html";
  }
}

/** Forcefully redirects the browser back to the main login index. */
function goToLogin() {
  window.location.href = "../index.html";
}

/** Clears the active session data and sends the user to the login page. */
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "../index.html";
}

/** Pushes a newly registered account into the local storage users database. */
function saveUser(newUser) {
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
}

/** Strips down and modifies the sidebar structure for unauthenticated layouts. */
function handleExternalLayout() {
  let loginBtn = document.getElementById("sidebar-login-btn");
  let mainNav = document.getElementById("nav-links");
  let headerActions = document.querySelector(".header-user-actions");

  if (loginBtn) {
    loginBtn.classList.remove("d-none");
    loginBtn.style.setProperty("display", "flex", "important");
    loginBtn.style.setProperty("margin-top", "160px", "important");
  }
  if (mainNav) mainNav.style.setProperty("display", "none", "important");
  if (headerActions) headerActions.style.setProperty("display", "none", "important");
}

/** Optimizes the layout views for logged-in users inside the main panel. */
function handleInternalLayout(isSpecialPage) {
  let helpBtn = document.querySelector(".help-btn") || document.querySelector("header img[src*='help']");
  let logoutBtn = document.querySelector(".logout-button") || Array.from(document.querySelectorAll("header button")).find(el => el.textContent.includes("Log out"));
  let loginBtn = document.getElementById("sidebar-login-btn");
  let userInitials = document.getElementById("userInitials") || document.querySelector(".header-user-actions");

  if (isSpecialPage) {
    if (helpBtn) helpBtn.style.setProperty("display", "none", "important");
    if (logoutBtn) logoutBtn.style.setProperty("display", "none", "important");
  } else {
    if (helpBtn) helpBtn.style.setProperty("display", "flex", "important");
    if (logoutBtn) logoutBtn.style.setProperty("display", "flex", "important");
  }

  if (loginBtn) loginBtn.style.setProperty("display", "none", "important");
  if (userInitials) userInitials.style.setProperty("display", "flex", "important");
}