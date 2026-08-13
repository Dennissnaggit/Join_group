import { state, callbacks } from "./board-state.js";
import { createTaskInFirestore } from "./board-firestore.js";
import {
  getInitials, getAvatarColor, escapeHtml,
  buildPriorityButtons, selectPriority, getActivePriority,
} from "./board-helpers.js";

let taskAddedNoticeTimer;


// ── Overlay setup ──────────────────────────────────────────────────────────

/** Registers the backdrop-click close handler on the add-task overlay. */
export function setupAddTaskOverlay() {
  const overlay = document.getElementById("boardAddTaskOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.addEventListener("click", e => {
    if (e.target.id === "boardAddTaskOverlay") closeAddTaskModal();
  });
}

/** Opens the "Add Task" modal, pre-selecting the given column status. */
export function openAddTaskModal(defaultStatus = "todo") {
  const overlay = document.getElementById("boardAddTaskOverlay");
  const content = document.getElementById("boardAddTaskModalContent");
  if (!overlay || !content) return;

  content.innerHTML = buildAddTaskHTML(defaultStatus);
  overlay.classList.add("is-open");
  document.body.classList.add("board-no-scroll");
  setupAddTaskListeners(defaultStatus);
}

/** Closes the add-task modal. */
export function closeAddTaskModal() {
  document.getElementById("boardAddTaskOverlay")?.classList.remove("is-open");
  document.body.classList.remove("board-no-scroll");
}


// ── HTML builders ──────────────────────────────────────────────────────────

function buildAddTaskHTML(defaultStatus) {
  return `
    <div class="bat-header">
      <h2 class="bat-title">Add Task</h2>
      <button id="boardAddTaskClose" class="board-modal-close" type="button">&times;</button>
    </div>
    <div class="bat-body">
      ${buildLeftColumn()}
      <div class="bat-divider" aria-hidden="true"></div>
      ${buildRightColumn(defaultStatus)}
    </div>
    <div class="bat-footer">
      <p class="bat-required-hint"><span class="bat-required">*</span>This field is required</p>
      <div class="bat-actions">
        <button type="button" id="batCancelBtn" class="bat-btn-cancel">Cancel &#x2715;</button>
        <button type="button" id="batCreateBtn" class="bat-btn-create" data-status="${defaultStatus}">
          Create Task <img src="../assets/icons/board/subtasks/check_white.svg" alt="save" width="24" height="24" style="vertical-align:middle;margin-left:4px">
        </button>
      </div>
    </div>`;
}

function buildLeftColumn() {
  return `
    <div class="bat-left">
      <div class="bat-field">
        <label class="bat-label">Title<span class="bat-required">*</span></label>
        <input id="batTitle" class="bat-input" type="text" placeholder="Enter a title">
        <span class="bat-error" id="batTitleError" hidden>This field is required</span>
      </div>
      <div class="bat-field bat-field--grow">
        <label class="bat-label">Description</label>
        <textarea id="batDescription" class="bat-input bat-textarea" placeholder="Enter a Description"></textarea>
      </div>
      <div class="bat-field">
        <label class="bat-label">Due date<span class="bat-required">*</span></label>
        <input id="batDueDate" class="bat-input" type="date">
        <span class="bat-error" id="batDueDateError" hidden>This field is required</span>
      </div>
    </div>`;
}

