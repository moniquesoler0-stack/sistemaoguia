import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Cliente = {
  id: string;
  nome: string;
  contato: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tamanho_habitual: string | null;
  observacao: string | null;
  criado_em: string;
};

async function usuarioId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async (): Promise<Cliente[]> => {
      const id = await usuarioId();
      if (!id) return [];
      const { data } = await supabase.from("loja_clientes").select("*").order("nome");
      return (data ?? []) as unknown as Cliente[];
    },
  });
}

export function useInvalidarClientes() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["clientes"] });
}

export async function criarCliente(campos: Partial<Cliente>) {
  const id = await usuarioId();
  if (!id) return;
  await supabase.from("loja_clientes").insert({ user_id: id, nome: campos.nome ?? "", ...campos } as never);
}

export async function atualizarCliente(clienteId: string, campos: Partial<Cliente>) {
  await supabase.from("loja_clientes").update(campos as never).eq("id", clienteId);
}

export async function removerCliente(clienteId: string) {
  await supabase.from("loja_clientes").delete().eq("id", clienteId);
}
