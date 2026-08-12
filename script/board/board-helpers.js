/** Returns initials (max 2 chars) from a full name. */
export function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Returns a deterministic color based on the name string. */
export function getAvatarColor(name) {
  const colors = ["#ff7a00", "#2fd7c4", "#5a42b2", "#ff5eb3", "#6e52ff", "#00bee8", "#1fd7c1", "#ffbb2b"];
  let hash = 0;
  const value = String(name || "");
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Returns the human-readable label for a priority key. */
export function getPriorityLabel(priority) {
  return { urgent: "Urgent", medium: "Medium", low: "Low" }[priority] || "Medium";
}

/** Returns the icon image path for a priority key. */
export function getPriorityIconPath(priority) {
  const map = {
    urgent: "../assets/icons/board/high.png",
    medium: "../assets/icons/board/medium.png",
    low:    "../assets/icons/board/low.png",
  };
  return map[priority] || map.medium;
}

/** Formats an ISO date string to DD/MM/YYYY. */
export function formatDisplayDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB");
}

/** Escapes HTML special characters to prevent XSS. */
export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Returns an SVG priority icon for the task detail overlay. */
export function getOverlayPriorityIcon(priority) {
  const icons = {
    urgent: `<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 11l6-6 6 6" fill="none" stroke="#FF3D00" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 16l6-6 6 6" fill="none" stroke="#FF3D00" stroke-width="2" stroke-linecap="round"/></svg>`,
    medium: `<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 8h12" fill="none" stroke="#FFA800" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 12h12" fill="none" stroke="#FFA800" stroke-width="2" stroke-linecap="round"/></svg>`,
    low:    `<svg class="board-modal-priority-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 9l6 6 6-6" fill="none" stroke="#7AE229" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 4l6 6 6-6" fill="none" stroke="#7AE229" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
  return icons[priority] || icons.medium;
}

/** SVG delete icon for the modal action bar. */
export function deleteIcon() {
  return `<svg class="board-modal-action-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 21c-.55 0-1.02-.2-1.41-.59C5.2 20.02 5 19.55 5 19V6h14v13c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H7Zm2-4h2V9H9v8Zm4 0h2V9h-2v8ZM5 4h4V3h6v1h4v2H5V4Z" fill="#2A3647"/>
  </svg>`;
}

/** SVG edit icon for the modal action bar. */
export function editIcon() {
  return `<svg class="board-modal-action-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1 1 0 0 0 0-1.42l-2.5-2.5a1 1 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-2.13Z" fill="#2A3647"/>
  </svg>`;
}

/** Builds the three priority toggle buttons HTML, marking the active one. */
export function buildPriorityButtons(activePrio) {
  const prios = [
    { id: "urgent", label: "Urgent", a: "prioUrgentActive", i: "prioUrgentNotActive" },
    { id: "medium", label: "Medium", a: "prioMedActive",    i: "prioMedNotActive"    },
    { id: "low",    label: "Low",    a: "prioLowActive",    i: "prioLowNotActive"    },
  ];
  const buttons = prios.map(p => {
    const active = activePrio === p.id ? "bat-prio-active" : "";
    const img    = activePrio === p.id ? p.a : p.i;
    return `<button type="button" class="bat-prio-btn bat-prio-${p.id} ${active}" data-prio="${p.id}">
      ${p.label} <img src="../assets/AdTask/${img}.png" alt="" class="bat-prio-img">
    </button>`;
  });
  return `<div class="bat-priority-group">${buttons.join("")}</div>`;
}

/** Toggles the active priority button and swaps the button images. */
export function selectPriority(prio) {
  const imgs = {
    urgent: { a: "prioUrgentActive", i: "prioUrgentNotActive" },
    medium: { a: "prioMedActive",    i: "prioMedNotActive"    },
    low:    { a: "prioLowActive",    i: "prioLowNotActive"    },
  };
  document.querySelectorAll(".bat-prio-btn").forEach(btn => {
    const p      = btn.dataset.prio;
    const active = p === prio;
    btn.classList.toggle("bat-prio-active", active);
    const img = btn.querySelector(".bat-prio-img");
    if (img) img.src = `../assets/AdTask/${active ? imgs[p].a : imgs[p].i}.png`;
  });
}

/** Reads and returns the currently active priority key from the DOM. */
export function getActivePriority() {
  return document.querySelector(".bat-prio-btn.bat-prio-active")?.dataset.prio || "medium";
}
