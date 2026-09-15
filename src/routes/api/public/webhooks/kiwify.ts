import { createFileRoute } from "@tanstack/react-router";

type Corpo = {
  order_status?: string;
  webhook_event_type?: string;
  Customer?: { email?: string };
  customer?: { email?: string };
  Product?: { product_name?: string };
};

function aprovado(status?: string) {
  return status === "paid" || status === "approved";
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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: perfil } = await supabaseAdmin
          .from("perfis")
          .select("id, tem_minha_loja, tem_minha_loja_pro")
          .ilike("email", email)
          .maybeSingle();

        if (!perfil) return new Response("ok", { status: 200 });

        const nomeProduto = (corpo.Product?.product_name ?? "").toLowerCase();
        const ehPro = nomeProduto.includes("pro") || nomeProduto.includes("gest");
        const status = corpo.order_status ?? corpo.webhook_event_type;

        if (aprovado(status)) {
          await supabaseAdmin
            .from("perfis")
            .update(
              ehPro
                ? {
                    tem_minha_loja_pro: true,
                    pro_expira_em: new Date(Date.now() + 31 * 86400000).toISOString(),
                  }
                : { tem_minha_loja: true },
            )
            .eq("id", perfil.id);
        } else if (ehPro) {
          // Cancelamento, reembolso ou chargeback: o acesso à gestão para,
          // mas os dados continuam salvos e podem ser exportados.
          await supabaseAdmin
            .from("perfis")
            .update({ tem_minha_loja_pro: false, pro_expira_em: new Date().toISOString() })
            .eq("id", perfil.id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
