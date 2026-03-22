import { config } from "dotenv";
import { resolve } from "path";
import { runHymnsScraper } from "../lib/scraper";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
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