function buildRightColumn(defaultStatus) {
  return `
    <div class="bat-right">
      <div class="bat-field">
        <span class="bat-label">Priority</span>
        ${buildPriorityButtons("medium")}
      </div>
      <div class="bat-field bat-assigned-field">
        <label class="bat-label">Assigned to</label>
        <div class="bat-dropdown-wrapper" data-dropdown="contacts">
          <div id="batAssignedToggle" class="bat-input bat-dropdown-toggle">
            <span>Select contacts to assign</span>
            <span class="bat-dropdown-arrow">&#9662;</span>
          </div>
          <div id="batAssignedDropdown" class="bat-dropdown" hidden>
            <div class="bat-dropdown-search-wrapper">
              <input id="batAssignedSearch" class="bat-dropdown-search" type="text" placeholder="Search contacts...">
            </div>
            ${buildContactCheckboxes()}
          </div>
        </div>
        <div id="batSelectedAvatars" class="bat-selected-avatars"></div>
      </div>
      <div class="bat-field">
        <label class="bat-label">Category<span class="bat-required">*</span></label>
        <div class="bat-dropdown-wrapper" data-dropdown="category">
          <div id="batCategoryToggle" class="bat-input bat-dropdown-toggle">
            <span id="batCategoryDisplay">Select task category</span>
            <span class="bat-dropdown-arrow">&#9662;</span>
          </div>
          <div id="batCategoryDropdown" class="bat-dropdown" hidden>
            <div class="bat-category-option" data-value="User Story">User Story</div>
            <div class="bat-category-option" data-value="Technical Task">Technical Task</div>
          </div>
        </div>
        <span class="bat-error" id="batCategoryError" hidden>This field is required</span>
      </div>
      <div class="bat-field">
        <label class="bat-label">Subtasks</label>
        <div class="bat-subtask-input-wrap">
          <input id="batSubtaskInput" class="bat-input bat-subtask-field" type="text" placeholder="Add new subtask">
          <div class="bat-subtask-input-icons is-empty">
            <button type="button" class="bat-subtask-icon-btn bat-si-plus">+</button>
            <button type="button" class="bat-subtask-icon-btn bat-si-clear"><img src="../assets/icons/board/subtasks/close.svg" alt="x" width="16" height="16"></button>
            <span class="bat-si-sep"></span>
            <button type="button" class="bat-subtask-icon-btn bat-si-confirm"><img src="../assets/icons/board/subtasks/mark.svg" alt="ok" width="16" height="16"></button>
          </div>
        </div>
        <ul id="batSubtaskList" class="bat-subtask-list"></ul>
      </div>
    </div>`;
}

function buildContactCheckboxes() {
  if (!state.contacts.length) {
    return `<p class="bat-no-contacts">No contacts available</p>`;
  }
  return state.contacts.map(c => `
    <label class="bat-contact-option">
      <div class="bat-contact-name-wrap">
        <span class="board-avatar" style="background-color:${c.color || getAvatarColor(c.name)}">${getInitials(c.name)}</span>
        <span>${c.name}</span>
      </div>
      <input type="checkbox" value="${c.name}" class="bat-contact-check">
    </label>`).join("");
}


// ── Event setup ────────────────────────────────────────────────────────────

function setupAddTaskListeners(defaultStatus) {
  document.getElementById("boardAddTaskClose")?.addEventListener("click", closeAddTaskModal);
  document.getElementById("batCancelBtn")?.addEventListener("click", closeAddTaskModal);
  document.getElementById("batCreateBtn")?.addEventListener("click", () => createBoardTask(defaultStatus));

  document.querySelectorAll(".bat-prio-btn")
    .forEach(btn => btn.addEventListener("click", () => selectPriority(btn.dataset.prio)));

  setupContactDropdown();
  setupCategoryDropdown();
  setupSubtaskInput();
}

function setupCategoryDropdown() {
  const toggle   = document.getElementById("batCategoryToggle");
  const dropdown = document.getElementById("batCategoryDropdown");
  toggle?.addEventListener("click", e => { e.stopPropagation(); dropdown.hidden = !dropdown.hidden; });

  dropdown?.querySelectorAll(".bat-category-option").forEach(opt => {
    opt.addEventListener("click", () => {
      document.getElementById("batCategoryDisplay").textContent = opt.dataset.value;
      dropdown.querySelectorAll(".bat-category-option").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      dropdown.hidden = true;
      document.getElementById("batCategoryError").hidden = true;
    });
  });

  const closeOutside = e => {
    const el = document.getElementById("batCategoryDropdown");
    if (!el) { document.removeEventListener("click", closeOutside); return; }
    if (!e.target.closest('[data-dropdown="category"]')) el.hidden = true;
  };
  document.addEventListener("click", closeOutside);
}

