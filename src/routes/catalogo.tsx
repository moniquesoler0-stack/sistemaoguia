import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Casca } from "@/components/Casca";
import { EsqueletoLista } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useDadosLoja, usePerfil } from "@/lib/loja";
import { podeSistema } from "@/lib/pro";
import { moeda } from "@/lib/formato";
import {
  apelidar,
  publicarPeca,
  salvarCatalogo,
  useCatalogo,
  useInvalidarCatalogo,
} from "@/lib/catalogo";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo da loja, Minha Loja" },
      {
        name: "description",
        content:
          "Ative seu catálogo, escolha o link, publique as peças e envie para as clientes pedirem pelo WhatsApp.",
      },
      { property: "og:title", content: "Catálogo da loja, Minha Loja" },
      {
        property: "og:description",
        content: "Link próprio com suas peças publicadas e pedido direto no WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogoAdmin,
});

function CatalogoAdmin() {
  const perfil = usePerfil();
  const loja = useDadosLoja();
  const catalogo = useCatalogo();
  const invalidar = useInvalidarCatalogo();
  const navigate = useNavigate();

  const liberado = podeSistema(perfil.data);
  useEffect(() => {
    if (!perfil.isLoading && perfil.data && !liberado) void navigate({ to: "/gestao" });
  }, [perfil.isLoading, perfil.data, liberado, navigate]);

  const c = catalogo.data;
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!c) return;
    setTitulo(c.titulo ?? loja.data?.config?.nome_loja ?? "");
    setSlug(c.slug ?? apelidar(loja.data?.config?.nome_loja ?? ""));
    setBio(c.bio ?? "");
    setWhatsapp(c.whatsapp ?? "");
    setInstagram(c.instagram ?? "");
  }, [c, loja.data?.config?.nome_loja]);

  const produtos = loja.data?.produtos ?? [];
  const publicadas = produtos.filter((p) => p.publicado).length;
  const endereco =
    typeof window === "undefined" ? "" : `${window.location.origin}/loja/${slug}`;

  async function salvar(extra?: { ativo?: boolean }) {
    setSalvando(true);
    setAviso(null);
    const limpo = apelidar(slug);
    setSlug(limpo);
    const r = await salvarCatalogo({
      titulo: titulo.trim() || null,
      slug: limpo || null,
      bio: bio.trim() || null,
      whatsapp: whatsapp.replace(/\D/g, "") || null,
      instagram: instagram.replace(/^@/, "").trim() || null,
      ...(extra ?? {}),
    });
    setSalvando(false);
    if (r.erro) setAviso(r.erro);
    else {
      setAviso("Catálogo salvo.");
      invalidar();
    }
  }

  async function alternarPeca(id: string, valor: boolean) {
    await publicarPeca(id, valor);
    invalidar();
  }

  const ativo = !!c?.ativo;

  return (
    <Casca titulo="Catálogo" subtitulo={`${publicadas} publicadas`}>
      <div className="space-y-5 px-5">
        <section className="rounded-3xl bg-card p-5 ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="fonte-display text-[16px] font-semibold leading-tight">
                {ativo ? "Catálogo no ar" : "Catálogo desligado"}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {ativo
                  ? "Qualquer pessoa com o link vê as peças publicadas."
                  : "Escolha o link, publique as peças e ligue quando quiser."}
              </p>
            </div>
            <button
              onClick={() => void salvar({ ativo: !ativo })}
              disabled={salvando || !slug}
              className={
                "shrink-0 rounded-2xl px-4 py-2.5 fonte-display text-[13px] font-semibold leading-none disabled:opacity-50 " +
                (ativo ? "bg-muted" : "bg-pink text-primary-foreground")
              }
            >
              {ativo ? "Desligar" : "Ligar"}
            </button>
          </div>

          {ativo && slug ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[12px]">{endereco}</span>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(endereco);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1600);
                }}
                className="shrink-0 text-[12px] font-semibold underline"
              >
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-3xl bg-card p-5 ring-1 ring-black/5">
          <h2 className="fonte-display text-[16px] font-semibold leading-tight">Sua página</h2>
          <Campo rotulo="Nome que aparece" valor={titulo} ao={setTitulo} dica="Studio Fit" />
          <Campo
            rotulo="Link da loja"
            valor={slug}
            ao={(v) => setSlug(apelidar(v))}
            dica="studio-fit"
          />
          <Campo
            rotulo="Frase de apresentação"
            valor={bio}
            ao={setBio}
            dica="Moda fitness com caimento que veste bem"
          />
          <Campo
            rotulo="WhatsApp para pedidos"
            valor={whatsapp}
            ao={setWhatsapp}
            dica="11999999999"
          />
          <Campo rotulo="Instagram" valor={instagram} ao={setInstagram} dica="studiofit" />
          {aviso ? <p className="text-[12px] text-muted-foreground">{aviso}</p> : null}
          <button
            onClick={() => void salvar()}
            disabled={salvando}
            className="w-full rounded-2xl bg-pink py-3.5 fonte-display text-[14px] font-semibold leading-none text-primary-foreground disabled:opacity-60"
          >
            {salvando ? "Salvando" : "Salvar catálogo"}
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="fonte-display text-[16px] font-semibold leading-tight">
            Peças no catálogo
          </h2>
          {loja.isLoading ? (
            <EsqueletoLista />
          ) : produtos.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma peça cadastrada"
              frase="Cadastre uma peça para poder publicá-la no catálogo."
            />
          ) : (
            <ul className="space-y-2">
              {produtos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-black/5"
                >
                  {p.foto_url ? (
                    <img
                      src={p.foto_url}
                      alt={p.nome}
                      loading="lazy"
                      className="size-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid size-10 place-items-center rounded-xl bg-muted text-[12px] text-muted-foreground">
                      {p.nome.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{p.nome}</p>
                    <p className="text-[12px] text-muted-foreground">{moeda(p.preco_atual)}</p>
                  </div>
                  <button
                    onClick={() => void alternarPeca(p.id, !p.publicado)}
                    className={
                      "shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold leading-none " +
                      (p.publicado ? "bg-mint text-mint-forte" : "bg-muted text-muted-foreground")
                    }
                  >
                    {p.publicado ? "Publicada" : "Publicar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Casca>
  );
}

function Campo({
  rotulo,
  valor,
  ao,
  dica,
}: {
  rotulo: string;
  valor: string;
  ao: (v: string) => void;
  dica: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-muted-foreground">{rotulo}</span>
      <input
        value={valor}
        onChange={(e) => ao(e.target.value)}
        placeholder={dica}
        className="w-full rounded-2xl bg-muted px-4 py-3 text-[14px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-pink"
      />
    </label>
  );
}
