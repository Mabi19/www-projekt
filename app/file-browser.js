import { username } from "./account.js";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif"]);

const fileRoot = document.querySelector("#file-root");

let sortDirection = localStorage.getItem("sort-direction") ?? "ascending";
let folderPosition = localStorage.getItem("folder-position") ?? "start";
/** @type HTMLFormElement */
const sortForm = document.querySelector("#controls-sorting");
const sortRadio = sortForm.elements.namedItem("sort-direction");
const folderRadio = sortForm.elements.namedItem("folder-position");
sortRadio.value = sortDirection;
folderRadio.value = folderPosition;
sortRadio.forEach((/** @type HTMLInputElement */ el) => {
    el.addEventListener("change", (ev) => {
        sortDirection = ev.target.value;
        localStorage.setItem("sort-direction", sortDirection);
        sortAllFileLists();
    });
});
folderRadio.forEach((/** @type HTMLInputElement */ el) => {
    el.addEventListener("change", (ev) => {
        folderPosition = ev.target.value;
        localStorage.setItem("folder-position", folderPosition);
        sortAllFileLists();
    });
});

/** @type HTMLInputElement */
const searchInput = document.querySelector("#file-search");
const searchNothingFoundBox = document.querySelector("#search-nothing-found");
searchInput.value = "";
searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value;
    if (searchTerm === "") {
        for (const entry of fileRoot.querySelectorAll("li")) {
            entry.classList.remove("search-hidden");
        }
        searchNothingFoundBox.remove("shown");
    } else {
        const anythingFound = filterFileList(fileRoot, searchTerm);
        if (!anythingFound) {
            searchNothingFoundBox.classList.add("shown");
        } else {
            searchNothingFoundBox.classList.remove("shown");
        }
    }
});

/**
 * @param {HTMLUListElement} list
 * @param {string} searchTerm
 */
function filterFileList(list, searchTerm) {
    let anythingInListPasses = false;
    for (const li of list.children) {
        if (li.dataset.path.includes(searchTerm)) {
            anythingInListPasses = true;
            li.classList.remove("search-hidden");
        } else {
            if (li.dataset.type === "file") {
                // Non-matching files just get hidden.
                li.classList.add("search-hidden");
            } else {
                // Non-matching directories should show if they have some shown content.
                // li -> details -> ul
                const sublist = li.querySelector(":scope > details > ul");
                if (!filterFileList(sublist, searchTerm)) {
                    li.classList.add("search-hidden");
                } else {
                    anythingInListPasses = true;
                    li.classList.remove("search-hidden");
                    // this is shown only because of the content;
                    // if the search term's long enough, we can helpfully reveal it
                    if (searchTerm.length >= 4) {
                        /** @type HTMLDetailsElement */
                        const details = sublist.parentElement;
                        details.open = true;
                    }
                }
            }
        }
    }

    return anythingInListPasses;
}

function buildFileList(children, listElement, basePath = "/") {
    for (const entry of children) {
        const li = document.createElement("li");
        li.dataset.path = basePath + entry.name;
        li.dataset.type = entry.type;

        let mainRow;
        if (entry.type === "file") {
            mainRow = document.createElement("button");
            mainRow.classList.add("raw");
            mainRow.addEventListener("click", openFileDialog);

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

            const name = document.createElement("span");
            name.classList.add("filename");
            name.textContent = entry.name;
            mainRow.appendChild(name);
        }

        listElement.appendChild(li);
    }
}

/** @param {HTMLUListElement} list */
function sortFileList(list) {
    const listItems = Array.from(list.children);
    listItems.sort((/** @type HTMLLIElement */ a, /** @type HTMLLIElement */ b) => {
        const aType = a.dataset.type;
        const bType = b.dataset.type;
        const nameResult = a.dataset.path.localeCompare(b.dataset.path) * (sortDirection == "ascending" ? 1 : -1);

        if (folderPosition == "mixed") {
            return nameResult;
        } else if (folderPosition === "start" || folderPosition === "end") {
            if (aType === bType) {
                return nameResult;
            }

            if (aType === "directory") {
                // only a is a directory
                return folderPosition === "start" ? -1 : 1;
            } else {
                // only b is a directory
                return folderPosition === "start" ? 1 : -1;
            }
        }
    });
    list.replaceChildren(...listItems);
}

function sortAllFileLists() {
    sortFileList(fileRoot);
    fileRoot.querySelectorAll(".directory-list").forEach((el) => sortFileList(el));
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
    sortAllFileLists(fileRoot);
} catch (e) {
    alert("Wystąpił błąd podczas ładowania danych");
    console.error(e);
}
