"use client";

import { Button } from "@/components/ui/button";
import { languageNames, t } from "@/lib/i18n";
import { Language } from "@/lib/types";
import { useLanguage } from "@/components/providers/language-provider";
import { Check, Languages, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const languages: Language[] = ["es", "en", "pt", "sw", "chk"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const copy = t(language);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`${copy.selectLanguage}: ${languageNames[language]}`}
        className="h-10 rounded-full border-0 bg-linear-to-r from-cyan-500 to-blue-500 px-4 text-white shadow-sm hover:from-cyan-500/90 hover:to-blue-500/90"
      >
        <Languages className="mr-1.5 h-4 w-4" />
        {languageNames[language]}
      </Button>

      {open && mounted
        ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close language picker"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={copy.selectLanguage}
            className="relative w-[min(92vw,28rem)] max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xl font-black text-slate-900">{copy.selectLanguage}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-2">
              {languages.map((item) => {
                const selected = item === language;
                return (
                  <Button
                    key={item}
                    type="button"
                    variant={selected ? "default" : "secondary"}
                    className="h-12 justify-between rounded-2xl text-base font-bold"
                    onClick={() => {
                      setLanguage(item);
                      setOpen(false);
                    }}
                  >
                    {languageNames[item]}
                    {selected ? <Check className="h-5 w-5" /> : null}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )
        : null}
    </>
  );
}
