import type { ReactNode } from "react";

export function EstadoVazio({
  titulo,
  frase,
  acao,
}: {
  titulo: string;
  frase: string;
  acao?: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-muted p-6 text-center ring-1 ring-black/5">
      <h2 className="fonte-display text-[17px] font-semibold">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-[28ch] text-pretty text-[13px] text-muted-foreground">
        {frase}
      </p>
      {acao ? <div className="mt-4 flex justify-center">{acao}</div> : null}
    </div>
  );
}
