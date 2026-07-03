/**
 * Generates the HTML for a letter category divider
 */
function createLetterDividerTemplate(letter) {
  return `<div class="letter-divider">${letter}</div>`;
}

function createContactListItemTemplate(contact, initials) {
  return `
        <div class="contact-list-item" id="item-${contact.id}" onclick="showContactDetails('${contact.id}')">
            <div class="contact-avatar" style="background-color: ${contact.color}">${initials}</div>
            <div class="contact-info-short">
                <span class="contact-name">${contact.name}</span>
                <span class="contact-email-link">${contact.email}</span>
            </div>
        </div>
    `;
}

function createContactDetailTemplate(contact, initials) {
  return `
        <div class="contact-detail-view animate-fade-in">
            <div class="mobile-back-arrow" onclick="hideMobileDetail()"><img src="../assets/logo/arrow-left.svg"></div>
            <div class="contact-detail-header">
                <div class="contact-avatar-large" style="background-color: ${
                  contact.color
                }">${initials}</div>
                <div class="contact-header-titles">
                    <h2>${contact.name}</h2>
                    ${getDetailActionsTemplate(contact.id)}
                </div>
            </div>
            ${getDetailBodyTemplate(contact)}
        </div>
    `;
}

function getDetailActionsTemplate(id) {
  return `
        <div class="contact-actions">
            <span class="action-btn" onclick="openEditModal('${id}')"><img src="../assets/icons/edit.svg"> Edit</span>
            <span class="action-btn" onclick="deleteContact('${id}')"><img src="../assets/icons/delete.svg"> Delete</span>
        </div>
    `;
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
        </div>
    `;
}

// Exactamente 14 líneas de código para el formulario de edición
function getEditFormTemplate(c) {
  return `
    <form class="modal-form" onsubmit="updateContact(event, '${c.id}')">
        <div class="input-icon-container"><input type="text" id="modalName" value="${c.name}" required><img src="../assets/icons/person.svg"></div>
        <div class="input-icon-container"><input type="email" id="modalEmail" value="${c.email}" required><img src="../assets/icons/mail.svg"></div>
        <div class="input-icon-container"><input type="tel" id="modalPhone" value="${c.phone}" required><img src="../assets/icons/lock.svg"></div>
        <div class="modal-actions-container">
            <button type="button" class="btn-cancel" style="width:113px;height:55px;" onclick="deleteContact('${c.id}')">Delete</button>
            <button type="submit" class="btn-create" style="width:113px;height:55px;">Save <img src="../assets/icons/check_white.svg"></button>
        </div>
    </form>`;
}

function createEditModalTemplate(c, initials) {
  return `
    <div class="modal-card">
        <div class="modal-left-panel">
            <img class="modal-logo" src="../assets/logo/logo_white.svg" alt="Logo">
            <h1>Edit contact</h1>
            <div class="blue-line-horizontal"></div>
        </div>
        <div class="modal-right-panel">
            <div class="close-btn-container" onclick="closeContactModal()"><img src="../assets/icons/close.svg"></div>
            <div class="modal-avatar-circle" style="background-color: ${
              c.color
            };">${initials}</div>
            <div class="modal-form-container">
                ${getEditFormTemplate(c)}
            </div>
        </div>
    </div>`;
}

function createAddModalTemplate() {
  return `
    <div class="modal-card">
        <div class="modal-left-panel">
            <img class="modal-logo" src="../assets/logo/logo_white.svg" alt="Logo">
            <h1>Add contact</h1>
            <p>Tasks are better with a team!</p>
            <div class="blue-line-horizontal"></div>
        </div>
        <div class="modal-right-panel">
            <div class="close-btn-container" onclick="closeContactModal()"><img src="../assets/icons/close.svg"></div>
            <div class="modal-avatar-circle" style="background-color: #D1D1D1;"><img src="../assets/icons/person.svg" style="filter: brightness(0) invert(1); width: 40px; height: 40px;"></div>
            <div class="modal-form-container">
                <form class="modal-form" onsubmit="saveNewContact(event)">
                    <div class="input-icon-container"><input type="text" id="modalName" placeholder="Name" required><img src="../assets/icons/person.svg"></div>
                    <div class="input-icon-container"><input type="email" id="modalEmail" placeholder="Email" required><img src="../assets/icons/mail.svg"></div>
                    <div class="input-icon-container"><input type="tel" id="modalPhone" placeholder="Phone" required><img src="../assets/icons/lock.svg"></div>
                    <div class="modal-actions-container">
                        <button type="button" class="btn-cancel" style="width:126px;height:56px;" onclick="closeContactModal()">Cancel <img src="../assets/icons/close.svg"></button>
                        <button type="submit" class="btn-create" style="width:214px;height:56px;">Create contact <img src="../assets/icons/check.svg"></button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}

function createToastTemplate() {
  return `<div id="contactToast" class="toast-notification animate-slide-up">Contact successfully created</div>`;
}
