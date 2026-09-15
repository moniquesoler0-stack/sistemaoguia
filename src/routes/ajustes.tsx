import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Casca } from "@/components/Casca";
import { Esqueleto } from "@/components/Esqueleto";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useDadosLoja, useInvalidarLoja, usePerfil } from "@/lib/loja";
import { moeda, numero } from "@/lib/formato";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes da loja, Minha Loja" },
      {
        name: "description",
        content:
          "Custo fixo, embalagem, imposto, canais de venda e fornecedores. É aqui que os números do painel ficam verdadeiros.",
      },
      { property: "og:title", content: "Ajustes da loja, Minha Loja" },
      {
        property: "og:description",
        content: "Configure custo fixo, embalagem, imposto, canais e fornecedores.",
      },
    ],
  }),
  component: Ajustes,
});

function Ajustes() {
  const loja = useDadosLoja();
  const perfil = usePerfil();
  const invalidar = useInvalidarLoja();
  const navigate = useNavigate();

  const [nomeLoja, setNomeLoja] = useState("");
  const [volume, setVolume] = useState("");
  const [ads, setAds] = useState("");
  const [imposto, setImposto] = useState("");
  const [margem, setMargem] = useState("");

  const config = loja.data?.config ?? null;

  useEffect(() => {
    if (!config) return;
    setNomeLoja(config.nome_loja ?? "");
    setVolume(String(config.volume_mensal_esperado));
    setAds(String(config.investimento_ads_mensal));
    setImposto(String(config.imposto_pct));
    setMargem(String(config.margem_minima_pct));
  }, [config?.id]);

  async function salvarConfig() {
    if (!config) return;
    await supabase
      .from("loja_config")
      .update({
        nome_loja: nomeLoja || null,
        volume_mensal_esperado: numero(volume) || 1,
        investimento_ads_mensal: numero(ads),
        imposto_pct: numero(imposto),
        margem_minima_pct: numero(margem),
        onboarding_concluido: true,
      })
      .eq("id", config.id);
    invalidar();
  }

  async function novoCustoFixo(nome: string, valor: string) {
    const { data: u } = await supabase.auth.getUser();
    await supabase
      .from("loja_custos_fixos")
      .insert({ user_id: u.user!.id, nome, valor_mensal: numero(valor) });
    invalidar();
  }

  async function novoItemEmbalagem(nome: string, valor: string) {
    const { data: u } = await supabase.auth.getUser();
    await supabase
      .from("loja_itens_embalagem")
      .insert({ user_id: u.user!.id, nome, valor_unitario: numero(valor) });
    invalidar();
  }

  async function novoFornecedor(nome: string, contato: string) {
    const { data: u } = await supabase.auth.getUser();
    await supabase
      .from("loja_fornecedores")
      .insert({ user_id: u.user!.id, nome, contato: contato || null });
    invalidar();
  }

  async function apagar(tabela: "loja_custos_fixos" | "loja_itens_embalagem" | "loja_fornecedores", id: string) {
    await supabase.from(tabela).delete().eq("id", id);
    invalidar();
  }

  const totalFixo = (loja.data?.custosFixos ?? []).reduce(
    (s, c) => s + Number(c.valor_mensal),
    0,
  );

  return (
    <Casca titulo="Ajustes" subtitulo={nomeLoja || "sua loja"}>
      <div className="space-y-5 px-5">
        {loja.isLoading ? (
          <>
            <Esqueleto className="h-40" />
            <Esqueleto className="h-40" />
          </>
        ) : (
          <>
            <Bloco titulo="A sua loja">
              <Campo rotulo="Nome da loja" valor={nomeLoja} aoMudar={setNomeLoja} texto />
              <div className="grid grid-cols-2 gap-2">
                <Campo rotulo="Peças que vende por mês" valor={volume} aoMudar={setVolume} />
                <Campo rotulo="Anúncios por mês" valor={ads} aoMudar={setAds} />
                <Campo rotulo="Imposto %" valor={imposto} aoMudar={setImposto} />
                <Campo rotulo="Margem mínima %" valor={margem} aoMudar={setMargem} />
              </div>
              <button
                onClick={() => void salvarConfig()}
                className="w-full rounded-2xl bg-pink py-3.5 fonte-display text-[14px] font-semibold leading-none text-primary-foreground"
              >
                Salvar ajustes
              </button>
            </Bloco>

            <Bloco titulo={`Custo fixo do mês, ${moeda(totalFixo)}`}>
              {loja.data?.custosFixos.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum custo fixo lançado"
                  frase="Aluguel, internet, contadora, plano de celular. Sem eles, o lucro que você vê é maior do que o real."
                />
              ) : (
                <Lista
                  itens={(loja.data?.custosFixos ?? []).map((c) => ({
                    id: c.id,
                    esquerda: c.nome,
                    direita: moeda(c.valor_mensal),
                  }))}
                  aoApagar={(id) => void apagar("loja_custos_fixos", id)}
                />
              )}
              <Adicionar
                rotuloNome="Ex: aluguel"
                rotuloValor="Valor"
                aoAdicionar={(n, v) => void novoCustoFixo(n, v)}
              />
            </Bloco>

            <Bloco titulo="Embalagem">
              {loja.data?.embalagem.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum item de embalagem"
                  frase="Sacola, laço, cartão e etiqueta somam alguns reais em cada peça. Some aqui e a conta fecha certa."
                />
              ) : (
                <Lista
                  itens={(loja.data?.embalagem ?? []).map((i) => ({
                    id: i.id,
                    esquerda: i.nome,
                    direita: moeda(i.valor_unitario),
                  }))}
                  aoApagar={(id) => void apagar("loja_itens_embalagem", id)}
                />
              )}
              <Adicionar
                rotuloNome="Ex: sacola"
                rotuloValor="Valor"
                aoAdicionar={(n, v) => void novoItemEmbalagem(n, v)}
              />
            </Bloco>

            <Bloco titulo="Fornecedores">
              {loja.data?.fornecedores.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum fornecedor cadastrado"
                  frase="Cadastre para saber depois qual fornecedor entrega as peças que mais dão lucro."
                />
              ) : (
                <Lista
                  itens={(loja.data?.fornecedores ?? []).map((f) => ({
                    id: f.id,
                    esquerda: f.nome,
                    direita: f.contato ?? "",
                  }))}
                  aoApagar={(id) => void apagar("loja_fornecedores", id)}
                />
              )}
              <Adicionar
                rotuloNome="Nome do fornecedor"
                rotuloValor="Contato"
                somenteTexto
                aoAdicionar={(n, v) => void novoFornecedor(n, v)}
              />
            </Bloco>

            <Bloco titulo="Canais de venda">
              <Canais />
            </Bloco>

            <Bloco titulo="Sua conta">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {perfil.data?.email}. Acesso vitalício ao Minha Loja
                {perfil.data?.tem_minha_loja ? " ativo" : " não ativo"}.
                {perfil.data?.tem_minha_loja_pro
                  ? " Pro ativo."
                  : " Pro não ativo."}
              </p>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  void navigate({ to: "/" });
                }}
                className="w-full rounded-2xl bg-muted py-3.5 fonte-display text-[14px] font-semibold leading-none ring-1 ring-black/5"
              >
                Sair da conta
              </button>
            </Bloco>
          </>
        )}
      </div>
    </Casca>
  );
}

