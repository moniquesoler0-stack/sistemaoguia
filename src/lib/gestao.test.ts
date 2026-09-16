import { expect, test } from "bun:test";
import { variacoesDoProduto } from "./gestao";
import type { Produto } from "./loja";

const peca = (variacoes: Produto["variacoes"]): Produto =>
  ({
    id: "p1",
    nome: "Top",
    variacoes,
  }) as Produto;

test("tamanho e cor viram a grade combinada", () => {
  // Era o bug: "P" e "preto" contavam como duas peças diferentes no estoque,
  // em vez de uma peça "P / preto".
  const grade = variacoesDoProduto(
    peca([{ tamanho: "P" }, { tamanho: "M" }, { cor: "preto" }, { cor: "rosa" }]),
  );
  expect(grade).toEqual(["P / preto", "P / rosa", "M / preto", "M / rosa"]);
});

test("só tamanhos, sem cor, mantém a lista simples", () => {
  expect(variacoesDoProduto(peca([{ tamanho: "P" }, { tamanho: "G" }]))).toEqual(["P", "G"]);
});

test("só cores, sem tamanho, mantém a lista simples", () => {
  expect(variacoesDoProduto(peca([{ cor: "preto" }]))).toEqual(["preto"]);
});

test("variação já combinada é respeitada como veio", () => {
  expect(variacoesDoProduto(peca([{ tamanho: "P", cor: "preto" }]))).toEqual(["P / preto"]);
});

test("peça sem variação cai na Única", () => {
  expect(variacoesDoProduto(peca([]))).toEqual(["Única"]);
});

test("não repete variação duplicada", () => {
  const grade = variacoesDoProduto(peca([{ tamanho: "P", cor: "preto" }, { tamanho: "P" }, { cor: "preto" }]));
  expect(grade).toEqual(["P / preto"]);
});
