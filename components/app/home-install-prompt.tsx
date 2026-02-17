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
    <Card className="border-green-300 bg-green-50">
      <CardHeader>
        <CardTitle className="text-base text-green-800">Add EnglishConnect Buddy to Home Screen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-green-900">
        {deferredPrompt ? (
          <Button onClick={() => void install()} className="w-full bg-green-600 hover:bg-green-700">
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
