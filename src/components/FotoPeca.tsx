import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEZ_ANOS = 60 * 60 * 24 * 3650;

export function FotoPeca({
  foto,
  aoTrocar,
}: {
  foto: string | null;
  aoTrocar: (url: string | null) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(arquivo: File) {
    setAviso(null);
    if (arquivo.size > 10 * 1024 * 1024) {
      setAviso("A foto precisa ter até 10 MB.");
      return;
    }
    setEnviando(true);
    const { data: usuario } = await supabase.auth.getUser();
    const id = usuario.user?.id;
    if (!id) {
      setEnviando(false);
      setAviso("Sessão expirada, entre de novo.");
      return;
    }
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const caminho = `${id}/${crypto.randomUUID()}.${extensao}`;
    const { error } = await supabase.storage
      .from("pecas")
      .upload(caminho, arquivo, { contentType: arquivo.type || "image/jpeg" });
    if (error) {
      setEnviando(false);
      setAviso("Não foi possível enviar a foto agora.");
      return;
    }
    const { data } = await supabase.storage.from("pecas").createSignedUrl(caminho, DEZ_ANOS);
    setEnviando(false);
    if (!data?.signedUrl) {
      setAviso("A foto subiu, mas não consegui gerar o endereço dela.");
      return;
    }
    aoTrocar(data.signedUrl);
  }

  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
        Foto da peça
      </span>
      <div className="flex items-center gap-3">
        {foto ? (
          <img
            src={foto}
            alt="Foto da peça"
            loading="lazy"
            className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-black/5"
          />
        ) : (
          <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-background text-[11px] text-muted-foreground ring-1 ring-black/5">
            Sem foto
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button
            onClick={() => entrada.current?.click()}
            disabled={enviando}
            className="rounded-2xl bg-pink px-4 py-2.5 fonte-display text-[13px] font-semibold leading-none text-primary-foreground disabled:opacity-60"
          >
            {enviando ? "Enviando" : foto ? "Trocar foto" : "Enviar foto"}
          </button>
          {foto ? (
            <button
              onClick={() => aoTrocar(null)}
              className="rounded-2xl bg-background px-4 py-2.5 text-[13px] text-muted-foreground ring-1 ring-black/5"
            >
              Remover foto
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (arquivo) void enviar(arquivo);
        }}
      />
      {aviso ? <p className="mt-2 text-[12px] text-muted-foreground">{aviso}</p> : null}
    </div>
  );
}
