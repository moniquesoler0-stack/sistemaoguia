# Orientações para agentes

Projeto em português: nomes de variáveis, funções, comentários e textos de tela
seguem o idioma do código existente. Mantenha esse padrão.

## Regras que não mudam

- **Nada de segredo no repositório.** O `.env` está fora do git. Se precisar de
  uma variável nova, documente em `.env.example` com valor de exemplo.
- **A `SUPABASE_SERVICE_ROLE_KEY` ignora o RLS.** Use apenas em `*.server.ts` e
  em rotas de servidor, nunca em arquivo que vá para o navegador.
- **Toda tabela nova nasce com RLS ligada** e política restrita ao dono da linha.
- **Acesso pago é decidido no banco.** As colunas `tem_minha_loja`,
  `tem_minha_loja_pro` e `pro_expira_em` só são graváveis pelo `service_role`,
  a partir do webhook de pagamento. Não devolva esse poder ao cliente.
- **Mudança de banco é migração.** Crie um arquivo em `supabase/migrations`,
  nunca altere o schema direto pelo painel.

## Antes de entregar

```sh
bunx tsc --noEmit
bun run build
```
