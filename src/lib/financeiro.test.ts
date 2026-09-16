import { expect, test } from "bun:test";
import { caixaDoMes, resumoDoMes } from "./financeiro";
import type { Lancamento, Venda, VendaItem } from "./gestao";

// Uma peça de R$ 100, custo variável R$ 30, vendida num canal de 5% + R$ 1 fixo.
// Contribuição: 100 - 30 - 1 - 5 = 64.
const venda = (extra: Partial<Venda> = {}): Venda => ({
  id: "v1",
  cliente_id: null,
  canal_id: "c1",
  data: "2026-09-10",
  desconto: 0,
  frete_cobrado: 0,
  forma_pagamento: "Pix",
  parcelas: 1,
  status: "pago",
  observacao: null,
  total: 100,
  lucro_total: 64,
  criado_em: "2026-09-10T12:00:00Z",
  ...extra,
});

const item = (extra: Partial<VendaItem> = {}): VendaItem => ({
  id: "i1",
  venda_id: "v1",
  produto_id: "p1",
  variacao: "P",
  quantidade: 1,
  preco_unitario: 100,
  custo_unitario_no_momento: 30,
  lucro_unitario: 64,
  ...extra,
});

const base = {
  vendas: [venda()],
  itens: [item()],
  custosFixosTotal: 500,
  adsMensal: 100,
  doPeriodo: () => true,
};

test("separa custo da peça, taxas e o que sobrou da venda", () => {
  const r = resumoDoMes(base);
  expect(r.faturamento).toBe(100);
  expect(r.pecas).toBe(1);
  expect(r.custoPecas).toBe(30);
  expect(r.taxas).toBe(6); // 5% do preço + R$ 1 fixo
  expect(r.sobrouVendas).toBe(64);
});

test("desconta o custo fixo uma vez só", () => {
  // Era o bug: o custo fixo vinha embutido no lucro da peça e era subtraído de
  // novo no fim, then o lucro do mês aparecia menor do que o real.
  const r = resumoDoMes(base);
  expect(r.lucroMes).toBe(64 - 500 - 100);

  // Dobrar o custo fixo tem que mexer no resultado exatamente uma vez.
  const dobrado = resumoDoMes({ ...base, custosFixosTotal: 1000 });
  expect(r.lucroMes - dobrado.lucroMes).toBe(500);
});

test("usa o custo gravado na venda, não o custo de hoje", () => {
  const comCustoAntigo = resumoDoMes({
    ...base,
    itens: [item({ custo_unitario_no_momento: 20 })],
  });
  expect(comCustoAntigo.custoPecas).toBe(20);
});

test("venda devolvida sai da conta do mês", () => {
  const r = resumoDoMes({ ...base, vendas: [venda({ status: "devolvida" })] });
  expect(r.faturamento).toBe(0);
  expect(r.pecas).toBe(0);
  expect(r.lucroMes).toBe(-600);
});

test("só conta as vendas do período pedido", () => {
  const r = resumoDoMes({
    ...base,
    vendas: [venda(), venda({ id: "v2", data: "2026-08-10" })],
    itens: [item(), item({ id: "i2", venda_id: "v2" })],
    doPeriodo: (v) => v.data.startsWith("2026-09"),
  });
  expect(r.faturamento).toBe(100);
});

test("quantidade multiplica custo e contribuição", () => {
  const r = resumoDoMes({
    ...base,
    vendas: [venda({ total: 300, lucro_total: 192 })],
    itens: [item({ quantidade: 3 })],
  });
  expect(r.custoPecas).toBe(90);
  expect(r.sobrouVendas).toBe(192);
});

const lancamento = (tipo: string, valor: number): Lancamento => ({
  id: `l-${tipo}-${valor}`,
  tipo,
  categoria: null,
  descricao: null,
  valor,
  data: "2026-09-10",
});

test("caixa soma aporte e desconta despesa avulsa", () => {
  const resumo = resumoDoMes(base);
  const c = caixaDoMes({
    resumo,
    lancamentos: [lancamento("aporte", 1000), lancamento("saida", 50)],
    custosFixosTotal: 500,
  });
  expect(c.entradas).toBe(1000);
  expect(c.saidas).toBe(50);
  expect(c.lucroFinal).toBe(resumo.lucroMes - 50 + 1000);
});

test("a reposição da peça já está descontada do que pode tirar", () => {
  const resumo = resumoDoMes({ ...base, custosFixosTotal: 0, adsMensal: 0 });
  const c = caixaDoMes({ resumo, lancamentos: [], custosFixosTotal: 0 });
  // Vendeu 100, o custo de 30 para repor a peça já saiu na conta do lucro.
  expect(resumo.custoPecas).toBe(30);
  expect(c.podeTirar).toBe(64);
});

test("o que já foi retirado no mês sai do que ainda pode tirar", () => {
  const resumo = resumoDoMes({ ...base, custosFixosTotal: 0, adsMensal: 0 });
  const c = caixaDoMes({
    resumo,
    lancamentos: [lancamento("retirada", 40)],
    custosFixosTotal: 0,
  });
  expect(c.podeTirar).toBe(64 - 40);
});

test("não sugere retirada quando o mês está no vermelho", () => {
  const resumo = resumoDoMes(base);
  const c = caixaDoMes({ resumo, lancamentos: [], custosFixosTotal: 500 });
  expect(c.podeTirar).toBe(0);
});
