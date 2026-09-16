import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/sessao";
import { usePerfil } from "@/lib/loja";
import { Esqueleto } from "@/components/Esqueleto";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minha Loja, precificação real para moda fitness" },
      {
        name: "description",
        content:
          "Descubra quanto você ganha de verdade em cada peça, por canal de venda, com custo de embalagem, taxa, imposto e custo fixo já embutidos.",
      },
      { property: "og:title", content: "Minha Loja, precificação real para moda fitness" },
      {
        property: "og:description",
        content:
          "Você acha que ganha R$ 68. Veja quanto sobra de verdade em cada peça, em cada canal.",
      },
    ],
  }),
  component: Vendas,
});

function Vendas() {
  const { sessao, carregando } = useSessao();
  const perfil = usePerfil();
  const navigate = useNavigate();
  const [aviso, setAviso] = useState<string | null>(null);

  const pronto = !carregando && !perfil.isLoading;
  const podePrecificar =
    !!perfil.data && (perfil.data.tem_minha_loja || perfil.data.tem_minha_loja_pro);

  useEffect(() => {
    if (pronto && sessao && podePrecificar) void navigate({ to: "/painel" });
  }, [pronto, sessao, podePrecificar, navigate]);

  // O acesso é liberado pelo webhook de pagamento, não pelo navegador: o banco
  // não aceita mais que a própria pessoa ligue o Pro para si.
  function comprar() {
    if (!sessao) {
      void navigate({ to: "/entrar" });
      return;
    }
    setAviso("O checkout ainda não está conectado. Assim que estiver, este botão leva direto ao pagamento.");
  }

  return (
    <main className="trilho px-5 pb-10 pt-8">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-2xl bg-pink fonte-display text-lg font-semibold text-primary-foreground">
          M
        </span>
        <span className="fonte-display text-[15px] font-semibold">Minha Loja</span>
      </div>

      <h1 className="mt-7 text-balance fonte-display text-[30px] font-semibold leading-[1.1]">
        Sua verdade em números
      </h1>
      <p className="mt-3 text-pretty text-[14px] leading-relaxed text-muted-foreground">
        Você cadastra as peças, o app calcula o que sobra de verdade em cada uma, em cada canal de
        venda, com embalagem, taxa, imposto, perda e custo fixo já embutidos.
      </p>

      <section className="mt-7 rounded-3xl bg-ink p-5 text-background">
        <p className="mb-4 text-[12px] uppercase tracking-[0.15em] text-background/45">
          Auditoria de preço
        </p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-background/45">
              Você acha que ganha
            </p>
            <p className="fonte-display text-[28px] font-semibold leading-none text-background/60 line-through decoration-pink">
              R$ 68
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-mint-forte">Você ganha</p>
            <p className="pop fonte-display text-[40px] font-semibold leading-none text-mint-forte">
              R$ 41
            </p>
          </div>
        </div>
        <p className="mt-4 text-pretty text-[12px] text-background/50">
          No marketplace essa mesma peça vira prejuízo de R$ 4,20. É esse tipo de conta que o app
          faz por você.
        </p>
      </section>

      {!pronto ? (
        <div className="mt-7 space-y-3">
          <Esqueleto className="h-40" />
          <Esqueleto className="h-40" />
        </div>
      ) : (
        <div className="mt-7 space-y-3">
          <article className="rounded-3xl bg-muted p-5 ring-1 ring-black/5">
            <h2 className="fonte-display text-[18px] font-semibold">Minha Loja</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Pagamento único, acesso vitalício
            </p>
            <p className="mt-3 text-pretty text-[13px] leading-relaxed">
              Cadastro de peças, custo real, margem, markup, preço mínimo, desconto máximo, ponto de
              equilíbrio e comparativo de canais.
            </p>
            <button
              onClick={comprar}
              className="mt-4 h-13 w-full rounded-2xl bg-pink py-4 fonte-display text-[15px] font-semibold leading-none text-primary-foreground shadow-lg shadow-pink/30"
            >
              Comprar acesso vitalício
            </button>
          </article>

          <article className="rounded-3xl bg-mint/50 p-5 ring-1 ring-black/5">
            <h2 className="fonte-display text-[18px] font-semibold">Minha Loja Pro</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Assinatura mensal</p>
            <p className="mt-3 text-pretty text-[13px] leading-relaxed">
              Tudo da Minha Loja mais estoque, vendas, catálogo público com link, clientes e
              financeiro. Mesmas peças, nada de recadastrar.
            </p>
            <button
              onClick={comprar}
              className="mt-4 w-full rounded-2xl bg-ink py-4 fonte-display text-[15px] font-semibold leading-none text-background"
            >
              Assinar a Pro
            </button>
          </article>
        </div>
      )}

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        {sessao ? (
          <button onClick={() => void supabase.auth.signOut()} className="underline">
            Sair da conta
          </button>
        ) : (
          <Link to="/entrar" className="underline">
            Já tenho conta, quero entrar
          </Link>
        )}
      </p>

      {aviso ? (
        <p className="mt-4 rounded-2xl bg-cream p-3.5 text-center text-[12.5px] leading-relaxed ring-1 ring-black/5">
          {aviso}
        </p>
      ) : null}
    </main>
  );
}
