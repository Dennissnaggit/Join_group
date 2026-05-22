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
  checkExternalView();
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
  if (!user && !window.location.pathname.includes("index.html")) {
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

/** Toggles specific body classes depending on url parameters for external links. */
function checkExternalView() {
  let urlParams = new URLSearchParams(window.location.search);
  let isExternal = urlParams.get("view") === "external";
  let body = document.body;
  if (!body) {
    setTimeout(checkExternalView, 30);
    return;
  }
  body.classList.add(isExternal ? "external-view" : "internal-view");
}

/** Strips down and modifies the sidebar structure for unauthenticated layouts. */
function handleExternalLayout(navLinks) {
  let loginBtn = document.getElementById("sidebar-login-btn");
  let headerRight =
    document.querySelector(".header-right-side") ||
    document.querySelector(".user-initials-circle")?.parentElement;
  navLinks.style.setProperty("display", "none", "important");
  if (loginBtn) {
    loginBtn.classList.remove("d-none");
    loginBtn.style.setProperty("display", "flex", "important");
  }
  if (headerRight)
    headerRight.style.setProperty("display", "none", "important");
}

/** Optimizes the layout views for logged-in users inside the main panel. */
function handleInternalLayout() {
  let userInitials = document.querySelector(".user-initials-circle");
  let helpIcon =
    document.querySelector('header img[src*="help"]') ||
    document.querySelector('header a[href*="help"]');
  if (userInitials)
    userInitials.style.setProperty("display", "flex", "important");
  if (helpIcon) {
    helpIcon.style.setProperty("display", "none", "important");
    if (helpIcon.parentElement?.tagName === "A")
      helpIcon.parentElement.style.setProperty("display", "none", "important");
  }
  hideLogoutBtn();
}

/** Searches and completely hides the main application logout button interface. */
function hideLogoutBtn() {
  let logoutBtn = Array.from(
    document.querySelectorAll("header button, header a, header div")
  ).find((el) => el.textContent.includes("Log out"));
  if (logoutBtn) logoutBtn.style.setProperty("display", "none", "important");
}
