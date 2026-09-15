import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CatalogoConfig = {
  id: string;
  user_id: string;
  ativo: boolean;
  slug: string | null;
  titulo: string | null;
  bio: string | null;
  cor_destaque: string | null;
  logo_url: string | null;
  instagram: string | null;
  whatsapp: string | null;
  canal_preco_id: string | null;
  visitas: number;
};

async function usuarioId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useCatalogo() {
  return useQuery({
    queryKey: ["catalogo"],
    queryFn: async (): Promise<CatalogoConfig | null> => {
      const id = await usuarioId();
      if (!id) return null;
      const { data } = await supabase
        .from("loja_catalogo_config")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();
      if (data) return data as unknown as CatalogoConfig;
      const { data: criado } = await supabase
        .from("loja_catalogo_config")
        .insert({ user_id: id })
        .select()
        .single();
      return (criado ?? null) as unknown as CatalogoConfig | null;
    },
  });
}

export function useInvalidarCatalogo() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["catalogo"] });
    void qc.invalidateQueries({ queryKey: ["loja"] });
  };
}

export function apelidar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function salvarCatalogo(campos: Partial<CatalogoConfig>) {
  const id = await usuarioId();
  if (!id) return { erro: "Sessão expirada" };
  const { error } = await supabase
    .from("loja_catalogo_config")
    .update(campos as never)
    .eq("user_id", id);
  if (error) {
    if (error.code === "23505") return { erro: "Esse link já está em uso. Escolha outro." };
    return { erro: "Não foi possível salvar agora." };
  }
  return {};
}

export async function publicarPeca(produtoId: string, publicado: boolean) {
  await supabase.from("loja_produtos").update({ publicado }).eq("id", produtoId);
}
