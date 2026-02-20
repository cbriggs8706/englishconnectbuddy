"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { absoluteUrl } from "@/lib/app-url";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export default function AdminHomeQrPage() {
  const [url] = useState(() => absoluteUrl("/?a2hs=1"));
  const [qrData, setQrData] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    void QRCode.toDataURL(url, { width: 1400, margin: 1 }).then(setQrData);
  }, [url]);

  return (
    <AdminShell title="Homepage QR">
      <AdminGate>
        <Card>
          <CardHeader>
            <CardTitle>Scan to Open Homepage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrData ? (
              <img
                src={qrData}
                alt="Homepage QR"
                className="mx-auto aspect-square w-full rounded-2xl border bg-white p-2"
              />
            ) : null}
            <p className="break-all rounded-xl border bg-muted p-3 text-sm font-semibold">{url}</p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                if (typeof window === "undefined") return;
                void navigator.clipboard.writeText(url);
              }}
            >
              Copy URL
            </Button>
          </CardContent>
        </Card>
      </AdminGate>
    </AdminShell>
  );
}
