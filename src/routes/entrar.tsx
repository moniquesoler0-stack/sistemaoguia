import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/sessao";

// O botão do Google só aparece depois que o provedor estiver configurado no
// painel do Supabase. Ligue com VITE_GOOGLE_LOGIN="true" no .env.
const googleAtivo = import.meta.env["VITE_GOOGLE_LOGIN"] === "true";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar na Minha Loja" },
      {
        name: "description",
        content: "Acesse sua conta da Minha Loja para precificar suas peças de moda fitness.",
      },
      { property: "og:title", content: "Entrar na Minha Loja" },
      {
        property: "og:description",
        content: "Acesse sua conta da Minha Loja para precificar suas peças.",
      },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const { sessao } = useSessao();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (sessao) void navigate({ to: "/" });
  }, [sessao, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const resposta =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({
            email,
            password: senha,
            options: {
              data: { nome },
              emailRedirectTo: window.location.origin,
            },
          });
    setEnviando(false);
    if (resposta.error) {
      setErro(traduzir(resposta.error.message));
      return;
    }
    void navigate({ to: "/" });
  }

  async function comGoogle() {
    setErro(null);
    // O Supabase leva a pessoa para o Google e devolve na origem do site.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErro("Não foi possível entrar com o Google agora. Tente pelo email.");
  }

  return (
    <main className="trilho px-5 pb-10 pt-10">
      <span className="grid size-10 place-items-center rounded-2xl bg-pink fonte-display text-xl font-semibold text-primary-foreground">
        M
      </span>
      <h1 className="mt-6 text-balance fonte-display text-[26px] font-semibold leading-tight">
        {modo === "entrar" ? "Entrar na sua loja" : "Criar sua conta"}
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        {modo === "entrar"
          ? "Suas peças e seus números continuam exatamente onde você parou."
          : "Sua loja já nasce com canais de venda e itens de embalagem preenchidos."}
      </p>

      <form onSubmit={enviar} className="mt-6 space-y-3">
        {modo === "criar" ? (
          <Campo rotulo="Nome" valor={nome} aoMudar={setNome} tipo="text" />
        ) : null}
        <Campo rotulo="Email" valor={email} aoMudar={setEmail} tipo="email" />
        <Campo rotulo="Senha" valor={senha} aoMudar={setSenha} tipo="password" />

        {erro ? (
          <p className="rounded-2xl bg-pink/10 p-3 text-[12.5px] text-foreground/80">{erro}</p>
        ) : null}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-2xl bg-pink py-4 fonte-display text-[15px] font-semibold leading-none text-primary-foreground shadow-lg shadow-pink/30 disabled:opacity-60"
        >
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      {googleAtivo ? (
        <button
          onClick={() => void comGoogle()}
          className="mt-3 w-full rounded-2xl bg-muted py-4 fonte-display text-[15px] font-semibold leading-none ring-1 ring-black/5"
        >
          Continuar com o Google
        </button>
      ) : null}

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {modo === "entrar" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
        <button
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          className="fonte-display font-semibold text-pink"
        >
          {modo === "entrar" ? "Criar agora" : "Entrar"}
        </button>
      </p>
    </main>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  tipo: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        required
        className="h-13 w-full rounded-2xl bg-muted px-4 py-3.5 text-[15px] ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-pink"
      />
    </label>
  );
}

function traduzir(mensagem: string) {
  if (mensagem.includes("Invalid login credentials")) return "Email ou senha incorretos.";
  if (mensagem.includes("already registered")) return "Esse email já tem conta. Faça login.";
  if (mensagem.includes("Password should be")) return "A senha precisa de pelo menos 6 caracteres.";
  return "Não deu certo agora. Confira os dados e tente de novo.";
}
