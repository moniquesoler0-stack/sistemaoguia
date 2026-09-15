export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <div
      className={"animate-pulse rounded-2xl bg-muted ring-1 ring-black/5 " + className}
      aria-hidden="true"
    />
  );
}

export function EsqueletoLista({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: linhas }).map((_, i) => (
        <Esqueleto key={i} className="h-[62px]" />
      ))}
    </div>
  );
}
