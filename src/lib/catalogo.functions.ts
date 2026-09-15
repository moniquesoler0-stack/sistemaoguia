import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PecaPublica = {
  id: string;
  nome: string;
  foto_url: string | null;
  preco_atual: number;
  variacoes: { tamanho?: string; cor?: string }[];
};

export type CatalogoPublico = {
  titulo: string;
  bio: string | null;
  cor_destaque: string | null;
  logo_url: string | null;
  instagram: string | null;
  whatsapp: string | null;
  slug: string;
  pecas: PecaPublica[];
} | null;

export const buscarCatalogoPublico = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "").toLowerCase() }))
  .handler(async ({ data }): Promise<CatalogoPublico> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: config } = await supabase
      .from("loja_catalogo_config")
      .select("user_id, titulo, bio, cor_destaque, logo_url, instagram, whatsapp, slug")
      .eq("slug", data.slug)
      .eq("ativo", true)
      .maybeSingle();

    if (!config) return null;

    const { data: pecas } = await supabase
      .from("loja_produtos")
      .select("id, nome, foto_url, preco_atual, variacoes")
      .eq("user_id", config.user_id)
      .eq("publicado", true)
      .eq("ativo", true)
      .order("criado_em", { ascending: false });

    return {
      titulo: config.titulo ?? "Catálogo",
      bio: config.bio,
      cor_destaque: config.cor_destaque,
      logo_url: config.logo_url,
      instagram: config.instagram,
      whatsapp: config.whatsapp,
      slug: config.slug as string,
      pecas: ((pecas ?? []) as unknown as PecaPublica[]).map((p) => ({
        ...p,
        variacoes: Array.isArray(p.variacoes) ? p.variacoes : [],
      })),
    };
  });
