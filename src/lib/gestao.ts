import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { auditar, type BaseLoja, type Canal } from "./calculos";
import type { Produto } from "./loja";

export type LinhaEstoque = {
  id: string;
  produto_id: string;
  variacao: string;
  quantidade: number;
  minimo: number;
  atualizado_em: string;
};

export type Movimento = {
  id: string;
  produto_id: string;
  variacao: string;
  tipo: string;
  quantidade: number;
  motivo: string | null;
  origem_id: string | null;
  criado_em: string;
};

export type Venda = {
  id: string;
  cliente_id: string | null;
  canal_id: string | null;
  data: string;
  desconto: number;
  frete_cobrado: number;
  forma_pagamento: string | null;
  parcelas: number;
  status: string;
  observacao: string | null;
  total: number;
  lucro_total: number;
  criado_em: string;
};

export type VendaItem = {
  id: string;
  venda_id: string;
  produto_id: string | null;
  variacao: string;
  quantidade: number;
  preco_unitario: number;
  custo_unitario_no_momento: number;
  lucro_unitario: number;
};

export type Lancamento = {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string | null;
  valor: number;
  data: string;
};

async function usuarioId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useGestao() {
  return useQuery({
    queryKey: ["gestao"],
    queryFn: async () => {
      const id = await usuarioId();
      if (!id) return null;
      const [estoque, movimentos, vendas, itens, lancamentos] = await Promise.all([
        supabase.from("loja_estoque").select("*"),
        supabase
          .from("loja_movimentos_estoque")
          .select("*")
          .order("criado_em", { ascending: false })
          .limit(300),
        supabase.from("loja_vendas").select("*").order("data", { ascending: false }),
        supabase.from("loja_venda_itens").select("*"),
        supabase
          .from("loja_financeiro_lancamentos")
          .select("*")
          .order("data", { ascending: false }),
      ]);
      return {
        estoque: (estoque.data ?? []) as unknown as LinhaEstoque[],
        movimentos: (movimentos.data ?? []) as unknown as Movimento[],
        vendas: (vendas.data ?? []) as unknown as Venda[],
        itens: (itens.data ?? []) as unknown as VendaItem[],
        lancamentos: (lancamentos.data ?? []) as unknown as Lancamento[],
      };
    },
  });
}

export function useInvalidarGestao() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["gestao"] });
    void qc.invalidateQueries({ queryKey: ["loja"] });
  };
}

export function variacoesDoProduto(produto: Produto): string[] {
  const lista = (produto.variacoes ?? [])
    .map((v) => [v.tamanho, v.cor].filter(Boolean).join(" / "))
    .filter((v) => v.length > 0);
  return lista.length > 0 ? lista : ["Única"];
}

export function quantidadeDe(
  estoque: LinhaEstoque[],
  produtoId: string,
  variacao: string,
) {
  return estoque.find((e) => e.produto_id === produtoId && e.variacao === variacao)?.quantidade ?? 0;
}

/** Ajusta o estoque de uma variação e registra o movimento. */
export async function moverEstoque(params: {
  produtoId: string;
  variacao: string;
  delta: number;
  tipo: "entrada" | "saida" | "ajuste" | "devolucao";
  motivo?: string;
  origemId?: string | null;
}) {
  const id = await usuarioId();
  if (!id) return;
  const { data: atual } = await supabase
    .from("loja_estoque")
    .select("*")
    .eq("produto_id", params.produtoId)
    .eq("variacao", params.variacao)
    .maybeSingle();

  const nova = Math.max(0, Number(atual?.quantidade ?? 0) + params.delta);
  if (atual) {
    await supabase
      .from("loja_estoque")
      .update({ quantidade: nova, atualizado_em: new Date().toISOString() })
      .eq("id", atual.id);
  } else {
    await supabase.from("loja_estoque").insert({
      user_id: id,
      produto_id: params.produtoId,
      variacao: params.variacao,
      quantidade: nova,
    });
  }

  await supabase.from("loja_movimentos_estoque").insert({
    user_id: id,
    produto_id: params.produtoId,
    variacao: params.variacao,
    tipo: params.tipo,
    quantidade: Math.abs(params.delta),
    motivo: params.motivo ?? null,
    origem_id: params.origemId ?? null,
  });
}

