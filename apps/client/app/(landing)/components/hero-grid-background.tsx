export function HeroGridBackground(): React.ReactElement {
  return (
    <>
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(var(--color-ink-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-subtle) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-accent-glow), transparent)"
        }}
      />
    </>
  );
}
