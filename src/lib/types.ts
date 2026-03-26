export type BusinessType = 'hotel' | 'carwash' | 'autoservice';
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'active' | 'completed' | 'failed';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Speaker = 'agent' | 'customer';
export type Language = 'uk' | 'ru' | 'en';

export type Script = {
	id: string;
	name: string;
	business_type: BusinessType;
	system_prompt: string;
	first_message: string;
	voice_id: string;
	language: Language;
	agent_id: string | null;
	created_at: string;
	updated_at: string;
};

export type Call = {
	id: string;
	script_id: string;
	direction: CallDirection;
	phone_number: string;
	status: CallStatus;
	conversation_id: string | null;
	started_at: string;
	ended_at: string | null;
	audio_url: string | null;
	script?: Script;
};

export type TranscriptEntry = {
	id: string;
	call_id: string;
	speaker: Speaker;
	text: string;
	timestamp_ms: number;
	created_at: string;
};

export type CallAnalysis = {
	id: string;
	call_id: string;
	summary: string;
	sentiment: Sentiment;
	script_adherence: number;
	action_items: string[];
	key_topics: string[];
	created_at: string;
};
