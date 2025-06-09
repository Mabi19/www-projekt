import init, { transform } from "https://cdn.jsdelivr.net/npm/lightningcss-wasm/+esm";
import * as esbuild from "https://deno.land/x/esbuild@v0.25.5/mod.js";
import { copy, ensureDir } from "jsr:@std/fs";

// @ts-expect-error types are wrong idk
await init();

const jsEntrypoints = new Set(["theme.js", "auth/login.js", "auth/account.js", "file-browser/file-browser.js", "file-browser/shared-file.js"]);

ensureDir("./dist/app");

async function visitDir(directory: string) {
    for await (const file of Deno.readDir("./app/" + directory)) {
        const fullPath = directory + file.name;
        if (file.isDirectory) {
            ensureDir("./dist/app/" + fullPath);
            await visitDir(directory + file.name + "/");
        } else {
            const ext = file.name.split(".").at(-1);
            if (ext === "js") {
                if (jsEntrypoints.has(fullPath)) {
                    await esbuild.build({
                        bundle: true,
                        format: "esm",
                        minify: true,
                        entryPoints: ["./app/" + fullPath],
                        outfile: "./dist/app/" + fullPath,
                    });
                }
            } else if (ext === "css") {
                const { code } = transform({
                    filename: fullPath,
                    code: new TextEncoder().encode(await Deno.readTextFile("./app/" + fullPath)),
                    minify: true,
                });
                await Deno.writeTextFile("./dist/app/" + fullPath, new TextDecoder().decode(code));
            } else {
                Deno.copyFile("./app/" + fullPath, "./dist/app/" + fullPath);
            }
        }
    }
}

await visitDir("");
await copy("./data", "./dist/data", { overwrite: true });
await copy("./server.ts", "./dist/server.ts", { overwrite: true });
await copy("./accounts.json", "./dist/accounts.json", { overwrite: true });

await esbuild.stop();
