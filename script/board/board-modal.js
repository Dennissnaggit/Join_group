import { state, callbacks } from "./board-state.js";
import { deleteTaskFromFirestore, updateTaskInFirestore } from "./board-firestore.js";
import {
  getInitials, getAvatarColor,
  getPriorityLabel, getOverlayPriorityIcon, formatDisplayDate,
  escapeHtml, deleteIcon, editIcon,
  buildPriorityButtons, selectPriority, getActivePriority,
} from "./board-helpers.js";

// ── Checkbox icon helper ─────────────────────────────────────────────────────

const checkboxImg = done =>
  `<img src="../assets/icons/board/${done ? "check_btn_marked" : "check_btn_open"}.svg"
        class="board-modal-check-icon" alt="">`;

const subtaskEditActions = changed => changed
  ? `<button type="button" class="board-modal-subtask-btn" data-action="cancel" title="Abbrechen">&#x2715;</button>
     <span class="board-modal-subtask-sep"></span>
     <button type="button" class="board-modal-subtask-btn" data-action="save"   title="Speichern">&#x2713;</button>`
  : `<button type="button" class="board-modal-subtask-btn" data-action="delete" title="Löschen">${deleteIcon()}</button>
     <span class="board-modal-subtask-sep"></span>
     <button type="button" class="board-modal-subtask-btn" data-action="save"   title="Speichern">&#x2713;</button>`;


// ── Task Detail Overlay ────────────────────────────────────────────────────

/** Registers the backdrop-click close handler on the task detail overlay. */
export function setupBoardTaskOverlay() {
  const overlay = document.getElementById("boardTaskOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.addEventListener("click", e => {
    if (e.target.id === "boardTaskOverlay") closeTaskOverlay();
  });
}

/** Opens the task detail overlay for the given task ID. */
export function openTaskOverlay(taskId) {
  const task    = state.tasks.find(t => t.id === taskId);
  const overlay = document.getElementById("boardTaskOverlay");
  const content = document.getElementById("boardTaskModalContent");
  if (!task || !overlay || !content) return;

  content.innerHTML = buildDetailHTML(task);
  overlay.classList.add("is-open");
  document.body.classList.add("board-no-scroll");

  document.getElementById("boardTaskOverlayClose")
    ?.addEventListener("click", closeTaskOverlay);
  document.getElementById("boardTaskDelete")
    ?.addEventListener("click", () => deleteBoardTask(task.id));
  document.getElementById("boardTaskEdit")
    ?.addEventListener("click", () => openEditMode(task));
  setupSubtaskToggle(task);
}

/** Closes and resets the task detail overlay. */
export function closeTaskOverlay() {
  document.getElementById("boardTaskOverlay")?.classList.remove("is-open");
  document.getElementById("boardTaskModalContent")?.classList.remove("board-task-modal--wide");
  document.body.classList.remove("board-no-scroll");
}

async function deleteBoardTask(taskId) {
  try {
    await deleteTaskFromFirestore(taskId);
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    closeTaskOverlay();
    callbacks.renderBoard?.();
  } catch (err) {
    console.error("Task konnte nicht gelöscht werden:", err);
  }
}

function buildDetailHTML(task) {
  const typeClass = task.type === "Technical Task" ? "technical-task" : "user-story";
  return `
    <div class="board-modal-head">
      <span class="board-task-type ${typeClass}">${task.type}</span>
      <button id="boardTaskOverlayClose" class="board-modal-close" type="button">&times;</button>
    </div>
    <h3 class="board-modal-title">${task.title}</h3>
    <p class="board-modal-description">${task.description}</p>
    <div class="board-modal-row">
      <span class="board-modal-label">Due date:</span>
      <span>${formatDisplayDate(task.dueDate)}</span>
    </div>
    <div class="board-modal-row">
      <span class="board-modal-label">Priority:</span>
      <span class="board-modal-priority">${getPriorityLabel(task.priority)} ${getOverlayPriorityIcon(task.priority)}</span>
    </div>
    <div class="board-modal-section">
      <p class="board-modal-label">Assigned To:</p>
      <ul class="board-modal-user-list">${buildUsersHtml(task.assignedTo)}</ul>
    </div>
    <div class="board-modal-section">
      <p class="board-modal-label">Subtasks</p>
      <ul class="board-modal-subtask-list">${buildSubtasksHtml(task.subtasks)}</ul>
    </div>
    <div class="board-modal-actions">
      <button id="boardTaskDelete" type="button" class="board-modal-action-btn">${deleteIcon()} <span>Delete</span></button>
      <span class="board-modal-action-divider"></span>
      <button id="boardTaskEdit"   type="button" class="board-modal-action-btn">${editIcon()}   <span>Edit</span></button>
    </div>`;
}

