import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

// Lee/guarda las claves en el archivo .env de la carpeta (no se sube a GitHub). Sin dependencias.
export function loadEnv(root) {
  const f = path.join(root, ".env");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
export function saveEnv(root, name, value) {
  const f = path.join(root, ".env");
  const lines = existsSync(f) ? readFileSync(f, "utf8").split(/\r?\n/).filter((l) => l.trim() && !l.startsWith(name + "=")) : [];
  lines.push(`${name}=${value}`);
  writeFileSync(f, lines.join("\n") + "\n", { mode: 0o600 });
  process.env[name] = value;
}
