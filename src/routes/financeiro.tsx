import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { useDadosLoja, usePerfil } from "@/lib/loja";
import { podeSistema } from "@/lib/pro";
import { custoVariavelUnit } from "@/lib/calculos";
import { moeda, numero, pct } from "@/lib/formato";
import {
  mesAnterior,
  mesAtual,
  useGestao,
  useInvalidarGestao,
  type Venda,
  type VendaItem,
} from "@/lib/gestao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro do mês, Minha Loja" },
      {
        name: "description",
        content:
          "Faturamento, lucro real, custo fixo sobre o volume vendido de verdade, caixa e quanto você pode tirar no mês.",
      },
      { property: "og:title", content: "Financeiro do mês, Minha Loja" },
      {
        property: "og:description",
        content: "Resultado do mês em linguagem clara, caixa junto e comparação com o mês passado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Financeiro,
});

function Financeiro() {
  const loja = useDadosLoja();
  const gestao = useGestao();
  const perfil = usePerfil();
  const invalidar = useInvalidarGestao();
  const liberado = podeSistema(perfil.data);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("saida");

  const produtos = loja.data?.produtos ?? [];
  const custosFixosTotal = (loja.data?.custosFixos ?? []).reduce(
    (s, c) => s + Number(c.valor_mensal),
    0,
  );
  const adsMensal = Number(loja.data?.config?.investimento_ads_mensal ?? 0);
  const vendas = gestao.data?.vendas ?? [];
  const itens = gestao.data?.itens ?? [];
  const lancamentos = gestao.data?.lancamentos ?? [];

  const resumo = (filtro: (v: Venda) => boolean) => {
    const doPeriodo = vendas.filter((v) => filtro(v) && v.status !== "devolvida");
    const ids = new Set(doPeriodo.map((v) => v.id));
    const linhas = itens.filter((i: VendaItem) => ids.has(i.venda_id));
    const faturamento = doPeriodo.reduce((s, v) => s + Number(v.total), 0);
    const pecas = linhas.reduce((s, i) => s + i.quantidade, 0);
    const custoPecas = linhas.reduce((s, i) => {
      const p = produtos.find((x) => x.id === i.produto_id);
      return s + (p ? custoVariavelUnit(p) : 0) * i.quantidade;
    }, 0);
    const lucroBruto = linhas.reduce(
      (s, i) => s + Number(i.lucro_unitario) * i.quantidade,
      0,
    );
    const taxas = Math.max(0, faturamento - custoPecas - lucroBruto - adsMensal * 0);
    const sobrouVendas = faturamento - custoPecas - taxas;
    const lucroMes = sobrouVendas - custosFixosTotal;
    return { faturamento, pecas, custoPecas, taxas, sobrouVendas, lucroMes };
  };

  const atual = useMemo(() => resumo((v) => mesAtual(v.data)), [vendas, itens, produtos, custosFixosTotal]);
  const passado = useMemo(() => resumo((v) => mesAnterior(v.data)), [vendas, itens, produtos, custosFixosTotal]);

  const doMes = lancamentos.filter((l) => mesAtual(l.data));
  const entradasManuais = doMes
    .filter((l) => l.tipo === "entrada" || l.tipo === "aporte")
    .reduce((s, l) => s + Number(l.valor), 0);
  const saidasManuais = doMes
    .filter((l) => l.tipo === "saida")
    .reduce((s, l) => s + Number(l.valor), 0);
  const retiradas = doMes
    .filter((l) => l.tipo === "retirada")
    .reduce((s, l) => s + Number(l.valor), 0);

  const lucroFinal = atual.lucroMes - saidasManuais + entradasManuais;
  const reservaReposicao = atual.custoPecas;
  const caixa = atual.faturamento + entradasManuais - saidasManuais - retiradas - custosFixosTotal;
  const podeTirar = Math.max(0, Math.min(lucroFinal - retiradas, caixa - reservaReposicao));

  const volumeEstimado = Number(loja.data?.config?.volume_mensal_esperado ?? 0);
  const fixoUnitReal = custosFixosTotal / Math.max(1, atual.pecas);

  const diaDoMes = new Date().getDate();
  const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const ritmo = (atual.sobrouVendas / Math.max(1, diaDoMes)) * diasNoMes;
  const abaixoEquilibrio = ritmo < custosFixosTotal;

  const variacao = (a: number, b: number) => (b !== 0 ? ((a - b) / Math.abs(b)) * 100 : 0);

  async function lancar() {
    if (!liberado || !descricao.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("loja_financeiro_lancamentos").insert({
      user_id: u.user!.id,
      tipo,
      descricao: descricao.trim(),
      valor: numero(valor),
    });
    setDescricao("");
    setValor("");
    invalidar();
  }

  function exportar() {
    const linhas = [
      ["tipo", "data", "descricao", "valor"],
      ...vendas.map((v) => ["venda", v.data, v.status, String(v.total)]),
      ...lancamentos.map((l) => [l.tipo, l.data, l.descricao ?? "", String(l.valor)]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${c}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "financeiro-minha-loja.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Casca titulo="Financeiro" subtitulo="Este mês">
      <div className="space-y-4 px-5">
        {!liberado ? (
          <div className="rounded-2xl bg-cream px-4 py-3 text-[12px] ring-1 ring-black/5">
            Modo leitura. Os números continuam salvos.{" "}
            <Link to="/assinatura" className="font-semibold underline">
              Assinar
            </Link>
          </div>
        ) : null}

        {gestao.isLoading || loja.isLoading ? (
          <>
            <Esqueleto className="h-28" />
            <Esqueleto className="h-40" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Cartao titulo="Faturamento" valor={moeda(atual.faturamento)} />
              <Cartao titulo="Lucro do mês" valor={moeda(lucroFinal)} destaque />
              <Cartao
                titulo="Margem real"
                valor={pct(atual.faturamento > 0 ? (lucroFinal / atual.faturamento) * 100 : 0)}
              />
              <Cartao titulo="Peças vendidas" valor={String(atual.pecas)} />
            </div>

            <section className="rounded-3xl bg-muted p-4 ring-1 ring-black/5">
              <h2 className="fonte-display text-[16px] font-semibold">Resultado do mês</h2>
              <ul className="mt-3 space-y-1.5 text-[14px]">
                <Linha rotulo="Vendas do mês" valor={moeda(atual.faturamento)} />
                <Linha rotulo="menos custo das peças vendidas" valor={moeda(-atual.custoPecas)} />
                <Linha rotulo="menos taxas e impostos" valor={moeda(-atual.taxas)} />
                <Linha rotulo="= o que sobrou das vendas" valor={moeda(atual.sobrouVendas)} forte />
                <Linha rotulo="menos custos fixos" valor={moeda(-custosFixosTotal)} />
                <Linha rotulo="= lucro do mês" valor={moeda(atual.lucroMes)} forte />
              </ul>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Mês passado o lucro foi {moeda(passado.lucroMes)},{" "}
                {pct(variacao(atual.lucroMes, passado.lucroMes), 0)} de diferença.
              </p>
            </section>

            <section className="rounded-3xl bg-cream p-4 ring-1 ring-black/5">
              <h2 className="fonte-display text-[16px] font-semibold">Quanto posso tirar</h2>
              <p className="mt-1 fonte-display text-[26px] font-semibold leading-none">
                {moeda(podeTirar)}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-secondary-foreground">
                Já separando {moeda(reservaReposicao)} para repor as peças que saíram e{" "}
                {moeda(retiradas)} que você já retirou este mês.
              </p>
            </section>

            <section className="rounded-3xl bg-muted p-4 ring-1 ring-black/5">
              <h2 className="fonte-display text-[16px] font-semibold">
                Seu custo fixo por peça agora usa o volume real
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Você vendeu {atual.pecas} peças este mês, então cada peça carrega{" "}
                {moeda(fixoUnitReal)} de custo fixo. Na precificação a conta usava a estimativa de{" "}
                {volumeEstimado} peças, que dava {moeda(custosFixosTotal / Math.max(1, volumeEstimado))}.
              </p>
            </section>

            {abaixoEquilibrio ? (
              <div className="rounded-2xl bg-rose/10 px-4 py-3 text-[13px] ring-1 ring-rose/30">
                No ritmo de hoje o mês fecha em {moeda(ritmo)} de sobra, abaixo dos{" "}
                {moeda(custosFixosTotal)} de custo fixo. Falta vender mais para pagar a estrutura.
              </div>
            ) : null}

            <section className="space-y-3 rounded-3xl bg-muted p-4 ring-1 ring-black/5">
              <h2 className="fonte-display text-[16px] font-semibold">Caixa</h2>
              <p className="text-[12px] text-muted-foreground">
                Lançamentos que não são venda: despesa avulsa, retirada sua ou dinheiro que você
                colocou.
              </p>
              <ul className="space-y-1.5">
                {doMes.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 rounded-2xl bg-background px-3.5 py-3 ring-1 ring-black/5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px]">{l.descricao}</span>
                    <span className="text-[12px] text-muted-foreground">{l.tipo}</span>
                    <span className="text-[14px] font-semibold">{moeda(l.valor)}</span>
                    <button
                      disabled={!liberado}
                      aria-label={`Remover ${l.descricao}`}
                      onClick={async () => {
                        await supabase
                          .from("loja_financeiro_lancamentos")
                          .delete()
                          .eq("id", l.id);
                        invalidar();
                      }}
                      className="grid size-8 place-items-center rounded-lg bg-muted text-[14px] text-muted-foreground disabled:opacity-40"
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: sacolas"
                  className="min-w-0 flex-1 rounded-2xl bg-background px-3.5 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
                />
                <input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  inputMode="decimal"
                  placeholder="Valor"
                  className="w-[88px] rounded-2xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none"
                />
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="rounded-2xl bg-background px-2 py-3 text-[13px] ring-1 ring-black/5 outline-none"
                >
                  <option value="saida">Saída</option>
                  <option value="entrada">Entrada</option>
                  <option value="retirada">Retirada</option>
                  <option value="aporte">Aporte</option>
                </select>
              </div>
              <button
                disabled={!liberado}
                onClick={() => void lancar()}
                className="w-full rounded-2xl bg-ink py-3 fonte-display text-[13px] font-semibold text-background disabled:opacity-40"
              >
                Lançar no caixa
              </button>
            </section>

            <button
              onClick={exportar}
              className="w-full rounded-2xl bg-muted py-3.5 fonte-display text-[13px] font-semibold ring-1 ring-black/5"
            >
              Exportar em CSV
            </button>
          </>
        )}
      </div>
    </Casca>
  );
}

function Cartao({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-muted p-3 ring-1 ring-black/5">
      <p className="text-[11px] text-muted-foreground">{titulo}</p>
      <p
        className={
          "mt-1 fonte-display text-[19px] font-semibold leading-none " +
          (destaque ? "text-mint-forte" : "")
        }
      >
        {valor}
      </p>
    </div>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <li className={"flex items-baseline justify-between gap-3 " + (forte ? "font-semibold" : "")}>
      <span className={forte ? "" : "text-muted-foreground"}>{rotulo}</span>
      <span>{valor}</span>
    </li>
  );
}
