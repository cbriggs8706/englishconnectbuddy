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
    <div className="relative mx-auto min-h-screen max-w-xl overflow-hidden bg-background pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.28),transparent_60%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_70%_15%,rgba(234,179,8,0.2),transparent_35%)]" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 px-4 py-4 backdrop-blur">
        <div className="relative flex min-h-14 items-center justify-end gap-2">
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-semibold tracking-[0.04em] text-foreground">EC Buddy</h1>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
              {contextLabel}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="relative z-10 space-y-4 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
