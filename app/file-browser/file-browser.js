import { closeDialogModal, openDialogModal } from "../dialog.js";
import { setUpFolderAnimations } from "./details-anim.js";
import { openFileDialog, setDeleteFileFunc, setRenameFileFunc } from "./file-dialog.js";
import { IMAGE_EXTENSIONS } from "./file-types.js";

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

/** @type HTMLInputElement */
const uploadFileInput = document.querySelector("#upload-file-input");
const uploadButton = document.querySelector("#upload-button");
uploadButton.addEventListener("click", () => uploadFileInput.click());
uploadFileInput.addEventListener("change", () => {
    const file = uploadFileInput.files[0];
    if (!file) {
        return;
    }

    uploadButton.disabled = true;
    const fd = new FormData();
    fd.append("name", file.name);
    fd.append("target-folder", "/");
    fd.append("data", file);
    fetch("/upload", { method: "POST", body: fd })
        .then((response) => response.json())
        .then((result) => {
            uploadButton.disabled = false;
            applyFileDiff(result);
        })
        .catch((e) => {
            console.log(e);
            alert("Wystąpił błąd podczas wgrywania pliku.");
            uploadButton.disabled = false;
        });
});

const createFolderDialog = document.querySelector("#create-folder");
/** @type HTMLFormElement */
const createFolderForm = document.querySelector("#create-folder-form");
const createFolderNameInput = createFolderForm.elements.namedItem("new-folder-name");
const createFolderResult = document.querySelector("#create-folder-result");
const createFolderButton = document.querySelector("#create-folder-button");
createFolderForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    createFolderButton.disabled = true;

    const name = createFolderNameInput.value;

    const fd = new FormData();
    fd.append("name", name);
    fd.append("target-folder", "/");
    fetch("/mkdir", { method: "POST", body: fd })
        .then(async (response) => {
            if (response.status === 409) {
                // Conflict
                createFolderResult.textContent = "Folder o takiej nazwie już istnieje.";
            } else {
                applyFileDiff(await response.json());
                closeDialogModal(createFolderDialog);
            }
            createFolderButton.disabled = false;
        })
        .catch((e) => {
            console.log(e);
            alert("Wystąpił błąd podczas wgrywania pliku.");
            createFolderButton.disabled = false;
        });
});
createFolderButton.addEventListener("click", () => {
    createFolderNameInput.value = "";
    createFolderResult.textContent = "";
    openDialogModal(createFolderDialog);
});
createFolderDialog.querySelector(".header > button").addEventListener("click", () => closeDialogModal(createFolderDialog));

function deleteFileByListItem(li) {
    const path = li.dataset.path;
    const fd = new FormData();
    fd.append("path", path);
    fetch("/delete", { method: "POST", body: fd })
        .then(async (response) => {
            if (response.status === 404) {
                // Not Found
                alert("Błąd: taki plik nie istnieje");
            } else {
                applyFileDiff(await response.json());
            }
        }).catch((e) => {
            console.log(e);
            alert("Wystąpił błąd podczas usuwania pliku");
        })
}
// Fill in the file-dialog.js's callback. Unfortunately I don't have time to refactor this properly.
setDeleteFileFunc((path) => {
    const li = fileRoot.querySelector(`li[data-path="${CSS.escape(path)}"]`);
    deleteFileByListItem(li);
});

function moveByListItem(li, destination) {
    console.log(destination);
    const from = li.dataset.path;
    const fd = new FormData();
    fd.append("from", from);
    fd.append("to", destination);
    fetch("/move", { method: "POST", body: fd })
        .then(async (response) => {
            if (response.status === 404) {
                // Not Found
                alert("Błąd: taki plik nie istnieje");
            } else if (response.status == 409) {
                // Conflict
                alert("Błąd: już istnieje plik o takiej nazwie");
            } else {
                applyFileDiff(await response.json());
            }
        });
}

setRenameFileFunc((path, newName) => {
    const li = fileRoot.querySelector(`li[data-path="${CSS.escape(path)}"]`);
    const splitOldPath = path.split("/");
    const newPath = [...splitOldPath.slice(0, -1), newName].join("/");
    moveByListItem(li, newPath);
})

/**
 * @typedef {{ type: "create", folder: string, name: string, entryType: string }} CreateInstruction
 * @typedef {{ type: "remove", path: string }} RemoveInstruction
 * @typedef {{ type: "move", from: string, to: string }} MoveInstruction
 * @typedef {Array<CreateInstruction | RemoveInstruction | MoveInstruction>} InstructionList
 */

/**
 * Apply some instructions from the server onto the file view DOM.
 * @param {InstructionList} diff The instructions from the server.
 */
