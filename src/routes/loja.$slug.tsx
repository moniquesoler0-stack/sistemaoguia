import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { moeda } from "@/lib/formato";
import { buscarCatalogoPublico } from "@/lib/catalogo.functions";

export const Route = createFileRoute("/loja/$slug")({
  loader: ({ params }) => buscarCatalogoPublico({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const titulo = loaderData?.titulo ?? "Catálogo";
    const desc =
      loaderData?.bio ?? "Veja as peças disponíveis e faça seu pedido direto pelo WhatsApp.";
    return {
      meta: [
        { title: `${titulo}, catálogo` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: `${titulo}, catálogo` },
        { property: "og:description", content: desc.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <Recado
      titulo="Catálogo indisponível"
      frase="Tente abrir o link de novo em alguns instantes."
    />
  ),
  notFoundComponent: () => (
    <Recado titulo="Catálogo não encontrado" frase="Confira o link com a loja." />
  ),
  component: CatalogoPublicoPagina,
});

function Recado({ titulo, frase }: { titulo: string; frase: string }) {
  return (
    <main className="trilho min-h-svh px-5 py-16 text-center">
      <h1 className="fonte-display text-[22px] font-semibold">{titulo}</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">{frase}</p>
    </main>
  );
}

function CatalogoPublicoPagina() {
  const dados = Route.useLoaderData();
  const [pedido, setPedido] = useState<Record<string, number>>({});

  if (!dados)
    return (
      <Recado
        titulo="Catálogo fora do ar"
        frase="Esta loja ainda não publicou o catálogo. Fale com ela pelo Instagram."
      />
    );

  const itens = dados.pecas.filter((p) => (pedido[p.id] ?? 0) > 0);
  const total = itens.reduce((s, p) => s + p.preco_atual * (pedido[p.id] ?? 0), 0);

  function mudar(id: string, delta: number) {
    setPedido((atual) => ({ ...atual, [id]: Math.max(0, (atual[id] ?? 0) + delta) }));
  }

  const texto = encodeURIComponent(
    `Olá, vim pelo catálogo ${dados.titulo}. Quero:\n` +
      itens.map((p) => `${pedido[p.id]}x ${p.nome}`).join("\n") +
      `\nTotal ${moeda(total)}`,
  );
  const link = dados.whatsapp ? `https://wa.me/55${dados.whatsapp}?text=${texto}` : null;

  return (
    <main className="trilho min-h-svh pb-28">
      <header className="px-5 pb-4 pt-8 text-center">
        {dados.logo_url ? (
          <img
            src={dados.logo_url}
            alt={dados.titulo}
            className="mx-auto size-16 rounded-2xl object-cover"
          />
        ) : null}
        <h1 className="mt-3 fonte-display text-[24px] font-semibold leading-tight">
          {dados.titulo}
        </h1>
        {dados.bio ? (
          <p className="mx-auto mt-2 max-w-[36ch] text-pretty text-[13px] text-muted-foreground">
            {dados.bio}
          </p>
        ) : null}
        {dados.instagram ? (
          <a
            href={`https://instagram.com/${dados.instagram}`}
            className="mt-2 inline-block text-[12px] underline"
          >
            @{dados.instagram}
          </a>
        ) : null}
      </header>

      {dados.pecas.length === 0 ? (
        <p className="px-5 text-center text-[13px] text-muted-foreground">
          As peças voltam em breve. Acompanhe pelo Instagram da loja.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 px-5 lg:grid-cols-4">
          {dados.pecas.map((p) => {
            const qtd = pedido[p.id] ?? 0;
            const tamanhos = p.variacoes
              .map((v) => [v.tamanho, v.cor].filter(Boolean).join(" "))
              .filter(Boolean);
            return (
              <li key={p.id} className="rounded-3xl bg-card p-2.5 ring-1 ring-black/5">
                {p.foto_url ? (
                  <img
                    src={p.foto_url}
                    alt={p.nome}
                    loading="lazy"
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid aspect-square w-full place-items-center rounded-2xl bg-muted text-[13px] text-muted-foreground">
                    {p.nome.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="mt-2 line-clamp-2 text-[13px] leading-snug">{p.nome}</p>
                {tamanhos.length ? (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {tamanhos.join(", ")}
                  </p>
                ) : null}
                <p className="mt-1 fonte-display text-[15px] font-semibold">
                  {moeda(p.preco_atual)}
                </p>
                {qtd === 0 ? (
                  <button
                    onClick={() => mudar(p.id, 1)}
                    className="mt-2 w-full rounded-xl bg-pink py-2 text-[12px] font-semibold leading-none text-primary-foreground"
                  >
                    Quero essa
                  </button>
                ) : (
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-muted px-2 py-1.5">
                    <button onClick={() => mudar(p.id, -1)} className="px-2 text-[15px]">
                      -
                    </button>
                    <span className="text-[13px] font-semibold">{qtd}</span>
                    <button onClick={() => mudar(p.id, 1)} className="px-2 text-[15px]">
                      +
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {itens.length > 0 ? (
        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[412px] -translate-x-1/2 border-t border-border bg-background/95 px-5 pb-5 pt-3 backdrop-blur">
          <p className="mb-2 text-center text-[12px] text-muted-foreground">
            {itens.length} peças, {moeda(total)}
          </p>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl bg-pink py-3.5 text-center fonte-display text-[14px] font-semibold leading-none text-primary-foreground"
            >
              Fechar pedido no WhatsApp
            </a>
          ) : (
            <p className="text-center text-[12px] text-muted-foreground">
              Esta loja ainda não cadastrou o WhatsApp de pedidos.
            </p>
          )}
        </div>
      ) : null}
    </main>
  );
}
