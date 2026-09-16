// Só o que os testes usam do runner embutido do Bun. O pacote @types/bun
// inteiro não serve aqui: ele redefine o fetch global e passa a brigar com os
// tipos do cliente do Supabase.
declare module "bun:test" {
  type Comparacoes = {
    toBe(esperado: unknown): void;
    toEqual(esperado: unknown): void;
    toBeCloseTo(esperado: number, casas?: number): void;
  };
  export function test(nome: string, corpo: () => void | Promise<void>): void;
  export function expect(recebido: unknown): Comparacoes;
}
