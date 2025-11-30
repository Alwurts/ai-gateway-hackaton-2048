import { customProvider, defaultSettingsMiddleware, gateway, wrapLanguageModel } from "ai";

const languageModels = {
	"gpt-5.1-instant": wrapLanguageModel({
		model: gateway("openai/gpt-5.1-instant"),
		middleware: defaultSettingsMiddleware({
			settings: {
				providerOptions: {
					openai: {
						reasoningSummary: "auto", // 'auto' for condensed or 'detailed' for comprehensive
						reasoningEffort: "none", // 'none' | 'low' | 'medium' | 'high'
					},
				},
			},
		}),
	}),
	"gpt-5-nano": wrapLanguageModel({
		model: gateway("openai/gpt-5-nano"),
		middleware: defaultSettingsMiddleware({
			settings: {
				providerOptions: {
					openai: {
						reasoningSummary: "auto", // 'auto' for condensed or 'detailed' for comprehensive
						reasoningEffort: "minimal", // 'minimal' | 'low' | 'medium' | 'high'
					},
				},
			},
		}),
	}),
	"gpt-5-mini": wrapLanguageModel({
		model: gateway("openai/gpt-5-mini"),
		middleware: defaultSettingsMiddleware({
			settings: {
				providerOptions: {
					openai: {
						reasoningSummary: "auto", // 'auto' for condensed or 'detailed' for comprehensive
						reasoningEffort: "minimal", // 'minimal' | 'low' | 'medium' | 'high'
					},
				},
			},
		}),
	}),
};

export const model = customProvider({ languageModels });

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);
