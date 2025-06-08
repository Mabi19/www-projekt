const loginForm = document.querySelector("#login");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const resultBox = document.querySelector("#result");

function setResult(str) {
    if (str) {
        resultBox.textContent = str;
        resultBox.classList.remove("hidden");
    } else {
        resultBox.classList.add("hidden");
    }
}

usernameInput.addEventListener("input", () => resultBox.classList.add("hidden"));
passwordInput.addEventListener("input", () => resultBox.classList.add("hidden"));

loginForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;
    if (!username) {
        setResult("Nazwa użytkownika jest wymagana");
        return;
    }

    if (!password) {
        setResult("Hasło jest wymagane");
    }

    const res = await fetch("/login", { method: "POST", body: JSON.stringify({ username, password }) });
    if (res.ok) {
        window.location.href = "./browse.html";
    } else {
        if (res.status == 401) {
            setResult("Niepoprawny login lub hasło");
        } else {
            setResult("Nieznany błąd :(");
        }
    }
});

const userCookie = document.cookie.split("; ").find((entry) => entry.startsWith("user="))?.split("=")?.[1];
if (userCookie) {
    window.location.href = "./browse.html";
}
