# Minha Loja

Precificação e gestão para lojista de moda fitness. O app calcula quanto sobra
de verdade em cada peça, em cada canal de venda, com embalagem, taxa, imposto,
perda e custo fixo já embutidos — e, na camada Pro, controla estoque, vendas,
clientes, financeiro e um catálogo público com link.

## Como rodar

Precisa de [Bun](https://bun.sh).

```sh
bun install
cp .env.example .env   # preencha com as chaves do seu projeto Supabase
bun run dev            # http://localhost:8080
```

Outros comandos: `bun run build` (produção), `bun run test`, `bun run lint`,
`bun run format`.

Os testes cobrem as contas que não podem errar: o resultado do mês em
`src/lib/financeiro.ts` e a grade de variações em `src/lib/gestao.ts`. Rodam no
runner embutido do Bun, sem dependência extra.

## Variáveis de ambiente

Estão descritas em [.env.example](.env.example). As que começam com `VITE_` vão
para o navegador; as demais ficam só no servidor. A `SUPABASE_SERVICE_ROLE_KEY`
ignora o RLS e nunca deve receber o prefixo `VITE_`.

## Banco

O schema inteiro está em [supabase/migrations](supabase/migrations), aplicado em
ordem de nome de arquivo. Toda tabela tem RLS ligada e a regra é sempre a mesma:
cada pessoa enxerga e altera apenas as próprias linhas.

Duas exceções, para o catálogo público funcionar sem login: o papel `anon` lê um
punhado de colunas de `loja_produtos` e `loja_catalogo_config`, o suficiente para
montar a vitrine. Custo, frete, perda e margem ficam fora dessa lista de propósito.

As colunas que liberam acesso pago em `perfis` não são graváveis pelo usuário.
Só o `service_role`, usado pelo webhook de pagamento, escreve nelas.

Para aplicar migrações novas:

```sh
bunx supabase db push --db-url "$SUPABASE_DB_URL"
```

## Publicação

O site fica em **https://sistemaoguia.vercel.app**, na Vercel, projeto
`sistemaoguia` do time *monique's projects*. O repositório está conectado: todo
push na `main` publica sozinho, em cerca de 15 segundos. Não é preciso rodar
nada à mão.

Branches que não sejam a `main` geram um preview com link próprio, protegido por
login da Vercel. Produção é pública.

As variáveis de ambiente de produção vivem no painel da Vercel, em Settings →
Environment Variables. O `.env` daqui não é enviado junto no deploy.

## Tarefas de operação

**Liberar acesso a uma conta.** A interface não faz isso de propósito: as colunas
de acesso pago só aceitam escrita do webhook de pagamento. Para liberar na mão,
no SQL Editor do Supabase:

```sql
-- acesso vitalício à precificação
update public.perfis set tem_minha_loja = true where email = 'pessoa@exemplo.com';

-- assinatura da gestão por 30 dias (use null em pro_expira_em para não vencer)
update public.perfis
   set tem_minha_loja_pro = true,
       pro_expira_em = now() + interval '30 days'
 where email = 'pessoa@exemplo.com';
```

**Ligar o login com Google.** Crie as credenciais OAuth no Google Cloud, cole em
Authentication → Providers → Google no Supabase, e então adicione
`VITE_GOOGLE_LOGIN="true"` ao `.env` e às variáveis da Vercel. O botão só aparece
com essa variável ligada.

**Emails de confirmação.** O Supabase exige confirmação de email no cadastro, e o
remetente embutido é limitado a poucos envios por hora. Antes de abrir para
clientes, configure um SMTP próprio em Authentication → Emails. Não desligue a
confirmação: o gatilho de admin concede acesso total ao email do dono, e sem a
confirmação qualquer pessoa poderia se cadastrar com ele.

**Webhook de pagamento.** A URL a configurar na Kiwify é
`https://sistemaoguia.vercel.app/api/public/webhooks/kiwify?token=SEU_TOKEN`,
onde o token é o valor de `KIWIFY_WEBHOOK_TOKEN` nas variáveis da Vercel.
Preencha também `KIWIFY_PRODUTO_PRO` e `KIWIFY_PRODUTO_VITALICIO` com os ids dos
produtos: sem eles o webhook adivinha pelo nome, o que é menos confiável.

## Estrutura

- `src/lib/calculos.ts` — o motor de precificação, sem dependência de framework
- `src/lib/loja.ts`, `gestao.ts`, `catalogo.ts`, `clientes.ts` — acesso a dados
- `src/routes` — as telas, uma por arquivo, em TanStack Start
- `src/components/ui` — componentes shadcn/ui

## Tecnologias

TanStack Start, React, TypeScript, Tailwind CSS e Supabase.
