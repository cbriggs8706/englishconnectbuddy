"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { t } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { loading, user, profile } = useAuth();
  const { language } = useLanguage();
  const copy = t(language);

  if (loading) {
    return <p className="text-base text-muted-foreground">{copy.adminLoading}</p>;
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="rounded-2xl border-0 bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-white shadow-lg shadow-amber-500/30">
        <div className="mb-2 flex items-center gap-2 text-lg font-bold">
          <AlertTriangle className="h-5 w-5" />
          {copy.adminOnly}
        </div>
        <p className="text-base text-white/95">{copy.adminNeedAccount}</p>
      </div>
    );
  }

  return <>{children}</>;
}
