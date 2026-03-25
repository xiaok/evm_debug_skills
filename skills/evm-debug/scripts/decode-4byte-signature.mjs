const input = process.argv[2];

if (!input) {
  console.error(
    "Usage: node skills/evm-debug/scripts/decode-4byte-signature.mjs <hex>",
  );
  process.exit(1);
}

const normalized = input.toLowerCase().startsWith("0x")
  ? input.toLowerCase()
  : `0x${input.toLowerCase()}`;
const rawHex = normalized.slice(2);

let endpoint;
let kind;

if (/^[0-9a-f]{8}$/.test(rawHex)) {
  endpoint = "https://www.4byte.directory/api/v1/signatures/";
  kind = "function";
} else if (/^[0-9a-f]{64}$/.test(rawHex)) {
  endpoint = "https://www.4byte.directory/api/v1/event-signatures/";
  kind = "event";
} else {
  console.error(
    "Expected either a 4-byte selector (8 hex chars) or a 32-byte event topic (64 hex chars), with optional 0x prefix.",
  );
  process.exit(1);
}

const url = new URL(endpoint);
url.searchParams.set("hex_signature", normalized);

const response = await fetch(url);
if (!response.ok) {
  console.error(`4byte ${kind} request failed with status ${response.status}.`);
  process.exit(1);
}

const payload = await response.json();
const results = Array.isArray(payload.results) ? payload.results : [];

if (results.length === 0) {
  console.error(`No 4byte ${kind} signature found for ${normalized}.`);
  process.exit(2);
}

for (const result of results) {
  if (typeof result?.text_signature === "string" && result.text_signature) {
    console.log(result.text_signature);
  }
}
