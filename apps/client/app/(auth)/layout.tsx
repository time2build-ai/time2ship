const GRID_BACKGROUND = "linear-gradient(var(--color-ink-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-subtle) 1px, transparent 1px)";
const GRADIENT_GLOW = "radial-gradient(ellipse 60% 40% at 50% 50%, var(--color-accent-glow), transparent)";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-ink px-4 sm:px-6 md:px-8 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{ backgroundImage: GRID_BACKGROUND, backgroundSize: "60px 60px" }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: GRADIENT_GLOW }}
      />
      <div className="relative z-[1] w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}
