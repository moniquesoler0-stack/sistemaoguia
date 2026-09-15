import { useState } from "react";
import { useDadosLoja, type Compra } from "@/lib/loja";
import { moverEstoque, useInvalidarGestao, variacoesDoProduto } from "@/lib/gestao";

/** Confirma as quantidades por variação e sobe o estoque de uma compra já lançada. */
export function EntradaCompra({ compra, aoFechar }: { compra: Compra; aoFechar: () => void }) {
  const loja = useDadosLoja();
  const invalidar = useInvalidarGestao();
  const produtos = loja.data?.produtos ?? [];

  const iniciais = compra.itens.map((i) => {
    const produto = produtos.find((p) => p.nome.toLowerCase() === String(i.nome).toLowerCase());
    return {
      nome: String(i.nome),
      produtoId: produto?.id ?? "",
      variacao: (produto ? variacoesDoProduto(produto)[0] : "Única") ?? "Única",
      quantidade: String(i.qtd ?? 1),
    };
  });

  const [linhas, setLinhas] = useState(iniciais);
  const [salvando, setSalvando] = useState(false);

  async function confirmar() {
    setSalvando(true);
    for (const l of linhas) {
      if (!l.produtoId) continue;
      const qtd = Math.max(0, Math.round(Number(l.quantidade) || 0));
      if (qtd === 0) continue;
      await moverEstoque({
        produtoId: l.produtoId,
        variacao: l.variacao,
        delta: qtd,
        tipo: "entrada",
        motivo: "entrada de compra",
        origemId: compra.id,
      });
    }
    invalidar();
    setSalvando(false);
    aoFechar();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <div className="max-h-[86dvh] w-full max-w-[412px] overflow-y-auto rounded-3xl bg-card p-5 shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="fonte-display text-[18px] font-semibold">Dar entrada no estoque</h2>
          <button onClick={aoFechar} className="text-[13px] text-muted-foreground">
            Fechar
          </button>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          O frete já rateado continua no custo de cada peça. Confirme as quantidades por variação.
        </p>

        <div className="mt-4 space-y-2">
          {linhas.map((l, idx) => {
            const produto = produtos.find((p) => p.id === l.produtoId);
            return (
              <div key={idx} className="rounded-2xl bg-muted p-3 ring-1 ring-black/5">
                <p className="truncate text-[14px] font-semibold">{l.nome}</p>
                <div className="mt-2 grid grid-cols-[1fr_1fr_64px] gap-2">
                  <select
                    value={l.produtoId}
                    onChange={(e) =>
                      setLinhas((v) =>
                        v.map((x, i) =>
                          i === idx ? { ...x, produtoId: e.target.value, variacao: "Única" } : x,
                        ),
                      )
                    }
                    className="min-w-0 rounded-xl bg-background px-2 py-2.5 text-[13px] ring-1 ring-black/5 outline-none"
                  >
                    <option value="">Escolher peça</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={l.variacao}
                    onChange={(e) =>
                      setLinhas((v) =>
                        v.map((x, i) => (i === idx ? { ...x, variacao: e.target.value } : x)),
                      )
                    }
                    className="min-w-0 rounded-xl bg-background px-2 py-2.5 text-[13px] ring-1 ring-black/5 outline-none"
                  >
                    {(produto ? variacoesDoProduto(produto) : ["Única"]).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    value={l.quantidade}
                    inputMode="numeric"
                    onChange={(e) =>
                      setLinhas((v) =>
                        v.map((x, i) => (i === idx ? { ...x, quantidade: e.target.value } : x)),
                      )
                    }
                    className="w-full rounded-xl bg-background px-2 py-2.5 text-center text-[13px] ring-1 ring-black/5 outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          disabled={salvando}
          onClick={() => void confirmar()}
          className="mt-4 w-full rounded-2xl bg-pink py-3.5 fonte-display text-[14px] font-semibold leading-none text-primary-foreground disabled:opacity-60"
        >
          {salvando ? "Subindo estoque" : "Confirmar entrada"}
        </button>
      </div>
    </div>
  );
}