function buildUsersHtml(assignedTo) {
  if (!assignedTo?.length) return "<li>Not assigned</li>";
  return assignedTo.map(user => {
    const contact = state.contacts.find(c => c.name === user);
    const color = contact?.color || getAvatarColor(user);
    return `
    <li class="board-modal-user-item">
      <span class="board-avatar" style="background-color:${color}">${getInitials(user)}</span>
      <span>${user}</span>
    </li>`;
  }).join("");
}

function buildSubtasksHtml(subtasks) {
  if (!subtasks?.length) return `<li class="board-modal-no-subtasks">No subtasks</li>`;
  return subtasks.map((s, i) => `
    <li class="board-modal-subtask-item" data-index="${i}">
      <button type="button" class="board-modal-check-btn" data-action="toggle">${checkboxImg(s.done)}</button>
      <span class="board-modal-subtask-title">${escapeHtml(s.title)}</span>
    </li>`).join("");
}

function setupSubtaskToggle(task) {
  const list = document.querySelector(".board-modal-subtask-list");
  if (!list) return;

  list.addEventListener("click", e => {
    const item   = e.target.closest("[data-index]");
    if (!item) return;
    const idx    = parseInt(item.dataset.index, 10);
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "toggle") subtaskToggleDone(item, task, idx);
  });
}

function subtaskToggleDone(item, task, idx) {
  task.subtasks[idx].done = !task.subtasks[idx].done;
  item.querySelector(".board-modal-check-icon").src =
    `../assets/icons/board/${task.subtasks[idx].done ? "check_btn_marked" : "check_btn_open"}.svg`;
  updateTaskInFirestore(task.id, { subtasks: task.subtasks }).catch(console.error);
  const st = state.tasks.find(t => t.id === task.id);
  if (st) st.subtasks = task.subtasks;
  callbacks.renderBoard?.();
}

function subtaskEnterEdit(item, task, idx) {
  const titleEl   = item.querySelector(".board-modal-subtask-title");
  const actionsEl = item.querySelector(".board-modal-subtask-actions");
  const original  = task.subtasks[idx].title;

  const input = document.createElement("input");
  input.type  = "text";
  input.className = "board-modal-subtask-input";
  input.value = original;
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  actionsEl.innerHTML = subtaskEditActions(false);
  item.classList.add("is-editing");

  input.addEventListener("input", () => {
    actionsEl.innerHTML = subtaskEditActions(input.value.trim() !== original);
  });
}

function subtaskSave(item, task, idx) {
  const input = item.querySelector(".board-modal-subtask-input");
  if (!input) return;
  const val = input.value.trim();
  if (val) task.subtasks[idx].title = val;
  subtaskExitEdit(item, task, idx);
  updateTaskInFirestore(task.id, { subtasks: task.subtasks }).catch(console.error);
  const st = state.tasks.find(t => t.id === task.id);
  if (st) st.subtasks = task.subtasks;
}

function subtaskExitEdit(item, task, idx) {
  const input     = item.querySelector(".board-modal-subtask-input");
  const actionsEl = item.querySelector(".board-modal-subtask-actions");
  if (!input) return;
  const span = document.createElement("span");
  span.className   = "board-modal-subtask-title";
  span.textContent = task.subtasks[idx].title;
  input.replaceWith(span);
  actionsEl.innerHTML = `
    <button type="button" class="board-modal-subtask-btn" data-action="edit"   title="Bearbeiten">${editIcon()}</button>
    <span class="board-modal-subtask-sep"></span>
    <button type="button" class="board-modal-subtask-btn" data-action="delete" title="Löschen">${deleteIcon()}</button>`;
  item.classList.remove("is-editing");
}

function subtaskDelete(list, task, idx) {
  task.subtasks.splice(idx, 1);
  list.innerHTML = buildSubtasksHtml(task.subtasks);
  updateTaskInFirestore(task.id, { subtasks: task.subtasks }).catch(console.error);
  const st = state.tasks.find(t => t.id === task.id);
  if (st) st.subtasks = task.subtasks;
  callbacks.renderBoard?.();
}


