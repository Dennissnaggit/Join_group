export const taskElements = {
  form: document.getElementById("addTaskForm"),
  clearButton: document.querySelector(".clearBtn"),
  message: document.getElementById("taskAddedMessage"),
  title: document.getElementById("TitleOfTask"),
  description: document.getElementById("exampleFormControlTextarea1"),
  dueDate: document.getElementById("exampleFormControlInput1"),
  category: document.getElementById("category"),
  categoryToggle: document.getElementById("categoryToggle"),
  categoryOptions: document.getElementById("categoryOptions"),
  categoryText: document.getElementById("categorySelectedText"),
  categoryWrapper: document.getElementById("categoryDropdownWrapper"),
  subtaskInput: document.getElementById("subtaskInput"),
  subtaskActions: document.getElementById("inputActions"),
  subtaskList: document.getElementById("subtaskList"),
  subtaskError: document.getElementById("subtaskError"),
  assignedToggle: document.getElementById("assignedToToggle"),
  assignedDropdown: document.getElementById("assignedToDropdown"),
  assignedSearch: document.getElementById("assignedToSearch"),
  assignedOptions: document.getElementById("assignedToOptions"),
  assignedSelected: document.getElementById("assignedToSelected"),
};


/** Kopiert ein statisches HTML-Template für einen dynamischen Eintrag.
 * @param {string} templateId - ID des HTML-Templates.
 * @returns {HTMLElement} Kopie des Template-Elements.
 */
export function cloneTaskTemplate(templateId) {
  return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
}
