export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-ink">
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
