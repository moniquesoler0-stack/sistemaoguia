import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Casca } from "@/components/Casca";
import { EsqueletoLista } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { usePerfil } from "@/lib/loja";
import { podeSistema } from "@/lib/pro";
import { useGestao } from "@/lib/gestao";
import { moeda } from "@/lib/formato";
import {
  criarCliente,
  removerCliente,
  useClientes,
  useInvalidarClientes,
  type Cliente,
} from "@/lib/clientes";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes, Minha Loja" },
      {
        name: "description",
        content:
          "Cadastre suas clientes com WhatsApp, Instagram e tamanho habitual, e veja quanto cada uma já comprou.",
      },
      { property: "og:title", content: "Clientes, Minha Loja" },
      {
        property: "og:description",
        content: "Histórico de compras por cliente e contato rápido pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const perfil = usePerfil();
  const navigate = useNavigate();
  const clientes = useClientes();
  const gestao = useGestao();
  const invalidar = useInvalidarClientes();

  const liberado = podeSistema(perfil.data);
  useEffect(() => {
    if (!perfil.isLoading && perfil.data && !liberado) void navigate({ to: "/gestao" });
  }, [perfil.isLoading, perfil.data, liberado, navigate]);

  const [abrindo, setAbrindo] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [busca, setBusca] = useState("");

  const vendas = gestao.data?.vendas ?? [];
  const resumo = useMemo(() => {
    const mapa = new Map<string, { total: number; qtd: number; ultima: string }>();
    for (const v of vendas) {
      if (!v.cliente_id || v.status === "devolvida") continue;
      const atual = mapa.get(v.cliente_id) ?? { total: 0, qtd: 0, ultima: v.data };
      mapa.set(v.cliente_id, {
        total: atual.total + Number(v.total ?? 0),
        qtd: atual.qtd + 1,
        ultima: v.data > atual.ultima ? v.data : atual.ultima,
      });
    }
    return mapa;
  }, [vendas]);

  const lista = (clientes.data ?? []).filter((c) =>
    c.nome.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  async function salvar() {
    if (!nome.trim()) return;
    await criarCliente({
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, "") || null,
      instagram: instagram.replace(/^@/, "").trim() || null,
      tamanho_habitual: tamanho.trim() || null,
    });
    setNome("");
    setWhatsapp("");
    setInstagram("");
    setTamanho("");
    setAbrindo(false);
    invalidar();
  }

  async function apagar(c: Cliente) {
    await removerCliente(c.id);
    invalidar();
  }

  return (
    <Casca
      titulo="Clientes"
      subtitulo={`${clientes.data?.length ?? 0} cadastradas`}
      acao={
        <button
          onClick={() => setAbrindo((v) => !v)}
          className="rounded-2xl bg-pink px-4 py-2.5 fonte-display text-[13px] font-semibold leading-none text-primary-foreground"
        >
          {abrindo ? "Fechar" : "Nova cliente"}
        </button>
      }
    >
      <div className="space-y-4 px-5">
        {abrindo ? (
          <section className="space-y-2.5 rounded-3xl bg-card p-4 ring-1 ring-black/5">
            <Entrada valor={nome} ao={setNome} dica="Nome" />
            <div className="grid grid-cols-2 gap-2">
              <Entrada valor={whatsapp} ao={setWhatsapp} dica="WhatsApp" />
              <Entrada valor={instagram} ao={setInstagram} dica="Instagram" />
            </div>
            <Entrada valor={tamanho} ao={setTamanho} dica="Tamanho habitual" />
            <button
              onClick={() => void salvar()}
              className="w-full rounded-2xl bg-pink py-3 fonte-display text-[14px] font-semibold leading-none text-primary-foreground"
            >
              Salvar cliente
            </button>
          </section>
        ) : null}

        {(clientes.data?.length ?? 0) > 0 ? (
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente"
            className="w-full rounded-2xl bg-muted px-4 py-3 text-[14px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-pink"
          />
        ) : null}

        {clientes.isLoading ? (
          <EsqueletoLista />
        ) : lista.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma cliente aqui ainda"
            frase="Cadastre quem já comprou com você para lembrar do tamanho e chamar de volta na próxima coleção."
            acao={
              <button
                onClick={() => setAbrindo(true)}
                className="rounded-2xl bg-pink px-5 py-3 fonte-display text-[13px] font-semibold leading-none text-primary-foreground"
              >
                Cadastrar cliente
              </button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {lista.map((c) => {
              const r = resumo.get(c.id);
              return (
                <li key={c.id} className="rounded-2xl bg-card p-3.5 ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate fonte-display text-[15px] font-semibold leading-tight">
                        {c.nome}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {[
                          c.tamanho_habitual ? `Veste ${c.tamanho_habitual}` : null,
                          c.instagram ? `@${c.instagram}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Sem detalhes"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="fonte-display text-[15px] font-semibold leading-none">
                        {moeda(r?.total ?? 0)}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {r ? `${r.qtd} compras` : "sem compras"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {c.whatsapp ? (
                      <a
                        href={`https://wa.me/55${c.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-mint px-3 py-2 text-[12px] font-semibold leading-none text-mint-forte"
                      >
                        Chamar no WhatsApp
                      </a>
                    ) : null}
                    <button
                      onClick={() => void apagar(c)}
                      className="text-[12px] text-muted-foreground underline"
                    >
                      Remover
                    </button>
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

function Entrada({ valor, ao, dica }: { valor: string; ao: (v: string) => void; dica: string }) {
  return (
    <input
      value={valor}
      onChange={(e) => ao(e.target.value)}
      placeholder={dica}
      className="w-full rounded-2xl bg-muted px-4 py-3 text-[14px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-pink"
    />
  );
}
