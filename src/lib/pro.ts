import { supabase } from "@/integrations/supabase/client";
import type { Perfil } from "./loja";

export function temTesteAtivo(perfil: Perfil | null | undefined) {
  if (!perfil?.pro_trial_expira_em) return false;
  return new Date(perfil.pro_trial_expira_em).getTime() > Date.now();
}

/** Assinatura paga e dentro da validade. Sem data de expiração significa vitalícia. */
export function assinaturaAtiva(perfil: Perfil | null | undefined) {
  if (!perfil?.tem_minha_loja_pro) return false;
  if (!perfil.pro_expira_em) return true;
  return new Date(perfil.pro_expira_em).getTime() > Date.now();
}

/** Acesso à gestão da loja: assinatura ativa ou teste dentro do prazo. */
export function podeSistema(perfil: Perfil | null | undefined) {
  return assinaturaAtiva(perfil) || temTesteAtivo(perfil);
}

export function testeJaUsado(perfil: Perfil | null | undefined) {
  return !!perfil?.pro_trial_iniciado_em;
}

export function diasRestantesTeste(perfil: Perfil | null | undefined) {
  if (!perfil?.pro_trial_expira_em) return 0;
  const ms = new Date(perfil.pro_trial_expira_em).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/**
 * O usuário não escreve mais direto em perfis: essas colunas são do webhook de
 * pagamento. O teste passa por função no banco, que só concede uma vez por conta.
 */
export async function iniciarTeste() {
  await supabase.rpc("iniciar_teste_pro");
}
