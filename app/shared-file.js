import { createFileDialog } from "./file-dialog.js";

const path = new URL(window.location).searchParams.get("path");
if (path) {
    createFileDialog(path);
}
