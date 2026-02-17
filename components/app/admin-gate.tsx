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
    return <p className="text-sm text-muted-foreground">{copy.adminLoading}</p>;
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          {copy.adminOnly}
        </div>
        <p className="text-sm">{copy.adminNeedAccount}</p>
      </div>
    );
  }

  return <>{children}</>;
}
