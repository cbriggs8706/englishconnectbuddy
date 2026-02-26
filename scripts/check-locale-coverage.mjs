import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (EXTENSIONS.has(extname(full))) files.push(full);
  }
  return files;
}

const files = ROOTS.flatMap((root) => walk(root));
const failures = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (source.includes("locale-check: ignore")) continue;

  const hasEn = /\ben\s*:\s*/.test(source);
  const hasEs = /\bes\s*:\s*/.test(source);
  const hasPt = /\bpt\s*:\s*/.test(source);
  const hasSw = /\bsw\s*:\s*/.test(source);
  const hasChk = /\bchk\s*:\s*/.test(source);

  if (hasEn && hasEs && hasPt && (!hasSw || !hasChk)) {
    failures.push(`${file}: locale map has en/es/pt but missing ${!hasSw && !hasChk ? "sw+chk" : !hasSw ? "sw" : "chk"}`);
  }

  const hasEsBranch = /language\s*===\s*["']es["']/.test(source);
  const hasPtBranch = /language\s*===\s*["']pt["']/.test(source);
  const hasSwBranch = /language\s*===\s*["']sw["']/.test(source);
  const hasChkBranch = /language\s*===\s*["']chk["']/.test(source);

  if (hasEsBranch && hasPtBranch && (!hasSwBranch || !hasChkBranch)) {
    failures.push(`${file}: has language es/pt branch logic but missing ${!hasSwBranch && !hasChkBranch ? "sw+chk" : !hasSwBranch ? "sw" : "chk"} branch logic`);
  }
}

if (failures.length > 0) {
  console.error("Locale coverage check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Locale coverage check passed.");
