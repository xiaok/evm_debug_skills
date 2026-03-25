import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPiSkillPrompt } from "../src/pi/run-pi-skill-prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

async function decodeOneHex(promptLine) {
  return runPiSkillPrompt({
    cwd: projectRoot,
    prompt: [
      "Use the local evm-debug skill.",
      promptLine,
      "Return only the decoded signature, with no explanation, quotes, punctuation, or extra text.",
    ].join("\n"),
  });
}

test("evm-debug skill decodes a 4byte function selector", async () => {
  const result = await decodeOneHex(
    "Decode this hex with the skill's unified 4byte signature workflow: 0x46ee9e35",
  );

  assert.equal(result.text, "WithdrawalsDisabled()");
});

test("evm-debug skill decodes a 4byte event topic", async () => {
  const result = await decodeOneHex(
    "Decode this hex with the skill's unified 4byte signature workflow: 0x729d3664274983d1d1b3255dd990736babd877454af86fdbd7a33e4dbd175c28",
  );

  assert.equal(result.text, "ProfileCreated(address,string,string,uint256)");
});
