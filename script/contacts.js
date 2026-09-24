import { auth, db } from "./firebase.js";
import {
  ensureGuestContacts,
  isGuestSession,
  writeGuestList,
  GUEST_CONTACTS_KEY,
} from "./guest-data.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  createLetterDividerTemplate,
  createContactListItemTemplate,
  createContactDetailTemplate,
  createAddModalTemplate,
  createEditModalTemplate,
  createToastTemplate,
} from "./contacts_template.js";

import {
  initContactInputRestrictions,
  validateContactForm,
} from "./contacts_validation.js";

let contacts = [];
let currentUser = null;
export let currentSelectedContactId = null;

/**
 * Reads guest contacts from local storage.
 * @returns {Array} List of stored guest contacts.
 */
function readGuestContacts() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CONTACTS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * Saves guest contacts array to local storage.
 * @param {Array} list - The contacts list to store.
 */
function writeGuestContacts(list) {
  writeGuestList(GUEST_CONTACTS_KEY, list);
}

/**
 * Initializes contact module depending on session type.
 */
async function initContacts() {
  await init();
  if (isGuestSession()) {
    currentUser = null;
    await loadSharedContactsForGuest();
    renderContactList();
    return;
  }
  setupAuthListener();
}

/**
 * Sets up authentication state listener for logged-in users.
 */
function setupAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return console.error("No user logged in.");
    currentUser = user;
    await loadContacts();
    renderContactList();
  });
}

/**
 * Loads shared contacts data for guest session.
 */
async function loadSharedContactsForGuest() {
  ensureGuestContacts();
  contacts = readGuestContacts();
}

/**
 * Fetches user contacts collection from Firestore database.
 */
async function loadContacts() {
  if (!currentUser) return;
  try {
    const contactsRef = collection(db, "users", currentUser.uid, "contacts");
    const snapshot = await getDocs(contactsRef);
    contacts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading contacts:", error);
  }
}

/**
 * Sorts and renders contact list into UI container.
 */
function renderContactList() {
  let container = document.getElementById("contactsListContainer");
  if (!container) return;
  container.innerHTML = "";
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  buildListHTML(container);
}

/**
 * Iterates through contacts to build grouped list HTML.
 */
function buildListHTML(container) {
  let currentLetter = "";
  contacts.forEach((contact) => {
    let firstLetter = contact.name.charAt(0).toUpperCase();
    if (firstLetter !== currentLetter) {
      currentLetter = firstLetter;
      container.innerHTML += createLetterDividerTemplate(currentLetter);
    }
    let initials = getInitials(contact.name);
    container.innerHTML += createContactListItemTemplate(contact, initials);
  });
}

/**
 * Renders individual contact details into the container.
 */
function renderContactDetailView(contact) {
  const container = document.getElementById("contactDetailContainer");
  if (!container) return;

  const initials = getInitials(contact.name);
  container.innerHTML = createContactDetailTemplate(contact, initials);
}

/**
 * Displays contact details and toggles mobile controls.
 */
export function showContactDetails(id, event) {
  if (event) event.stopPropagation();
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  currentSelectedContactId = id;
  window.currentSelectedContactId = id;

  renderContactDetailView(contact);

  document.querySelector(".contacts-main-grid")?.classList.add("show-detail-active");
  document.querySelector(".contacts-sidebar-list")?.classList.add("d-none-mobile");
  document.querySelector(".contacts-detail-panel")?.classList.add("d-show-mobile");
  document.getElementById("mobileMenuBtn")?.classList.remove("d-none");
}

/**
 * Toggles mobile visibility between list and detail.
 */
export function toggleMobileDetailView(showDetail) {
  const sidebar = document.querySelector(".contacts-sidebar-list");
  const detailPanel = document.querySelector(".contacts-detail-panel");
  if (!sidebar || !detailPanel) return;

  if (showDetail && window.innerWidth <= 800) {
    sidebar.classList.add("d-none");
    detailPanel.classList.add("show-mobile");
  } else {
    sidebar.classList.remove("d-none");
    detailPanel.classList.remove("show-mobile");
  }
}

/**
 * Binds contact ID attributes to mobile action buttons.
 */
function bindMobileActionButtons(id) {
  let mobileEditBtn = document.querySelector(".action-btn-edit");
  let mobileDeleteBtn = document.querySelector(".action-btn-delete");
  if (mobileEditBtn) mobileEditBtn.setAttribute("data-id", id);
  if (mobileDeleteBtn) mobileDeleteBtn.setAttribute("data-id", id);

  let mobileMenu = document.getElementById("mobileActionMenu");
  if (mobileMenu) mobileMenu.classList.add("d-none");
}