function setupContactDropdown() {
  const toggle   = document.getElementById("batAssignedToggle");
  const dropdown = document.getElementById("batAssignedDropdown");
  toggle?.addEventListener("click", e => { e.stopPropagation(); dropdown.hidden = !dropdown.hidden; });
  dropdown?.querySelectorAll(".bat-contact-check").forEach(cb =>
    cb.addEventListener("change", updateAvatars));

  document.getElementById("batAssignedSearch")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    dropdown.querySelectorAll(".bat-contact-option").forEach(opt => {
      opt.style.display = opt.querySelector(".bat-contact-name-wrap span:last-child")
        ?.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  const closeOutside = e => {
    const el = document.getElementById("batAssignedDropdown");
    if (!el) { document.removeEventListener("click", closeOutside); return; }
    if (!e.target.closest('[data-dropdown="contacts"]')) el.hidden = true;
  };
  document.addEventListener("click", closeOutside);
}

function setupSubtaskInput() {
  const input  = document.getElementById("batSubtaskInput");
  const list   = document.getElementById("batSubtaskList");
  const wrap   = input?.parentElement;
  const icons  = wrap?.querySelector(".bat-subtask-input-icons");

  const setEmpty  = () => { icons?.classList.add("is-empty");  icons?.classList.remove("is-typing"); };
  const setTyping = () => { icons?.classList.remove("is-empty"); icons?.classList.add("is-typing"); };

  const addItem = () => {
    const text = input?.value.trim();
    if (!text || !list) return;
    const li = document.createElement("li");
    li.className = "bat-subtask-item";
    li.dataset.origIdx = "-1";
    li.innerHTML = `
      <span class="bat-subtask-text">• ${escapeHtml(text)}</span>
      <div class="bat-subtask-actions">
        <button type="button" class="bat-subtask-action-btn" data-action="delete"><img src="../assets/icons/board/subtasks/delete.svg" alt="del" width="16" height="16"></button>
      </div>`;
    list.appendChild(li);
    input.value = "";
    setEmpty();
    input.focus();
  };

  input?.addEventListener("input",   () => input.value.length ? setTyping() : setEmpty());
  icons?.querySelector(".bat-si-plus")?.addEventListener("click",    () => input?.value.trim() ? addItem() : input?.focus());
  icons?.querySelector(".bat-si-clear")?.addEventListener("click",   () => { if(input) input.value = ""; setEmpty(); input?.focus(); });
  icons?.querySelector(".bat-si-confirm")?.addEventListener("click", addItem);
  input?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } });
  list?.addEventListener("click",    e => {
    if (e.target.closest("[data-action='delete']")) e.target.closest(".bat-subtask-item")?.remove();
  });
}

function updateAvatars() {
  const scope = document.getElementById("boardAddTaskModalContent");
  if (!scope) return;
  const container = scope.querySelector("#batSelectedAvatars");
  if (!container) return;
  container.innerHTML = [...scope.querySelectorAll(".bat-contact-check:checked")].map(cb => {
    const c = state.contacts.find(x => x.name === cb.value);
    return `<span class="board-avatar" style="background-color:${c?.color || getAvatarColor(cb.value)}"
      title="${cb.value}">${getInitials(cb.value)}</span>`;
  }).join("");
}


// ── Create task ────────────────────────────────────────────────────────────

function validateForm() {
  const title    = document.getElementById("batTitle")?.value.trim();
  const dueDate  = document.getElementById("batDueDate")?.value;
  const category = document.querySelector(".bat-category-option.selected")?.dataset.value || "";
  let valid = true;

  document.getElementById("batTitleError").hidden    = !!title;    if (!title)    valid = false;
  document.getElementById("batDueDateError").hidden  = !!dueDate;  if (!dueDate)  valid = false;
  document.getElementById("batCategoryError").hidden = !!category; if (!category) valid = false;
  return valid;
}

async function createBoardTask(defaultStatus) {
  if (!validateForm()) return;

  const scope = document.getElementById("boardAddTaskModalContent") || document;

  const category = document.querySelector(".bat-category-option.selected")?.dataset.value || "";

  const taskData = {
    title:       document.getElementById("batTitle").value.trim(),
    description: document.getElementById("batDescription")?.value.trim() || "",
    dueDate:     document.getElementById("batDueDate").value,
    priority:    getActivePriority(),
    type:        category,
    category,
    assignedTo:  [...scope.querySelectorAll(".bat-contact-check:checked")].map(cb => cb.value),
    subtasks:    [...scope.querySelectorAll("#batSubtaskList .bat-subtask-text")]
                   .map(el => ({ title: el.textContent.replace("•", "").trim(), done: false })),
    status: defaultStatus,
  };

  try {
    const id = await createTaskInFirestore(taskData);
    state.tasks.push({ id, ...taskData });
    closeAddTaskModal();
    callbacks.renderBoard?.();
    showTaskAddedNotice();
  } catch (err) {
    console.error("Fehler beim Erstellen:", err);
  }
}

function showTaskAddedNotice() {
  const notice = document.getElementById("boardTaskAddedNotice");
  if (!notice) return;

  window.clearTimeout(taskAddedNoticeTimer);
  notice.classList.add("show");

  taskAddedNoticeTimer = window.setTimeout(() => {
    notice.classList.remove("show");
  }, 2200);
}
