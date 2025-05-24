export const username = document.cookie.split("; ").find((entry) => entry.startsWith("user=")).split("=").at(-1);

document.querySelector("#account-username").textContent = username;
document.querySelector("#logout-button").addEventListener("click", () => {
    document.cookie = "user=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/"
})
