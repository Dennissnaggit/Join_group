import { state, callbacks } from "./board-state.js";
import { createTaskInFirestore } from "./board-firestore.js";
import {
  getInitials, getAvatarColor, escapeHtml,
  buildPriorityButtons, selectPriority, getActivePriority, isValidDateInput,
} from "./board-helpers.js";

let taskAddedNoticeTimer;
let closeDropdownsOnOutsideClick;


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
  const status = ["todo", "in-progress", "await-feedback", "done"].includes(defaultStatus)
    ? defaultStatus
    : "todo";
  window.location.href = `./add_task.html?status=${encodeURIComponent(status)}`;
}

/** Closes the add-task modal. */
export function closeAddTaskModal() {
  document.getElementById("boardAddTaskOverlay")?.classList.remove("is-open");
  document.body.classList.remove("board-no-scroll");
  document.removeEventListener("click", closeDropdownsOnOutsideClick);
  closeDropdownsOnOutsideClick = null;
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
    <p id="batFormError" class="bat-error" role="alert" hidden></p>
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
          <div id="batAssignedToggle" class="bat-input bat-dropdown-toggle" role="button" tabindex="0" aria-expanded="false">
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
          <div id="batCategoryToggle" class="bat-input bat-dropdown-toggle" role="button" tabindex="0" aria-expanded="false">
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
  setupDropdownOutsideHandler();
  setupSubtaskInput();
  setupAddTaskValidation();
}

function setupCategoryDropdown() {
  const toggle   = document.getElementById("batCategoryToggle");
  const dropdown = document.getElementById("batCategoryDropdown");
  toggle?.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
    toggle.setAttribute("aria-expanded", String(!dropdown.hidden));
  });
  toggle?.addEventListener("keydown", handleDropdownKeydown);

  dropdown?.querySelectorAll(".bat-category-option").forEach(opt => {
    opt.addEventListener("click", () => {
      document.getElementById("batCategoryDisplay").textContent = opt.dataset.value;
      dropdown.querySelectorAll(".bat-category-option").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      dropdown.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
      clearFieldError(toggle, document.getElementById("batCategoryError"));
    });
  });

}

function setupContactDropdown() {
  const toggle   = document.getElementById("batAssignedToggle");
  const dropdown = document.getElementById("batAssignedDropdown");
  toggle?.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
    toggle.setAttribute("aria-expanded", String(!dropdown.hidden));
  });
  toggle?.addEventListener("keydown", handleDropdownKeydown);
  dropdown?.querySelectorAll(".bat-contact-check").forEach(cb =>
    cb.addEventListener("change", updateAvatars));

  document.getElementById("batAssignedSearch")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    dropdown.querySelectorAll(".bat-contact-option").forEach(opt => {
      opt.style.display = opt.querySelector(".bat-contact-name-wrap span:last-child")
        ?.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

}

function setupDropdownOutsideHandler() {
  document.removeEventListener("click", closeDropdownsOnOutsideClick);
  closeDropdownsOnOutsideClick = event => {
    document.querySelectorAll(".bat-dropdown-wrapper").forEach(wrapper => {
      if (wrapper.contains(event.target)) return;
      wrapper.querySelector(".bat-dropdown").hidden = true;
      wrapper.querySelector(".bat-dropdown-toggle").setAttribute("aria-expanded", "false");
    });
  };
  document.addEventListener("click", closeDropdownsOnOutsideClick);
}

function handleDropdownKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  event.currentTarget.click();
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
        <button type="button" class="bat-subtask-action-btn" data-action="edit" aria-label="Edit subtask"><img src="../assets/icons/board/subtasks/edit.svg" alt="" width="16" height="16"></button>
        <span class="bat-subtask-action-sep"></span>
        <button type="button" class="bat-subtask-action-btn" data-action="delete" aria-label="Delete subtask"><img src="../assets/icons/board/subtasks/delete.svg" alt="" width="16" height="16"></button>
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
  list?.addEventListener("click", e => {
    const button = e.target.closest("[data-action]");
    const item = button?.closest(".bat-subtask-item");
    if (!button || !item) return;
    if (button.dataset.action === "delete") item.remove();
    if (button.dataset.action === "edit") editNewSubtask(item);
    if (button.dataset.action === "save") saveNewSubtask(item);
    if (button.dataset.action === "cancel") cancelNewSubtask(item);
  });

  list?.addEventListener("keydown", event => {
    if (!event.target.matches(".bat-subtask-edit-input")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      saveNewSubtask(event.target.closest(".bat-subtask-item"));
    }
    if (event.key === "Escape") cancelNewSubtask(event.target.closest(".bat-subtask-item"));
  });
}

function editNewSubtask(item) {
  const text = item.querySelector(".bat-subtask-text");
  const input = document.createElement("input");
  input.className = "bat-subtask-edit-input";
  input.value = text.textContent.replace(/^•\s*/, "");
  input.defaultValue = input.value;
  text.replaceWith(input);
  item.classList.add("is-editing");
  item.querySelector(".bat-subtask-actions").innerHTML = `
    <button type="button" class="bat-subtask-action-btn" data-action="cancel" aria-label="Cancel edit"><img src="../assets/icons/board/subtasks/close.svg" alt="" width="16" height="16"></button>
    <span class="bat-subtask-action-sep"></span>
    <button type="button" class="bat-subtask-action-btn" data-action="save" aria-label="Save subtask"><img src="../assets/icons/board/subtasks/mark.svg" alt="" width="16" height="16"></button>`;
  input.focus();
  input.select();
}

