import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Planos" };

const PLANS = [
  {
    name: "Grátis",
    price: "R$ 0",
    credits: "2 créditos (total)",
    note: "Para conhecer o produto",
    highlighted: false,
  },
  {
    name: "Surfista",
    price: "R$ 39/mês",
    credits: "8 créditos/mês",
    note: "Em breve — checkout ainda não disponível",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "R$ 89/mês",
    credits: "30 créditos/mês",
    note: "Em breve — checkout ainda não disponível",
    highlighted: false,
  },
] as const;

const PACKS = [
  { name: "Pack S", price: "R$ 19", credits: "5 créditos" },
  { name: "Pack M", price: "R$ 49", credits: "15 créditos" },
] as const;

export default function PlanosPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Badge variant="primary">Planos de exemplo</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Escolha como quer evoluir
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Valores e cotas ilustrativos. A cobrança real chega na próxima etapa —
          por enquanto o plano grátis oferece 2 créditos no total.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted ? "border-primary/40 bg-primary/5" : undefined
            }
          >
            <CardHeader>
              <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
              <p className="text-3xl font-bold tabular-nums">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-foreground">{plan.credits}</p>
              <p>{plan.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium">Pacotes avulsos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PACKS.map((pack) => (
            <Card key={pack.name}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium">{pack.name}</p>
                  <p className="text-sm text-muted-foreground">{pack.credits}</p>
                </div>
                <p className="font-display text-xl font-bold">{pack.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Button asChild variant="secondary">
        <Link href="/dashboard">Voltar ao painel</Link>
      </Button>
    </div>
  );
}
