import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPiSkillPrompt } from "../src/pi/run-pi-skill-prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function askOneField(question) {
  return runPiSkillPrompt({
    cwd: projectRoot,
    prompt: [
      "Use the local evm-debug skill.",
      `Question: ${question}`,
      "Return only the requested field value, with no explanation, quotes, punctuation, or extra text.",
    ].join("\n"),
  });
}

test("evm-debug skill handles basic chain info queries", async () => {
  const chainIdResult = await askOneField("What is ETH chain ID?");
  assert.equal(chainIdResult.text, "1");

  const shortNameResult = await askOneField(
    "What is the shortName of Ethereum Mainnet?",
  );
  assert.equal(shortNameResult.text, "eth");

  const symbolResult = await askOneField(
    "What is the native currency symbol of Gnosis?",
  );
  assert.equal(symbolResult.text, "XDAI");

  const rpcResult = await askOneField("What is one RPC URL for OP Mainnet?");
  assert.equal(rpcResult.text, "https://mainnet.optimism.io");

  const explorerResult = await askOneField(
    "What is one scan or explorer URL for Gnosis?",
  );
  assert.equal(explorerResult.text, "https://gnosisscan.io");
});
