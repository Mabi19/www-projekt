let darkModeQuery = matchMedia("(prefers-color-scheme: dark)");

let dialogModule;
import("./dialog.js").then((mod) => dialogModule = mod);

function updateTheme() {
    const THEMES = new Set(["light", "dark", "auto"]);
    const ACCENT_COLORS = new Set(["green", "purple", "pink"]);

    let theme = localStorage.getItem("theme");
    if (!THEMES.has(theme)) {
        theme = "auto";
    }
    if (theme === "auto") {
        theme = darkModeQuery.matches ? "dark" : "light";
    }

    let accentColor = localStorage.getItem("accent");
    if (!ACCENT_COLORS.has(accentColor)) {
        accentColor = "green";
    }

    document.documentElement.className = "";
    document.documentElement.classList.add(`theme-${theme}`, `accent-${accentColor}`);
};

updateTheme();

document.addEventListener("DOMContentLoaded", () => {
    /** @type HTMLDialogElement */
    const settingsDialog = document.querySelector("#settings");
    if (settingsDialog) {
        /** @type HTMLSelectElement */
        const themeSelect = settingsDialog.querySelector("#theme");
        /** @type HTMLSelectElement */
        const accentSelect = settingsDialog.querySelector("#accent-color");

        themeSelect.value = localStorage.getItem("theme") ?? "auto";
        accentSelect.value = localStorage.getItem("accent") ?? "green";
        themeSelect.addEventListener("change", () => {
            localStorage.setItem("theme", themeSelect.value);
            updateTheme();
        });
        accentSelect.addEventListener("change", () => {
            localStorage.setItem("accent", accentSelect.value);
            updateTheme();
        });

        /** @type HTMLButtonElement */
        const closeButton = settingsDialog.querySelector(".header > button");
        closeButton.addEventListener("click", () => dialogModule.closeDialogModal(settingsDialog));
    }

    const settingsButton = document.querySelector("#settings-button");
    settingsButton?.addEventListener("click", () => dialogModule.openDialogModal(settingsDialog));
});
