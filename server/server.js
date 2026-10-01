import { app } from "./app.js";
import { readConfig } from "./config.js";

const port = Number(process.env.PORT || 3001);
if (!process.env.VERCEL) {
  // Production deployments sit behind a proxy and must accept connections from
  // it; `security()` still rejects any request whose Host is not APP_URL.
  // Local development stays loopback-only.
  const host = readConfig().production ? "0.0.0.0" : "127.0.0.1";
  app.listen(port, host, () => {
    console.log(
      `APT API: http://${host === "0.0.0.0" ? "localhost" : host}:${port}`,
    );
  });
}
export default app;
