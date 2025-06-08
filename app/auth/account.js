export const username = document.cookie.split("; ").find((entry) => entry.startsWith("user=")).split("=").at(-1);

const usernameElement = document.querySelector("#account-username");
const logoutButton = document.querySelector("#logout-button");
if (usernameElement) {
    usernameElement.textContent = username;
    logoutButton.addEventListener("click", () => {
        document.cookie = "user=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/"
    })
}
