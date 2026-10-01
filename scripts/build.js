import { cp, mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
async function check(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${item.name}`;
    if (item.isDirectory()) await check(path);
    else if (item.name.endsWith(".js"))
      execFileSync(process.execPath, ["--check", path], { stdio: "inherit" });
  }
}
await check("server");
await check("scripts");
await mkdir("public", { recursive: true });
await cp("server/public", "public", { recursive: true });
console.log("JavaScript checked. Browser assets copied to public/.");
