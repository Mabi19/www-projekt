import { username } from "../auth/account.js"

export function getShareURL(path) {
    return `${location.protocol}//${window.location.host}/file.html?path=/${username}${path}`
}
