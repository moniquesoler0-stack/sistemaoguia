
create table public.perfis (
  id uuid primary key references auth.users on delete cascade,
  email text,
  nome text,
  tem_minha_loja boolean not null default false,
  tem_minha_loja_pro boolean not null default false,
  pro_expira_em timestamptz,
  criado_em timestamptz not null default now()
);
grant select, insert, update on public.perfis to authenticated;
grant all on public.perfis to service_role;
alter table public.perfis enable row level security;
create policy "perfis proprios" on public.perfis for select to authenticated using (auth.uid() = id);
create policy "perfis update proprios" on public.perfis for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "perfis insert proprios" on public.perfis for insert to authenticated with check (auth.uid() = id);

create table public.loja_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade unique,
  nome_loja text,
  slug text unique,
  volume_mensal_esperado int not null default 60,
  investimento_ads_mensal numeric not null default 0,
  imposto_pct numeric not null default 0,
  margem_minima_pct numeric not null default 20,
  onboarding_concluido boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.loja_custos_fixos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  valor_mensal numeric not null default 0,
  criado_em timestamptz not null default now()
);

create table public.loja_itens_embalagem (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  valor_unitario numeric not null default 0,
  aplicar_por_padrao boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.loja_canais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  taxa_pct numeric not null default 0,
  taxa_fixa numeric not null default 0,
  parcelamento jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);

create table public.loja_fornecedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  contato text,
  observacao text,
  criado_em timestamptz not null default now()
);

create table public.loja_produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  foto_url text,
  fornecedor_id uuid references public.loja_fornecedores on delete set null,
  custo_mercadoria numeric not null default 0,
  frete_rateado numeric not null default 0,
  perda_pct numeric not null default 0,
  itens_embalagem jsonb not null default '[]'::jsonb,
  preco_atual numeric not null default 0,
  margem_alvo_pct numeric not null default 0,
  variacoes jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  publicado boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.loja_compras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  fornecedor_id uuid references public.loja_fornecedores on delete set null,
  data date not null default current_date,
  frete_total numeric not null default 0,
  itens jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create table public.loja_estoque (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  produto_id uuid references public.loja_produtos on delete cascade,
  variacao text,
  quantidade int not null default 0,
  criado_em timestamptz not null default now()
);

create table public.loja_movimentos_estoque (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  produto_id uuid references public.loja_produtos on delete cascade,
  variacao text,
  tipo text not null,
  quantidade int not null default 0,
  observacao text,
  criado_em timestamptz not null default now()
);

create table public.loja_clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,
  contato text,
  observacao text,
  criado_em timestamptz not null default now()
);

create table public.loja_vendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  cliente_id uuid references public.loja_clientes on delete set null,
  canal_id uuid references public.loja_canais on delete set null,
  data date not null default current_date,
  itens jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  criado_em timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['loja_config','loja_custos_fixos','loja_itens_embalagem','loja_canais','loja_fornecedores','loja_produtos','loja_compras','loja_estoque','loja_movimentos_estoque','loja_clientes','loja_vendas']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "dono gerencia" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create index on public.%I (user_id)', t);
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name'));

  insert into public.loja_config (user_id) values (new.id);

  insert into public.loja_canais (user_id, nome, taxa_pct, taxa_fixa, parcelamento, ordem) values
    (new.id, 'Pix', 0, 0, '[]'::jsonb, 1),
    (new.id, 'Cartão à vista', 4.99, 0, '[]'::jsonb, 2),
    (new.id, 'Cartão parcelado', 4.99, 0, '[{"parcelas":2,"taxa_pct":6.49},{"parcelas":3,"taxa_pct":7.49},{"parcelas":4,"taxa_pct":8.49},{"parcelas":6,"taxa_pct":10.49},{"parcelas":10,"taxa_pct":14.49},{"parcelas":12,"taxa_pct":16.49}]'::jsonb, 3),
    (new.id, 'Marketplace', 18, 0, '[]'::jsonb, 4);

  insert into public.loja_itens_embalagem (user_id, nome, valor_unitario, aplicar_por_padrao) values
    (new.id, 'Papelaria', 0.75, true),
    (new.id, 'Sacola ziplock', 1.89, true),
    (new.id, 'Sacola TNT', 1.70, false),
    (new.id, 'Cartão de lavagem', 0.98, true),
    (new.id, 'Mimo', 1.50, false);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