// ── Edit Form ──────────────────────────────────────────────────────────────

/** Replaces the modal content with the two-column edit form for the given task. */
export function openEditMode(task) {
  const content = document.getElementById("boardTaskModalContent");
  if (!content) return;

  // Switch modal to wide layout (same width as Add Task modal)
  content.classList.add("board-task-modal--wide");
  content.innerHTML = buildEditHTML(task);
  setupEditListeners(task);
}

function buildEditHTML(task) {
  return `
    <div class="bat-header">
      <h2 class="bat-title">Edit Task</h2>
      <button id="boardTaskOverlayClose" class="board-modal-close" type="button">&times;</button>
    </div>
    <div class="bat-body">
      <div class="bat-left">
        <div class="bat-field">
          <label class="bat-label">Title<span class="bat-required">*</span></label>
          <input id="editTitle" class="bat-input" type="text" value="${escapeHtml(task.title)}">
        </div>
        <div class="bat-field bat-field--grow">
          <label class="bat-label">Description</label>
          <textarea id="editDescription" class="bat-input bat-textarea">${escapeHtml(task.description)}</textarea>
        </div>
        <div class="bat-field">
          <label class="bat-label">Due date<span class="bat-required">*</span></label>
          <input id="editDueDate" class="bat-input" type="date" value="${task.dueDate}">
        </div>
      </div>
      <div class="bat-divider" aria-hidden="true"></div>
      <div class="bat-right">
        <div class="bat-field">
          <span class="bat-label">Priority</span>
          ${buildPriorityButtons(task.priority)}
        </div>
        <div class="bat-field bat-assigned-field">
          <label class="bat-label">Assigned to</label>
          <div class="bat-dropdown-wrapper">
            <div id="batAssignedToggle" class="bat-input bat-dropdown-toggle">
              <span>Select contacts to assign</span><span class="bat-dropdown-arrow">▾</span>
            </div>
            <div id="batAssignedDropdown" class="bat-dropdown" hidden>
              ${buildContactCheckboxes(task.assignedTo)}
            </div>
          </div>
          <div id="batSelectedAvatars" class="bat-selected-avatars"></div>
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
          <ul id="batSubtaskList" class="bat-subtask-list">${buildSubtaskItems(task.subtasks)}</ul>
        </div>
      </div>
    </div>
    <div class="bat-footer">
      <p class="bat-required-hint"><span class="bat-required">*</span>This field is required</p>
      <div class="bat-actions">
        <button type="button" id="editCancelBtn" class="bat-btn-cancel">Cancel &#x2715;</button>
        <button type="button" id="editSaveBtn" class="bat-btn-create">
          Save <img src="../assets/icons/board/subtasks/check_white.svg" alt="save" width="24" height="24" style="vertical-align:middle;margin-left:4px; color: white">
        </button>
      </div>
    </div>`;
}

function buildContactCheckboxes(assignedTo) {
  if (!state.contacts.length) {
    return `<p class="bat-no-contacts">No contacts available</p>`;
  }
  return state.contacts.map(c => `
    <label class="bat-contact-option">
      <div class="bat-contact-name-wrap">
        <span class="board-avatar" style="background-color:${c.color || getAvatarColor(c.name)}">${
          getInitials(c.name)}</span>
        <span>${c.name}</span>
      </div>
      <input type="checkbox" value="${c.name}" class="bat-contact-check"
        ${(assignedTo || []).includes(c.name) ? "checked" : ""}>
    </label>`).join("");
}

function buildSubtaskItems(subtasks) {
  return (subtasks || []).map((s, i) => batSubtaskItemHTML(s.title, i)).join("");
}

function batSubtaskItemHTML(title, idx) {
  return `
    <li class="bat-subtask-item" data-orig-idx="${idx}">
      <span class="bat-subtask-text">• ${escapeHtml(title)}</span>
      <div class="bat-subtask-actions">
        <button type="button" class="bat-subtask-action-btn" data-action="edit"><img src="../assets/icons/board/subtasks/edit.svg" alt="edit" width="16" height="16"></button>
        <span class="bat-subtask-action-sep"></span>
        <button type="button" class="bat-subtask-action-btn" data-action="delete"><img src="../assets/icons/board/subtasks/delete.svg" alt="delete" width="16" height="16"></button>
      </div>
    </li>`;
}

