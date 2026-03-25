import path from "node:path";
import {
  AuthStorage,
  createAgentSession,
  createReadOnlyTools,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@mariozechner/pi-coding-agent";

function buildSystemInstruction(skillName) {
  return [
    "You are running inside an automated test harness.",
    `Use the ${skillName} skill whenever the request is relevant.`,
    "If the user asks for a single-token answer, return exactly one token and nothing else.",
    "Prefer reading the local project references over guessing.",
  ].join(" ");
}

async function resolveModel(modelRegistry, provider, modelId) {
  const available = await modelRegistry.getAvailable();

  if (provider && modelId) {
    const exactMatch = available.find(
      (model) => model.provider === provider && model.id === modelId,
    );
    if (exactMatch) {
      return exactMatch;
    }
  }

  const minimaxMatch = available.find(
    (model) =>
      model.provider.toLowerCase().includes("minimax") &&
      /m[- ]?2\.?7/i.test(model.id),
  );
  if (minimaxMatch) {
    return minimaxMatch;
  }

  return available[0];
}

export async function runPiSkillPrompt({
  cwd,
  prompt,
  skillName = "evm-debug",
  modelProvider = process.env.PI_TEST_MODEL_PROVIDER,
  modelId = process.env.PI_TEST_MODEL_ID,
}) {
  const authStorage = AuthStorage.create();
  const modelRegistry = new ModelRegistry(authStorage);
  const model = await resolveModel(modelRegistry, modelProvider, modelId);
  if (!model) {
    throw new Error(
      "No available Pi model was found. Verify your local Pi auth and model configuration.",
    );
  }

  const loader = new DefaultResourceLoader({
    cwd,
    agentDir: cwd,
    systemPromptOverride: () => buildSystemInstruction(skillName),
  });
  await loader.reload();

  const { session } = await createAgentSession({
    cwd,
    agentDir: cwd,
    model,
    thinkingLevel: "minimal",
    authStorage,
    modelRegistry,
    resourceLoader: loader,
    sessionManager: SessionManager.inMemory(),
    tools: createReadOnlyTools(cwd),
  });

  let streamedText = "";
  const unsubscribe = session.subscribe((event) => {
    if (
      event.type === "message_update" &&
      event.assistantMessageEvent.type === "text_delta"
    ) {
      streamedText += event.assistantMessageEvent.delta;
    }
  });

  try {
    await session.prompt(prompt);
  } finally {
    unsubscribe();
    session.dispose();
  }

  return {
    model: `${model.provider}/${model.id}`,
    text: streamedText.trim(),
    cwd: path.resolve(cwd),
  };
}