function applyFileDiff(diff) {
    for (const instruction of diff) {
        switch (instruction.type) {
            case "create":
                const { folder, name, entryType } = instruction;
                const folderList = folder === "/" ? fileRoot : fileRoot.querySelector(`li[data-path="${CSS.escape(folder)}"] > details > ul.directory-list`);
                console.log(folderList);
                const newLi = makeFileEntry(folder, {
                    name,
                    type: entryType,
                    // not necessary if file, but doesn't hurt
                    children: [],
                });
                folderList.appendChild(newLi);
                sortFileList(folderList);
                // intentionally not re-filtering: a newly uploaded file not showing would be weird
                break;
            case "remove":
                const { path } = instruction;
                const removedLi = fileRoot.querySelector(`li[data-path="${CSS.escape(path)}"]`);
                removedLi.remove();
                // removing will never break sorting
                break;
            case "move":
                const { from, to } = instruction;
                const movedLi = fileRoot.querySelector(`li[data-path="${CSS.escape(from)}"]`);
                if (movedLi.dataset.type === "directory") {
                    alert("Przenoszenie folderów nie jest wspierane");
                    break;
                }
                movedLi.dataset.path = to;
                movedLi.remove();

                const splitNewPath = to.split("/");
                const folderPath = splitNewPath.slice(0, -1).join("/");
                const newName = splitNewPath.at(-1);
                movedLi.querySelector(".filename").textContent = newName;
                const targetFolderList = folderPath === "" ? fileRoot : fileRoot.querySelector(`li[data-path="${CSS.escape(folderPath)}"] > details > ul.directory-list`);
                targetFolderList.appendChild(movedLi);
                sortFileList(targetFolderList);
                break;
            default:
                console.log(instruction);
                alert("Unimplemented server command of type " + instruction.type);
                break;
        }
    }
}

/**
 * @param {string} basePath The path to the working directory
 * @param entry The file entry to create.
 * @return {HTMLLIElement} The resulting HTML element.
 */
function makeFileEntry(basePath, entry) {
    const li = document.createElement("li");
    li.dataset.path = basePath + entry.name;
    li.dataset.type = entry.type;

    let mainRow;
    // build out the general structure
    if (entry.type === "file") {
        mainRow = document.createElement("button");
        mainRow.classList.add("raw");
        mainRow.addEventListener("click", () => openFileDialog(li.dataset.path));

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
        setUpFolderAnimations(details);

        const emptyOptions = document.createElement("div");
        emptyOptions.classList.add("directory-empty-options");

        const emptyOptionsText = document.createElement("span");
        emptyOptionsText.textContent = "Ten folder jest pusty.";
        emptyOptions.appendChild(emptyOptionsText);

        const emptyOptionsButton = document.createElement("button");
        emptyOptionsButton.classList.add("destructive");
        const emptyOptionsButtonIcon = document.createElement("span");
        emptyOptionsButtonIcon.classList.add("material-symbols-rounded");
        emptyOptionsButtonIcon.textContent = "delete";
        emptyOptionsButton.appendChild(emptyOptionsButtonIcon);
        const emptyOptionsButtonText = document.createElement("span");
        emptyOptionsButtonText.textContent = "Usuń";
        emptyOptionsButton.appendChild(emptyOptionsButtonText);

        emptyOptionsButton.addEventListener("click", () => deleteFileByListItem(li));
        emptyOptions.appendChild(emptyOptionsButton);

        details.appendChild(emptyOptions);

        li.appendChild(details);
    }
    mainRow.classList.add("entry-main");

    // fill stuff in
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

    // drag-and-drop
    if (entry.type === "file") {
        li.draggable = true;
        li.addEventListener("dragstart", (ev) => {
            li.classList.add("dragged");
            // This class activates hidden ::after's over all the elements, which take inputs for dropping.
            fileRoot.parentElement.classList.add("drag-active");
            ev.dataTransfer.setData("application/x.ustronny-sejf-file", li.dataset.path);
            ev.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", () => {
            li.classList.remove("dragged");
            fileRoot.parentElement.classList.remove("drag-active");
        })
    } else {
        makeDropZone(li);
        li.addEventListener("drop", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const sourcePath = ev.dataTransfer.getData("application/x.ustronny-sejf-file");
            console.log("drop", sourcePath);
            li.firstElementChild.open = true;
            li.classList.remove("drag-over");

            const movedLi = fileRoot.querySelector(`li[data-path="${CSS.escape(sourcePath)}"]`);
            const sourceName = sourcePath.split("/").at(-1);
            const destDir = li.dataset.path;
            const destPath = destDir + "/" + sourceName;
            if (sourcePath === destPath) {
                return;
            }
            console.log("source", movedLi, "dest", li);
            moveByListItem(movedLi, destPath);
        })
    }

    return li;
}

function makeDropZone(elem) {
    elem.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        ev.dataTransfer.effectAllowed = "move";
    });
    elem.addEventListener("dragenter", () => { elem.classList.add("drag-over") });
    elem.addEventListener("dragleave", () => { elem.classList.remove("drag-over") });
}
makeDropZone(fileRoot);
fileRoot.addEventListener("drop", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const sourcePath = ev.dataTransfer.getData("application/x.ustronny-sejf-file");
    console.log("drop", sourcePath);
    // the root is non-expandable
    // fileRoot.firstElementChild.open = true;
    fileRoot.classList.remove("drag-over");

    const movedLi = fileRoot.querySelector(`li[data-path="${CSS.escape(sourcePath)}"]`);
    const sourceName = sourcePath.split("/").at(-1);
    const destPath = "/" + sourceName;
    if (sourcePath === destPath) {
        return;
    }
    console.log("source", movedLi, "dest", fileRoot);
    moveByListItem(movedLi, destPath);
});

function buildFileList(children, listElement, basePath = "/") {
    for (const entry of children) {
        const li = makeFileEntry(basePath, entry);
        listElement.appendChild(li);
    }
}

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