function setupEditListeners(task) {
  document.getElementById("boardTaskOverlayClose")?.addEventListener("click", closeTaskOverlay);
  document.getElementById("editCancelBtn")?.addEventListener("click", closeTaskOverlay);
  document.getElementById("editSaveBtn")?.addEventListener("click", () => saveTaskEdit(task.id));

  document.getElementById("batAssignedSearch")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    document.getElementById("batAssignedDropdown")
      ?.querySelectorAll(".bat-contact-option").forEach(opt => {
        opt.style.display = opt.querySelector(".bat-contact-name-wrap span:last-child")
          ?.textContent.toLowerCase().includes(q) ? "" : "none";
      });
  });

  document.querySelectorAll(".bat-prio-btn")
    .forEach(btn => btn.addEventListener("click", () => selectPriority(btn.dataset.prio)));

  setupDropdown("batAssignedToggle", "batAssignedDropdown", updateSelectedAvatars);
  setupSubtaskInput("batSubtaskInput", "batSubtaskAdd", "batSubtaskList");
  updateSelectedAvatars();
}

function setupDropdown(toggleId, dropdownId, onChange) {
  const toggle   = document.getElementById(toggleId);
  const dropdown = document.getElementById(dropdownId);
  toggle?.addEventListener("click", e => { e.stopPropagation(); dropdown.hidden = !dropdown.hidden; });
  dropdown?.querySelectorAll(".bat-contact-check").forEach(cb => cb.addEventListener("change", onChange));

  const closeOutside = e => {
    const el = document.getElementById(dropdownId);
    if (!el) { document.removeEventListener("click", closeOutside); return; }
    if (!e.target.closest(".bat-dropdown-wrapper")) el.hidden = true;
  };
  document.addEventListener("click", closeOutside);
}

function setupSubtaskInput(inputId, addBtnId, listId) {
  const input  = document.getElementById(inputId);
  const list   = document.getElementById(listId);
  const icons  = input?.parentElement?.querySelector(".bat-subtask-input-icons");

  const setEmpty  = () => { icons?.classList.add("is-empty");   icons?.classList.remove("is-typing"); };
  const setTyping = () => { icons?.classList.remove("is-empty"); icons?.classList.add("is-typing"); };

  const addItem = () => {
    const text = input?.value.trim();
    if (!text || !list) return;
    const tpl = document.createElement("template");
    tpl.innerHTML = batSubtaskItemHTML(text, -1);
    const li = tpl.content.firstElementChild;
    if (li) list.appendChild(li);
    input.value = "";
    setEmpty();
    input.focus();
  };

  input?.addEventListener("input",   () => input.value.length ? setTyping() : setEmpty());
  icons?.querySelector(".bat-si-plus")?.addEventListener("click",    () => input?.value.trim() ? addItem() : input?.focus());
  icons?.querySelector(".bat-si-clear")?.addEventListener("click",   () => { if(input) input.value = ""; setEmpty(); input?.focus(); });
  icons?.querySelector(".bat-si-confirm")?.addEventListener("click", addItem);
  input?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } });

  list?.addEventListener("click", e => {
    const btn  = e.target.closest("[data-action]");
    const item = e.target.closest(".bat-subtask-item");
    if (!btn || !item) return;
    const action = btn.dataset.action;
    if (action === "edit")   batEditSubtask(item);
    if (action === "delete") item.remove();
    if (action === "save")   batSaveSubtask(item);
    if (action === "cancel") batCancelSubtask(item);
  });

  list?.addEventListener("dblclick", e => {
    const span = e.target.closest(".bat-subtask-text");
    if (span) batEditSubtask(span.closest(".bat-subtask-item"));
  });
}

function batEditSubtask(item) {
  if (item.classList.contains("is-editing")) return;

  // Close any other open edit in the same list first
  const list = item.closest(".bat-subtask-list");
  list?.querySelectorAll(".bat-subtask-item.is-editing").forEach(other => {
    if (other !== item) batSaveSubtask(other);
  });

  const span    = item.querySelector(".bat-subtask-text");
  const actions = item.querySelector(".bat-subtask-actions");
  const original = span.textContent.replace(/^•\s*/, "").trim();

  const input = document.createElement("input");
  input.type         = "text";
  input.className    = "bat-subtask-edit-input";
  input.value        = original;
  input.defaultValue = original;
  span.replaceWith(input);
  input.focus();
  input.select();

  actions.innerHTML = batSubtaskEditActions(false);
  item.classList.add("is-editing");

  input.addEventListener("input", () => {
    actions.innerHTML = batSubtaskEditActions(input.value.trim() !== original);
  });
}