function saveNewSubtask(item) {
  const input = item.querySelector(".bat-subtask-edit-input");
  const title = input.value.trim();
  if (!title) {
    input.setCustomValidity("A subtask title is required.");
    input.reportValidity();
    return;
  }
  restoreNewSubtask(item, title);
}

function cancelNewSubtask(item) {
  const input = item.querySelector(".bat-subtask-edit-input");
  restoreNewSubtask(item, input.defaultValue);
}

function restoreNewSubtask(item, title) {
  const text = document.createElement("span");
  text.className = "bat-subtask-text";
  text.textContent = `• ${title}`;
  item.querySelector(".bat-subtask-edit-input").replaceWith(text);
  item.classList.remove("is-editing");
  item.querySelector(".bat-subtask-actions").innerHTML = `
    <button type="button" class="bat-subtask-action-btn" data-action="edit" aria-label="Edit subtask"><img src="../assets/icons/board/subtasks/edit.svg" alt="" width="16" height="16"></button>
    <span class="bat-subtask-action-sep"></span>
    <button type="button" class="bat-subtask-action-btn" data-action="delete" aria-label="Delete subtask"><img src="../assets/icons/board/subtasks/delete.svg" alt="" width="16" height="16"></button>`;
}

function getLocalDateValue(date = new Date()) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function setFieldError(field, error, message) {
  field?.setAttribute("aria-invalid", "true");
  if (error && field) field.setAttribute("aria-describedby", error.id);
  if (error) {
    error.textContent = message;
    error.hidden = false;
  }
}

function clearFieldError(field, error) {
  field?.removeAttribute("aria-invalid");
  field?.removeAttribute("aria-describedby");
  if (error) error.hidden = true;
}

function setupAddTaskValidation() {
  const title = document.getElementById("batTitle");
  const dueDate = document.getElementById("batDueDate");
  const category = document.getElementById("batCategoryToggle");
  dueDate.min = getLocalDateValue();
  title?.addEventListener("input", () => clearFieldError(title, document.getElementById("batTitleError")));
  dueDate?.addEventListener("change", () => clearFieldError(dueDate, document.getElementById("batDueDateError")));
  category?.addEventListener("click", () => clearFieldError(category, document.getElementById("batCategoryError")));
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
  const titleField = document.getElementById("batTitle");
  const dueDateField = document.getElementById("batDueDate");
  const categoryField = document.getElementById("batCategoryToggle");
  const title = titleField?.value.trim() || "";
  const dueDate = dueDateField?.value || "";
  const category = document.querySelector(".bat-category-option.selected")?.dataset.value || "";
  const isDateValid = isValidDateInput(dueDate, getLocalDateValue());

  if (!title) setFieldError(titleField, document.getElementById("batTitleError"), "This field is required.");
  if (title) clearFieldError(titleField, document.getElementById("batTitleError"));
  if (!isDateValid) setFieldError(dueDateField, document.getElementById("batDueDateError"), "Please choose a valid current or future date.");
  if (isDateValid) clearFieldError(dueDateField, document.getElementById("batDueDateError"));
  if (!category) setFieldError(categoryField, document.getElementById("batCategoryError"), "This field is required.");
  if (category) clearFieldError(categoryField, document.getElementById("batCategoryError"));
  const firstInvalidField = !title ? titleField : !isDateValid ? dueDateField : !category ? categoryField : null;
  firstInvalidField?.focus();
  return Boolean(title && isDateValid && category);
}

async function createBoardTask(defaultStatus) {
  document.getElementById("batFormError").hidden = true;
  if (!validateForm()) return;

  const scope = document.getElementById("boardAddTaskModalContent") || document;
  const blankSubtask = scope.querySelector("#batSubtaskList .bat-subtask-edit-input")
    && [...scope.querySelectorAll("#batSubtaskList .bat-subtask-edit-input")]
      .find(input => !input.value.trim());
  if (blankSubtask) {
    blankSubtask.setCustomValidity("A subtask title is required.");
    blankSubtask.reportValidity();
    blankSubtask.focus();
    return;
  }

  const category = document.querySelector(".bat-category-option.selected")?.dataset.value || "";

  const taskData = {
    title:       document.getElementById("batTitle").value.trim(),
    description: document.getElementById("batDescription")?.value.trim() || "",
    dueDate:     document.getElementById("batDueDate").value,
    priority:    getActivePriority(),
    type:        category,
    category,
    assignedTo:  [...scope.querySelectorAll(".bat-contact-check:checked")].map(cb => cb.value),
    subtasks:    [...scope.querySelectorAll("#batSubtaskList .bat-subtask-item")]
                   .map(item => {
                     const field = item.querySelector(".bat-subtask-text, .bat-subtask-edit-input");
                     return { title: (field.value ?? field.textContent).replace(/^•\s*/, "").trim(), done: false };
                   }),
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
    const error = document.getElementById("batFormError");
    if (error) {
      error.textContent = "The task could not be saved. Please try again.";
      error.hidden = false;
    }
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
