-- Enable Realtime for call_analyses so dashboard auto-updates when analysis arrives
alter publication supabase_realtime add table public.call_analyses;
