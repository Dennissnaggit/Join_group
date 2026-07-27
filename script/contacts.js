let contacts = [
  {
    id: "c1",
    name: "Anton Mayer",
    email: "antoni@gmail.com",
    phone: "+49 111 111 111",
    color: "#FF7A00",
  },
  {
    id: "c2",
    name: "Anja Schulz",
    email: "schulz@hotmail.com",
    phone: "+49 222 222 222",
    color: "#E600B2",
  },
  {
    id: "c3",
    name: "Benedikt Ziegler",
    email: "benedikt@gmail.com",
    phone: "+49 333 333 333",
    color: "#4622FF",
  },
  {
    id: "c4",
    name: "Tatjana Wolf",
    email: "wolf@gmail.com",
    phone: "+49 444 444 444",
    color: "#FFC700",
  },
];

const GUEST_EMAIL = "guest@join.com";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch (error) {
    return null;
  }
}

function isEditableCurrentUser(currentUser) {
  return (
    currentUser &&
    currentUser.email &&
    currentUser.email !== GUEST_EMAIL &&
    currentUser.name !== "Guest User"
  );
}

function getSelfContactId(currentUser) {
  return currentUser.uid || currentUser.email;
}

function getSelfContactColor(seed) {
  const palette = [
    "#FF7A00",
    "#E600B2",
    "#4622FF",
    "#FFC700",
    "#00B8D9",
    "#22C55E",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return palette[hash % palette.length];
}

function getSelfContact() {
  const currentUser = getCurrentUser();

  if (!isEditableCurrentUser(currentUser)) {
    return null;
  }

  const id = getSelfContactId(currentUser);

  if (!id) {
    return null;
  }

  return {
    id,
    name: currentUser.name || currentUser.email,
    email: currentUser.email,
    phone: currentUser.phone || "",
    color: currentUser.color || getSelfContactColor(id),
  };
}

function syncSelfContact() {
  const selfContact = getSelfContact();

  if (!selfContact) {
    return;
  }

  contacts = contacts.filter((contact) => contact.id !== selfContact.id);
  contacts.push(selfContact);
}

function getFirestoreStore() {
  return window.firestoreData;
}

async function loadContactsFromFirestore() {
  const firestoreStore = getFirestoreStore();

  if (!firestoreStore) {
    return contacts.slice();
  }

  return firestoreStore.loadUserCollection("contacts", contacts);
}

/** Initializes the contacts view by triggering the rendering process. */
async function initContacts() {
  contacts = await loadContactsFromFirestore();
  await syncSelfContactToFirestore();
  contacts = await loadContactsFromFirestore();
  renderContactList();
}

/** Sorts contacts alphabetically and clears the container before building the list. */
function renderContactList() {
  let container = document.getElementById("contactsListContainer");
  if (!container) return;
  container.innerHTML = "";
  contacts.sort((a, b) => a.name.localeCompare(b.name));
  buildListHTML(container);
}

async function syncSelfContactToFirestore() {
  const firestoreStore = getFirestoreStore();
  const currentUser = getCurrentUser();

  if (!firestoreStore || !isEditableCurrentUser(currentUser)) {
    return;
  }

  const selfContact = getSelfContact();

  if (!selfContact) {
    return;
  }

  await firestoreStore.saveUserCollectionItem("contacts", selfContact);
  await firestoreStore.mergeCurrentUserProfile({
    name: selfContact.name,
    email: selfContact.email,
    phone: selfContact.phone,
    color: selfContact.color,
  });
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
    id: `c-${Date.now()}`,
    name: document.getElementById("modalName").value,
    email: document.getElementById("modalEmail").value,
    phone: document.getElementById("modalPhone").value,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  };

  const firestoreStore = getFirestoreStore();
  if (firestoreStore) {
    await firestoreStore.saveUserCollectionItem("contacts", newContact);
  } else {
    contacts.push(newContact);
  }

  await refreshContactsFromFirestore();
  executePostSaveActions();
}

/** Concludes the creation flow by closing the modal, refreshing the list, and showing a toast notification. */
function executePostSaveActions() {
  closeContactModal();
  showToast();
}

/** Modifies an existing contact's attributes in local memory and refreshes the current views. */
async function updateContact(event, id) {
  event.preventDefault();
  let contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  contact.name = document.getElementById("modalName").value;
  contact.email = document.getElementById("modalEmail").value;
  contact.phone = document.getElementById("modalPhone").value;

  const firestoreStore = getFirestoreStore();
  if (firestoreStore) {
    await firestoreStore.saveUserCollectionItem("contacts", contact);
  }

  const currentUser = getCurrentUser();
  if (firestoreStore && currentUser && getSelfContactId(currentUser) === id) {
    await firestoreStore.mergeCurrentUserProfile({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      color: contact.color,
    });
  }

  await refreshContactsFromFirestore();

  closeContactModal();
  showContactDetails(id);
}

async function deleteContact(id) {
  const firestoreStore = getFirestoreStore();

  if (firestoreStore) {
    await firestoreStore.deleteUserCollectionItem("contacts", id);
  } else {
    contacts = contacts.filter((contact) => contact.id !== id);
  }

  await refreshContactsFromFirestore();
  closeContactModal();

  let container = document.getElementById("contactDetailContainer");
  if (container) {
    container.innerHTML = '<p class="select-hint">Select a contact to view details.</p>';
  }
}

async function refreshContactsFromFirestore() {
  contacts = await loadContactsFromFirestore();
  await syncSelfContactToFirestore();
  contacts = await loadContactsFromFirestore();
  renderContactList();
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
