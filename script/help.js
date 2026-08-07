/**
 * Help page initialization
 */
async function initHelp() {
  await init();
  checkExternalView();
  console.log("Help section initialized.");
}

/**
 * Avoids ReferenceError if checkExternalView is called during init
 */
function checkExternalView() {
    
}