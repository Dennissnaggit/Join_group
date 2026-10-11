/** Verknüpft Eingabe und Umschaltbutton und gibt die Funktion zum Aktualisieren des Symbols zurück.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 * @param {HTMLButtonElement} toggleButton - Button für die Passwortanzeige.
 * @returns {Function} Funktion zur Aktualisierung des Symbols.
 */
export function setupPasswordToggle(input, toggleButton) {
  if (!input || !toggleButton) return () => {};

  // Das Symbol zeigt an, ob das Passwortfeld Text enthält.
  const updateIcon = () => updatePasswordIcon(input, toggleButton);

  input.addEventListener("input", updateIcon);
  toggleButton.addEventListener("click", () => togglePasswordVisibility(input, toggleButton));

  updateIcon();
  return updateIcon;
}


/** Wechselt die Passwortsichtbarkeit und aktualisiert Buttonzustand und Beschriftung für Screenreader.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 * @param {HTMLButtonElement} toggleButton - Button für die Passwortanzeige.
 */
function togglePasswordVisibility(input, toggleButton) {
  const passwordIsVisible = input.type === "text";
  input.type = passwordIsVisible ? "password" : "text";
  toggleButton.setAttribute("aria-pressed", String(!passwordIsVisible));
  toggleButton.setAttribute(
    "aria-label",
    passwordIsVisible ? "Passwort anzeigen" : "Passwort verbergen"
  );
  input.focus();
}


/** Aktualisiert das Symbol anhand des Feldinhalts.
 * @param {HTMLInputElement} input - Zu bearbeitendes Eingabefeld.
 * @param {HTMLButtonElement} toggleButton - Button für die Passwortanzeige.
 */
function updatePasswordIcon(input, toggleButton) {
  toggleButton.classList.toggle("password-toggle--has-value", input.value.length > 0);
}
