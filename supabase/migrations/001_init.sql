-- Scripts
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text not null check (business_type in ('hotel', 'carwash', 'autoservice')),
  system_prompt text not null,
  first_message text not null default '',
  voice_id text not null default 'default',
  language text not null default 'uk' check (language in ('uk', 'ru', 'en')),
  agent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Calls
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references public.scripts(id) on delete restrict,
  direction text not null check (direction in ('inbound', 'outbound')),
  phone_number text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  conversation_id text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  audio_url text
);

-- Transcript entries
create table public.transcript_entries (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  speaker text not null check (speaker in ('agent', 'customer')),
  text text not null,
  timestamp_ms integer not null default 0,
  created_at timestamptz not null default now()
);

-- Call analyses
create table public.call_analyses (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  summary text not null,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  script_adherence integer not null default 0 check (script_adherence between 0 and 100),
  action_items jsonb not null default '[]'::jsonb,
  key_topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint call_analyses_call_id_unique unique (call_id)
);

-- Indexes
create index idx_calls_script_id on public.calls(script_id);
create index idx_calls_status on public.calls(status);
create index idx_calls_started_at on public.calls(started_at desc);
create index idx_transcript_entries_call_id on public.transcript_entries(call_id);
create index idx_transcript_entries_call_id_ts on public.transcript_entries(call_id, timestamp_ms);

-- Realtime
alter publication supabase_realtime add table public.transcript_entries;
alter publication supabase_realtime add table public.calls;

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scripts_updated_at
  before update on public.scripts
  for each row execute function public.set_updated_at();

-- Storage bucket for recordings
insert into storage.buckets (id, name, public)
values ('call-recordings', 'call-recordings', true);

create policy "Public read access for call recordings"
  on storage.objects for select
  using (bucket_id = 'call-recordings');

create policy "Service role upload for call recordings"
  on storage.objects for insert
  with check (bucket_id = 'call-recordings');