/**
 * Highlights active contact item in sidebar list.
 */
function highlightActiveItem(id) {
  document.querySelectorAll(".contact-list-item").forEach((el) => {
    el.classList.remove("active");
  });
  let activeItem = document.getElementById(`item-${id}`);
  if (activeItem) activeItem.classList.add("active");
}

/**
 * Adjusts layout views for mobile screen sizes (<= 768px).
 */
function handleMobileViewToggle() {
  if (window.innerWidth <= 768) {
    document
      .querySelector(".contacts-main-grid")
      ?.classList.add("show-detail-active");
    document
      .querySelector(".contacts-sidebar-list")
      ?.classList.add("d-none-mobile");
    document
      .querySelector(".contacts-detail-panel")
      ?.classList.add("d-show-mobile");
    document.getElementById("mobileAddBtn")?.classList.add("d-none");
    document.getElementById("mobileMenuBtn")?.classList.remove("d-none");
  }
}

/**
 * Toggles visibility of mobile floating options menu.
 */
export function toggleMobileMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("mobileActionMenu");
  if (menu) {
    menu.classList.toggle("d-none");
  }
}
/**
 * Resets mobile view back to contacts list view.
 */
export function hideMobileDetail() {
  document.querySelector(".contacts-main-grid")?.classList.remove("show-detail-active");
  document.querySelector(".contacts-sidebar-list")?.classList.remove("d-none-mobile");
  document.querySelector(".contacts-detail-panel")?.classList.remove("d-show-mobile");
  document.getElementById("mobileMenuBtn")?.classList.add("d-none");
  closeMobileMenu();
}

function openAddContactModal() {
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  if (content) content.innerHTML = createAddModalTemplate();
  if (overlay) overlay.classList.remove("d-none");

  const { nameInput, emailInput, phoneInput } = getActiveModalInputs();
  initContactInputRestrictions(nameInput, emailInput, phoneInput);
}

/**
 * Extracts target ID from event or DOM element.
 */
function getTargetId(event, element) {
  if (typeof element === "string" || typeof element === "number")
    return String(element).trim();
  if (typeof event === "string" || typeof event === "number")
    return String(event).trim();
  let el = element || event?.currentTarget || event?.target;
  let target = el?.closest?.("[data-id]") || el;
  return target?.getAttribute?.("data-id") || null;
}

/**
 * Opens edit modal populated with selected contact data.
 */
function openEditModal(event, element) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  let targetId = getTargetId(event, element);
  let contact = contacts.find(
    (c) => String(c.id).trim() === String(targetId).trim()
  );
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");

  if (!contact || !overlay || !content) return;
  content.innerHTML = createEditModalTemplate(
    contact,
    getInitials(contact.name)
  );
  overlay.classList.remove("d-none");

  // Activa el bloqueo de letras en teléfono y números en nombre al editar:
  const { nameInput, emailInput, phoneInput } = getActiveModalInputs();
  initContactInputRestrictions(nameInput, emailInput, phoneInput);
}

/**
 * Closes contact modal overlay and clears content.
 */
function closeContactModal() {
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  if (overlay) overlay.classList.add("d-none");
  if (content) content.innerHTML = "";
}

/**
 * Helper to retrieve active modal inputs whether in Add or Edit mode.
 */
function getActiveModalInputs() {
  const nameInput = document.getElementById("contactName") || document.getElementById("modalName");
  const emailInput = document.getElementById("contactEmail") || document.getElementById("modalEmail");
  const phoneInput = document.getElementById("contactPhone") || document.getElementById("modalPhone");
  return { nameInput, emailInput, phoneInput };
}

/**
 * Constructs contact object from input fields.
 */
function createContactDataObj() {
  const { nameInput, emailInput, phoneInput } = getActiveModalInputs();
  return {
    id: `contact-${crypto.randomUUID()}`,
    name: nameInput ? nameInput.value.trim() : "",
    email: emailInput ? emailInput.value.trim() : "",
    phone: phoneInput ? phoneInput.value.trim() : "",
    color: getRandomColor(),
  };
}

async function saveNewContact(event) {
  if (event) event.preventDefault();

  const { nameInput, emailInput, phoneInput } = getActiveModalInputs();

  const isFormValid = validateContactForm(nameInput, emailInput, phoneInput);
  if (!isFormValid) {
    console.warn("Validation failed: Please check highlighted fields.");
    return;
  }

  const newContact = createContactDataObj();

  if (!currentUser && isGuestSession()) {
    contacts.push(newContact);
    writeGuestContacts(contacts);
    executePostSaveActions();
    return;
  }

  if (!currentUser) return console.error("No user logged in.");

  await saveContactToFirestore(newContact);
  executePostSaveActions();
}

