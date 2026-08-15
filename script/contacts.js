import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

let contacts = [];
let currentUser = null;
const GUEST_CONTACTS_KEY = "contacts";
const GUEST_CONTACTS_SEED = [
  { id: "guest-contact-1", name: "Max Mustermann", email: "max@guest.join", phone: "+49 170 1000001", color: "#ff7a00" },
  { id: "guest-contact-2", name: "Erika Muster", email: "erika@guest.join", phone: "+49 170 1000002", color: "#2fd7c4" },
  { id: "guest-contact-3", name: "Alex Demo", email: "alex@guest.join", phone: "+49 170 1000003", color: "#5a42b2" },
];

function isGuestSession() {
  try {
    const current = JSON.parse(localStorage.getItem("currentUser") || "null");
    return !!(current && (current.isGuest || current.name === "Guest User"));
  } catch {
    return false;
  }
}

function readGuestContacts() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CONTACTS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeGuestContacts(list) {
  localStorage.setItem(GUEST_CONTACTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

function ensureGuestContacts() {
  const list = readGuestContacts();
  if (!list.length) writeGuestContacts(GUEST_CONTACTS_SEED);
}
/** Initializes the contacts view by triggering the rendering process. */
async function initContacts() {
    await init();

  if (isGuestSession()) {
    currentUser = null;
    await loadSharedContactsForGuest();
    renderContactList();
    return;
  }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.error("Kein Benutzer eingeloggt.");
            return;
        }

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
        const contactsRef = collection(
            db,
            "users",
            currentUser.uid,
            "contacts"
        );

        const snapshot = await getDocs(contactsRef);

        contacts = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
        }));
    } catch (error) {
        console.error("Fehler beim Laden der Kontakte:", error);
    }
}

/** Sorts contacts alphabetically and clears the container before building the list. */
function renderContactList() {
  let container = document.getElementById("contactsListContainer");
  if (!container) return;
  container.innerHTML = "";
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  buildListHTML(container);
}

/** Iterates through contacts to inject letter dividers and individual contact items. */
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

/** Finds a specific contact, highlights it in the list, and displays its full details. */
function showContactDetails(id) {
  let contact = contacts.find((c) => c.id === id);
  let container = document.getElementById("contactDetailContainer");
  if (!contact || !container) return;
  highlightActiveItem(id);
  let initials = getInitials(contact.name);
  container.innerHTML = createContactDetailTemplate(contact, initials);
  handleMobileViewToggle();
}

/** Removes the active styling from all list items and applies it to the selected contact. */
function highlightActiveItem(id) {
  document
    .querySelectorAll(".contact-list-item")
    .forEach((el) => el.classList.remove("active"));
  let activeItem = document.getElementById(`item-${id}`);
  if (activeItem) activeItem.classList.add("active");
}

/** Switches the mobile interface visibility from the contact list to the detailed panel. */
function handleMobileViewToggle() {
  if (window.innerWidth <= 850) {
    document
      .querySelector(".contacts-sidebar-list")
      .classList.add("d-none-mobile");
    document
      .querySelector(".contacts-detail-panel")
      .classList.add("d-show-mobile");
  }
}

/** Restores the contact list view and hides the detailed panel on mobile devices. */
function hideMobileDetail() {
  document
    .querySelector(".contacts-sidebar-list")
    .classList.remove("d-none-mobile");
  document
    .querySelector(".contacts-detail-panel")
    .classList.remove("d-show-mobile");
}

/** Injects the creation form template and makes the contact modal visible. */
function openAddContactModal() {
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  content.innerHTML = createAddModalTemplate();
  overlay.classList.remove("d-none");
}

function openEditModal(id) {
  let contact = contacts.find((c) => c.id === id);
  if (!contact) return;
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  let initials = getInitials(contact.name);
  content.innerHTML = createEditModalTemplate(contact, initials);
  overlay.classList.remove("d-none");
}

