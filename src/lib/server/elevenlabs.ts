import { ELEVENLABS_API_KEY, ELEVENLABS_AGENT_PHONE_NUMBER_ID } from '$env/static/private';
import type { Script } from '$lib/types';

const BASE_URL = 'https://api.elevenlabs.io';

const headers = () => ({
	'xi-api-key': ELEVENLABS_API_KEY,
	'Content-Type': 'application/json'
});

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		headers: headers(),
		body: body ? JSON.stringify(body) : undefined
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`ElevenLabs API error ${res.status}: ${text}`);
	}

	const contentType = res.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		return res.json() as Promise<T>;
	}
	return res as unknown as T;
}

function buildAgentConfig(script: Script) {
	return {
		name: script.name,
		conversation_config: {
			agent: {
				prompt: {
					prompt: script.system_prompt
				},
				first_message: script.first_message,
				language: script.language
			},
			tts: {
				voice_id: script.voice_id,
				model_id: 'eleven_flash_v2_5'
			}
		}
	};
}

export async function createAgent(script: Script): Promise<string> {
	const config = buildAgentConfig(script);
	const data = await request<{ agent_id: string }>('POST', '/v1/convai/agents/create', config);
	// Привʼязуємо агента до номера телефону
	await assignAgentToNumber(data.agent_id);
	return data.agent_id;
}

export async function updateAgent(agentId: string, script: Script): Promise<void> {
	const config = buildAgentConfig(script);
	await request<unknown>('PATCH', `/v1/convai/agents/${agentId}`, config);
	// Привʼязуємо агента до номера при кожному оновленні
	await assignAgentToNumber(agentId);
}

export async function assignAgentToNumber(agentId: string): Promise<void> {
	await request<unknown>(
		'PATCH',
		`/v1/convai/phone-numbers/${ELEVENLABS_AGENT_PHONE_NUMBER_ID}`,
		{ agent_id: agentId }
	);
}

export async function deleteAgent(agentId: string): Promise<void> {
	await request<unknown>('DELETE', `/v1/convai/agents/${agentId}`);
}

type OutboundCallResponse = {
	success: boolean;
	message: string;
	conversation_id?: string;
	call_sid?: string;
};

export async function initiateOutboundCall(
	agentId: string,
	toNumber: string,
	dynamicVariables?: Record<string, string>
): Promise<string> {
	const body: Record<string, unknown> = {
		agent_id: agentId,
		agent_phone_number_id: ELEVENLABS_AGENT_PHONE_NUMBER_ID,
		to_number: toNumber
	};

	if (dynamicVariables) {
		body.conversation_initiation_client_data = {
			dynamic_variables: dynamicVariables
		};
	}

	const data = await request<OutboundCallResponse>('POST', '/v1/convai/sip-trunk/outbound-call', body);

	if (!data.conversation_id) {
		throw new Error(`Outbound call failed: ${data.message}`);
	}

	return data.conversation_id;
}

type TranscriptItem = {
	role: 'user' | 'agent';
	message: string;
	time_in_call_secs: number;
};

type ConversationResponse = {
	conversation_id: string;
	agent_id: string;
	status: string;
	has_audio: boolean;
	metadata: {
		start_time_unix_secs: number;
		call_duration_secs: number;
		termination_reason?: string;
		phone_call?: {
			from_number?: string;
			to_number?: string;
			external_number?: string;
			agent_number?: string;
		};
	};
	analysis?: {
		transcript_summary?: string;
		call_successful?: string;
	};
	transcript: TranscriptItem[];
};

export async function getConversation(conversationId: string): Promise<ConversationResponse> {
	return request<ConversationResponse>('GET', `/v1/convai/conversations/${conversationId}`);
}

export async function getConversationAudio(conversationId: string): Promise<ArrayBuffer> {
	const res = await fetch(`${BASE_URL}/v1/convai/conversations/${conversationId}/audio`, {
		headers: { 'xi-api-key': ELEVENLABS_API_KEY }
	});

	if (!res.ok) {
		throw new Error(`Failed to get audio: ${res.status}`);
	}

	return res.arrayBuffer();
}

type ConversationListItem = {
	conversation_id: string;
	agent_id: string;
	status: string;
	start_time_unix_secs: number;
	call_duration_secs: number;
	call_successful?: string;
	transcript_summary?: string;
	direction?: string;
};

type ListConversationsResponse = {
	conversations: ConversationListItem[];
	next_cursor?: string;
	has_more: boolean;
};

export async function listConversations(
	agentId: string,
	pageSize = 30
): Promise<ListConversationsResponse> {
	return request<ListConversationsResponse>(
		'GET',
		`/v1/convai/conversations?agent_id=${agentId}&page_size=${pageSize}`
	);
}
