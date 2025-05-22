let darkModeQuery = matchMedia("(prefers-color-scheme: dark)");

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

    const htmlClasses = document.documentElement.classList;
    for (const cls of htmlClasses) {
        htmlClasses.remove(cls);
    }
    htmlClasses.add(`theme-${theme}`, `accent-${accentColor}`);
};

updateTheme();