function batSubtaskEditActions(changed) {
  if (changed) {
    return `<button type="button" class="bat-subtask-action-btn" data-action="cancel"><img src="../assets/icons/board/subtasks/close.svg" alt="cancel" width="16" height="16"></button>
            <span class="bat-subtask-action-sep"></span>
            <button type="button" class="bat-subtask-action-btn" data-action="save"><img src="../assets/icons/board/subtasks/mark.svg" alt="save" width="16" height="16"></button>`;
  }
  return `<button type="button" class="bat-subtask-action-btn" data-action="delete"><img src="../assets/icons/board/subtasks/delete.svg" alt="delete" width="16" height="16"></button>
          <span class="bat-subtask-action-sep"></span>
          <button type="button" class="bat-subtask-action-btn" data-action="save"><img src="../assets/icons/board/subtasks/mark.svg" alt="save" width="16" height="16"></button>`;
}

function batSaveSubtask(item) {
  const input   = item.querySelector(".bat-subtask-edit-input");
  const actions = item.querySelector(".bat-subtask-actions");
  if (!input) return;
  const val = input.value.trim() || input.value;
  const span = document.createElement("span");
  span.className   = "bat-subtask-text";
  span.textContent = "• " + val;
  input.replaceWith(span);
  actions.innerHTML = `
    <button type="button" class="bat-subtask-action-btn" data-action="edit"><img src="../assets/icons/board/subtasks/edit.svg" alt="edit" width="16" height="16"></button>
    <span class="bat-subtask-action-sep"></span>
    <button type="button" class="bat-subtask-action-btn" data-action="delete"><img src="../assets/icons/board/subtasks/delete.svg" alt="delete" width="16" height="16"></button>`;
  item.classList.remove("is-editing");
}

function batCancelSubtask(item) {
  const input   = item.querySelector(".bat-subtask-edit-input");
  const actions = item.querySelector(".bat-subtask-actions");
  if (!input) return;
  const span = document.createElement("span");
  span.className   = "bat-subtask-text";
  span.textContent = "• " + (input.defaultValue ?? input.value);
  input.replaceWith(span);
  actions.innerHTML = `
    <button type="button" class="bat-subtask-action-btn" data-action="edit"><img src="../assets/icons/board/subtasks/edit.svg" alt="edit" width="16" height="16"></button>
    <span class="bat-subtask-action-sep"></span>
    <button type="button" class="bat-subtask-action-btn" data-action="delete"><img src="../assets/icons/board/subtasks/delete.svg" alt="delete" width="16" height="16"></button>`;
  item.classList.remove("is-editing");
}

function updateSelectedAvatars() {
  const scope = document.getElementById("boardTaskModalContent");
  if (!scope) return;
  const container = scope.querySelector("#batSelectedAvatars");
  if (!container) return;
  container.innerHTML = [...scope.querySelectorAll(".bat-contact-check:checked")].map(cb => {
    const c = state.contacts.find(x => x.name === cb.value);
    return `<span class="board-avatar" style="background-color:${c?.color || getAvatarColor(cb.value)}"
      title="${cb.value}">${getInitials(cb.value)}</span>`;
  }).join("");
}

async function saveTaskEdit(taskId) {
  const title = document.getElementById("editTitle")?.value.trim();
  if (!title) return;

  const scope = document.getElementById("boardTaskModalContent") || document;

  const updates = {
    title,
    description: document.getElementById("editDescription")?.value.trim() || "",
    dueDate:     document.getElementById("editDueDate")?.value || "",
    priority:    getActivePriority(),
    assignedTo:  [...scope.querySelectorAll(".bat-contact-check:checked")].map(cb => cb.value),
    subtasks:    [...scope.querySelectorAll("#batSubtaskList .bat-subtask-text")]
                   .map(el => ({ title: el.textContent.replace(/^•\s*/, "").trim(), done: false })),
  };

  try {
    await updateTaskInFirestore(taskId, updates);
    const task = state.tasks.find(t => t.id === taskId);
    if (task) Object.assign(task, updates);
    closeTaskOverlay();
    callbacks.renderBoard?.();
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
  }
}
