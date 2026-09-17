import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useDadosLoja, usePerfil, type Produto } from "@/lib/loja";
import { podeSistema } from "@/lib/pro";
import { custoVariavelUnit } from "@/lib/calculos";
import { moeda } from "@/lib/formato";
import {
  definirMinimo,
  moverEstoque,
  quantidadeDe,
  useGestao,
  useInvalidarGestao,
  variacoesDoProduto,
} from "@/lib/gestao";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque por tamanho, Minha Loja" },
      {
        name: "description",
        content:
          "Veja quanto tem de cada tamanho, o valor parado em estoque e as peças sem giro há mais de sessenta dias.",
      },
      { property: "og:title", content: "Estoque por tamanho, Minha Loja" },
      {
        property: "og:description",
        content: "Grade por tamanho, valor parado, peças sem giro e alerta de mínimo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Estoque,
});

function Estoque() {
  const loja = useDadosLoja();
  const gestao = useGestao();
  const perfil = usePerfil();
  const invalidar = useInvalidarGestao();
  const liberado = podeSistema(perfil.data);

  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<"valor" | "quantidade" | "giro">("valor");
  const [aberta, setAberta] = useState<string | null>(null);

  const produtos = loja.data?.produtos ?? [];
  const estoque = gestao.data?.estoque ?? [];
  const movimentos = gestao.data?.movimentos ?? [];

  const linhas = useMemo(() => {
    return produtos.map((p) => {
      const variacoes = variacoesDoProduto(p);
      const grade = variacoes.map((v) => ({
        variacao: v,
        quantidade: quantidadeDe(estoque, p.id, v),
        minimo: estoque.find((e) => e.produto_id === p.id && e.variacao === v)?.minimo ?? 0,
      }));
      const total = grade.reduce((s, g) => s + g.quantidade, 0);
      const custo = custoVariavelUnit(p);
      const ultimaSaida = movimentos
        .filter((m) => m.produto_id === p.id && m.tipo === "saida")
        .map((m) => new Date(m.criado_em).getTime())
        .sort((a, b) => b - a)[0];
      const diasSemGiro = ultimaSaida
        ? Math.floor((Date.now() - ultimaSaida) / 86400000)
        : Math.floor((Date.now() - new Date(p.criado_em).getTime()) / 86400000);
      return { produto: p, grade, total, custo, valor: custo * total, diasSemGiro };
    });
  }, [produtos, estoque, movimentos]);

  const filtradas = linhas
    .filter((l) => l.produto.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) =>
      ordem === "valor"
        ? b.valor - a.valor
        : ordem === "quantidade"
          ? b.total - a.total
          : b.diasSemGiro - a.diasSemGiro,
    );

  const valorParado = linhas.reduce((s, l) => s + l.valor, 0);
  const semGiro = linhas.filter((l) => l.diasSemGiro > 60 && l.total > 0);
  const abaixoMinimo = linhas.reduce(
    (s, l) => s + l.grade.filter((g) => g.minimo > 0 && g.quantidade < g.minimo).length,
    0,
  );

  async function ajustar(produtoId: string, variacao: string, delta: number, motivo: string) {
    if (!liberado) return;
    await moverEstoque({
      produtoId,
      variacao,
      delta,
      tipo: delta > 0 ? "entrada" : "ajuste",
      motivo,
    });
    invalidar();
  }

  return (
    <Casca titulo="Estoque" subtitulo={`${linhas.reduce((s, l) => s + l.total, 0)} peças`}>
      <div className="space-y-4 px-5">
        {!liberado ? (
          <div className="rounded-2xl bg-cream px-4 py-3 text-[12px] ring-1 ring-black/5">
            Modo leitura. Seus dados continuam aqui e voltam a funcionar quando você assinar.{" "}
            <Link to="/assinatura" className="font-semibold underline">
              Assinar
            </Link>
          </div>
        ) : null}

        {gestao.isLoading || loja.isLoading ? (
          <>
            <Esqueleto className="h-24" />
            <Esqueleto className="h-40" />
          </>
        ) : produtos.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma peça para controlar"
            frase="O estoque usa as peças que você já cadastrou na precificação. Cadastre a primeira."
            acao={
              <Link
                to="/pecas"
                className="rounded-2xl bg-pink px-5 py-3 fonte-display text-[13px] font-semibold leading-none text-primary-foreground"
              >
                Cadastrar peça
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Numero titulo="Valor parado" valor={moeda(valorParado)} />
              <Numero
                titulo="Sem giro 60 dias"
                valor={`${semGiro.length}`}
                nota={moeda(semGiro.reduce((s, l) => s + l.valor, 0))}
              />
              <Numero titulo="Abaixo do mínimo" valor={`${abaixoMinimo}`} />
            </div>

            <div className="sticky top-0 z-10 -mx-5 flex gap-2 bg-background/95 px-5 py-2 backdrop-blur">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar peça"
                className="min-w-0 flex-1 rounded-2xl bg-muted px-4 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
              />
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as typeof ordem)}
                className="rounded-2xl bg-muted px-3 py-3 text-[13px] ring-1 ring-black/5 outline-none"
              >
                <option value="valor">Valor parado</option>
                <option value="quantidade">Quantidade</option>
                <option value="giro">Giro</option>
              </select>
            </div>

            <ul className="space-y-2">
              {filtradas.map((l) => (
                <li key={l.produto.id} className="rounded-3xl bg-muted p-4 ring-1 ring-black/5">
                  <button
                    onClick={() => setAberta(aberta === l.produto.id ? null : l.produto.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">
                        {l.produto.nome}
                      </span>
                      <span className="block text-[12px] text-muted-foreground">
                        {l.total} peças, {moeda(l.valor)} parado
                        {l.diasSemGiro > 60 ? `, ${l.diasSemGiro} dias sem sair` : ""}
                      </span>
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {aberta === l.produto.id ? "Fechar" : "Abrir"}
                    </span>
                  </button>

                  <Grade grade={l.grade} total={l.total} />

                  {aberta === l.produto.id ? (
                    <div className="mt-3 space-y-2">
                      {l.grade.map((g) => (
                        <Variacao
                          key={g.variacao}
                          produto={l.produto}
                          variacao={g.variacao}
                          quantidade={g.quantidade}
                          minimo={g.minimo}
                          liberado={liberado}
                          aoAjustar={ajustar}
                          aoMinimo={async (m) => {
                            if (!liberado) return;
                            await definirMinimo({
                              produtoId: l.produto.id,
                              variacao: g.variacao,
                              minimo: m,
                            });
                            invalidar();
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            <Link
              to="/compras"
              className="block rounded-2xl bg-muted py-3.5 text-center fonte-display text-[13px] font-semibold ring-1 ring-black/5"
            >
              Dar entrada a partir de uma compra
            </Link>
          </>
        )}
      </div>
    </Casca>
  );
}

function Grade({
  grade,
  total,
}: {
  grade: { variacao: string; quantidade: number; minimo: number }[];
  total: number;
}) {
  return (
    <div className="mt-3 space-y-1.5">
      {grade.map((g) => {
        const largura = total > 0 ? Math.round((g.quantidade / total) * 100) : 0;
        const baixo = g.minimo > 0 && g.quantidade < g.minimo;
        return (
          <div key={g.variacao} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-[11px] text-muted-foreground">
              {g.variacao}
            </span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-background">
              <span
                className={"block h-full rounded-full " + (baixo ? "bg-rose" : "bg-mint-forte")}
                style={{ width: `${Math.max(largura, g.quantidade > 0 ? 6 : 0)}%` }}
              />
            </span>
            <span className={"w-8 text-right text-[12px] " + (baixo ? "text-rose" : "")}>
              {g.quantidade}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Variacao({
  produto,
  variacao,
  quantidade,
  minimo,
  liberado,
  aoAjustar,
  aoMinimo,
}: {
  produto: Produto;
  variacao: string;
  quantidade: number;
  minimo: number;
  liberado: boolean;
  aoAjustar: (produtoId: string, variacao: string, delta: number, motivo: string) => void;
  aoMinimo: (minimo: number) => void;
}) {
  const [motivo, setMotivo] = useState("contagem");
  return (
    <div className="rounded-2xl bg-background p-3 ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px]">{variacao}</span>
        <button
          disabled={!liberado}
          onClick={() => aoAjustar(produto.id, variacao, -1, motivo)}
          className="size-8 rounded-lg bg-muted text-[16px] leading-none disabled:opacity-40"
          aria-label={`Tirar uma de ${variacao}`}
        >
          -
        </button>
        <span className="w-8 text-center text-[14px] font-semibold">{quantidade}</span>
        <button
          disabled={!liberado}
          onClick={() => aoAjustar(produto.id, variacao, 1, motivo)}
          className="size-8 rounded-lg bg-muted text-[16px] leading-none disabled:opacity-40"
          aria-label={`Somar uma de ${variacao}`}
        >
          +
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">Motivo do ajuste</span>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-xl bg-muted px-3 py-2 text-[13px] ring-1 ring-black/5 outline-none"
          >
            <option value="contagem">Contagem</option>
            <option value="perda">Perda</option>
            <option value="troca">Troca</option>
            <option value="uso proprio">Uso próprio</option>
            <option value="presente">Presente</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">Mínimo</span>
          <input
            defaultValue={String(minimo)}
            inputMode="numeric"
            disabled={!liberado}
            onBlur={(e) => aoMinimo(Number(e.target.value) || 0)}
            className="w-full rounded-xl bg-muted px-3 py-2 text-[13px] ring-1 ring-black/5 outline-none"
          />
        </label>
      </div>
    </div>
  );
}

function Numero({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl bg-muted p-3 ring-1 ring-black/5">
      <p className="text-[11px] leading-tight text-muted-foreground">{titulo}</p>
      <p className="mt-1 fonte-display text-[17px] font-semibold leading-none">{valor}</p>
      {nota ? <p className="mt-1 text-[11px] text-muted-foreground">{nota}</p> : null}
    </div>
  );
}
