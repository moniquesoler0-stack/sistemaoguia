import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useDadosLoja, usePerfil } from "@/lib/loja";
import { podeSistema } from "@/lib/pro";
import { moeda, pct } from "@/lib/formato";
import { devolverVenda, mesAtual, useGestao, useInvalidarGestao } from "@/lib/gestao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas com lucro real, Minha Loja" },
      {
        name: "description",
        content:
          "Cada venda registrada mostra o lucro real da peça, baixa o estoque da variação e guarda o custo daquele momento.",
      },
      { property: "og:title", content: "Vendas com lucro real, Minha Loja" },
      {
        property: "og:description",
        content: "Venda rápida, lucro por venda, filtros por período, canal e status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vendas,
});

const status = ["pago", "pendente", "enviado", "entregue", "devolvida"];

function Vendas() {
  const loja = useDadosLoja();
  const gestao = useGestao();
  const perfil = usePerfil();
  const invalidar = useInvalidarGestao();
  const liberado = podeSistema(perfil.data);

  const [periodo, setPeriodo] = useState<"mes" | "todos">("mes");
  const [canalFiltro, setCanalFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");

  const vendas = gestao.data?.vendas ?? [];
  const itens = gestao.data?.itens ?? [];
  const canais = loja.data?.canais ?? [];

  const filtradas = useMemo(
    () =>
      vendas.filter(
        (v) =>
          (periodo === "todos" || mesAtual(v.data)) &&
          (!canalFiltro || v.canal_id === canalFiltro) &&
          (!statusFiltro || v.status === statusFiltro),
      ),
    [vendas, periodo, canalFiltro, statusFiltro],
  );

  const faturamento = filtradas.reduce((s, v) => s + Number(v.total), 0);
  const lucro = filtradas.reduce((s, v) => s + Number(v.lucro_total), 0);

  async function mudarStatus(id: string, novo: string) {
    if (!liberado) return;
    await supabase.from("loja_vendas").update({ status: novo }).eq("id", id);
    invalidar();
  }

  return (
    <Casca titulo="Vendas" subtitulo={`${filtradas.length} no período`}>
      <div className="space-y-4 px-5">
        {!liberado ? (
          <div className="rounded-2xl bg-cream px-4 py-3 text-[12px] ring-1 ring-black/5">
            Modo leitura. Nada foi apagado.{" "}
            <Link to="/assinatura" className="font-semibold underline">
              Assinar
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-muted p-3 ring-1 ring-black/5">
            <p className="text-[11px] text-muted-foreground">Faturamento</p>
            <p className="mt-1 fonte-display text-[19px] font-semibold leading-none">
              {moeda(faturamento)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted p-3 ring-1 ring-black/5">
            <p className="text-[11px] text-muted-foreground">Lucro real</p>
            <p className="mt-1 fonte-display text-[19px] font-semibold leading-none text-mint-forte">
              {moeda(lucro)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              margem {pct(faturamento > 0 ? (lucro / faturamento) * 100 : 0)}
            </p>
          </div>
        </div>

        <div className="sticky top-0 z-10 -mx-5 flex gap-2 overflow-x-auto bg-background/95 px-5 py-2 backdrop-blur">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as typeof periodo)}
            className="rounded-2xl bg-muted px-3 py-2.5 text-[13px] ring-1 ring-black/5 outline-none"
          >
            <option value="mes">Este mês</option>
            <option value="todos">Tudo</option>
          </select>
          <select
            value={canalFiltro}
            onChange={(e) => setCanalFiltro(e.target.value)}
            className="rounded-2xl bg-muted px-3 py-2.5 text-[13px] ring-1 ring-black/5 outline-none"
          >
            <option value="">Todos os canais</option>
            {canais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="rounded-2xl bg-muted px-3 py-2.5 text-[13px] ring-1 ring-black/5 outline-none"
          >
            <option value="">Todos os status</option>
            {status.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {gestao.isLoading ? (
          <>
            <Esqueleto className="h-20" />
            <Esqueleto className="h-20" />
          </>
        ) : filtradas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma venda registrada"
            frase="Use o botão de venda rápida. Em dez segundos a peça sai do estoque e o lucro real aparece aqui."
          />
        ) : (
          <ul className="space-y-2">
            {filtradas.map((v) => {
              const linhas = itens.filter((i) => i.venda_id === v.id);
              const canal = canais.find((c) => c.id === v.canal_id);
              return (
                <li key={v.id} className="rounded-3xl bg-muted p-4 ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">
                        {linhas.map((i) => i.variacao).join(", ") || "Venda"}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {new Date(v.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        {canal ? `, ${canal.nome}` : ""}
                        {v.parcelas > 1 ? `, ${v.parcelas}x` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="fonte-display text-[16px] font-semibold leading-none">
                        {moeda(v.total)}
                      </p>
                      <p
                        className={
                          "mt-1 text-[12px] " +
                          (Number(v.lucro_total) >= 0 ? "text-mint-forte" : "text-rose")
                        }
                      >
                        lucro {moeda(v.lucro_total)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={v.status}
                      disabled={!liberado}
                      onChange={(e) => void mudarStatus(v.id, e.target.value)}
                      className="rounded-xl bg-background px-3 py-2 text-[12px] ring-1 ring-black/5 outline-none"
                    >
                      {status.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {v.status !== "devolvida" ? (
                      <button
                        disabled={!liberado}
                        onClick={async () => {
                          await devolverVenda(v.id, linhas);
                          invalidar();
                        }}
                        className="rounded-xl bg-background px-3 py-2 text-[12px] ring-1 ring-black/5 disabled:opacity-40"
                      >
                        Devolver ao estoque
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Casca>
  );
}
