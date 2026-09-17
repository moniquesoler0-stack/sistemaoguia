const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCurto = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function moeda(valor: number | null | undefined) {
  const v = Number(valor);
  return brl.format(Number.isFinite(v) ? v : 0);
}

export function moedaCurta(valor: number | null | undefined) {
  const v = Number(valor);
  return brlCurto.format(Number.isFinite(v) ? v : 0);
}

export function pct(valor: number | null | undefined, casas = 1) {
  const v = Number(valor);
  return `${(Number.isFinite(v) ? v : 0).toFixed(casas).replace(".", ",")}%`;
}

/** Aceita "12,90" e "12.90". */
export function numero(entrada: string | number | null | undefined) {
  if (typeof entrada === "number") return Number.isFinite(entrada) ? entrada : 0;
  if (!entrada) return 0;
  const limpo = String(entrada)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const v = Number(limpo);
  return Number.isFinite(v) ? v : 0;
}
