import Anthropic from '@anthropic-ai/sdk';
import { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL } from '$env/static/private';

export const llm = new Anthropic({
	apiKey: LLM_API_KEY,
	baseURL: LLM_BASE_URL
});

export const model = LLM_MODEL;
