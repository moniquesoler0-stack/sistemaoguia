import { createFileRoute } from "@tanstack/react-router";

type Corpo = {
  order_id?: string;
  order_status?: string;
  webhook_event_type?: string;
  Customer?: { email?: string };
  customer?: { email?: string };
  Product?: { product_id?: string; product_name?: string };
};

const APROVADO = ["paid", "approved", "order_approved", "subscription_renewed"];
const PERDIDO = [
  "refunded",
  "chargedback",
  "chargeback",
  "canceled",
  "cancelled",
  "order_refunded",
  "subscription_canceled",
  "subscription_late",
];

/** Ids de produto da Kiwify, separados por vírgula, configurados no .env. */
function ids(variavel: string) {
  return (process.env[variavel] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Qual plano a compra libera. O ecossistema tem mais de um produto na mesma
 * conta da Kiwify, então o certo é casar pelo id. O nome é só a rede de
 * segurança: "pro" como palavra inteira, senão "produto" e "promoção" casariam.
 */
function ehPlanoPro(produtoId: string, nome: string) {
  if (ids("KIWIFY_PRODUTO_PRO").includes(produtoId)) return true;
  if (ids("KIWIFY_PRODUTO_VITALICIO").includes(produtoId)) return false;
  return /\bpro\b/i.test(nome) || /gest[aã]o/i.test(nome);
}

export const Route = createFileRoute("/api/public/webhooks/kiwify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const esperado = process.env["KIWIFY_WEBHOOK_TOKEN"];
        if (!esperado) return new Response("not configured", { status: 503 });

        const url = new URL(request.url);
        const enviado =
          url.searchParams.get("token") ?? request.headers.get("x-kiwify-token") ?? "";
        if (enviado !== esperado) return new Response("invalid token", { status: 401 });

        let corpo: Corpo;
        try {
          corpo = (await request.json()) as Corpo;
        } catch {
          return new Response("invalid body", { status: 400 });
        }

        const email = (corpo.Customer?.email ?? corpo.customer?.email ?? "")
          .trim()
          .toLowerCase();
        if (!email) return new Response("missing email", { status: 400 });

        const status = (corpo.order_status ?? corpo.webhook_event_type ?? "").toLowerCase();
        const aprovado = APROVADO.includes(status);
        const perdido = PERDIDO.includes(status);
        // Qualquer outro status (aguardando pagamento, boleto gerado, recusado)
        // não mexe no acesso de ninguém.
        if (!aprovado && !perdido) return new Response("ok", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Um pedido pode ser aprovado e depois reembolsado, então a chave inclui
        // o status: o reenvio do mesmo evento é ignorado, a mudança real passa.
        const pedido = corpo.order_id ?? "";
        const chave = `${pedido}:${status}`;
        if (pedido) {
          const { error } = await supabaseAdmin.from("pagamentos_processados").insert({
            chave,
            pedido,
            email,
            produto: corpo.Product?.product_name ?? null,
            status,
          });
          // 23505: chave repetida, ou seja, evento já tratado antes.
          if (error?.code === "23505") return new Response("ok", { status: 200 });
        }

        const { data: perfil } = await supabaseAdmin
          .from("perfis")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        // Sem conta ainda: responder 200 evita que a Kiwify fique reenviando.
        // A pessoa cria a conta com o mesmo email e o acesso entra na renovação.
        if (!perfil) return new Response("ok", { status: 200 });

        const pro = ehPlanoPro(corpo.Product?.product_id ?? "", corpo.Product?.product_name ?? "");

        const campos = aprovado
          ? pro
            ? {
                tem_minha_loja_pro: true,
                pro_expira_em: new Date(Date.now() + 31 * 86400000).toISOString(),
              }
            : { tem_minha_loja: true }
          : // Reembolso, cancelamento ou chargeback: o acesso para, mas os dados
            // continuam salvos e podem ser exportados.
            pro
            ? { tem_minha_loja_pro: false, pro_expira_em: new Date().toISOString() }
            : { tem_minha_loja: false };

        await supabaseAdmin.from("perfis").update(campos).eq("id", perfil.id);

        return new Response("ok", { status: 200 });
      },
    },
  },
});
