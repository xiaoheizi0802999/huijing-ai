create policy "deny direct generation request reads"
on public.generation_requests for select to authenticated
using (false);
