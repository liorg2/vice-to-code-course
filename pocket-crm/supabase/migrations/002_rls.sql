-- Each person reads and changes only their own rows.
alter table contacts enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;

create policy contacts_own on contacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy deals_own on deals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy activities_own on activities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
