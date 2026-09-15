import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Casca } from "@/components/Casca";
import { EsqueletoLista } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { baseDaLoja, useDadosLoja, useInvalidarLoja } from "@/lib/loja";
import { auditar, semaforo, type Semaforo } from "@/lib/calculos";
import { moeda, numero, pct } from "@/lib/formato";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pecas/")({
  head: () => ({
    meta: [
      { title: "Peças por lucro, Minha Loja" },
      {
        name: "description",
        content:
          "Seu catálogo ordenado da peça que mais dá dinheiro para a que dá prejuízo, com semáforo de margem e troca de canal na hora.",
      },
      { property: "og:title", content: "Peças por lucro, Minha Loja" },
      {
        property: "og:description",
        content: "Troque de Pix para marketplace e veja metade das linhas mudarem de cor.",
      },
    ],
  }),
  component: Pecas,
});

const cores: Record<Semaforo, string> = {
  verde: "bg-mint",
  ambar: "bg-sun",
  vermelho: "bg-rose",
};

function Pecas() {
  const loja = useDadosLoja();
  const invalidar = useInvalidarLoja();

  const [canalId, setCanalId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [soVermelhas, setSoVermelhas] = useState(false);

  const [nome, setNome] = useState("");
  const [custo, setCusto] = useState("");
  const [preco, setPreco] = useState("");
  const [salvando, setSalvando] = useState(false);

  const canais = loja.data?.canais.filter((c) => c.ativo) ?? [];
  const canal = canais.find((c) => c.id === canalId) ?? canais[0] ?? null;

  const linhas = useMemo(() => {
    if (!loja.data) return [];
    const base = baseDaLoja(loja.data.config, loja.data.custosFixos);
    return loja.data.produtos
      .filter((p) => p.ativo)
      .map((p) => {
        const r = auditar(p, base, p.preco_atual, canal);
        return { produto: p, ...r, cor: semaforo(r.margem, r.lucro, base.margemMinimaPct) };
      })
      .filter((l) => (busca ? l.produto.nome.toLowerCase().includes(busca.toLowerCase()) : true))
      .filter((l) => (fornecedor ? l.produto.fornecedor_id === fornecedor : true))
      .filter((l) => (soVermelhas ? l.cor === "vermelho" : true))
      .sort((a, b) => b.lucro - a.lucro);
  }, [loja.data, canal, busca, fornecedor, soVermelhas]);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !loja.data) return;
    setSalvando(true);
    const { data: user } = await supabase.auth.getUser();
    const padrao = loja.data.embalagem
      .filter((i) => i.aplicar_por_padrao)
      .map((i) => ({ nome: i.nome, valor: Number(i.valor_unitario) }));
    await supabase.from("loja_produtos").insert({
      user_id: user.user!.id,
      nome: nome.trim(),
      custo_mercadoria: numero(custo),
      preco_atual: numero(preco),
      itens_embalagem: padrao,
      margem_alvo_pct: loja.data.config?.margem_minima_pct ?? 20,
    });
    setNome("");
    setCusto("");
    setPreco("");
    setSalvando(false);
    invalidar();
  }

  async function duplicar(id: string) {
    const p = loja.data?.produtos.find((x) => x.id === id);
    if (!p) return;
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("loja_produtos").insert({
      user_id: user.user!.id,
      nome: `${p.nome} (cópia)`,
      foto_url: p.foto_url,
      fornecedor_id: p.fornecedor_id,
      custo_mercadoria: p.custo_mercadoria,
      frete_rateado: p.frete_rateado,
      perda_pct: p.perda_pct,
      itens_embalagem: p.itens_embalagem,
      preco_atual: p.preco_atual,
      margem_alvo_pct: p.margem_alvo_pct,
      variacoes: p.variacoes,
    });
    invalidar();
  }

  function exportar() {
    const cabecalho = "Peça;Custo;Preço;Lucro;Margem %;Markup %;Canal";
    const corpo = linhas.map((l) =>
      [
        l.produto.nome.replace(/;/g, ","),
        l.produto.custo_mercadoria,
        l.produto.preco_atual,
        l.lucro.toFixed(2),
        l.margem.toFixed(1),
        l.markup.toFixed(1),
        canal?.nome ?? "",
      ].join(";"),
    );
    const csv = [cabecalho, ...corpo].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "minha-loja-pecas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalVermelhas = linhas.filter((l) => l.cor === "vermelho").length;

  return (
    <Casca titulo="Peças por lucro" subtitulo={`${linhas.length} peças`}>
      <div className="sticky top-0 z-10 bg-background/95 px-5 py-3 ring-1 ring-black/5 backdrop-blur">
        <div
          className="grid gap-1 rounded-2xl bg-muted p-1 ring-1 ring-black/5"
          style={{ gridTemplateColumns: `repeat(${Math.max(canais.length, 1)}, minmax(0, 1fr))` }}
        >
          {canais.map((c) => (
            <button
              key={c.id}
              onClick={() => setCanalId(c.id)}
              className={
                "rounded-xl py-2.5 fonte-display text-[12.5px] leading-none " +
                (canal?.id === c.id
                  ? "bg-pink font-semibold text-primary-foreground shadow-md shadow-pink/30"
                  : "font-medium text-muted-foreground")
              }
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-5 pt-4">
        <form onSubmit={cadastrar} className="rounded-3xl bg-muted p-3 ring-1 ring-black/5">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Cadastro em lista
          </p>
          <div className="flex gap-2">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da peça"
              className="min-w-0 flex-1 rounded-xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
            />
            <input
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              inputMode="decimal"
              placeholder="Custo"
              className="w-[74px] rounded-xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
            />
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              inputMode="decimal"
              placeholder="Preço"
              className="w-[74px] rounded-xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
            />
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="mt-2 w-full rounded-xl bg-ink py-3 fonte-display text-[13.5px] font-semibold leading-none text-background disabled:opacity-60"
          >
            Salvar e continuar na lista
          </button>
        </form>

        <div className="space-y-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome"
            className="w-full rounded-2xl bg-muted px-4 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
          />
          <div className="flex gap-2">
            <select
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="min-w-0 flex-1 rounded-2xl bg-muted px-3 py-3 text-[13px] ring-1 ring-black/5 outline-none"
            >
              <option value="">Todos os fornecedores</option>
              {loja.data?.fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSoVermelhas((v) => !v)}
              className={
                "shrink-0 rounded-2xl px-4 py-3 fonte-display text-[13px] font-semibold leading-none ring-1 ring-black/5 " +
                (soVermelhas ? "bg-pink text-primary-foreground" : "bg-muted text-foreground/70")
              }
            >
              No vermelho {totalVermelhas}
            </button>
          </div>
        </div>

        {loja.isLoading ? (
          <EsqueletoLista />
        ) : linhas.length === 0 ? (
          <EstadoVazio
            titulo="Nada aqui com esses filtros"
            frase="Cadastre a primeira peça no campo acima ou limpe a busca e os filtros para ver o catálogo inteiro."
          />
        ) : (
          <ul className="space-y-2.5">
            {linhas.map((l) => (
              <li
                key={l.produto.id}
                className="flex items-stretch gap-3 overflow-hidden rounded-2xl bg-background ring-1 ring-black/5"
              >
                <span className={`w-1.5 shrink-0 ${cores[l.cor]}`} />
                <Link
                  to="/pecas/$id"
                  params={{ id: l.produto.id }}
                  className="min-w-0 flex-1 py-3"
                >
                  <p className="truncate text-[15px] font-semibold leading-tight">
                    {l.produto.nome}
                  </p>
                  <p className="mt-1 text-[12px] leading-none text-muted-foreground">
                    Custo {moeda(l.produto.custo_mercadoria)} · {moeda(l.produto.preco_atual)} ·
                    margem {pct(l.margem, 0)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2 pr-3">
                  <span className="fonte-display text-[17px] font-semibold leading-none">
                    {moeda(l.lucro)}
                  </span>
                  <button
                    onClick={() => void duplicar(l.produto.id)}
                    aria-label={`Duplicar ${l.produto.nome}`}
                    className="grid size-9 place-items-center rounded-xl bg-muted fonte-display text-[16px] leading-none text-foreground/60"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {linhas.length > 0 ? (
          <button
            onClick={exportar}
            className="w-full rounded-2xl bg-muted py-3.5 fonte-display text-[14px] font-semibold leading-none ring-1 ring-black/5"
          >
            Exportar em CSV
          </button>
        ) : null}
      </div>
    </Casca>
  );
}
