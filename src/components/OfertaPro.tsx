import { Link } from "@tanstack/react-router";
import { useDadosLoja, usePerfil } from "@/lib/loja";

/**
 * Oferta contextual da assinatura. Só aparece para quem tem a camada 1,
 * não tem a Pro e já cadastrou pelo menos 15 peças. O gatilho é uso, não tempo.
 */
export function OfertaPro({ texto }: { texto: string }) {
  const perfil = usePerfil();
  const loja = useDadosLoja();

  const totalPecas = loja.data?.produtos.length ?? 0;
  const mostrar = !!perfil.data && !perfil.data.tem_minha_loja_pro && totalPecas >= 15;

  if (!mostrar) return null;

  return (
    <Link
      to="/assinatura"
      className="block rounded-2xl bg-mint/50 p-3.5 text-[12.5px] leading-snug text-foreground/80 ring-1 ring-black/5"
    >
      <span className="text-pretty">{texto}</span>
      <span className="mt-1 block fonte-display text-[12px] font-semibold text-pink">
        Conhecer a assinatura
      </span>
    </Link>
  );
}
