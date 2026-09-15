import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { useDadosLoja, useInvalidarLoja, usePerfil } from "@/lib/loja";
import { iniciarTeste, podeSistema, testeJaUsado } from "@/lib/pro";
import { moeda } from "@/lib/formato";
import { variacoesDoProduto } from "@/lib/gestao";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Gestão da loja, Minha Loja" },
      {
        name: "description",
        content:
          "Estoque por tamanho, vendas com lucro real, catálogo para enviar às clientes e financeiro do mês. Teste sete dias sem cartão.",
      },
      { property: "og:title", content: "Gestão da loja, Minha Loja" },
      {
        property: "og:description",
        content: "Estoque, vendas, catálogo e financeiro sobre as peças que você já cadastrou.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gestao,
});

function Gestao() {
  const loja = useDadosLoja();
  const perfil = usePerfil();
  const invalidar = useInvalidarLoja();
  const navigate = useNavigate();
  const [iniciando, setIniciando] = useState(false);

  const liberado = podeSistema(perfil.data);

  useEffect(() => {
    if (liberado) void navigate({ to: "/estoque" });
  }, [liberado, navigate]);

  const produtos = loja.data?.produtos ?? [];
  const nomeLoja = loja.data?.config?.nome_loja ?? "sua loja";
  const jaUsou = testeJaUsado(perfil.data);

  async function comecarTeste() {
    setIniciando(true);
    await iniciarTeste();
    invalidar();
    setIniciando(false);
    void navigate({ to: "/estoque" });
  }

  return (
    <Casca titulo="Gestão da loja" subtitulo={`${produtos.length} peças prontas`}>
      <div className="space-y-5 px-5">
        <section className="rounded-3xl bg-cream p-5 ring-1 ring-black/5">
          <h2 className="fonte-display text-[19px] font-semibold leading-tight">
            Suas peças já estão aqui. Falta ligar a gestão.
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-secondary-foreground">
            Estoque por tamanho, venda em dez segundos, catálogo para enviar às clientes e o lucro
            real do mês. Tudo em cima do catálogo que você já cadastrou.
          </p>
          {jaUsou ? (
            <Link
              to="/assinatura"
              className="mt-4 block rounded-2xl bg-pink py-3.5 text-center fonte-display text-[14px] font-semibold leading-none text-primary-foreground"
            >
              Assinar a gestão
            </Link>
          ) : (
            <>
              <button
                disabled={iniciando}
                onClick={() => void comecarTeste()}
                className="mt-4 w-full rounded-2xl bg-pink py-3.5 fonte-display text-[14px] font-semibold leading-none text-primary-foreground disabled:opacity-60"
              >
                {iniciando ? "Liberando" : "Experimentar 7 dias grátis"}
              </button>
              <p className="mt-2 text-center text-[12px] text-muted-foreground">
                Sem cartão. Depois você decide.
              </p>
              <Link
                to="/assinatura"
                className="mt-3 block text-center text-[12px] underline text-muted-foreground"
              >
                Prefiro assinar agora
              </Link>
            </>
          )}
        </section>

        {loja.isLoading ? (
          <>
            <Esqueleto className="h-52" />
            <Esqueleto className="h-52" />
          </>
        ) : (
          <>
            <Area
              titulo="Estoque"
              frase={`Suas ${produtos.length} peças já estão prontas. Falta só ligar o estoque.`}
            >
              <ul className="space-y-1.5">
                {produtos.slice(0, 4).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl bg-background px-3 py-2.5 ring-1 ring-black/5"
                  >
                    <Foto url={p.foto_url} nome={p.nome} />
                    <span className="min-w-0 flex-1 truncate text-[14px]">{p.nome}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {variacoesDoProduto(p).length} variações
                    </span>
                    <span className="rounded-lg bg-muted px-2 py-1 text-[12px] opacity-40">00</span>
                  </li>
                ))}
              </ul>
            </Area>

            <Area
              titulo="Catálogo"
              frase="Seu catálogo já existe. Ative para receber o link e enviar às clientes."
            >
              <p className="mb-2 text-[12px] text-muted-foreground">
                minhaloja.app/loja/{(nomeLoja || "sua-loja").toLowerCase().replace(/\s+/g, "-")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {produtos.slice(0, 3).map((p) => (
                  <div key={p.id} className="rounded-2xl bg-background p-2 ring-1 ring-black/5">
                    <Foto url={p.foto_url} nome={p.nome} grande />
                    <p className="mt-1.5 truncate text-[12px]">{p.nome}</p>
                    <p className="text-[12px] font-semibold">{moeda(p.preco_atual)}</p>
                  </div>
                ))}
              </div>
            </Area>

            <Area
              titulo="Vendas"
              frase="Registre uma venda e o estoque baixa sozinho, com o lucro real daquela peça."
            >
              <div className="space-y-2 opacity-60">
                <select
                  disabled
                  className="w-full rounded-2xl bg-background px-4 py-3 text-[14px] ring-1 ring-black/5"
                >
                  <option>{produtos[0]?.nome ?? "Sua peça"}</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-background px-4 py-3 text-[14px] ring-1 ring-black/5">
                    Tamanho
                  </div>
                  <div className="rounded-2xl bg-background px-4 py-3 text-[14px] ring-1 ring-black/5">
                    Canal
                  </div>
                </div>
                <div className="rounded-2xl bg-pink py-3 text-center fonte-display text-[14px] font-semibold text-primary-foreground">
                  Confirmar venda
                </div>
              </div>
            </Area>

            <Area
              titulo="Financeiro"
              frase="Hoje seu lucro é estimativa. Aqui ele vira o número real do mês."
            >
              <div className="grid grid-cols-2 gap-2">
                {["Faturamento", "Lucro do mês", "Margem real", "Posso tirar"].map((r) => (
                  <div key={r} className="rounded-2xl bg-background p-3 ring-1 ring-black/5">
                    <p className="text-[12px] text-muted-foreground">{r}</p>
                    <p className="mt-1 select-none fonte-display text-[18px] font-semibold blur-[5px]">
                      R$ 0.000
                    </p>
                  </div>
                ))}
              </div>
            </Area>
          </>
        )}
      </div>
    </Casca>
  );
}

function Area({
  titulo,
  frase,
  children,
}: {
  titulo: string;
  frase: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl bg-muted p-4 ring-1 ring-black/5">
      <div>
        <h2 className="fonte-display text-[16px] font-semibold leading-tight">{titulo}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{frase}</p>
      </div>
      {children}
    </section>
  );
}

function Foto({ url, nome, grande }: { url: string | null; nome: string; grande?: boolean }) {
  const classe = grande ? "aspect-square w-full" : "size-9";
  if (url)
    return <img src={url} alt={nome} className={`${classe} rounded-xl object-cover`} loading="lazy" />;
  return (
    <div className={`${classe} grid place-items-center rounded-xl bg-muted text-[12px] text-muted-foreground`}>
      {nome.slice(0, 1).toUpperCase()}
    </div>
  );
}
