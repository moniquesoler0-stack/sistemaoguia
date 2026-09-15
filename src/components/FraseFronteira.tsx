import { useEffect, useState } from "react";

const chave = "minha-loja-fronteira-vista";

export function FraseFronteira() {
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(chave)) return;
    setAberta(true);
  }, []);

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/30 p-4 sm:place-items-center">
      <div className="w-full max-w-[412px] rounded-3xl bg-card p-6 shadow-xl ring-1 ring-black/5">
        <h2 className="fonte-display text-[19px] font-semibold leading-tight">
          Você tem a Precificação completa, para sempre.
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          A gestão da loja é uma assinatura separada, e você pode testar quando quiser.
        </p>
        <button
          onClick={() => {
            window.localStorage.setItem(chave, "1");
            setAberta(false);
          }}
          className="mt-5 w-full rounded-2xl bg-pink py-3.5 fonte-display text-[14px] font-semibold leading-none text-primary-foreground"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
