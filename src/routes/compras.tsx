import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Casca } from "@/components/Casca";
import { EsqueletoLista } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useDadosLoja, useInvalidarLoja, usePerfil } from "@/lib/loja";
import { moeda, numero } from "@/lib/formato";
import { supabase } from "@/integrations/supabase/client";
import { podeSistema } from "@/lib/pro";
import { EntradaCompra } from "@/components/EntradaCompra";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Compras e frete rateado, Minha Loja" },
      {
        name: "description",
        content:
          "Lance a compra do fornecedor com o frete total e o app divide o frete entre as peças pelo valor de cada uma.",
      },
      { property: "og:title", content: "Compras e frete rateado, Minha Loja" },
      {
        property: "og:description",
        content: "O frete da sacoleira dividido peça por peça, sem calculadora.",
      },
    ],
  }),
  component: Compras,
});

type Item = { nome: string; qtd: string; custo: string };

function Compras() {
  const loja = useDadosLoja();
  const perfil = usePerfil();
  const invalidar = useInvalidarLoja();
  const comGestao = podeSistema(perfil.data);
  const [entrada, setEntrada] = useState<string | null>(null);

  const [fornecedor, setFornecedor] = useState("");
  const [frete, setFrete] = useState("");
  const [itens, setItens] = useState<Item[]>([{ nome: "", qtd: "1", custo: "" }]);
  const [salvando, setSalvando] = useState(false);

  const linhas = itens
    .filter((i) => i.nome.trim())
    .map((i) => ({
      nome: i.nome.trim(),
      qtd: Math.max(1, Math.round(numero(i.qtd) || 1)),
      custo: numero(i.custo),
    }));
  const totalMercadoria = linhas.reduce((s, l) => s + l.custo * l.qtd, 0);
  const freteTotal = numero(frete);

  function rateio(custo: number) {
    if (totalMercadoria <= 0) return 0;
    return (custo / totalMercadoria) * freteTotal;
  }

  async function lancar() {
    if (linhas.length === 0) return;
    setSalvando(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user!.id;

    await supabase.from("loja_compras").insert({
      user_id: uid,
      fornecedor_id: fornecedor || null,
      frete_total: freteTotal,
      itens: linhas,
    });

    const padrao = (loja.data?.embalagem ?? [])
      .filter((i) => i.aplicar_por_padrao)
      .map((i) => ({ nome: i.nome, valor: Number(i.valor_unitario) }));

    await supabase.from("loja_produtos").insert(
      linhas.map((l) => ({
        user_id: uid,
        nome: l.nome,
        fornecedor_id: fornecedor || null,
        custo_mercadoria: l.custo,
        frete_rateado: Number(rateio(l.custo).toFixed(2)),
        itens_embalagem: padrao,
        margem_alvo_pct: loja.data?.config?.margem_minima_pct ?? 20,
      })),
    );

    setItens([{ nome: "", qtd: "1", custo: "" }]);
    setFrete("");
    setSalvando(false);
    invalidar();
  }

  return (
    <Casca titulo="Compras" subtitulo="frete dividido por peça">
      <div className="space-y-4 px-5">
        <section className="space-y-3 rounded-3xl bg-muted p-4 ring-1 ring-black/5">
          <h2 className="fonte-display text-[16px] font-semibold leading-tight">Nova compra</h2>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="min-w-0 rounded-2xl bg-background px-3 py-3 text-[13.5px] ring-1 ring-black/5 outline-none"
            >
              <option value="">Sem fornecedor</option>
              {loja.data?.fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            <input
              value={frete}
              onChange={(e) => setFrete(e.target.value)}
              inputMode="decimal"
              placeholder="Frete total"
              className="w-full rounded-2xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
            />
          </div>

          <div className="space-y-2">
            {itens.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={item.nome}
                  onChange={(e) =>
                    setItens((v) =>
                      v.map((x, i) => (i === idx ? { ...x, nome: e.target.value } : x)),
                    )
                  }
                  placeholder="Peça"
                  className="min-w-0 flex-1 rounded-xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
                />
                <input
                  value={item.qtd}
                  onChange={(e) =>
                    setItens((v) => v.map((x, i) => (i === idx ? { ...x, qtd: e.target.value } : x)))
                  }
                  inputMode="numeric"
                  className="w-[54px] rounded-xl bg-background px-2 py-3 text-center text-[14px] ring-1 ring-black/5 outline-none"
                />
                <input
                  value={item.custo}
                  onChange={(e) =>
                    setItens((v) =>
                      v.map((x, i) => (i === idx ? { ...x, custo: e.target.value } : x)),
                    )
                  }
                  inputMode="decimal"
                  placeholder="Custo"
                  className="w-[78px] rounded-xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none"
                />
              </div>
            ))}
            <button
              onClick={() => setItens((v) => [...v, { nome: "", qtd: "1", custo: "" }])}
              className="w-full rounded-xl bg-background py-2.5 fonte-display text-[13px] font-semibold leading-none ring-1 ring-black/5"
            >
              Somar outra peça
            </button>
          </div>

          {linhas.length > 0 ? (
            <div className="rounded-2xl bg-background p-3.5 ring-1 ring-black/5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Frete rateado pelo valor
              </p>
              <ul className="space-y-1">
                {linhas.map((l, i) => (
                  <li key={i} className="flex justify-between text-[13px]">
                    <span className="truncate pr-2">{l.nome}</span>
                    <span className="shrink-0 font-semibold">
                      {moeda(l.custo)} + {moeda(rateio(l.custo))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            onClick={() => void lancar()}
            disabled={salvando || linhas.length === 0}
            className="w-full rounded-2xl bg-pink py-4 fonte-display text-[15px] font-semibold leading-none text-primary-foreground disabled:opacity-60"
          >
            Lançar compra e criar as peças
          </button>
        </section>

        <h2 className="px-1 fonte-display text-[16px] font-semibold leading-tight">
          Compras lançadas
        </h2>
        {loja.isLoading ? (
          <EsqueletoLista />
        ) : (loja.data?.compras.length ?? 0) === 0 ? (
          <EstadoVazio
            titulo="Nenhuma compra lançada"
            frase="Ao lançar a compra com o frete total, cada peça já nasce com a parte do frete dentro do custo."
          />
        ) : (
          <ul className="space-y-2">
            {loja.data?.compras.map((c) => {
              const nomeFornecedor =
                loja.data?.fornecedores.find((f) => f.id === c.fornecedor_id)?.nome ??
                "Sem fornecedor";
              const total = c.itens.reduce((s, i) => s + Number(i.custo) * Number(i.qtd), 0);
              return (
                <li key={c.id} className="rounded-2xl bg-muted p-3.5 ring-1 ring-black/5">
                  <div className="flex justify-between gap-2">
                    <p className="text-[14px] font-semibold">{nomeFornecedor}</p>
                    <p className="fonte-display text-[15px] font-semibold">
                      {moeda(total + Number(c.frete_total))}
                    </p>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {new Date(c.data).toLocaleDateString("pt-BR")} · {c.itens.length} peças · frete{" "}
                    {moeda(c.frete_total)}
                  </p>
                  {comGestao ? (
                    <button
                      onClick={() => setEntrada(c.id)}
                      className="mt-2.5 w-full rounded-xl bg-background py-2.5 fonte-display text-[13px] font-semibold ring-1 ring-black/5"
                    >
                      Dar entrada no estoque
                    </button>
                  ) : null}
                  {entrada === c.id ? (
                    <EntradaCompra compra={c} aoFechar={() => setEntrada(null)} />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Casca>
  );
}
