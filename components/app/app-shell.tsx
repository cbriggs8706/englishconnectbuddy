import { BottomNav } from "@/components/app/bottom-nav";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const contextLabel = subtitle ?? title;

  return (
    <div className="relative mx-auto min-h-screen max-w-xl overflow-hidden bg-white pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_15%_0%,rgba(16,185,129,0.32),transparent_58%),radial-gradient(circle_at_85%_4%,rgba(59,130,246,0.28),transparent_48%),radial-gradient(circle_at_68%_12%,rgba(244,114,182,0.2),transparent_38%)]" />
      <header className="sticky top-0 z-30 border-b-2 border-sky-200/80 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="flex min-h-14 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[1.9rem] font-bold tracking-[0.03em] text-foreground">EC Buddy</h1>
            <p className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-sky-900/80">
              {contextLabel}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="app-content relative z-10 space-y-4 px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
