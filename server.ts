import { Hono } from "jsr:@hono/hono@4.7.10";
import { setCookie } from "jsr:@hono/hono@4.7.10/cookie";
import { serveStatic } from "jsr:@hono/hono@4.7.10/deno";
import { HTTPException } from "jsr:@hono/hono@4.7.10/http-exception";
import accounts from "./accounts.json" with { type: "json" };

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
app.use("*", serveStatic({ root: "./app" }))
Deno.serve(app.fetch);
