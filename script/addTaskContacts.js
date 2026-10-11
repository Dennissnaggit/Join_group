import { auth, db } from "./firebase.js";
import { ensureGuestContacts, isGuestSession } from "./guest-data.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { taskElements as elements, cloneTaskTemplate } from "./addTaskElements.js";

let availableContacts = [];
let selectedContactIds = [];


/** Verknüpft Suche, Auswahl und Schließen des Kontakt-Dropdowns.
 */
export function setupAssignedContacts() {
  elements.assignedToggle.addEventListener("click", toggleAssignedDropdown);
  elements.assignedSearch.addEventListener("input", () => renderAssignedToOptions(elements.assignedSearch.value));
  elements.assignedOptions.addEventListener("click", handleAssignedContactClick);
  document.addEventListener("click", closeAssignedDropdownOutside);
}


/** Lädt Gastkontakte oder Kontakte des angemeldeten Benutzers.
 * @returns {Promise<void>} Abschluss des Vorgangs.
 */
export async function loadContacts() {
  if (!isGuestSession() && !auth.currentUser) {
    console.error("Kontakte konnten nicht geladen werden: Kein User eingeloggt.");
    return;
  }
  try {
    availableContacts = isGuestSession() ? ensureGuestContacts() : await fetchUserContacts(auth.currentUser.uid);
    availableContacts.sort((first, second) => first.name.localeCompare(second.name));
    renderAssignedToOptions();
  } catch (error) {
    console.error("Fehler beim Laden der Kontakte:", error);
  }
}


/** Liest die Kontakt-Dokumente eines Benutzers aus Firestore.
 * @param {string} uid - Benutzer-ID.
 * @returns {Promise<Array<object>>} Kontakte des Benutzers.
 */
async function fetchUserContacts(uid) {
  const snapshot = await getDocs(collection(db, "users", uid, "contacts"));
  return snapshot.docs.map(contact => ({ id: contact.id, ...contact.data() }));
}


/** Zeigt die Kontakte passend zum aktuellen Suchtext.
 * @param {string} [searchValue=""] - Suchtext für die Kontaktliste.
 */
function renderAssignedToOptions(searchValue = "") {
  const search = searchValue.trim().toLowerCase();
  const contacts = availableContacts.filter(contact => contact.name.toLowerCase().includes(search));
  const options = contacts.length ? contacts.map(createContactOption) : [cloneTaskTemplate("noContactsTemplate")];
  elements.assignedOptions.replaceChildren(...options);
}


/** Befüllt das statische Kontakt-Template mit sicheren Textwerten.
 * @param {object} contact - Kontakt mit ID, Namen und Farbe.
 * @returns {HTMLElement} Befüllter Kontakteintrag.
 */
function createContactOption(contact) {
  const option = cloneTaskTemplate("assignedContactTemplate");
  const selected = selectedContactIds.includes(contact.id);
  option.dataset.contactId = contact.id;
  option.classList.toggle("selected", selected);
  option.querySelector(".bat-contact-avatar").style.backgroundColor = contact.color;
  option.querySelector(".bat-contact-avatar").textContent = getContactInitials(contact.name);
  option.querySelector(".bat-contact-name").textContent = contact.name;
  option.querySelector("input").checked = selected;
  return option;
}


/** Ermittelt die Initialen aus dem ersten und letzten Namensbestandteil.
 * @param {string} name - Name des Kontakts.
 * @returns {string} Initialen des Kontakts.
 */
function getContactInitials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0].charAt(0) + (parts.length > 1 ? parts.at(-1).charAt(0) : "")).toUpperCase();
}


/** Übernimmt die angeklickte Kontakt-ID in die Auswahl.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function handleAssignedContactClick(event) {
  event.stopPropagation();
  const option = event.target.closest(".bat-contact-option");
  if (option) toggleAssignedContact(option.dataset.contactId);
}


/** Fügt einen Kontakt hinzu oder entfernt ihn aus der Auswahl.
 * @param {string} contactId - ID des ausgewählten Kontakts.
 */
function toggleAssignedContact(contactId) {
  selectedContactIds = selectedContactIds.includes(contactId)
    ? selectedContactIds.filter(id => id !== contactId) : [...selectedContactIds, contactId];
  renderAssignedToOptions(elements.assignedSearch.value);
  renderSelectedContacts();
  elements.assignedDropdown.classList.remove("d-none");
  elements.assignedSearch.focus({ preventScroll: true });
}


/** Zeigt bis zu vier Avatare sowie die Anzahl weiterer Kontakte.
 */
function renderSelectedContacts() {
  const contacts = getSelectedContacts();
  const avatars = contacts.slice(0, 4).map(createSelectedAvatar);
  if (contacts.length > 4) avatars.push(createAdditionalAvatar(contacts.length - 4));
  elements.assignedSelected.replaceChildren(...avatars);
}


/** Liest die ausgewählten Kontaktobjekte anhand ihrer IDs.
 * @returns {Array<object>} Ausgewählte Kontakte.
 */
function getSelectedContacts() {
  return selectedContactIds.map(id => availableContacts.find(contact => contact.id === id)).filter(Boolean);
}


/** Befüllt den Avatar eines ausgewählten Kontakts.
 * @param {object} contact - Kontakt mit ID, Namen und Farbe.
 * @returns {HTMLElement} Befüllter Kontaktavatar.
 */
function createSelectedAvatar(contact) {
  const avatar = cloneTaskTemplate("selectedAvatarTemplate");
  avatar.style.backgroundColor = contact.color;
  avatar.title = contact.name;
  avatar.textContent = getContactInitials(contact.name);
  return avatar;
}


/** Zeigt die Anzahl der nicht einzeln dargestellten Kontakte.
 * @param {number} count - Anzahl zusätzlicher Kontakte.
 * @returns {HTMLElement} Avatar für zusätzliche Kontakte.
 */
function createAdditionalAvatar(count) {
  const avatar = cloneTaskTemplate("selectedAvatarTemplate");
  avatar.classList.add("bat-selected-avatar--more");
  avatar.title = `${count} additional assignee${count === 1 ? "" : "s"}`;
  avatar.textContent = `+${count}`;
  return avatar;
}


/** Öffnet oder schließt die Kontaktliste und fokussiert die Suche.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function toggleAssignedDropdown(event) {
  event.stopPropagation();
  elements.assignedDropdown.classList.toggle("d-none");
  if (!elements.assignedDropdown.classList.contains("d-none")) elements.assignedSearch.focus();
}


/** Schließt die Kontaktliste bei einem Klick außerhalb.
 * @param {Event} event - Ausgelöstes Benutzerereignis.
 */
function closeAssignedDropdownOutside(event) {
  if (!event.target.closest("#assignedToWrapper")) elements.assignedDropdown.classList.add("d-none");
}


/** Entfernt die Kontaktauswahl und setzt das Dropdown zurück.
 */
export function resetAssignedContacts() {
  selectedContactIds = [];
  elements.assignedSearch.value = "";
  elements.assignedSelected.replaceChildren();
  elements.assignedDropdown.classList.add("d-none");
  renderAssignedToOptions();
}


/** Liefert die Namen der ausgewählten Kontakte für die Speicherung.
 * @returns {Array<string>} Namen der ausgewählten Kontakte.
 */
export function getAssignedTo() {
  return getSelectedContacts().map(contact => contact.name);
}
