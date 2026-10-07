export function PageHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-6 space-y-2">
      <h1 className="text-3xl font-bold leading-snug md:text-4xl">{title}</h1>
      {intro ? <p className="text-muted">{intro}</p> : null}
    </div>
  );
}
