import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const toneStyles = {
  green: "border-0 bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25",
  blue: "border-0 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25",
  yellow: "border-0 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 text-white shadow-lg shadow-orange-500/25",
  purple: "border-0 bg-gradient-to-br from-fuchsia-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25",
} as const;

const titleStyles = {
  green: "text-white",
  blue: "text-white",
  yellow: "text-white",
  purple: "text-white",
} as const;

export function GameCard({
  title,
  description,
  href,
  tone = "green",
  cta = "Play",
}: {
  title: string;
  description: string;
  href: string;
  tone?: keyof typeof toneStyles;
  cta?: string;
}) {
  return (
    <Card className={`gap-3 py-4 ${toneStyles[tone]}`}>
      <CardHeader className="pb-1">
        <CardTitle className={`text-lg ${titleStyles[tone]}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-base text-white/95">{description}</p>
        <Button
          asChild
          size="sm"
          className="w-full rounded-xl border-0 bg-white/95 font-bold text-foreground hover:bg-white"
        >
          <Link href={href}>
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
