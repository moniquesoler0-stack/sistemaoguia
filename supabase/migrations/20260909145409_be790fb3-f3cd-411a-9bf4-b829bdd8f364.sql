CREATE UNIQUE INDEX IF NOT EXISTS loja_catalogo_config_slug_uniq ON public.loja_catalogo_config (lower(slug)) WHERE slug IS NOT NULL;

GRANT SELECT ON public.loja_catalogo_config TO anon;
GRANT SELECT ON public.loja_produtos TO anon;

CREATE POLICY "catalogo publico visivel" ON public.loja_catalogo_config
FOR SELECT TO anon USING (ativo = true AND slug IS NOT NULL);

CREATE POLICY "pecas publicadas visiveis" ON public.loja_produtos
FOR SELECT TO anon USING (
  publicado = true AND ativo = true AND EXISTS (
    SELECT 1 FROM public.loja_catalogo_config c
    WHERE c.user_id = loja_produtos.user_id AND c.ativo = true AND c.slug IS NOT NULL
  )
);