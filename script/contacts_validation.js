/**
 * Helper to update invalid message below the specific input container.
 */
function updateErrorMessage(inputElement, message) {
  if (!inputElement) return;

  const container = inputElement.closest(".input-container");
  if (!container) return;

  const msgEl = container.querySelector(".invalid-feedback");

  if (message) {
    if (msgEl) msgEl.textContent = message;
    inputElement.classList.add("is-invalid");
  } else {
    if (msgEl) msgEl.textContent = "";
    inputElement.classList.remove("is-invalid");
  }
}

/**
 * Validates email format using standard regex.
 */
export function isValidEmailFormat(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates name input value and character restrictions.
 */
export function checkName(nameInput) {
  const value = nameInput ? nameInput.value.trim() : "";
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  if (!value) {
    updateErrorMessage(nameInput, "Please enter your name.");
    return false;
  }
  
  if (!nameRegex.test(value)) {
    updateErrorMessage(nameInput, "Please enter a valid name.");
    return false;
  }

  updateErrorMessage(nameInput, "");
  return true;
}

/**
 * Validates email input value and format.
 */
export function checkEmail(emailInput) {
  const value = emailInput ? emailInput.value.trim() : "";

  if (!value) {
    updateErrorMessage(emailInput, "Please enter an email address.");
    return false;
  }
  if (!isValidEmailFormat(value)) {
    updateErrorMessage(emailInput, "Please enter a valid email address.");
    return false;
  }

  updateErrorMessage(emailInput, "");
  return true;
}

/**
 * Validates phone input value and allowed characters.
 */
export function checkPhone(phoneInput) {
  const value = phoneInput ? phoneInput.value.trim() : "";
  const phoneRegex = /^[0-9+\s]+$/;

  if (!value) {
    updateErrorMessage(phoneInput, "Please enter your phone number.");
    return false;
  }
  if (!phoneRegex.test(value)) {
    updateErrorMessage(phoneInput, "Please enter a valid phone number.");
    return false;
  }

  updateErrorMessage(phoneInput, "");
  return true;
}

/**
 * Setup real-time listeners for instant feedback on input/blur.
 */
export function initContactInputRestrictions(
  nameInput,
  emailInput,
  phoneInput
) {
  nameInput?.addEventListener("input", () => checkName(nameInput));
  phoneInput?.addEventListener("input", () => checkPhone(phoneInput));

  emailInput?.addEventListener("input", () => checkEmail(emailInput));
  emailInput?.addEventListener("blur", () => checkEmail(emailInput));
}

/**
 * Validates all fields prior to contact submission.
 */
export function validateContactForm(nameInput, emailInput, phoneInput) {
  const isNameValid = checkName(nameInput);
  const isEmailValid = checkEmail(emailInput);
  const isPhoneValid = checkPhone(phoneInput);

  return isNameValid && isEmailValid && isPhoneValid;
}
