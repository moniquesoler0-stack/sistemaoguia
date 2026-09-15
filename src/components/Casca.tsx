import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useSessao } from "@/lib/sessao";
import { usePerfil } from "@/lib/loja";
import { diasRestantesTeste, podeSistema, temTesteAtivo } from "@/lib/pro";
import { Esqueleto } from "./Esqueleto";
import { VendaRapida } from "./VendaRapida";
import { FraseFronteira } from "./FraseFronteira";

const basicas = [
  { to: "/painel", label: "Painel" },
  { to: "/pecas", label: "Peças" },
] as const;

const gestaoAbas = [
  { to: "/estoque", label: "Estoque" },
  { to: "/vendas", label: "Vendas" },
  { to: "/financeiro", label: "Financeiro" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/clientes", label: "Clientes" },
] as const;

const secundarias = [
  { to: "/compras", label: "Compras" },
  { to: "/ajustes", label: "Ajustes" },
] as const;

export function Casca({
  titulo,
  subtitulo,
  acao,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  const { sessao, carregando } = useSessao();
  const perfil = usePerfil();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuAberto, setMenuAberto] = useState(false);

  const pronto = !carregando && !perfil.isLoading;
  const podePrecificar =
    !!perfil.data && (perfil.data.tem_minha_loja || perfil.data.tem_minha_loja_pro);
  const comSistema = podeSistema(perfil.data);

  useEffect(() => {
    if (!pronto) return;
    if (!sessao) void navigate({ to: "/entrar" });
    else if (!podePrecificar) void navigate({ to: "/" });
  }, [pronto, sessao, podePrecificar, navigate]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  const abas = comSistema
    ? [...basicas, ...gestaoAbas, ...secundarias]
    : [...basicas, { to: "/gestao", label: "Gestão da loja" } as const, ...secundarias];

  const marca = (
    <Link to="/painel" className="flex min-w-0 items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-pink fonte-display text-lg font-semibold text-primary-foreground">
        M
      </span>
      <span className="min-w-0">
        <span className="block truncate fonte-display text-[15px] font-semibold leading-tight">
          Minha Loja
        </span>
        <span className="block text-[11px] leading-none text-muted-foreground">Moda fitness</span>
      </span>
    </Link>
  );

  const item = (aba: { to: string; label: string }) => {
    const ativa = pathname.startsWith(aba.to);
    return (
      <li key={aba.to}>
        <Link
          to={aba.to}
          className={
            "block rounded-2xl px-4 py-3 fonte-display text-[14px] font-medium leading-none " +
            (ativa
              ? "bg-pink text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted")
          }
        >
          {aba.label}
        </Link>
      </li>
    );
  };

  return (
    <div className="trilho flex flex-col lg:flex-row lg:gap-0">
      <aside className="hidden shrink-0 border-r border-border px-4 py-6 lg:block lg:w-64">
        <div className="px-1">{marca}</div>
        <ul className="mt-8 space-y-1.5">{abas.map(item)}</ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:py-6">
        {temTesteAtivo(perfil.data) && !perfil.data?.tem_minha_loja_pro ? (
          <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-2.5 ring-1 ring-black/5">
            <span className="text-[12px]">
              {diasRestantesTeste(perfil.data) <= 1
                ? "Seu teste da gestão termina hoje"
                : diasRestantesTeste(perfil.data) <= 3
                  ? `Faltam ${diasRestantesTeste(perfil.data)} dias de teste, seus dados ficam salvos`
                  : `Teste da gestão, faltam ${diasRestantesTeste(perfil.data)} dias`}
            </span>
            <Link to="/assinatura" className="text-[12px] font-semibold underline">
              Assinar
            </Link>
          </div>
        ) : null}

        <header className="px-5 pb-4 pt-5 lg:pt-0">
          <div className="mb-3 flex items-center justify-between gap-3 lg:mb-0 lg:justify-end">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <button
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir menu"
                className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted"
              >
                <span className="space-y-1">
                  <span className="block h-0.5 w-4 rounded bg-foreground" />
                  <span className="block h-0.5 w-4 rounded bg-foreground" />
                  <span className="block h-0.5 w-4 rounded bg-foreground" />
                </span>
              </button>
              {marca}
            </div>
            {acao}
          </div>
          <div className="flex items-end justify-between gap-3 pt-1">
            <h1 className="text-balance fonte-display text-[22px] font-semibold leading-tight lg:text-[28px]">
              {titulo}
            </h1>
            {subtitulo ? (
              <span className="shrink-0 text-[12px] text-muted-foreground">{subtitulo}</span>
            ) : null}
          </div>
        </header>

        {pronto && sessao && podePrecificar ? (
          children
        ) : (
          <div className="space-y-3 px-5">
            <Esqueleto className="h-24" />
            <Esqueleto className="h-24" />
            <Esqueleto className="h-16" />
          </div>
        )}
      </div>

      {pronto && podePrecificar ? <FraseFronteira /> : null}
      {comSistema ? <VendaRapida /> : null}

      {menuAberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[268px] flex-col bg-background px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between gap-2 px-1">
              {marca}
              <button
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="shrink-0 rounded-xl px-2 py-1 text-[13px] text-muted-foreground"
              >
                Fechar
              </button>
            </div>
            <ul className="mt-6 space-y-1.5 overflow-y-auto">{abas.map(item)}</ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
