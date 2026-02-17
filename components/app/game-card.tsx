import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const toneStyles = {
  green: "border-lime-200 dark:border-lime-700/50 bg-white/95 dark:bg-card",
  blue: "border-sky-200 dark:border-sky-700/50 bg-white/95 dark:bg-card",
  yellow: "border-amber-200 dark:border-amber-700/50 bg-white/95 dark:bg-card",
} as const;

const titleStyles = {
  green: "text-lime-700 dark:text-lime-300",
  blue: "text-sky-700 dark:text-sky-300",
  yellow: "text-amber-700 dark:text-amber-300",
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
    <Card className={`shadow-sm ${toneStyles[tone]}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base ${titleStyles[tone]}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground/80">{description}</p>
        <Button asChild size="sm" className="rounded-xl">
          <Link href={href}>
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
