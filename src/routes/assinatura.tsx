import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Casca } from "@/components/Casca";
import { useInvalidarLoja, usePerfil } from "@/lib/loja";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/assinatura")({
  head: () => ({
    meta: [
      { title: "Minha Loja Pro, o que muda" },
      {
        name: "description",
        content:
          "O Pro acrescenta estoque, vendas, catálogo com link, clientes e o financeiro do mês ao que você já tem no Minha Loja.",
      },
      { property: "og:title", content: "Minha Loja Pro, o que muda" },
      {
        property: "og:description",
        content: "Estoque, vendas, catálogo com link, clientes e financeiro, no mesmo app.",
      },
    ],
  }),
  component: Assinatura,
});

const RECURSOS = [
  ["Estoque por tamanho e cor", "Saiba o que ainda está na arara antes de prometer para a cliente."],
  ["Vendas registradas", "O lucro deixa de ser estimativa e passa a ser o que você vendeu."],
  ["Catálogo com link", "Suas peças com preço, prontas para mandar no WhatsApp."],
  ["Clientes", "Quem compra sempre, o que cada uma leva e quanto deixa na loja."],
  ["Financeiro do mês", "Entrou, saiu e sobrou, no fim do mês, sem planilha."],
] as const;

function Assinatura() {
  const perfil = usePerfil();
  const invalidar = useInvalidarLoja();
  const [ativando, setAtivando] = useState(false);

  const pro = perfil.data?.tem_minha_loja_pro ?? false;

  async function ativar() {
    if (!perfil.data) return;
    setAtivando(true);
    const expira = new Date();
    expira.setDate(expira.getDate() + 30);
    await supabase
      .from("perfis")
      .update({ tem_minha_loja_pro: true, pro_expira_em: expira.toISOString() })
      .eq("id", perfil.data.id);
    setAtivando(false);
    invalidar();
  }

  return (
    <Casca titulo="Minha Loja Pro" subtitulo={pro ? "ativo" : "mensal"}>
      <div className="space-y-5 px-5">
        <section className="rounded-3xl bg-ink p-5 text-background">
          <p className="text-[13px] text-background/60">
            O que você já tem continua seu para sempre. O Pro é o que vem depois do preço certo.
          </p>
          <p className="mt-3 fonte-display text-[34px] font-semibold leading-none">
            R$ 29 <span className="text-[15px] font-medium text-background/60">por mês</span>
          </p>
        </section>

        <ul className="space-y-2.5">
          {RECURSOS.map(([titulo, texto]) => (
            <li key={titulo} className="rounded-2xl bg-muted p-4 ring-1 ring-black/5">
              <p className="fonte-display text-[15px] font-semibold leading-tight">{titulo}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{texto}</p>
            </li>
          ))}
        </ul>

        {pro ? (
          <div className="rounded-2xl bg-mint/50 p-4 text-[13.5px] leading-relaxed ring-1 ring-black/5">
            Seu Pro está ativo
            {perfil.data?.pro_expira_em
              ? ` até ${new Date(perfil.data.pro_expira_em).toLocaleDateString("pt-BR")}`
              : ""}
            . As telas de estoque, vendas, catálogo, clientes e financeiro entram em seguida.
          </div>
        ) : (
          <>
            <button
              onClick={() => void ativar()}
              disabled={ativando}
              className="w-full rounded-2xl bg-pink py-4 fonte-display text-[15px] font-semibold leading-none text-primary-foreground shadow-lg shadow-pink/30 disabled:opacity-60"
            >
              Ativar o Pro por 30 dias
            </button>
            <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
              O pagamento ainda não está ligado. Por enquanto a ativação serve para você testar o
              que muda.
            </p>
          </>
        )}

        <Link
          to="/painel"
          className="block py-2 text-center text-[13px] text-muted-foreground underline"
        >
          Voltar ao painel
        </Link>
      </div>
    </Casca>
  );
}
