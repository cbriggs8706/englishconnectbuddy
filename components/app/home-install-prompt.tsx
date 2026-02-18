"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function HomeInstallPrompt() {
  const [shouldPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("a2hs") === "1" && !isStandalone();
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!shouldPrompt) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const ios = useMemo(() => isIos(), []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!shouldPrompt || isStandalone()) return null;

  return (
    <Card className="border-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white">Add EnglishConnect Buddy to Home Screen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-base text-white/95">
        {deferredPrompt ? (
          <Button onClick={() => void install()} className="w-full border-0 bg-white text-emerald-700 hover:bg-emerald-50">
            Add to Home Screen
          </Button>
        ) : null}
        {ios ? (
          <p>On iPhone/iPad: tap Share, then tap Add to Home Screen.</p>
        ) : (
          <p>If no prompt appears, open your browser menu and choose Install app or Add to Home screen.</p>
        )}
      </CardContent>
    </Card>
  );
}