/**
 * Generates random hexadecimal color string.
 */
function getRandomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

/**
 * Executes UI updates after saving a contact.
 */
function executePostSaveActions() {
  closeContactModal();
  renderContactList();
  showContactCreatedSuccess();
}

/**
 * Handles updating contact process.
 */
async function updateContact(event, id) {
  event.preventDefault();
  let contact = contacts.find((c) => String(c.id) === String(id));
  if (!contact) return;
  const updatedData = getModalFormData();
  if (!currentUser && isGuestSession()) {
    return handleGuestUpdate(contact, updatedData, id);
  }
  if (currentUser) await handleFirestoreUpdate(contact, updatedData, id);
}

/**
 * Reads form data values from modal input fields.
 */
function getModalFormData() {
  return {
    name: document.getElementById("modalName").value.trim(),
    email: document.getElementById("modalEmail").value.trim(),
    phone: document.getElementById("modalPhone").value.trim(),
  };
}

/**
 * Handles update operation for guest session.
 */
function handleGuestUpdate(contact, updatedData, id) {
  Object.assign(contact, updatedData);
  writeGuestContacts(contacts);
  finalizeUpdate(id);
}

/**
 * Updates existing contact document in Firestore.
 */
async function handleFirestoreUpdate(contact, updatedData, id) {
  try {
    const contactRef = doc(db, "users", currentUser.uid, "contacts", id);
    await updateDoc(contactRef, updatedData);
    Object.assign(contact, updatedData);
    finalizeUpdate(id);
  } catch (error) {
    console.error("Contact could not be updated:", error);
  }
}

/**
 * Finalizes contact update actions and UI refresh.
 */
function finalizeUpdate(id) {
  closeContactModal();
  renderContactList();
  showContactDetails(id);
}

/**
 * Generates uppercase initials string from full name.
 */
function getInitials(name) {
  let parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Displays toast notification message.
 */
function showToast() {
  let main = document.getElementById("content");
  if (!main) return;
  main.insertAdjacentHTML("beforeend", createToastTemplate());
  setTimeout(() => {
    document.getElementById("contactToast")?.remove();
  }, 3000);
}

/**
 * Handles contact deletion request.
 */
async function deleteContact(event, element) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  let targetId = getTargetId(event, element);
  if (!targetId) return;

  if (!currentUser && isGuestSession()) {
    contacts = contacts.filter((c) => String(c.id) !== String(targetId));
    writeGuestContacts(contacts);
    resetDetailAndRender();
    return;
  }
  if (currentUser) await deleteContactFromFirestore(targetId);
}

/**
 * Deletes contact document from Firestore database.
 */
async function deleteContactFromFirestore(id) {
  try {
    const contactRef = doc(db, "users", currentUser.uid, "contacts", id);
    await deleteDoc(contactRef);
    contacts = contacts.filter((c) => String(c.id) !== String(id));
    resetDetailAndRender();
  } catch (error) {
    console.error("Contact could not be deleted:", error);
  }
}

/**
 * Resets contact detail panel and updates list view.
 */
function resetDetailAndRender() {
  renderContactList();
  const detailContainer = document.getElementById("contactDetailContainer");
  if (detailContainer) {
    detailContainer.innerHTML = `<p class="select-hint">Select a contact to view details.</p>`;
  }
  closeContactModal();
  hideMobileDetail();
}

export function closeMobileMenu() {
  const menu = document.getElementById("mobileActionMenu");
  if (menu) {
    menu.classList.add("d-none");
  }
}

/**
 * Closes the mobile menu when clicking outside of it.
 */
document.addEventListener("click", (event) => {
  const menu = document.getElementById("mobileActionMenu");
  const btn = document.getElementById("mobileMenuBtn");

  if (menu && !menu.classList.contains("d-none")) {
    if (!menu.contains(event.target) && !btn?.contains(event.target)) {
      menu.classList.add("d-none");
    }
  }
});

/**
 * Triggers the "Contact successfully created" overlay animation.
 */
function showContactCreatedSuccess() {
  const toast = document.getElementById("contactToast");
  if (!toast) return;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// Global function exports
window.initContacts = initContacts;
window.openAddContactModal = openAddContactModal;
window.openEditModal = openEditModal;
window.closeContactModal = closeContactModal;
window.saveNewContact = saveNewContact;
window.updateContact = updateContact;
window.deleteContact = deleteContact;
window.showContactDetails = showContactDetails;
window.hideMobileDetail = hideMobileDetail;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;