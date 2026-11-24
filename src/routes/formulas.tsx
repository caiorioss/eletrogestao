import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { CostFormula, EnergyFormula, Var } from "@/components/site/Formula";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/formulas")({
  head: () => ({
    meta: [
      { title: "Fórmulas de energia e custo | Eletrogestão" },
      {
        name: "description",
        content: "Aprenda E = P × t / 1000 e Custo = kWh × Tarifa com um exemplo prático de empresa.",
      },
      { property: "og:title", content: "Fórmulas de energia e custo elétrico" },
      {
        property: "og:description",
        content: "Potência, tempo e tarifa: as contas que transformam Física em gestão de custos.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Formulas,
});

const vars = [
  { s: "E", name: "Energia consumida", unit: "kWh" },
  { s: "P", name: "Potência do equipamento", unit: "W (watts)" },
  { s: "t", name: "Tempo de funcionamento", unit: "h (horas)" },
];

function Formulas() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className="eyebrow text-muted-foreground">Material de apoio</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-black md:text-5xl">
        Duas contas que todo gestor deveria saber fazer
      </h1>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border bg-card p-8 shadow-ledger">
          <p className="eyebrow text-muted-foreground">Fórmula 1 · Consumo</p>
          <div className="mt-6 text-4xl md:text-5xl">
            <EnergyFormula />
          </div>
          <dl className="mt-8 divide-y border-t">
            {vars.map((v) => (
              <div key={v.s} className="flex items-center justify-between py-3">
                <dt className="flex items-center gap-3">
                  <span className="text-xl">
                    <Var>{v.s}</Var>
                  </span>
                  {v.name}
                </dt>
                <dd className="tabular text-sm text-muted-foreground">{v.unit}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            Dividimos por 1000 porque 1 kW = 1000 W. A concessionária cobra em quilowatt-hora.
          </p>
        </div>

        <div className="rounded-sm border bg-card p-8 shadow-ledger">
          <p className="eyebrow text-muted-foreground">Fórmula 2 · Custo</p>
          <div className="mt-6 text-3xl md:text-4xl">
            <CostFormula />
          </div>
          <p className="mt-8 text-muted-foreground">
            A <strong className="text-foreground">tarifa</strong> é o preço de cada kWh, em R$/kWh,
            definido pela distribuidora (com impostos e bandeiras). Com ela, a energia deixa de ser
            um número físico e vira uma linha do orçamento.
          </p>
          <p className="mt-4 text-muted-foreground">
            Para o mês inteiro, basta usar <Var>t</Var> = horas por dia × dias trabalhados.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-extrabold">Exemplo resolvido</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Um motor de esteira de 7.500 W funciona 16 horas por dia, 22 dias por mês. A tarifa é
          R$ 0,92/kWh.
        </p>
        <div className="mt-6 overflow-hidden rounded-sm border bg-ink text-ink-foreground">
          {[
            ["Tempo no mês", "t = 16 h × 22 dias", "352 h"],
            ["Energia", "E = (7.500 × 352) / 1000", "2.640 kWh"],
            ["Custo", "Custo = 2.640 × 0,92", "R$ 2.428,80"],
          ].map(([label, calc, result]) => (
            <div
              key={label}
              className="grid gap-2 border-b border-ink-foreground/15 px-6 py-5 last:border-0 md:grid-cols-[180px_1fr_auto] md:items-center"
            >
              <span className="eyebrow text-ink-foreground/60">{label}</span>
              <span className="tabular">{calc}</span>
              <span className="tabular text-lg font-semibold text-electric">{result}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-muted-foreground">
          Se esse motor ficar 3 horas por dia ligado sem produzir, são 66 h por mês, ou seja,
          495 kWh e <strong className="text-foreground">R$ 455,40 jogados fora</strong> — por um
          único motor.
        </p>
      </section>

      <div className="mt-12">
        <Button asChild variant="electric" size="lg">
          <Link to="/simulador">
            Aplicar no simulador <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
