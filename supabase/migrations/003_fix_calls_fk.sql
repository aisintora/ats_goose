-- Change FK from RESTRICT to SET NULL so scripts can be deleted even if calls reference them
alter table public.calls drop constraint calls_script_id_fkey;
alter table public.calls add constraint calls_script_id_fkey
  foreign key (script_id) references public.scripts(id) on delete set null;
alter table public.calls alter column script_id drop not null;
