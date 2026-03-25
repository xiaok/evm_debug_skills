import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const defaultSourceDir = "/tmp/ethereum-chains/_data/chains";
const sourceDir =
  process.env.CHAIN_SOURCE_DIR ??
  (await fs
    .access(defaultSourceDir)
    .then(() => defaultSourceDir)
    .catch(() => null));
const outputFile = path.join(
  projectRoot,
  "skills",
  "evm-debug",
  "references",
  "chains-reference.jsonl",
);

function normalizeAlias(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(normalizeAlias))];
}

if (!sourceDir) {
  throw new Error(
    "No chain source directory found. Set CHAIN_SOURCE_DIR to ethereum-lists/_data/chains.",
  );
}

const fileNames = (await fs.readdir(sourceDir))
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();

const lines = [];

for (const fileName of fileNames) {
  const filePath = path.join(sourceDir, fileName);
  const raw = JSON.parse(await fs.readFile(filePath, "utf8"));

  if (!raw?.chainId || !raw?.name) {
    continue;
  }

  const aliases = unique([
    raw.name,
    raw.title,
    raw.chain,
    raw.shortName,
    raw.nativeCurrency?.name,
    raw.nativeCurrency?.symbol,
    raw.icon,
    `${raw.name} chain`,
    `${raw.name} network`,
  ]);

  lines.push(
    JSON.stringify({
      chainId: raw.chainId,
      name: raw.name,
      title: raw.title ?? null,
      chain: raw.chain ?? null,
      shortName: raw.shortName ?? null,
      symbol: raw.nativeCurrency?.symbol ?? null,
      aliases,
      source: "ethereum-lists",
      sourceFile: fileName,
      raw,
    }),
  );
}

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${lines.join("\n")}\n`);
console.log(`Wrote ${lines.length} chains to ${outputFile}`);
