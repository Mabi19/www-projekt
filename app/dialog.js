/** @param {HTMLDialogElement} dialog */
export function openDialogModal(dialog) {
    dialog.showModal();
    dialog.classList.add("opening");
    dialog.addEventListener("animationend", () => {
        dialog.classList.remove("opening");
    }, { once: true });
}

/** @param {HTMLDialogElement} dialog */
export function closeDialogModal(dialog) {
    dialog.classList.add("closing");
    dialog.addEventListener("animationend", () => {
        dialog.classList.remove("closing")
        dialog.close();
    }, { once: true });
}
