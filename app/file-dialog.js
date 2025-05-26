import { username } from "./account.js";
import { IMAGE_EXTENSIONS } from "./file-types.js";

/** @type HTMLDialogElement */
const fileDetailDialog = document.querySelector("#file-detail");
const actionArea = fileDetailDialog.querySelector("#file-action-area");
const fileDetailPath = fileDetailDialog.querySelector("#file-detail-path");
const fileDetailDownload = fileDetailDialog.querySelector("#file-detail-download");
const fileDetailShare = fileDetailDialog.querySelector("#file-detail-share");
const fileDetailDelete = fileDetailDialog.querySelector("#file-detail-delete");
fileDetailDialog.querySelector(".header > button")?.addEventListener("click", () => fileDetailDialog.close());

fileDetailShare?.addEventListener("click", () => {
    const url = `${location.protocol}//${window.location.host}/file.html?path=/${username}${currentDialogPath}`

    const pre = document.createElement("pre");
    pre.textContent = url;
    const copyButton = document.createElement("button");
    copyButton.classList.add("material-symbols-rounded");
    copyButton.textContent = "content_copy";
    copyButton.title = "Skopiuj do schowka";
    copyButton.addEventListener("click", () => navigator.clipboard.writeText(url))

    actionArea.className = "share";
    actionArea.replaceChildren(pre, copyButton);
});

fileDetailDelete?.addEventListener("click", () => {
    const confirmText = document.createElement("div");
    confirmText.classList.add("file-delete-text");
    confirmText.textContent = `Czy na pewno chcesz usunąć '${currentDialogPath}'?`;

    const confirmYes = document.createElement("button");
    confirmYes.classList.add("destructive", "file-delete-yes");
    confirmYes.textContent = "Usuń";
    confirmYes.addEventListener("click", () => {
        deleteFileFunc(currentDialogPath);
        fileDetailDialog.close();
    });

    const confirmNo = document.createElement("button");
    confirmNo.classList.add("file-delete-no");
    confirmNo.textContent = "Anuluj";
    confirmNo.addEventListener("click", () => {
        actionArea.className = "";
        actionArea.replaceChildren();
    })

    actionArea.className = "delete";
    actionArea.replaceChildren(confirmText, confirmYes, confirmNo);
})

/** @type string */
let currentDialogPath;
/**
 * @param {string} username
 * @param {string} path
 */
export function createFileDialog(username, path) {
    currentDialogPath = path;
    fileDetailPath.textContent = path;

    // preview
    const fileExtension = path.split(".").at(-1);
    const previousPreview = document.querySelector("#file-detail-preview");
    let preview;
    if (IMAGE_EXTENSIONS.has(fileExtension)) {
        preview = document.createElement("img");
        preview.id = "file-detail-preview";
        preview.src = `/data/${username}${path}`;
        preview.alt = `Podgląd pliku ${path}`;
    } else if (fileExtension == "txt") {
        // TODO: Add highlight.js here
        preview = document.createElement("pre");
        preview.id = "file-detail-preview";
        preview.textContent = "Ładowanie...";
        fetch(`/data/${username}${path}`)
            .then((res) => res.text())
            .then((text) => preview.textContent = text)
            .catch((e) => preview.textContent = `Wystąpił błąd: ${e.message}`);
    } else {
        preview = document.createElement("div");
        preview.id = "file-detail-preview";
        preview.textContent = "<brak>";
    }
    previousPreview.replaceWith(preview);

    actionArea.replaceChildren();

    if (fileDetailDownload) {
        fileDetailDownload.href = `/data/${username}${path}`;
    }
}

export function openFileDialog(path) {
    createFileDialog(username, path);
    fileDetailDialog.showModal();
}

// This is a hack, but I don't have time to make this not spaghetti.
// Set by file-browser.js.
/** @type (path: string) => void */
let deleteFileFunc;
export function setDeleteFileFunc(func) {
    deleteFileFunc = func;
}
