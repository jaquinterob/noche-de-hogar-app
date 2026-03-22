import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "dotenv";
import { resolve } from "path";
import { verifyHymnsAccessKeyPlain } from "../lib/hymns-access-verify";
import { runHymnsScraper } from "../lib/scraper";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function readScrapeKey(): Promise<string> {
  const fromEnv = process.env.HYMNS_SCRAPE_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (!stdin.isTTY) {
    console.error(
      "Define la variable de entorno HYMNS_SCRAPE_KEY (la misma clave que en /himnos/acceso)",
      "o ejecuta este comando en una terminal interactiva para introducirla.",
    );
    process.exit(1);
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question("Clave de administración de himnos: ")).trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const key = await readScrapeKey();
  if (!key) {
    console.error("Clave vacía.");
    process.exit(1);
  }
  if (!(await verifyHymnsAccessKeyPlain(key))) {
    console.error("Clave incorrecta.");
    process.exit(1);
  }

  console.log(
    "Iniciando scraper (lista oficial: números no consecutivos, p. ej. 1062 → 1201)…",
  );
  const result = await runHymnsScraper({
    onProgress: (p) => {
      if (p.ok) process.stdout.write(".");
      else process.stdout.write("x");
      if (p.number % 50 === 0) console.log(` ${p.number}`);
    },
  });
  console.log("\n", {
    upserted: result.upserted,
    titlesFromPage: result.titlesFromPage,
    loadWarnings: result.errors.length,
  });
  if (result.errors.length > 0) {
    console.log("Primeros avisos:");
    console.log(result.errors.slice(0, 5));
  }
  process.exitCode = 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
