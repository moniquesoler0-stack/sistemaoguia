-- A Kiwify reenvia o mesmo evento quando não recebe resposta a tempo. Sem um
-- registro do que já foi tratado, cada reenvio de uma compra aprovada estendia
-- a assinatura por mais 31 dias.

create table if not exists public.pagamentos_processados (
  chave text primary key,
  pedido text,
  email text,
  produto text,
  status text,
  criado_em timestamptz not null default now()
);

grant all on public.pagamentos_processados to service_role;

-- Sem política de acesso: só o service_role, que ignora o RLS, enxerga a tabela.
-- Nem o usuário logado nem o anônimo têm o que fazer aqui.
alter table public.pagamentos_processados enable row level security;
