import type { Lancamento, Venda, VendaItem } from "./gestao";

export type ResumoMes = {
  faturamento: number;
  pecas: number;
  custoPecas: number;
  taxas: number;
  sobrouVendas: number;
  lucroMes: number;
};

/**
 * O resultado do mês em cima do que foi vendido de verdade.
 *
 * A conta separa dois mundos de propósito. Custo variável e taxa acompanham cada
 * peça e já estão gravados na linha da venda, com o valor do dia em que ela
 * aconteceu. Custo fixo e anúncio são do mês inteiro e entram uma única vez, no
 * fim. Misturar os dois é o que fazia o custo fixo ser descontado duas vezes.
 */
export function resumoDoMes(dados: {
  vendas: Venda[];
  itens: VendaItem[];
  custosFixosTotal: number;
  adsMensal: number;
  doPeriodo: (venda: Venda) => boolean;
}): ResumoMes {
  const vendas = dados.vendas.filter((v) => dados.doPeriodo(v) && v.status !== "devolvida");
  const ids = new Set(vendas.map((v) => v.id));
  const linhas = dados.itens.filter((i) => ids.has(i.venda_id));

  const faturamento = vendas.reduce((s, v) => s + Number(v.total), 0);
  const pecas = linhas.reduce((s, i) => s + i.quantidade, 0);

  // Custo do dia da venda. Reajustar o custo de uma peça hoje não pode mudar o
  // resultado de um mês que já fechou.
  const custoPecas = linhas.reduce(
    (s, i) => s + Number(i.custo_unitario_no_momento) * i.quantidade,
    0,
  );

  // O que cada venda deixou depois do custo da peça, da taxa do canal e do imposto.
  const contribuicao = linhas.reduce((s, i) => s + Number(i.lucro_unitario) * i.quantidade, 0);

  const taxas = Math.max(0, faturamento - custoPecas - contribuicao);
  const sobrouVendas = faturamento - custoPecas - taxas;
  const lucroMes = sobrouVendas - dados.custosFixosTotal - dados.adsMensal;

  return { faturamento, pecas, custoPecas, taxas, sobrouVendas, lucroMes };
}

export type Caixa = {
  entradas: number;
  saidas: number;
  retiradas: number;
  lucroFinal: number;
  saldo: number;
  podeTirar: number;
};

/** Movimento de dinheiro que não é venda, somado ao resultado do mês. */
export function caixaDoMes(dados: {
  resumo: ResumoMes;
  lancamentos: Lancamento[];
  custosFixosTotal: number;
}): Caixa {
  const soma = (tipos: string[]) =>
    dados.lancamentos
      .filter((l) => tipos.includes(l.tipo))
      .reduce((s, l) => s + Number(l.valor), 0);

  const entradas = soma(["entrada", "aporte"]);
  const saidas = soma(["saida"]);
  const retiradas = soma(["retirada"]);

  const lucroFinal = dados.resumo.lucroMes - saidas + entradas;
  const saldo = dados.resumo.faturamento + entradas - saidas - retiradas - dados.custosFixosTotal;

  // O dinheiro da reposição já está guardado: o custo das peças vendidas foi
  // descontado lá atrás, no lucro. Sobra o lucro menos o que já foi retirado.
  // (Havia aqui um segundo limite, pelo saldo em caixa menos a reposição, que
  // nunca chegava a valer: ele é sempre maior que este por taxas + anúncios.)
  const podeTirar = Math.max(0, lucroFinal - retiradas);

  return { entradas, saidas, retiradas, lucroFinal, saldo, podeTirar };
}
