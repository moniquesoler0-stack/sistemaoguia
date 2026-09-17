export type ItemEmbalagemAplicado = { nome: string; valor: number };

export type Canal = {
  id: string;
  nome: string;
  taxa_pct: number;
  taxa_fixa: number;
  parcelamento: { parcelas: number; taxa_pct: number }[];
  ativo: boolean;
};

export type BaseLoja = {
  custosFixosTotal: number;
  volumeMensal: number;
  adsMensal: number;
  impostoPct: number;
  margemMinimaPct: number;
};

export type Peca = {
  custo_mercadoria: number;
  frete_rateado: number;
  perda_pct: number;
  itens_embalagem: ItemEmbalagemAplicado[];
  preco_atual: number;
  margem_alvo_pct: number;
};

const n = (v: unknown) => {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function cvu(peca: Pick<Peca, "itens_embalagem">) {
  return (peca.itens_embalagem ?? []).reduce((s, i) => s + n(i.valor), 0);
}

/** Custo variável por peça, sem fixo e sem CAC. Usado no ponto de equilíbrio. */
export function custoVariavelUnit(peca: Peca) {
  const mercadoria = n(peca.custo_mercadoria);
  const frete = n(peca.frete_rateado);
  const perda = ((mercadoria + frete) * n(peca.perda_pct)) / 100;
  return mercadoria + frete + cvu(peca) + perda;
}

export function custoFixoUnitario(base: BaseLoja) {
  const volume = n(base.volumeMensal) || 1;
  return n(base.custosFixosTotal) / volume;
}

export function cacUnitario(base: BaseLoja) {
  const volume = n(base.volumeMensal) || 1;
  return n(base.adsMensal) / volume;
}

export function custoTotal(peca: Peca, base: BaseLoja) {
  return custoVariavelUnit(peca) + custoFixoUnitario(base) + cacUnitario(base);
}

export function taxasPct(base: BaseLoja, canal?: Canal | null, parcelas?: number) {
  if (!canal) return n(base.impostoPct);
  const parcela = parcelas
    ? canal.parcelamento?.find((p) => n(p.parcelas) === parcelas)
    : undefined;
  const taxaCanal = parcela ? n(parcela.taxa_pct) : n(canal.taxa_pct);
  return taxaCanal + n(base.impostoPct);
}

export function custosAbs(
  peca: Peca,
  base: BaseLoja,
  canal?: Canal | null,
  freteVendaAssumido = 0,
) {
  return custoTotal(peca, base) + n(canal?.taxa_fixa) + n(freteVendaAssumido);
}

/** Porta 1: quero margem de X por cento. */
export function precoPorMargem(
  peca: Peca,
  base: BaseLoja,
  margemAlvo: number,
  canal?: Canal | null,
  parcelas?: number,
  freteVenda = 0,
): { possivel: boolean; preco: number } {
  const abs = custosAbs(peca, base, canal, freteVenda);
  const pct = taxasPct(base, canal, parcelas) + n(margemAlvo);
  if (pct >= 100) return { possivel: false, preco: 0 };
  return { possivel: true, preco: abs / (1 - pct / 100) };
}

/** Porta 2 e 3: já cobro R$ Y, está bom? */
export function auditar(
  peca: Peca,
  base: BaseLoja,
  preco: number,
  canal?: Canal | null,
  parcelas?: number,
  freteVenda = 0,
) {
  const y = n(preco);
  const abs = custosAbs(peca, base, canal, freteVenda);
  const pct = taxasPct(base, canal, parcelas);
  const lucro = y - abs - (y * pct) / 100;
  const total = custoTotal(peca, base);
  return {
    lucro,
    margem: y > 0 ? (lucro / y) * 100 : 0,
    markup: total > 0 ? (y / total - 1) * 100 : 0,
    custoTotal: total,
    custosAbs: abs,
    taxasPct: pct,
  };
}

export function precoMinimo(peca: Peca, base: BaseLoja, canal?: Canal | null, freteVenda = 0) {
  const abs = custosAbs(peca, base, canal, freteVenda);
  const pct = taxasPct(base, canal);
  if (pct >= 100) return null;
  return abs / (1 - pct / 100);
}

export function descontoMaximo(peca: Peca, base: BaseLoja, canal?: Canal | null, freteVenda = 0) {
  const abs = custosAbs(peca, base, canal, freteVenda);
  const pct = taxasPct(base, canal) + n(base.margemMinimaPct);
  if (pct >= 100) return null;
  const piso = abs / (1 - pct / 100);
  const preco = n(peca.preco_atual);
  if (preco <= 0) return null;
  return { piso, percentual: ((preco - piso) / preco) * 100 };
}

export function margemContribuicao(
  peca: Peca,
  base: BaseLoja,
  preco: number,
  canal?: Canal | null,
  parcelas?: number,
) {
  const p = n(preco);
  return (
    p - custoVariavelUnit(peca) - n(canal?.taxa_fixa) - (p * taxasPct(base, canal, parcelas)) / 100
  );
}

export function pecasParaEquilibrio(
  peca: Peca,
  base: BaseLoja,
  preco: number,
  canal?: Canal | null,
) {
  const mc = margemContribuicao(peca, base, preco, canal);
  if (mc <= 0) return null;
  return Math.ceil(n(base.custosFixosTotal) / mc);
}

export function simularDesconto(
  peca: Peca,
  base: BaseLoja,
  descontoPct: number,
  canal?: Canal | null,
) {
  const precoAtual = n(peca.preco_atual);
  const novoPreco = precoAtual * (1 - n(descontoPct) / 100);
  const antes = auditar(peca, base, precoAtual, canal);
  const depois = auditar(peca, base, novoPreco, canal);
  const volume = n(base.volumeMensal) || 1;
  const lucroMesAntes = antes.lucro * volume;
  const pecasNecessarias = depois.lucro > 0 ? Math.ceil(lucroMesAntes / depois.lucro) : null;
  return {
    novoPreco,
    antes,
    depois,
    pecasNecessarias,
    pecasAMais: pecasNecessarias === null ? null : Math.max(0, pecasNecessarias - volume),
  };
}

export type Semaforo = "verde" | "ambar" | "vermelho";

export function semaforo(margem: number, lucro: number, margemMinima: number): Semaforo {
  if (lucro <= 0) return "vermelho";
  if (margem < margemMinima) return "ambar";
  return "verde";
}