export async function definirMinimo(params: {
  produtoId: string;
  variacao: string;
  minimo: number;
}) {
  const id = await usuarioId();
  if (!id) return;
  const { data: atual } = await supabase
    .from("loja_estoque")
    .select("id")
    .eq("produto_id", params.produtoId)
    .eq("variacao", params.variacao)
    .maybeSingle();
  if (atual) {
    await supabase.from("loja_estoque").update({ minimo: params.minimo }).eq("id", atual.id);
  } else {
    await supabase.from("loja_estoque").insert({
      user_id: id,
      produto_id: params.produtoId,
      variacao: params.variacao,
      quantidade: 0,
      minimo: params.minimo,
    });
  }
}

export type ItemVenda = {
  produto: Produto;
  variacao: string;
  quantidade: number;
  preco: number;
};

/** Registra a venda usando o mesmo motor de cálculo da precificação. */
export async function registrarVenda(params: {
  itens: ItemVenda[];
  base: BaseLoja;
  canal: Canal | null;
  parcelas: number;
  formaPagamento: string;
  desconto: number;
  freteCobrado: number;
  clienteId?: string | null;
  status?: string;
  observacao?: string | null;
}) {
  const id = await usuarioId();
  if (!id) return null;

  const calculados = params.itens.map((i) => {
    const conta = auditar(
      { ...i.produto, preco_atual: i.preco },
      params.base,
      i.preco,
      params.canal,
      params.parcelas,
    );
    return { ...i, lucro: conta.lucro, custo: conta.custosAbs };
  });

  const total =
    calculados.reduce((s, i) => s + i.preco * i.quantidade, 0) -
    params.desconto +
    params.freteCobrado;
  const lucroTotal =
    calculados.reduce((s, i) => s + i.lucro * i.quantidade, 0) - params.desconto;

  const { data: venda, error } = await supabase
    .from("loja_vendas")
    .insert({
      user_id: id,
      cliente_id: params.clienteId ?? null,
      canal_id: params.canal?.id ?? null,
      data: new Date().toISOString().slice(0, 10),
      itens: calculados.map((i) => ({
        produto_id: i.produto.id,
        nome: i.produto.nome,
        variacao: i.variacao,
        quantidade: i.quantidade,
        preco: i.preco,
      })),
      total,
      lucro_total: lucroTotal,
      desconto: params.desconto,
      frete_cobrado: params.freteCobrado,
      forma_pagamento: params.formaPagamento,
      parcelas: params.parcelas,
      status: params.status ?? "pago",
      observacao: params.observacao ?? null,
    })
    .select()
    .single();
  if (error || !venda) return null;

  await supabase.from("loja_venda_itens").insert(
    calculados.map((i) => ({
      user_id: id,
      venda_id: venda.id,
      produto_id: i.produto.id,
      variacao: i.variacao,
      quantidade: i.quantidade,
      preco_unitario: i.preco,
      custo_unitario_no_momento: i.custo,
      lucro_unitario: i.lucro,
    })),
  );

  for (const i of calculados) {
    await moverEstoque({
      produtoId: i.produto.id,
      variacao: i.variacao,
      delta: -i.quantidade,
      tipo: "saida",
      motivo: "venda",
      origemId: venda.id,
    });
  }

  return venda.id as string;
}

export async function devolverVenda(vendaId: string, itens: VendaItem[]) {
  for (const i of itens) {
    if (!i.produto_id) continue;
    await moverEstoque({
      produtoId: i.produto_id,
      variacao: i.variacao,
      delta: i.quantidade,
      tipo: "devolucao",
      motivo: "devolucao de venda",
      origemId: vendaId,
    });
  }
  await supabase.from("loja_vendas").update({ status: "devolvida" }).eq("id", vendaId);
}

export function mesAtual(data: string) {
  const hoje = new Date();
  const d = new Date(data + "T12:00:00");
  return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
}

export function mesAnterior(data: string) {
  const hoje = new Date();
  const ref = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const d = new Date(data + "T12:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
