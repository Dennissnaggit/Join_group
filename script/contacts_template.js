/**Creates letter divider HTML template. */
export function createLetterDividerTemplate(letter) {
  return `<div class="letter-divider">${letter}</div>`;
}

/**
 * Creates contact list item HTML template.*/
export function createContactListItemTemplate(contact, initials) {
  return `
    <div class="contact-list-item" id="item-${contact.id}" onclick="showContactDetails('${contact.id}', event)">
        <div class="contact-avatar" style="background-color: ${contact.color}">${initials}</div>
        <div class="contact-info-short">
            <span class="contact-name">${contact.name}</span>
            <span class="contact-email-link">${contact.email}</span>
        </div>
    </div>`;
}

/**Creates contact detail view HTML template. */
export function createContactDetailTemplate(contact, initials) {
  return `
    <div class="contact-detail-view animate-fade-in">
        ${getDetailHeaderTemplate(contact, initials)}
        ${getDetailBodyTemplate(contact)}
    </div>`;
}

function getDetailHeaderTemplate(contact, initials) {
  return `
    <div class="contact-detail-header">
        <div class="contact-avatar-large" style="background-color: ${
          contact.color
        }">${initials}</div>
        <div class="contact-header-titles">
            <h2>${contact.name}</h2>
            ${getDetailActionsTemplate(contact.id)}
        </div>
    </div>`;
}

function getDetailActionsTemplate(id) {
  return `
    <div class="contact-actions">
        <span class="action-btn" onclick="openEditModal(event, '${id}')">
            <img src="../assets/icons/edit.svg" alt="Edit"> Edit
        </span>
        <span class="action-btn" onclick="deleteContact(event, '${id}')">
            <img src="../assets/icons/delete.svg" alt="Delete"> Delete
        </span>
    </div>`;
}

function getDetailBodyTemplate(contact) {
  return `
    <div class="contact-info-body">
        <h3>Contact Information</h3>
        <div class="info-data-group">
            <p class="info-label">Email</p>
            <p class="info-value"><a href="mailto:${contact.email}">${contact.email}</a></p>
        </div>
        <div class="info-data-group">
            <p class="info-label">Phone</p>
            <p class="info-value">${contact.phone}</p>
        </div>
    </div>`;
}

function getEditFormTemplate(contact) {
  return `
    <form class="modal-form" onsubmit="updateContact(event, '${contact.id}')" novalidate>
        <div class="input-icon-container"><input type="text" id="modalName" value="${contact.name}" required><img src="../assets/icons/person.svg" alt=""></div>
        <div class="input-icon-container"><input type="email" id="modalEmail" value="${contact.email}" required><img src="../assets/icons/mail.svg" alt=""></div>
        <div class="input-icon-container"><input type="tel" id="modalPhone" value="${contact.phone}" required><img src="../assets/icons/lock.svg" alt=""></div>
        <div class="modal-actions-container">
            <button type="button" class="btn-cancel" onclick="deleteContact('${contact.id}')">Delete</button>
            <button type="submit" class="btn-create">Save <img src="../assets/icons/check.svg" alt=""></button>
        </div>
    </form>`;
}

/**Creates edit contact modal HTML template.*/
export function createEditModalTemplate(contact, initials) {
  return `
    <div class="modal-card">
        <div class="modal-left-panel">
            <img class="modal-logo" src="../assets/logo/logo_white.svg" alt="Logo">
            <h1>Edit contact</h1>
            <div class="blue-line-horizontal"></div>
        </div>
        <div class="modal-right-panel">
            <div class="close-btn-container" onclick="closeContactModal()"><img src="../assets/icons/close.svg" alt="Close"></div>
            <div class="modal-avatar-circle" style="background-color: ${
              contact.color
            };">${initials}</div>
            <div class="modal-form-container">${getEditFormTemplate(
              contact
            )}</div>
        </div>
    </div>`;
}

function getAddFormTemplate() {
  return `
    <form class="modal-form" onsubmit="saveNewContact(event)">
        <div class="input-icon-container"><input type="text" id="modalName" placeholder="Name" required><img src="../assets/icons/person.svg" alt=""></div>
        <div class="input-icon-container"><input type="email" id="modalEmail" placeholder="Email" required><img src="../assets/icons/mail.svg" alt=""></div>
        <div class="input-icon-container"><input type="tel" id="modalPhone" placeholder="Phone" required><img src="../assets/icons/lock.svg" alt=""></div>
        <div class="modal-actions-container">
            <button type="button" class="btn-cancel" onclick="closeContactModal()">Cancel <img src="../assets/icons/close.svg" alt=""></button>
            <button type="submit" class="btn-create">Create contact <img src="../assets/icons/check.svg" alt=""></button>
        </div>
    </form>`;
}

/**Creates add contact modal HTML template.*/
export function createAddModalTemplate() {
  return `
    <div class="modal-card">
        <div class="modal-left-panel">
            <img class="modal-logo" src="../assets/logo/logo_white.svg" alt="Logo">
            <div class="close-btn-container" onclick="closeContactModal()"><img src="../assets/icons/close.svg" alt="Close"></div>
            <h1>Add contact</h1>
            <p>Tasks are better with a team!</p>
            <div class="blue-line-horizontal"></div>
        </div>
        <div class="modal-right-panel">
            <div class="modal-avatar-circle" style="background-color: #D1D1D1;"><img src="../assets/icons/person.svg" style="filter: brightness(0) invert(1); width: 40px; height: 40px;" alt=""></div>
            <div class="modal-form-container">${getAddFormTemplate()}</div>
        </div>
    </div>`;
}

/**Creates toast notification HTML template.*/
export function createToastTemplate() {
  return `<div id="contactToast" class="toast-notification animate-slide-up">Contact successfully created</div>`;
}
