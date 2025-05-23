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
            buildFileList(entry.children, sublist);
            details.appendChild(sublist);

            li.appendChild(details);
        }
        mainRow.classList.add("entry-main");

        const icon = document.createElement("span");
        icon.textContent = entry.type;
        mainRow.appendChild(icon);
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
