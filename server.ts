import { Hono } from "jsr:@hono/hono@4.7.10";
import { getCookie, setCookie } from "jsr:@hono/hono@4.7.10/cookie";
import { serveStatic } from "jsr:@hono/hono@4.7.10/deno";
import { HTTPException } from "jsr:@hono/hono@4.7.10/http-exception";
import accounts from "./accounts.json" with { type: "json" };

interface FileEntry {
    type: "file";
    name: string;
}

interface DirectoryEntry {
    type: "directory";
    name: string;
    children: ListEntry[];
}

type ListEntry = FileEntry | DirectoryEntry;

async function getFileList(path: string) {
    const result: ListEntry[] = [];
    for await (const entry of Deno.readDir(path)) {
        if (entry.isFile) {
            result.push({ type: "file", name: entry.name });
        } else if (entry.isDirectory) {
            result.push({ type: "directory", name: entry.name, children: await getFileList(`${path}/${entry.name}`) })
        }
    }
    return result;
}

const app = new Hono();
app.post("/login", async (c) => {
    const { username, password } = await c.req.json();

    if (typeof username != "string" || typeof password != "string") {
        throw new HTTPException(400);
    }
    if ((accounts as Record<string, string>)[username] != password) {
        throw new HTTPException(401);
    }
    setCookie(c, "user", username, { maxAge: 3 * 24 * 60 * 60 });
    return c.body(null, 204);
});
app.get("/list", async (c) => {
    const username = getCookie(c, "user");
    if (!username) {
        throw new HTTPException(401);
    }

    return c.json(await getFileList(`./data/${username}`));
})
app.post("/upload", async (c) => {
    const username = getCookie(c, "user");
    if (!username) {
        throw new HTTPException(401);
    }

    const { name, "target-folder": targetFolder, data } = await c.req.parseBody();
    if (typeof name !== "string" || typeof targetFolder !== "string" || !(data instanceof File)) {
        throw new HTTPException(400);
    }

    if (!targetFolder.startsWith("/")) {
        throw new HTTPException(400);
    }

    const [namePre, ...nameRest] = name.split(".");
    const nameExt = nameRest ? "." + nameRest.join(".") : "";
    for (let counter = 0; counter < 16; counter++) {
        const dedupedName = counter > 0 ? `${namePre} (${counter})` : namePre;
        const path = `./data/${username}${targetFolder}/${dedupedName}${nameExt}`;
        try {
            await Deno.writeFile(path, await data.bytes(), { createNew: true });
            // success!
            return c.json([{ type: "create", folder: targetFolder, name: `${dedupedName}${nameExt}`, entryType: "file" }]);
        } catch (_) {
            // name is already used up
            continue;
        }
    }

    throw new HTTPException(500);
});
app.post("/mkdir", async (c) => {
    const username = getCookie(c, "user");
    if (!username) {
        throw new HTTPException(401);
    }

    const { name, "target-folder": targetFolder } = await c.req.parseBody();
    if (typeof name !== "string" || typeof targetFolder !== "string") {
        throw new HTTPException(400);
    }

    if (!targetFolder.startsWith("/")) {
        throw new HTTPException(400);
    }

    try {
        await Deno.mkdir(`./data/${username}${targetFolder}/${name}`);
        return c.json([{ type: "create", folder: targetFolder, name, entryType: "directory" }]);
    } catch (_) {
        return c.text("ERR_ALREADY_EXISTS", 409);
    }
});
app.post("/delete", async (c) => {
    const username = getCookie(c, "user");
    if (!username) {
        throw new HTTPException(401);
    }

    const { path } = await c.req.parseBody();
    if (typeof path !== "string" || !path.startsWith("/")) {
        throw new HTTPException(400);
    }

    try {
        await Deno.remove(`./data/${username}${path}`);
        return c.json([{ type: "remove", path }]);
    } catch (_) {
        return c.text("ERR_NOT_FOUND", 404);
    }
});
app.post("/move", async (c) => {
    const username = getCookie(c, "user");
    if (!username) {
        throw new HTTPException(401);
    }

    const { from, to } = await c.req.parseBody();
    if (typeof from !== "string" || typeof to !== "string") {
        throw new HTTPException(400);
    }

    try {
        await Deno.stat(`./data/${username}${from}`);
    } catch (_) {
        return c.text("ERR_NOT_FOUND", 404);
    }

    try {
        await Deno.stat(`./data/${username}${to}`);
        return c.text("ERR_ALREADY_EXISTS", 409);
    } catch (_) {
        // this space intentionally left blank
    }

    await Deno.rename(`./data/${username}${from}`, `./data/${username}${to}`);
    return c.json([
        { type: "move", from, to },
    ])
})
app.use("/data/*", serveStatic({ root: "./" }));
app.use("*", serveStatic({ root: "./app" }));
Deno.serve(app.fetch);
