-- A policy "perfis update proprios" cobre todas as colunas do próprio perfil,
-- inclusive tem_minha_loja, tem_minha_loja_pro e pro_expira_em. Com a chave
-- pública, que por definição está no navegador, qualquer pessoa liberava o
-- acesso pago para si mesma. Só o service_role (webhook de pagamento) deve
-- escrever nessas colunas.

revoke update on public.perfis from authenticated;
grant update (nome) on public.perfis to authenticated;

-- O teste de 7 dias continua partindo do usuário, mas por função controlada:
-- ela grava as duas datas de uma vez e só funciona se o teste nunca foi usado.
create or replace function public.iniciar_teste_pro()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.perfis
     set pro_trial_iniciado_em = now(),
         pro_trial_expira_em = now() + interval '7 days'
   where id = auth.uid()
     and pro_trial_iniciado_em is null;
end;
$$;

revoke execute on function public.iniciar_teste_pro() from public, anon;
grant execute on function public.iniciar_teste_pro() to authenticated;
