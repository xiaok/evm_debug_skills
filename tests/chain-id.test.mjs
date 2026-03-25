import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPiSkillPrompt } from "../src/pi/run-pi-skill-prompt.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("evm-debug skill answers Ethereum chain ID with one token", async () => {
  const result = await runPiSkillPrompt({
    cwd: projectRoot,
    prompt: [
      "Use the local evm-debug skill.",
      "Question: What is ETH chain ID?",
      "Answer with exactly one token.",
    ].join("\n"),
  });

  assert.equal(result.text, "1");
});
