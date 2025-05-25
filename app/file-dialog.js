import { IMAGE_EXTENSIONS } from "./file-types.js";

/** @type HTMLDialogElement */
const fileDetailDialog = document.querySelector("#file-detail");
const fileDetailPath = fileDetailDialog.querySelector("#file-detail-path");
const fileDetailDownload = fileDetailDialog.querySelector("#file-detail-download");
const fileDetailShare = fileDetailDialog.querySelector("#file-detail-share");
const fileDetailDelete = fileDetailDialog.querySelector("#file-detail-delete");
fileDetailDialog.querySelector(".header > button")?.addEventListener("click", () => fileDetailDialog.close());

let currentDialogPath;
/** @param {string} fullPath */
export function createFileDialog(fullPath) {
    currentDialogPath = fullPath;
    fileDetailPath.textContent = fullPath;

    // preview
    const fileExtension = fullPath.split(".").at(-1);
    const previousPreview = document.querySelector("#file-detail-preview");
    let preview;
    if (IMAGE_EXTENSIONS.has(fileExtension)) {
        preview = document.createElement("img");
        preview.id = "file-detail-preview";
        preview.src = `/data/${fullPath}`;
        preview.alt = `Podgląd pliku ${fullPath}`;
    } else if (fileExtension == "txt") {
        // TODO: Add highlight.js here
        preview = document.createElement("pre");
        preview.id = "file-detail-preview";
        preview.textContent = "Ładowanie...";
        fetch(`/data/${fullPath}`)
            .then((res) => res.text())
            .then((text) => preview.textContent = text)
            .catch((e) => preview.textContent = `Wystąpił błąd: ${e.message}`);
    } else {
        preview = document.createElement("div");
        preview.id = "file-detail-preview";
        preview.textContent = "<brak>";
    }
    previousPreview.replaceWith(preview);

    if (fileDetailDownload) {
        fileDetailDownload.href = `/data/${fullPath}`;
    }
}

export function openFileDialog(username, path) {
    createFileDialog(username + path);
    fileDetailDialog.showModal();
}
