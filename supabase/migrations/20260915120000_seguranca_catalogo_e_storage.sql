-- Fecha o que o catálogo público e o storage expunham, e cria o bucket de
-- fotos, que antes existia só no painel e não estava em migração nenhuma.

-- 1. Bucket das fotos de peça. Privado: o app usa URL assinada
--    (createSignedUrl), que funciona sem leitura pública.
insert into storage.buckets (id, name, public)
values ('pecas', 'pecas', false)
on conflict (id) do nothing;

-- 2. A política antiga deixava qualquer anônimo ler todo o bucket, inclusive
--    as fotos de peças não publicadas. A URL assinada dispensa isso.
drop policy if exists "fotos pecas leitura publica" on storage.objects;

-- 3. O catálogo público tinha select na tabela inteira de produtos, o que
--    expunha custo de mercadoria, frete rateado, perda e margem alvo de
--    todas as lojas. Restringe às colunas que a vitrine realmente usa.
revoke select on public.loja_produtos from anon;
grant select (id, user_id, nome, foto_url, preco_atual, variacoes, publicado, ativo)
  on public.loja_produtos to anon;

-- 4. Mesma ideia na configuração do catálogo: contagem de visitas e canal de
--    precificação não precisam ser legíveis por quem abre o link.
revoke select on public.loja_catalogo_config from anon;
grant select (id, user_id, ativo, slug, titulo, bio, cor_destaque, logo_url, instagram, whatsapp)
  on public.loja_catalogo_config to anon;
