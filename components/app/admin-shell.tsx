import { LanguageSwitcher } from "@/components/app/language-switcher";
import { ThemeToggle } from "@/components/app/theme-toggle";

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(244,63,94,0.25),transparent_28%),radial-gradient(circle_at_86%_2%,rgba(59,130,246,0.24),transparent_30%),radial-gradient(circle_at_45%_100%,rgba(14,165,233,0.18),transparent_40%)]" />

      <header className="sticky top-0 z-30 border-b-2 border-slate-200/80 bg-white/92 px-8 py-5 backdrop-blur">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-sky-700">EC Buddy Admin</p>
            <h1 className="truncate text-4xl font-black tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <p className="text-base font-semibold text-slate-700">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 space-y-5 px-8 py-8 [&_table]:w-full">{children}</main>
    </div>
  );
}
