import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { OfertaPro } from "@/components/OfertaPro";
import { baseDaLoja, useDadosLoja } from "@/lib/loja";
import { auditar, pecasParaEquilibrio, semaforo } from "@/lib/calculos";
import { moeda, moedaCurta, pct } from "@/lib/formato";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel da loja, Minha Loja" },
      {
        name: "description",
        content:
          "Lucro médio por peça, peças no vermelho, margem média real e quantas peças por mês pagam o seu custo fixo.",
      },
      { property: "og:title", content: "Painel da loja, Minha Loja" },
      {
        property: "og:description",
        content: "Os quatro números que dizem como sua loja está indo hoje.",
      },
    ],
  }),
  component: Painel,
});

function Painel() {
  const loja = useDadosLoja();

  const resumo = useMemo(() => {
    if (!loja.data) return null;
    const base = baseDaLoja(loja.data.config, loja.data.custosFixos);
    const canal = loja.data.canais.find((c) => c.ativo) ?? null;
    const produtos = loja.data.produtos.filter((p) => p.ativo);
    if (produtos.length === 0) return { base, canal, vazio: true as const };

    const linhas = produtos.map((p) => auditar(p, base, p.preco_atual, canal));
    const lucroMedio = linhas.reduce((s, l) => s + l.lucro, 0) / linhas.length;
    const margemMedia = linhas.reduce((s, l) => s + l.margem, 0) / linhas.length;
    const vermelhas = linhas.filter(
      (l, i) => semaforo(l.margem, l.lucro, base.margemMinimaPct) === "vermelho" && produtos[i],
    ).length;

    const equilibrios = produtos
      .map((p) => pecasParaEquilibrio(p, base, p.preco_atual, canal))
      .filter((v): v is number => v !== null);
    const equilibrio = equilibrios.length
      ? Math.round(equilibrios.reduce((s, v) => s + v, 0) / equilibrios.length)
      : null;

    return { base, canal, vazio: false as const, lucroMedio, margemMedia, vermelhas, equilibrio };
  }, [loja.data]);

  const configurado = loja.data?.config?.onboarding_concluido ?? false;

  return (
    <Casca titulo="Sua verdade em números" subtitulo="hoje">
      <div className="space-y-5 px-5">
        {!configurado ? (
          <Link
            to="/ajustes"
            className="block rounded-2xl bg-sun/35 p-3.5 text-[12.5px] leading-snug ring-1 ring-black/5"
          >
            Seus números melhoram depois que você ajusta custo fixo, embalagem e imposto.
            <span className="mt-1 block fonte-display text-[12px] font-semibold text-pink">
              Ajustar agora
            </span>
          </Link>
        ) : null}

        {loja.isLoading || !resumo ? (
          <div className="grid grid-cols-2 gap-3">
            <Esqueleto className="h-[104px]" />
            <Esqueleto className="h-[104px]" />
            <Esqueleto className="h-[104px]" />
            <Esqueleto className="h-[104px]" />
          </div>
        ) : resumo.vazio ? (
          <EstadoVazio
            titulo="Nenhuma peça cadastrada ainda"
            frase="Cadastre suas peças em lista, com nome, custo e preço. Leva poucos segundos por peça."
            acao={
              <Link
                to="/pecas"
                className="rounded-2xl bg-pink px-5 py-3 fonte-display text-[14px] font-semibold leading-none text-primary-foreground"
              >
                Cadastrar peças
              </Link>
            }
          />
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Resumo, canal {resumo.canal?.nome ?? "sem taxa"}
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Cartao
                cor="bg-mint/50"
                rotulo="Lucro médio por peça"
                valor={moedaCurta(resumo.lucroMedio)}
              />
              <Cartao
                cor="bg-pink text-primary-foreground"
                rotulo="Peças no vermelho"
                valor={String(resumo.vermelhas)}
                destaque
              />
              <Cartao
                cor="bg-sun/35"
                rotulo="Margem média real"
                valor={pct(resumo.margemMedia, 0)}
              />
              <Cartao
                cor="bg-rose/25"
                rotulo="Peças/mês p/ pagar o fixo"
                valor={resumo.equilibrio === null ? "sem margem" : String(resumo.equilibrio)}
              />
            </div>

            <div className="rounded-2xl bg-muted p-4 ring-1 ring-black/5">
              <p className="text-[12.5px] leading-relaxed text-foreground/75">
                Custo fixo do mês: {moeda(resumo.base.custosFixosTotal)}. Diluído em{" "}
                {resumo.base.volumeMensal} peças, cada peça carrega{" "}
                {moeda(resumo.base.custosFixosTotal / (resumo.base.volumeMensal || 1))} antes de
                qualquer taxa.
              </p>
            </div>

            <OfertaPro texto="Esse número é estimativa. O lucro real vem do que você vendeu de verdade." />

            <Link
              to="/pecas"
              className="block rounded-2xl bg-ink py-4 text-center fonte-display text-[15px] font-semibold leading-none text-background"
            >
              Ver peças por lucro
            </Link>
          </>
        )}
      </div>
    </Casca>
  );
}

function Cartao({
  cor,
  rotulo,
  valor,
  destaque,
}: {
  cor: string;
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-4 ring-1 ring-black/5 ${cor} ${destaque ? "pop" : ""}`}>
      <p
        className={`mb-2 text-[12px] font-medium leading-tight ${
          destaque ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {rotulo}
      </p>
      <p className="text-balance fonte-display text-[30px] font-semibold leading-none">{valor}</p>
    </div>
  );
}
