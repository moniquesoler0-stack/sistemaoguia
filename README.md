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

Outros comandos: `bun run build` (produção), `bun run lint`, `bun run format`.

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

## Estrutura

- `src/lib/calculos.ts` — o motor de precificação, sem dependência de framework
- `src/lib/loja.ts`, `gestao.ts`, `catalogo.ts`, `clientes.ts` — acesso a dados
- `src/routes` — as telas, uma por arquivo, em TanStack Start
- `src/components/ui` — componentes shadcn/ui

## Tecnologias

TanStack Start, React, TypeScript, Tailwind CSS e Supabase.
