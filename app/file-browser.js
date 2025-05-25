import { username } from "./account.js";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif"]);

const fileRoot = document.querySelector("#file-root");

function buildFileList(children, listElement, basePath = "/") {
    for (const entry of children) {
        const li = document.createElement("li");
        li.dataset.path = basePath + entry.name;

        let mainRow;
        if (entry.type === "file") {
            mainRow = document.createElement("div");

            li.appendChild(mainRow);
        } else if (entry.type === "directory") {
            const details = document.createElement("details");
            mainRow = document.createElement("summary");
            mainRow.classList.add("entry-main");
            details.appendChild(mainRow);

            const sublist = document.createElement("ul");
            sublist.classList.add("directory-list");
            buildFileList(entry.children, sublist, basePath + entry.name + "/");
            details.appendChild(sublist);

            li.appendChild(details);
        }
        mainRow.classList.add("entry-main");

        if (entry.type == "directory") {
            const iconClosed = document.createElement("span");
            iconClosed.classList.add("material-symbols-rounded", "directory-icon-closed");
            iconClosed.textContent = "folder";

            const iconOpen = document.createElement("span");
            iconOpen.classList.add("material-symbols-rounded", "directory-icon-open");
            iconOpen.textContent = "folder_open";

            mainRow.append(iconClosed, iconOpen);

            const name = document.createElement("span");
            name.textContent = entry.name;
            mainRow.appendChild(name);
        } else {
            const icon = document.createElement("span");
            icon.classList.add("material-symbols-rounded");
            const fileExtension = entry.name.split(".").at(-1);
            if (IMAGE_EXTENSIONS.has(fileExtension)) {
                icon.classList.add("icon-picture");
                icon.textContent = "image";
            } else {
                icon.textContent = "draft";
            }

            mainRow.appendChild(icon);

            const name = document.createElement("button");
            name.classList.add("filename");
            name.addEventListener("click", openFileDialog);
            name.textContent = entry.name;
            mainRow.appendChild(name);
        }

        listElement.appendChild(li);
    }
}

/** @type HTMLDialogElement */
const fileDetailDialog = document.querySelector("#file-detail");
const fileDetailPath = fileDetailDialog.querySelector("#file-detail-path");
const fileDetailDownload = fileDetailDialog.querySelector("#file-detail-download");
const fileDetailShare = fileDetailDialog.querySelector("#file-detail-share");
const fileDetailDelete = fileDetailDialog.querySelector("#file-detail-delete");
let currentDialogPath;
/** @param {MouseEvent} ev */
function openFileDialog(ev) {
    // find the main list item for its data-path
    /** @type HTMLElement */
    let mainElement = ev.target;
    while (!("path" in mainElement.dataset)) {
        mainElement = mainElement.parentElement;
    }
    const path = mainElement.dataset.path;
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

    fileDetailDownload.href = `/data/${username}${path}`;

    fileDetailDialog.showModal();
}
fileDetailDialog.querySelector(".header > button").addEventListener("click", () => fileDetailDialog.close());

let data;
try {
    const response = await fetch("/list");
    if (!response.ok) {
        if (response.status == 401) {
            window.location.href = "/";
        } else {
            alert("Wystąpił błąd! " + await response.text());
        }
    }
    data = await response.json();

    fileRoot.replaceChildren();
    buildFileList(data, fileRoot);
} catch (e) {
    alert("Wystąpił błąd podczas ładowania danych");
    console.error(e);
}
