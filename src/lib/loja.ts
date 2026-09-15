import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BaseLoja, Canal, Peca } from "./calculos";

export type Perfil = {
  id: string;
  email: string | null;
  nome: string | null;
  tem_minha_loja: boolean;
  tem_minha_loja_pro: boolean;
  pro_expira_em: string | null;
  pro_trial_iniciado_em: string | null;
  pro_trial_expira_em: string | null;
};

export type Config = {
  id: string;
  user_id: string;
  nome_loja: string | null;
  volume_mensal_esperado: number;
  investimento_ads_mensal: number;
  imposto_pct: number;
  margem_minima_pct: number;
  onboarding_concluido: boolean;
};

export type CustoFixo = { id: string; nome: string; valor_mensal: number };
export type ItemEmbalagem = {
  id: string;
  nome: string;
  valor_unitario: number;
  aplicar_por_padrao: boolean;
};
export type Fornecedor = { id: string; nome: string; contato: string | null; observacao: string | null };

export type Produto = Peca & {
  id: string;
  nome: string;
  foto_url: string | null;
  fornecedor_id: string | null;
  variacoes: { tamanho?: string; cor?: string; custo?: number }[];
  ativo: boolean;
  publicado: boolean;
  criado_em: string;
};

export type Compra = {
  id: string;
  fornecedor_id: string | null;
  data: string;
  frete_total: number;
  itens: { nome: string; qtd: number; custo: number }[];
};

async function usuarioId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function usePerfil() {
  return useQuery({
    queryKey: ["perfil"],
    queryFn: async (): Promise<Perfil | null> => {
      const id = await usuarioId();
      if (!id) return null;
      const { data, error } = await supabase.from("perfis").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
  });
}

export function useDadosLoja() {
  return useQuery({
    queryKey: ["loja"],
    queryFn: async () => {
      const id = await usuarioId();
      if (!id) return null;
      const [config, custos, embalagem, canais, fornecedores, produtos, compras] =
        await Promise.all([
          supabase.from("loja_config").select("*").eq("user_id", id).maybeSingle(),
          supabase.from("loja_custos_fixos").select("*").order("criado_em"),
          supabase.from("loja_itens_embalagem").select("*").order("criado_em"),
          supabase.from("loja_canais").select("*").order("ordem"),
          supabase.from("loja_fornecedores").select("*").order("nome"),
          supabase.from("loja_produtos").select("*").order("criado_em", { ascending: false }),
          supabase.from("loja_compras").select("*").order("data", { ascending: false }),
        ]);

      return {
        config: (config.data ?? null) as Config | null,
        custosFixos: (custos.data ?? []) as CustoFixo[],
        embalagem: (embalagem.data ?? []) as ItemEmbalagem[],
        canais: ((canais.data ?? []) as unknown as Canal[]).map((c) => ({
          ...c,
          parcelamento: Array.isArray(c.parcelamento) ? c.parcelamento : [],
        })),
        fornecedores: (fornecedores.data ?? []) as Fornecedor[],
        produtos: ((produtos.data ?? []) as unknown as Produto[]).map((p) => ({
          ...p,
          itens_embalagem: Array.isArray(p.itens_embalagem) ? p.itens_embalagem : [],
          variacoes: Array.isArray(p.variacoes) ? p.variacoes : [],
        })),
        compras: ((compras.data ?? []) as unknown as Compra[]).map((c) => ({
          ...c,
          itens: Array.isArray(c.itens) ? c.itens : [],
        })),
      };
    },
  });
}

export function baseDaLoja(
  config: Config | null,
  custosFixos: CustoFixo[],
): BaseLoja {
  return {
    custosFixosTotal: custosFixos.reduce((s, c) => s + Number(c.valor_mensal ?? 0), 0),
    volumeMensal: Number(config?.volume_mensal_esperado ?? 60),
    adsMensal: Number(config?.investimento_ads_mensal ?? 0),
    impostoPct: Number(config?.imposto_pct ?? 0),
    margemMinimaPct: Number(config?.margem_minima_pct ?? 20),
  };
}

export function useInvalidarLoja() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["loja"] });
    void qc.invalidateQueries({ queryKey: ["perfil"] });
  };
}
