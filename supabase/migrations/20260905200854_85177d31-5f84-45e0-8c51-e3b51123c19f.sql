create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  criado_em timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "usuario ve seus papeis"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;

create or replace function public.conceder_admin_email_verificado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) = 'moniquesoler0@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;

    update public.perfis
      set tem_minha_loja = true,
          tem_minha_loja_pro = true,
          pro_expira_em = null
      where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.conceder_admin_email_verificado() from public, anon, authenticated;

create trigger on_auth_user_created_admin
after insert on auth.users
for each row execute function public.conceder_admin_email_verificado();

create trigger on_auth_user_confirmed_admin
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.conceder_admin_email_verificado();