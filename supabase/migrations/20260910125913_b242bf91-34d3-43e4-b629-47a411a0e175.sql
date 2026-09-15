
create policy "fotos pecas dono gerencia"
on storage.objects for all to authenticated
using (bucket_id = 'pecas' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'pecas' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos pecas leitura publica"
on storage.objects for select to anon
using (bucket_id = 'pecas');