function Canais() {
  const loja = useDadosLoja();
  const invalidar = useInvalidarLoja();

  async function atualizar(id: string, campos: Record<string, unknown>) {
    await supabase
      .from("loja_canais")
      .update(campos as never)
      .eq("id", id);
    invalidar();
  }

  return (
    <div className="space-y-2">
      {(loja.data?.canais ?? []).map((c) => (
        <div key={c.id} className="rounded-2xl bg-background p-3 ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold">{c.nome}</p>
            <button
              onClick={() => void atualizar(c.id, { ativo: !c.ativo })}
              className={
                "rounded-full px-3 py-1.5 text-[12px] leading-none ring-1 ring-black/5 " +
                (c.ativo ? "bg-mint" : "bg-muted text-muted-foreground")
              }
            >
              {c.ativo ? "Ativo" : "Desligado"}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-muted-foreground">Taxa %</span>
              <input
                defaultValue={String(c.taxa_pct)}
                inputMode="decimal"
                onBlur={(e) => void atualizar(c.id, { taxa_pct: numero(e.target.value) })}
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-[14px] ring-1 ring-black/5 outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-muted-foreground">Taxa fixa</span>
              <input
                defaultValue={String(c.taxa_fixa)}
                inputMode="decimal"
                onBlur={(e) => void atualizar(c.id, { taxa_fixa: numero(e.target.value) })}
                className="w-full rounded-xl bg-muted px-3 py-2.5 text-[14px] ring-1 ring-black/5 outline-none"
              />
            </label>
          </div>
          {c.parcelamento.length > 0 ? (
            <p className="mt-2 text-[12px] text-muted-foreground">
              Parcelado: {c.parcelamento.map((p) => `${p.parcelas}x ${p.taxa_pct}%`).join(", ")}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl bg-muted p-4 ring-1 ring-black/5">
      <h2 className="fonte-display text-[16px] font-semibold leading-tight">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  texto,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  texto?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{rotulo}</span>
      <input
        value={valor}
        inputMode={texto ? "text" : "decimal"}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full rounded-2xl bg-background px-4 py-3 text-[15px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
      />
    </label>
  );
}

function Lista({
  itens,
  aoApagar,
}: {
  itens: { id: string; esquerda: string; direita: string }[];
  aoApagar: (id: string) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {itens.map((i) => (
        <li
          key={i.id}
          className="flex items-center gap-2 rounded-2xl bg-background px-3.5 py-3 ring-1 ring-black/5"
        >
          <span className="min-w-0 flex-1 truncate text-[14px]">{i.esquerda}</span>
          <span className="text-[14px] font-semibold">{i.direita}</span>
          <button
            onClick={() => aoApagar(i.id)}
            aria-label={`Remover ${i.esquerda}`}
            className="grid size-8 place-items-center rounded-lg bg-muted text-[14px] leading-none text-muted-foreground"
          >
            x
          </button>
        </li>
      ))}
    </ul>
  );
}

function Adicionar({
  rotuloNome,
  rotuloValor,
  somenteTexto,
  aoAdicionar,
}: {
  rotuloNome: string;
  rotuloValor: string;
  somenteTexto?: boolean;
  aoAdicionar: (nome: string, valor: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        aoAdicionar(nome.trim(), valor);
        setNome("");
        setValor("");
      }}
      className="flex gap-2"
    >
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder={rotuloNome}
        className="min-w-0 flex-1 rounded-2xl bg-background px-3.5 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
      />
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        inputMode={somenteTexto ? "text" : "decimal"}
        placeholder={rotuloValor}
        className="w-[92px] rounded-2xl bg-background px-3 py-3 text-[14px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
      />
      <button
        type="submit"
        className="shrink-0 rounded-2xl bg-ink px-4 fonte-display text-[14px] font-semibold text-background"
      >
        Somar
      </button>
    </form>
  );
}
