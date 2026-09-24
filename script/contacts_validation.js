/**
 * Helper to add invalid class to input and its container.
 */
function markAsInvalid(input) {
  if (!input) return;
  input.classList?.add("is-invalid");
  const container =
    input.closest?.(".input-icon-container") || input.parentElement;
  container?.classList?.add("is-invalid");
}

/**
 * Helper to remove invalid class and error message safely.
 */
function clearInvalidState(input) {
  if (!input) return;
  input.classList?.remove("is-invalid");
  const container =
    input.closest?.(".input-icon-container") || input.parentElement;
  if (container) {
    container.classList?.remove("is-invalid");
    updateErrorMessage(container, null);
  }
}

/**
 * Validates email format with TLD restriction (max 4 characters after dot).
 */
export function isValidEmailFormat(email) {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email.trim());
}

/**
 * Updates or removes the invalid message below the field container.
 */
function updateErrorMessage(container, message) {
  if (!container || !container.parentElement) return;
  let msgEl = container.parentElement.querySelector(".invalid-feedback");
  if (message) {
    if (!msgEl) {
      msgEl = document.createElement("span");
      msgEl.className = "invalid-feedback";
      container.parentElement.appendChild(msgEl);
    }
    msgEl.textContent = message;
  } else if (msgEl) {
    msgEl.remove();
  }
}

/**
 * Setup real-time input restrictions and smart validation.
 */
export function initContactInputRestrictions(
  nameInput,
  emailInput,
  phoneInput
) {
  const bindInput = (input, msg, validateFn) =>
    input?.addEventListener("input", (e) => {
      const val = e.target.value;
      const isBad = val.length > 0 && validateFn(val);
      const container = input.closest(".input-icon-container") || input;

      container.classList?.toggle("is-invalid", isBad);
      updateErrorMessage(container, isBad ? msg : null);
    });

  bindInput(nameInput, "Numbers and special characters are not allowed", (v) =>
    /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(v)
  );
  bindInput(phoneInput, "Only numbers, spaces and '+' are allowed", (v) =>
    /[^0-9+\s]/.test(v)
  );
  bindInput(emailInput, "Spaces are not allowed in email", (v) => /\s/.test(v));

  emailInput?.addEventListener("blur", (e) => {
    const val = e.target.value.trim();
    const container = emailInput.closest(".input-icon-container") || emailInput;
    const isBad = val.length > 0 && !isValidEmailFormat(val);

    container.classList?.toggle("is-invalid", isBad);
    updateErrorMessage(
      container,
      isBad ? "Please enter a valid email address" : null
    );
  });
}

/**
 * Validates all fields prior to contact submission.
 */
export function validateContactForm(nameInput, emailInput, phoneInput) {
  let isValid = true;
  const nameVal = nameInput ? nameInput.value.trim() : "";
  const emailVal = emailInput ? emailInput.value.trim() : "";
  const phoneVal = phoneInput ? phoneInput.value.trim() : "";

  if (!nameVal) {
    markAsInvalid(nameInput);
    isValid = false;
  } else {
    clearInvalidState(nameInput);
  }
  if (!emailVal || !isValidEmailFormat(emailVal)) {
    markAsInvalid(emailInput);
    isValid = false;
  } else {
    clearInvalidState(emailVal);
  }
  if (!phoneVal) {
    markAsInvalid(phoneInput);
    isValid = false;
  } else {
    clearInvalidState(phoneVal);
  }

  return isValid;
}
