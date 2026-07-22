/**
 * Help page initialization
 */
function initHelp() {
  checkExternalView();
  console.log("Help section initialized.");
}

/**
 * Avoids ReferenceError if checkExternalView is called during init
 */
function checkExternalView() {
    // Si necesitas que haga algo específico al cargar desde fuera, poné el código acá.
    // De lo contrario, dejar vacío evita el error en la consola.
}