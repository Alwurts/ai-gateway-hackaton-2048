import { customProvider, gateway } from "ai";

const languageModels = {
	"gpt-oss-120b": gateway("openai/gpt-oss-120b"),
	"claude-haiku-4.5": gateway("anthropic/claude-haiku-4.5"),
	"gemini-2.5-flash-lite": gateway("google/gemini-2.5-flash-lite"),
	"llama-3.3-70b": gateway("meta/llama-3.3-70b"),
	"mistral-large": gateway("mistral/mistral-large"),
	"grok-4-fast-non-reasoning": gateway("xai/grok-4-fast-non-reasoning"),
};

export const model = customProvider({ languageModels });

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);
