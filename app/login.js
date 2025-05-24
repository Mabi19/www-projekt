const loginForm = document.querySelector("#login");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");

loginForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    const res = await fetch("/login", { method: "POST", body: JSON.stringify({ username, password }) });
    if (res.ok) {
        window.location.href = "./browse.html";
    } else {
        let resultBox = loginForm.querySelector("#result");
        if (!resultBox) {
            resultBox = document.createElement("div");
            resultBox.id = "result";
            loginForm.appendChild(resultBox);
        }

        if (res.status == 401) {
            resultBox.textContent = "Niepoprawny login lub hasło";
        } else {
            resultBox.textContent = "Nieznany błąd :(";
        }
    }
});

const userCookie = document.cookie.split("; ").find((entry) => entry.startsWith("user="))?.split("=")?.[1];
if (userCookie) {
    window.location.href = "./browse.html";
}
