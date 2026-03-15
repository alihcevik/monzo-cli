import { createServer, type Server } from "node:http";

interface CallbackResult {
  code: string;
  state: string;
}

export function startCallbackServer(
  port: number,
  expectedState: string,
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    let server: Server;

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("OAuth callback timed out after 2 minutes."));
    }, 120_000);

    server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        res.writeHead(400);
        res.end("Missing code or state parameter.");
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400);
        res.end("State mismatch — possible CSRF attack.");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html><body style="font-family:system-ui;text-align:center;padding:3rem">
<h1>Authenticated!</h1>
<p>You can close this tab and return to your terminal.</p>
</body></html>`);

      clearTimeout(timeout);
      server.close();
      resolve({ code, state });
    });

    server.listen(port, "127.0.0.1", () => {
      // Server ready
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
