import { supabase } from "@/integrations/supabase/client";
import type { Perfil } from "./loja";

export function temTesteAtivo(perfil: Perfil | null | undefined) {
  if (!perfil?.pro_trial_expira_em) return false;
  return new Date(perfil.pro_trial_expira_em).getTime() > Date.now();
}

/** Acesso à gestão da loja: assinatura ativa ou teste dentro do prazo. */
export function podeSistema(perfil: Perfil | null | undefined) {
  return !!perfil && (perfil.tem_minha_loja_pro || temTesteAtivo(perfil));
}

export function testeJaUsado(perfil: Perfil | null | undefined) {
  return !!perfil?.pro_trial_iniciado_em;
}

export function diasRestantesTeste(perfil: Perfil | null | undefined) {
  if (!perfil?.pro_trial_expira_em) return 0;
  const ms = new Date(perfil.pro_trial_expira_em).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export async function iniciarTeste() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) return;
  const agora = new Date();
  const fim = new Date(agora.getTime() + 7 * 86400000);
  await supabase
    .from("perfis")
    .update({
      pro_trial_iniciado_em: agora.toISOString(),
      pro_trial_expira_em: fim.toISOString(),
    })
    .eq("id", id)
    .is("pro_trial_iniciado_em", null);
}
