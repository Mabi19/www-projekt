const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif"]);

const fileRoot = document.querySelector("#file-root");

function buildFileList(children, listElement) {
    for (const entry of children) {
        const li = document.createElement("li");

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
            buildFileList(entry.children, sublist);
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
        }


        const name = document.createElement("span");
        name.textContent = entry.name;
        mainRow.appendChild(name);

        listElement.appendChild(li);
    }
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
} catch (e) {
    alert("Wystąpił błąd podczas ładowania danych");
    console.error(e);
}
