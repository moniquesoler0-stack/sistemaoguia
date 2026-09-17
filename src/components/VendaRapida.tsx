import { useMemo, useState } from "react";
import { baseDaLoja, useDadosLoja, useInvalidarLoja } from "@/lib/loja";
import {
  quantidadeDe,
  registrarVenda,
  useGestao,
  useInvalidarGestao,
  variacoesDoProduto,
} from "@/lib/gestao";
import { moeda, numero } from "@/lib/formato";

export function VendaRapida() {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberta(true)}
        className="fixed bottom-24 right-4 z-30 rounded-full bg-pink px-5 py-4 fonte-display text-[14px] font-semibold leading-none text-primary-foreground shadow-xl lg:bottom-8 lg:right-8"
      >
        Venda rápida
      </button>
      {aberta ? <Painel aoFechar={() => setAberta(false)} /> : null}
    </>
  );
}

function Painel({ aoFechar }: { aoFechar: () => void }) {
  const loja = useDadosLoja();
  const gestao = useGestao();
  const invalidar = useInvalidarLoja();
  const invalidarGestao = useInvalidarGestao();

  const produtos = useMemo(() => (loja.data?.produtos ?? []).filter((p) => p.ativo), [loja.data]);
  const canais = (loja.data?.canais ?? []).filter((c) => c.ativo);

  const [produtoId, setProdutoId] = useState("");
  const [variacao, setVariacao] = useState("");
  const [canalId, setCanalId] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [preco, setPreco] = useState("");
  const [desconto, setDesconto] = useState("");
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const produto = produtos.find((p) => p.id === produtoId) ?? null;
  const canal = canais.find((c) => c.id === canalId) ?? canais[0] ?? null;
  const variacoes = produto ? variacoesDoProduto(produto) : [];
  const varSelecionada = variacao || variacoes[0] || "Única";
  const emEstoque = produto
    ? quantidadeDe(gestao.data?.estoque ?? [], produto.id, varSelecionada)
    : 0;

  async function confirmar() {
    if (!produto) return;
    setSalvando(true);
    const base = baseDaLoja(loja.data?.config ?? null, loja.data?.custosFixos ?? []);
    await registrarVenda({
      itens: [
        {
          produto,
          variacao: varSelecionada,
          quantidade: 1,
          preco: numero(preco) || Number(produto.preco_atual),
        },
      ],
      base,
      canal,
      parcelas,
      formaPagamento: canal?.nome ?? "Não informado",
      desconto: numero(desconto),
      freteCobrado: 0,
    });
    invalidar();
    invalidarGestao();
    setSalvando(false);
    aoFechar();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <div className="max-h-[86dvh] w-full max-w-[412px] overflow-y-auto rounded-3xl bg-card p-5 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="fonte-display text-[18px] font-semibold">Venda rápida</h2>
          <button onClick={aoFechar} className="text-[13px] text-muted-foreground">
            Fechar
          </button>
        </div>

        {produtos.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted-foreground">
            Cadastre uma peça na precificação para registrar vendas.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <Select
              rotulo="Peça"
              valor={produtoId}
              aoMudar={(v) => {
                setProdutoId(v);
                setVariacao("");
                const p = produtos.find((x) => x.id === v);
                setPreco(p ? String(p.preco_atual) : "");
              }}
              opcoes={[
                { valor: "", texto: "Escolher peça" },
                ...produtos.map((p) => ({ valor: p.id, texto: p.nome })),
              ]}
            />

            {produto ? (
              <>
                <Select
                  rotulo="Tamanho e cor"
                  valor={varSelecionada}
                  aoMudar={setVariacao}
                  opcoes={variacoes.map((v) => ({ valor: v, texto: v }))}
                />
                {emEstoque <= 0 ? (
                  <p className="rounded-2xl bg-cream px-3.5 py-2.5 text-[12px]">
                    Sem estoque desta variação. Você pode vender mesmo assim, como encomenda.
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground">
                    {emEstoque} em estoque nesta variação
                  </p>
                )}

                <Select
                  rotulo="Canal"
                  valor={canal?.id ?? ""}
                  aoMudar={setCanalId}
                  opcoes={canais.map((c) => ({ valor: c.id, texto: c.nome }))}
                />

                {(canal?.parcelamento?.length ?? 0) > 0 ? (
                  <Select
                    rotulo="Parcelas"
                    valor={String(parcelas)}
                    aoMudar={(v) => setParcelas(Number(v))}
                    opcoes={[
                      { valor: "1", texto: "À vista" },
                      ...(canal?.parcelamento ?? []).map((p) => ({
                        valor: String(p.parcelas),
                        texto: `${p.parcelas}x`,
                      })),
                    ]}
                  />
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                    Preço cobrado
                  </span>
                  <input
                    value={preco}
                    inputMode="decimal"
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full rounded-2xl bg-muted px-4 py-3 text-[15px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
                  />
                </label>

                <button
                  onClick={() => setMaisOpcoes((v) => !v)}
                  className="text-[12px] text-muted-foreground underline"
                >
                  {maisOpcoes ? "Esconder desconto" : "Desconto"}
                </button>
                {maisOpcoes ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                      Desconto em reais
                    </span>
                    <input
                      value={desconto}
                      inputMode="decimal"
                      onChange={(e) => setDesconto(e.target.value)}
                      className="w-full rounded-2xl bg-muted px-4 py-3 text-[15px] ring-1 ring-black/5 outline-none"
                    />
                  </label>
                ) : null}

                <p className="text-[13px] text-muted-foreground">
                  Total {moeda((numero(preco) || Number(produto.preco_atual)) - numero(desconto))}
                </p>

                <button
                  disabled={salvando}
                  onClick={() => void confirmar()}
                  className="w-full rounded-2xl bg-pink py-3.5 fonte-display text-[14px] font-semibold leading-none text-primary-foreground disabled:opacity-60"
                >
                  {salvando ? "Registrando" : "Confirmar venda"}
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Select({
  rotulo,
  valor,
  aoMudar,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; texto: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full rounded-2xl bg-muted px-4 py-3 text-[15px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}