function closeContactModal() {
  let overlay = document.getElementById("contactModalOverlay");
  let content = document.getElementById("contactModalContent");
  
  overlay.classList.add("d-none");
  
  if (content) {
    content.innerHTML = "";
  }
}

/** Prevents form submission default behavior, creates a new contact object, and saves it. */
async function saveNewContact(event) {
    event.preventDefault();

    const newContact = {
    id: `contact-${crypto.randomUUID()}`,
        name: document.getElementById("modalName").value.trim(),
        email: document.getElementById("modalEmail").value.trim(),
        phone: document.getElementById("modalPhone").value.trim(),
        color: getRandomColor()
    };

  if (!currentUser && isGuestSession()) {
    contacts.push(newContact);
    writeGuestContacts(contacts);
    executePostSaveActions();
    return;
  }

  if (!currentUser) {
    console.error("Kein Benutzer eingeloggt.");
    return;
  }

    try {
      const contactsRef = collection(
        db,
        "users",
        currentUser.uid,
        "contacts"
      );

        const docRef = await addDoc(contactsRef, newContact);

        contacts.push({
          ...newContact,
          id: docRef.id,
        });

        executePostSaveActions();
    } catch (error) {
        console.error("Kontakt konnte nicht gespeichert werden:", error);
    }
}

function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
}

/** Concludes the creation flow by closing the modal, refreshing the list, and showing a toast notification. */
function executePostSaveActions() {
  closeContactModal();
  renderContactList();
  showToast();
}

/** Modifies an existing contact's attributes in local memory and refreshes the current views. */
async function updateContact(event, id) {
    event.preventDefault();

    let contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    const updatedData = {
        name: document.getElementById("modalName").value.trim(),
        email: document.getElementById("modalEmail").value.trim(),
        phone: document.getElementById("modalPhone").value.trim()
    };

      if (!currentUser && isGuestSession()) {
        Object.assign(contact, updatedData);
        writeGuestContacts(contacts);
        closeContactModal();
        renderContactList();
        showContactDetails(id);
        return;
      }

      if (!currentUser) return;

    try {
      const contactRef = doc(
        db,
        "users",
        currentUser.uid,
        "contacts",
        id
      );

        await updateDoc(contactRef, updatedData);

        Object.assign(contact, updatedData);

        closeContactModal();
        renderContactList();
        showContactDetails(id);
    } catch (error) {
        console.error("Kontakt konnte nicht aktualisiert werden:", error);
    }
}
/** Extracts and returns the capitalized first letters of the provided name string. */
function getInitials(name) {
  let parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Injects a temporary success feedback banner that disappears after three seconds. */
function showToast() {
  let main = document.getElementById("content");
  main.insertAdjacentHTML("beforeend", createToastTemplate());
  setTimeout(() => {
    let toast = document.getElementById("contactToast");
    if (toast) toast.remove();
  }, 3000);
}
async function deleteContact(id) {
  if (!currentUser && isGuestSession()) {
    contacts = contacts.filter((contact) => contact.id !== id);
    writeGuestContacts(contacts);
    renderContactList();

    const detailContainer = document.getElementById("contactDetailContainer");
    if (detailContainer) {
      detailContainer.innerHTML = `
        <p class="select-hint">
          Select a contact to view details.
        </p>
      `;
    }

    closeContactModal();
    hideMobileDetail();
    return;
  }

  if (!currentUser) return;

    try {
      const contactRef = doc(
        db,
        "users",
        currentUser.uid,
        "contacts",
        id
      );

        await deleteDoc(contactRef);

        contacts = contacts.filter((contact) => contact.id !== id);

        renderContactList();

        const detailContainer =
            document.getElementById("contactDetailContainer");

        if (detailContainer) {
            detailContainer.innerHTML = `
                <p class="select-hint">
                    Select a contact to view details.
                </p>
            `;
        }

        closeContactModal();
        hideMobileDetail();
    } catch (error) {
        console.error("Kontakt konnte nicht gelöscht werden:", error);
    }
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
