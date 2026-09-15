
alter table public.perfis
  add column if not exists pro_trial_iniciado_em timestamptz,
  add column if not exists pro_trial_expira_em timestamptz;

alter table public.loja_estoque
  add column if not exists minimo integer not null default 0,
  add column if not exists atualizado_em timestamptz not null default now();
create unique index if not exists loja_estoque_unico on public.loja_estoque (user_id, produto_id, variacao);

alter table public.loja_movimentos_estoque
  add column if not exists motivo text,
  add column if not exists origem_id uuid;

alter table public.loja_vendas
  add column if not exists desconto numeric not null default 0,
  add column if not exists frete_cobrado numeric not null default 0,
  add column if not exists forma_pagamento text,
  add column if not exists parcelas integer not null default 1,
  add column if not exists status text not null default 'pago',
  add column if not exists observacao text,
  add column if not exists lucro_total numeric not null default 0;

alter table public.loja_clientes
  add column if not exists whatsapp text,
  add column if not exists instagram text,
  add column if not exists tamanho_habitual text;

create table if not exists public.loja_venda_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  venda_id uuid not null references public.loja_vendas(id) on delete cascade,
  produto_id uuid references public.loja_produtos(id) on delete set null,
  variacao text not null default '',
  quantidade integer not null default 1,
  preco_unitario numeric not null default 0,
  custo_unitario_no_momento numeric not null default 0,
  lucro_unitario numeric not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists loja_venda_itens_user on public.loja_venda_itens (user_id);
create index if not exists loja_venda_itens_venda on public.loja_venda_itens (venda_id);
grant select, insert, update, delete on public.loja_venda_itens to authenticated;
grant all on public.loja_venda_itens to service_role;
alter table public.loja_venda_itens enable row level security;
drop policy if exists "venda itens proprios" on public.loja_venda_itens;
create policy "venda itens proprios" on public.loja_venda_itens for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.loja_financeiro_lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null default 'saida',
  categoria text,
  descricao text,
  valor numeric not null default 0,
  data date not null default current_date,
  criado_em timestamptz not null default now()
);
create index if not exists loja_financeiro_user on public.loja_financeiro_lancamentos (user_id);
grant select, insert, update, delete on public.loja_financeiro_lancamentos to authenticated;
grant all on public.loja_financeiro_lancamentos to service_role;
alter table public.loja_financeiro_lancamentos enable row level security;
drop policy if exists "lancamentos proprios" on public.loja_financeiro_lancamentos;
create policy "lancamentos proprios" on public.loja_financeiro_lancamentos for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.loja_catalogo_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  ativo boolean not null default false,
  slug text unique,
  titulo text,
  bio text,
  cor_destaque text,
  logo_url text,
  instagram text,
  whatsapp text,
  canal_preco_id uuid references public.loja_canais(id) on delete set null,
  visitas integer not null default 0,
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.loja_catalogo_config to authenticated;
grant all on public.loja_catalogo_config to service_role;
alter table public.loja_catalogo_config enable row level security;
drop policy if exists "catalogo proprio" on public.loja_catalogo_config;
create policy "catalogo proprio" on public.loja_catalogo_config for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
