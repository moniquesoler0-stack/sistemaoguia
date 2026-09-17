import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { OfertaPro } from "@/components/OfertaPro";
import { FotoPeca } from "@/components/FotoPeca";
import { baseDaLoja, useDadosLoja, useInvalidarLoja } from "@/lib/loja";
import {
  auditar,
  descontoMaximo,
  pecasParaEquilibrio,
  precoMinimo,
  precoPorMargem,
  simularDesconto,
} from "@/lib/calculos";
import { moeda, numero, pct } from "@/lib/formato";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pecas/$id")({
  head: () => ({
    meta: [
      { title: "Peça, Minha Loja" },
      {
        name: "description",
        content:
          "Auditoria do preço da peça: quanto você acha que ganha, quanto ganha de verdade, parcelado e no marketplace.",
      },
      { property: "og:title", content: "Peça, Minha Loja" },
      {
        property: "og:description",
        content: "Veja o lucro real da peça em cada canal e simule desconto.",
      },
    ],
  }),
  component: TelaPeca,
});

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG"];

function TelaPeca() {
  const { id } = Route.useParams();
  const loja = useDadosLoja();
  const invalidar = useInvalidarLoja();
  const navigate = useNavigate();

  const produto = loja.data?.produtos.find((p) => p.id === id) ?? null;
  const canais = loja.data?.canais.filter((c) => c.ativo) ?? [];

  const [porta, setPorta] = useState<"margem" | "cobro" | "concorrente">("cobro");
  const [canalId, setCanalId] = useState<string | null>(null);
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [margemAlvo, setMargemAlvo] = useState("");
  const [concorrente, setConcorrente] = useState("");
  const [desconto, setDesconto] = useState(10);
  const [afinar, setAfinar] = useState(false);

  useEffect(() => {
    if (!produto) return;
    setPreco(String(produto.preco_atual ?? 0));
    setCusto(String(produto.custo_mercadoria ?? 0));
    setMargemAlvo(String(produto.margem_alvo_pct ?? 20));
  }, [produto?.id]);

  const canal = canais.find((c) => c.id === canalId) ?? canais[0] ?? null;
  const canalParcelado = canais.find((c) => c.parcelamento.length > 0) ?? null;
  const canalMarketplace = canais.find((c) => /market/i.test(c.nome)) ?? null;

  const calc = useMemo(() => {
    if (!loja.data || !produto) return null;
    const base = baseDaLoja(loja.data.config, loja.data.custosFixos);
    const peca = { ...produto, custo_mercadoria: numero(custo), preco_atual: numero(preco) };
    const valor = porta === "concorrente" ? numero(concorrente) : numero(preco);

    return {
      base,
      peca,
      atual: auditar(peca, base, valor, canal),
      parcelado: canalParcelado
        ? auditar(peca, base, valor, canalParcelado, canalParcelado.parcelamento.at(-1)?.parcelas)
        : null,
      parcelas: canalParcelado?.parcelamento.at(-1)?.parcelas ?? null,
      marketplace: canalMarketplace ? auditar(peca, base, valor, canalMarketplace) : null,
      minimo: precoMinimo(peca, base, canal),
      desconto: descontoMaximo(peca, base, canal),
      equilibrio: pecasParaEquilibrio(peca, base, valor, canal),
      sugerido: precoPorMargem(peca, base, numero(margemAlvo), canal),
      simulacao: simularDesconto(peca, base, desconto, canal),
      valor,
    };
  }, [
    loja.data,
    produto,
    custo,
    preco,
    concorrente,
    porta,
    canal,
    canalParcelado,
    canalMarketplace,
    margemAlvo,
    desconto,
  ]);

  async function salvar() {
    if (!produto) return;
    await supabase
      .from("loja_produtos")
      .update({
        custo_mercadoria: numero(custo),
        preco_atual: numero(preco),
        margem_alvo_pct: numero(margemAlvo),
      })
      .eq("id", produto.id);
    invalidar();
  }

  async function atualizar(campos: Record<string, unknown>) {
    if (!produto) return;
    await supabase
      .from("loja_produtos")
      .update(campos as never)
      .eq("id", produto.id);
    invalidar();
  }

  async function arquivar() {
    if (!produto) return;
    await supabase.from("loja_produtos").update({ ativo: false }).eq("id", produto.id);
    invalidar();
    void navigate({ to: "/pecas" });
  }

  return (
    <Casca titulo={produto?.nome ?? "Peça"} subtitulo={canal?.nome ?? ""}>
      <div className="space-y-4 px-5">
        {!produto || !calc ? (
          <>
            <Esqueleto className="h-12" />
            <Esqueleto className="h-44" />
            <Esqueleto className="h-24" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1 ring-1 ring-black/5">
              {(
                [
                  ["margem", "Quero margem"],
                  ["cobro", "Já cobro"],
                  ["concorrente", "A concorrente"],
                ] as const
              ).map(([chave, rotulo]) => (
                <button
                  key={chave}
                  onClick={() => setPorta(chave)}
                  className={
                    "rounded-xl py-2.5 fonte-display text-[12px] leading-none " +
                    (porta === chave
                      ? "bg-pink font-semibold text-primary-foreground"
                      : "font-medium text-muted-foreground")
                  }
                >
                  {rotulo}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Campo rotulo="Custo da peça" valor={custo} aoMudar={setCusto} />
              {porta === "margem" ? (
                <Campo rotulo="Margem desejada %" valor={margemAlvo} aoMudar={setMargemAlvo} />
              ) : porta === "concorrente" ? (
                <Campo rotulo="Preço da concorrente" valor={concorrente} aoMudar={setConcorrente} />
              ) : (
                <Campo rotulo="Preço que você cobra" valor={preco} aoMudar={setPreco} />
              )}
            </div>

            {canais.length > 1 ? (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {canais.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCanalId(c.id)}
                    className={
                      "shrink-0 rounded-full px-3.5 py-2 fonte-display text-[12px] leading-none ring-1 ring-black/5 " +
                      (canal?.id === c.id
                        ? "bg-ink font-semibold text-background"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            ) : null}

            {porta === "margem" ? (
              <div className="rounded-3xl bg-mint/50 p-5 ring-1 ring-black/5">
                <p className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground">
                  Preço para {pct(numero(margemAlvo), 0)} de margem
                </p>
                {calc.sugerido.possivel ? (
                  <>
                    <p className="pop mt-2 fonte-display text-[40px] font-semibold leading-none">
                      {moeda(calc.sugerido.preco)}
                    </p>
                    <button
                      onClick={() => {
                        setPreco(calc.sugerido.preco.toFixed(2));
                        setPorta("cobro");
                      }}
                      className="mt-4 w-full rounded-2xl bg-ink py-3.5 fonte-display text-[14px] font-semibold leading-none text-background"
                    >
                      Usar esse preço
                    </button>
                  </>
                ) : (
                  <p className="mt-2 text-pretty text-[13px] leading-relaxed">
                    Somando taxa do canal e imposto, essa margem passa de 100 por cento do preço.
                    Não existe preço que feche essa conta. Reduza a margem desejada ou escolha um
                    canal mais barato.
                  </p>
                )}
              </div>
            ) : (
              <section className="rounded-3xl bg-ink p-5 text-background">
                <p className="mb-4 text-[13px] font-medium text-background/55">
                  {produto.nome} · canal {canal?.nome ?? "sem taxa"}
                </p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-background/45">
                      Você acha que ganha
                    </p>
                    <p className="fonte-display text-[28px] font-semibold leading-none text-background/60 line-through decoration-pink">
                      {moeda(calc.valor - numero(custo))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-mint-forte">
                      Você ganha
                    </p>
                    <p
                      className={
                        "pop fonte-display text-[40px] font-semibold leading-none " +
                        (calc.atual.lucro >= 0 ? "text-mint-forte" : "text-rose")
                      }
                    >
                      {moeda(calc.atual.lucro)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-[12.5px] text-background/60">
                  {calc.parcelado && calc.parcelas ? (
                    <p>
                      Parcelada em {calc.parcelas}x, você ganha{" "}
                      <b className="text-background/90">{moeda(calc.parcelado.lucro)}</b>.
                    </p>
                  ) : null}
                  {calc.marketplace ? (
                    <p>
                      No marketplace, você {calc.marketplace.lucro >= 0 ? "ganha" : "perde"}{" "}
                      <b
                        className={calc.marketplace.lucro >= 0 ? "text-background/90" : "text-rose"}
                      >
                        {moeda(Math.abs(calc.marketplace.lucro))}
                      </b>
                      .
                    </p>
                  ) : null}
                </div>
              </section>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Numero rotulo="Margem" valor={pct(calc.atual.margem)} cor="bg-muted" />
              <Numero rotulo="Markup" valor={pct(calc.atual.markup)} cor="bg-muted" />
            </div>
            <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
              Margem é quanto sobra do preço de venda. Markup é quanto você somou em cima do custo.
              30 por cento de markup não dá 30 por cento de margem, e essa confusão é o que mais faz
              lojista perder dinheiro.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Numero
                rotulo="Preço mínimo, margem zero"
                valor={calc.minimo === null ? "impossível" : moeda(calc.minimo)}
                cor="bg-sun/35"
              />
              <Numero
                rotulo="Desconto máximo"
                valor={calc.desconto === null ? "sem folga" : pct(calc.desconto.percentual, 0)}
                cor="bg-rose/25"
              />
            </div>

            <div className="rounded-3xl bg-muted p-4 ring-1 ring-black/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Simulador de desconto
              </p>
              <input
                type="range"
                min={0}
                max={60}
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
                className="mt-3 w-full accent-pink"
              />
              <p className="mt-2 text-pretty text-[13px] leading-relaxed">
                Com {pct(desconto, 0)} de desconto o preço vai para{" "}
                {moeda(calc.simulacao.novoPreco)}. Sua margem cai de{" "}
                {pct(calc.simulacao.antes.margem, 0)} para {pct(calc.simulacao.depois.margem, 0)}
                {calc.simulacao.pecasAMais !== null
                  ? `, e você precisa vender ${calc.simulacao.pecasAMais} peças a mais para fechar o mês com o mesmo lucro.`
                  : ", e nesse preço a peça não paga mais os próprios custos."}
              </p>
            </div>

            <div className="rounded-3xl bg-muted p-4 ring-1 ring-black/5">
              <p className="text-[13px] leading-relaxed">
                Ponto de equilíbrio:{" "}
                {calc.equilibrio === null
                  ? "nesse preço a peça não contribui para pagar o custo fixo."
                  : `${calc.equilibrio} peças por mês pagam todo o seu custo fixo.`}
              </p>
            </div>

            <button
              onClick={() => void salvar()}
              className="w-full rounded-2xl bg-pink py-4 fonte-display text-[15px] font-semibold leading-none text-primary-foreground shadow-lg shadow-pink/30"
            >
              Salvar preço da peça
            </button>

            <OfertaPro texto="Suas peças já estão prontas para virar um catálogo com link para enviar às clientes." />

            <button
              onClick={() => setAfinar((v) => !v)}
              className="w-full rounded-2xl bg-muted py-3.5 fonte-display text-[14px] font-semibold leading-none ring-1 ring-black/5"
            >
              {afinar ? "Esconder o afinamento" : "Afinar essa peça"}
            </button>

            {afinar ? (
              <div className="space-y-4 rounded-3xl bg-muted p-4 ring-1 ring-black/5">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                    Fornecedor
                  </span>
                  <select
                    value={produto.fornecedor_id ?? ""}
                    onChange={(e) => void atualizar({ fornecedor_id: e.target.value || null })}
                    className="w-full rounded-2xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5"
                  >
                    <option value="">Sem fornecedor</option>
                    {loja.data?.fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <Campo
                    rotulo="Frete rateado"
                    valor={String(produto.frete_rateado)}
                    aoMudar={(v) => void atualizar({ frete_rateado: numero(v) })}
                  />
                  <Campo
                    rotulo="Perda %"
                    valor={String(produto.perda_pct)}
                    aoMudar={(v) => void atualizar({ perda_pct: numero(v) })}
                  />
                </div>

                <div>
                  <p className="mb-2 text-[12px] font-medium text-muted-foreground">
                    Embalagem aplicada
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {loja.data?.embalagem.map((i) => {
                      const aplicado = produto.itens_embalagem.some((x) => x.nome === i.nome);
                      return (
                        <button
                          key={i.id}
                          onClick={() =>
                            void atualizar({
                              itens_embalagem: aplicado
                                ? produto.itens_embalagem.filter((x) => x.nome !== i.nome)
                                : [
                                    ...produto.itens_embalagem,
                                    { nome: i.nome, valor: Number(i.valor_unitario) },
                                  ],
                            })
                          }
                          className={
                            "rounded-full px-3 py-2 text-[12px] leading-none ring-1 ring-black/5 " +
                            (aplicado ? "bg-mint" : "bg-background text-muted-foreground")
                          }
                        >
                          {i.nome} {moeda(i.valor_unitario)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[12px] font-medium text-muted-foreground">
                    Tamanhos e cores
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TAMANHOS.map((t) => {
                      const tem = produto.variacoes.some((v) => v.tamanho === t);
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            void atualizar({
                              variacoes: tem
                                ? produto.variacoes.filter((v) => v.tamanho !== t)
                                : [...produto.variacoes, { tamanho: t }],
                            })
                          }
                          className={
                            "rounded-full px-3.5 py-2 fonte-display text-[12px] leading-none ring-1 ring-black/5 " +
                            (tem ? "bg-ink text-background" : "bg-background text-muted-foreground")
                          }
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    defaultValue={produto.variacoes
                      .map((v) => v.cor)
                      .filter(Boolean)
                      .join(", ")}
                    onBlur={(e) => {
                      const cores = e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean);
                      const tamanhos = produto.variacoes.filter((v) => v.tamanho);
                      void atualizar({
                        variacoes: [...tamanhos, ...cores.map((c) => ({ cor: c }))],
                      });
                    }}
                    placeholder="Cores separadas por vírgula"
                    className="mt-2 w-full rounded-2xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
                  />
                </div>

                <FotoPeca
                  foto={produto.foto_url ?? null}
                  aoTrocar={(url) => void atualizar({ foto_url: url })}
                />

                <button
                  onClick={() => void arquivar()}
                  className="w-full rounded-2xl bg-background py-3 text-[13px] font-medium text-muted-foreground ring-1 ring-black/5"
                >
                  Arquivar essa peça
                </button>
              </div>
            ) : null}

            <Link
              to="/pecas"
              className="block py-2 text-center text-[13px] text-muted-foreground underline"
            >
              Voltar para a lista
            </Link>
          </>
        )}
      </div>
    </Casca>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{rotulo}</span>
      <input
        value={valor}
        inputMode="decimal"
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full rounded-2xl bg-muted px-4 py-3.5 text-[15px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
      />
    </label>
  );
}

function Numero({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <div className={`rounded-3xl p-4 ring-1 ring-black/5 ${cor}`}>
      <p className="mb-2 text-[12px] font-medium leading-tight text-muted-foreground">{rotulo}</p>
      <p className="fonte-display text-[24px] font-semibold leading-none">{valor}</p>
    </div>
  );
}
