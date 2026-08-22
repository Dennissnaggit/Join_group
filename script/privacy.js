/**
 * Avoids ReferenceError if checkExternalView is called during init
 */
function checkExternalView() {
 
}

/**
* Initializes the Privacy Policy page.
* Waits for the Sidebar and Header to load before displaying the content.
*/
async function initPrivacy() {
 
    if (typeof includeHTML === 'function') {
        await includeHTML();
    }

    requestAnimationFrame(() => {
        const appShell = document.querySelector('.app-shell');
        if (appShell) {
            appShell.classList.remove('loading');
        }
    });
}