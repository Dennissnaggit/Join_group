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

let contacts = [];
let currentUser = null;

function readGuestContacts() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CONTACTS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeGuestContacts(list) {
  writeGuestList(GUEST_CONTACTS_KEY, list);
}

async function initContacts() {
  await init();
  if (isGuestSession()) {
    currentUser = null;
    await loadSharedContactsForGuest();
    renderContactList();
    return;
  }
  onAuthStateChanged(auth, async (user) => {
    if (!user) return console.error("Kein Benutzer eingeloggt.");
    currentUser = user;
    await loadContacts();
    renderContactList();
  });
}

async function loadSharedContactsForGuest() {
  ensureGuestContacts();
  contacts = readGuestContacts();
}

async function loadContacts() {
  if (!currentUser) return;
  try {
    const contactsRef = collection(db, "users", currentUser.uid, "contacts");
    const snapshot = await getDocs(contactsRef);
    contacts = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  } catch (error) {
    console.error("Fehler beim Laden der Kontakte:", error);
  }
}

function renderContactList() {
  let container = document.getElementById("contactsListContainer");
  if (!container) return;
  container.innerHTML = "";
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  buildListHTML(container);
}

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

function showContactDetails(id) {
  let contact = contacts.find((c) => String(c.id) === String(id));
  let container = document.getElementById("contactDetailContainer");
  if (!contact || !container) return;

  highlightActiveItem(id);
  let initials = getInitials(contact.name);
  container.innerHTML = createContactDetailTemplate(contact, initials);
  handleMobileViewToggle();

  let mobileMenu = document.getElementById("mobileActionMenu");
  let mobileEditBtn = document.querySelector(".action-btn-edit");
  let mobileDeleteBtn = document.querySelector(".action-btn-delete");

  if (mobileEditBtn) mobileEditBtn.setAttribute("data-id", id);
  if (mobileDeleteBtn) mobileDeleteBtn.setAttribute("data-id", id);

  if (mobileMenu) {
    mobileMenu.classList.remove("d-none");
  }
}

function highlightActiveItem(id) {
  document
    .querySelectorAll(".contact-list-item")
    .forEach((el) => el.classList.remove("active"));
  let activeItem = document.getElementById(`item-${id}`);
  if (activeItem) activeItem.classList.add("active");
}

function handleMobileViewToggle() {
  if (window.innerWidth <= 850) {
    document
      .querySelector(".contacts-sidebar-list")
      ?.classList.add("d-none-mobile");
    document
      .querySelector(".contacts-detail-panel")
      ?.classList.add("d-show-mobile");
  }
}

function hideMobileDetail() {
  document
    .querySelector(".contacts-sidebar-list")
    ?.classList.remove("d-none-mobile");
  document
    .querySelector(".contacts-detail-panel")
    ?.classList.remove("d-show-mobile");
}

function openAddContactModal() {
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  if (content) content.innerHTML = createAddModalTemplate();
  if (overlay) overlay.classList.remove("d-none");
}

function getTargetId(event, element) {
  if (typeof element === "string" || typeof element === "number")
    return String(element).trim();
  if (typeof event === "string" || typeof event === "number")
    return String(event).trim();
  let el = element || event?.currentTarget || event?.target;
  let target = el?.closest?.("[data-id]") || el;
  return target?.getAttribute?.("data-id") || null;
}

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
}

function closeContactModal() {
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  if (overlay) overlay.classList.add("d-none");
  if (content) content.innerHTML = "";
}

async function saveNewContact(event) {
  event.preventDefault();
  const newContact = createContactDataObj();
  if (!currentUser && isGuestSession()) {
    contacts.push(newContact);
    writeGuestContacts(contacts);
    executePostSaveActions();
    return;
  }
  if (!currentUser) return console.error("Kein Benutzer eingeloggt.");
  await saveContactToFirestore(newContact);
}

function createContactDataObj() {
  return {
    id: `contact-${crypto.randomUUID()}`,
    name: document.getElementById("modalName").value.trim(),
    email: document.getElementById("modalEmail").value.trim(),
    phone: document.getElementById("modalPhone").value.trim(),
    color: getRandomColor(),
  };
}

async function saveContactToFirestore(newContact) {
  try {
    const contactsRef = collection(db, "users", currentUser.uid, "contacts");
    const docRef = await addDoc(contactsRef, newContact);
    contacts.push({ ...newContact, id: docRef.id });
    executePostSaveActions();
  } catch (error) {
    console.error("Kontakt konnte nicht gespeichert werden:", error);
  }
}

function getRandomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

function executePostSaveActions() {
  closeContactModal();
  renderContactList();
  showToast();
}

async function updateContact(event, id) {
  event.preventDefault();
  let contact = contacts.find((c) => String(c.id) === String(id));
  if (!contact) return;
  const updatedData = getModalFormData();
  if (!currentUser && isGuestSession()) {
    return handleGuestUpdate(contact, updatedData, id);
  }
  if (!currentUser) return;
  await handleFirestoreUpdate(contact, updatedData, id);
}

function getModalFormData() {
  return {
    name: document.getElementById("modalName").value.trim(),
    email: document.getElementById("modalEmail").value.trim(),
    phone: document.getElementById("modalPhone").value.trim(),
  };
}

function handleGuestUpdate(contact, updatedData, id) {
  Object.assign(contact, updatedData);
  writeGuestContacts(contacts);
  finalizeUpdate(id);
}

async function handleFirestoreUpdate(contact, updatedData, id) {
  try {
    const contactRef = doc(db, "users", currentUser.uid, "contacts", id);
    await updateDoc(contactRef, updatedData);
    Object.assign(contact, updatedData);
    finalizeUpdate(id);
  } catch (error) {
    console.error("Kontakt konnte nicht aktualisiert werden:", error);
  }
}

function finalizeUpdate(id) {
  closeContactModal();
  renderContactList();
  showContactDetails(id);
}

function getInitials(name) {
  let parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function showToast() {
  let main = document.getElementById("content");
  if (!main) return;
  main.insertAdjacentHTML("beforeend", createToastTemplate());
  setTimeout(() => {
    let toast = document.getElementById("contactToast");
    if (toast) toast.remove();
  }, 3000);
}

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

async function deleteContactFromFirestore(id) {
  try {
    const contactRef = doc(db, "users", currentUser.uid, "contacts", id);
    await deleteDoc(contactRef);
    contacts = contacts.filter((c) => String(c.id) !== String(id));
    resetDetailAndRender();
  } catch (error) {
    console.error("Kontakt konnte nicht gelöscht werden:", error);
  }
}

function resetDetailAndRender() {
  renderContactList();
  const detailContainer = document.getElementById("contactDetailContainer");
  if (detailContainer) {
    detailContainer.innerHTML = `<p class="select-hint">Select a contact to view details.</p>`;
  }

  let mobileMenu = document.getElementById("mobileActionMenu");
  if (mobileMenu) mobileMenu.classList.add("d-none");

  closeContactModal();
  hideMobileDetail();
}

window.initContacts = initContacts;
window.openAddContactModal = openAddContactModal;
window.openEditModal = openEditModal;
window.closeContactModal = closeContactModal;
window.saveNewContact = saveNewContact;
window.updateContact = updateContact;
window.deleteContact = deleteContact;
window.showContactDetails = showContactDetails;
window.hideMobileDetail = hideMobileDetail;
