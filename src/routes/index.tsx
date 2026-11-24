import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Cable, Cog, Gauge, Radio } from "lucide-react";

import { FieldArt } from "@/components/site/FieldArt";
import { EnergyFormula } from "@/components/site/Formula";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A importância do eletromagnetismo na administração de empresas | Eletrogestão" },
      {
        name: "description",
        content:
          "Motores, transformadores e medidores: entenda como o eletromagnetismo move a empresa e pesa nos custos.",
      },
      { property: "og:title", content: "A importância do eletromagnetismo na administração de empresas" },
      {
        property: "og:description",
        content: "Da Física à gestão: como a energia elétrica vira custo, planejamento e decisão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const applications = [
  {
    icon: Cog,
    title: "Motores elétricos",
    law: "Força de Lorentz",
    text: "Esteiras, bombas e compressores giram porque corrente elétrica dentro de um campo magnético gera força. São a maior fatia da conta de uma indústria.",
  },
  {
    icon: Cable,
    title: "Transformadores",
    law: "Lei de Faraday",
    text: "Elevam e reduzem a tensão para a energia chegar à empresa. Perdas no transformador e no cabeamento são dinheiro que não vira produção.",
  },
  {
    icon: Gauge,
    title: "Medidores de energia",
    law: "Indução eletromagnética",
    text: "O medidor registra cada kWh consumido. É desse número que nasce a fatura — e o indicador que o gestor acompanha todo mês.",
  },
  {
    icon: Radio,
    title: "Sensores e comunicação",
    law: "Ondas eletromagnéticas",
    text: "Sensores, Wi-Fi e automação permitem monitorar máquinas em tempo real e desligar o que está ocioso.",
  },
];

const steps = [
  { n: "01", title: "Medir", text: "Saber a potência (W) de cada equipamento e por quantas horas ele funciona." },
  { n: "02", title: "Calcular", text: "Converter potência e tempo em energia (kWh) e energia em reais." },
  { n: "03", title: "Decidir", text: "Comparar cenários: trocar, desligar, replanejar ou manter — e escolher com números." },
];

function Index() {
  return (
    <>
      <section className="relative overflow-hidden border-b grid-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div className="flex flex-col justify-center">
            <p className="eyebrow text-muted-foreground">Física × Administração</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] md:text-6xl">
              A importância do <span className="bg-electric px-1.5">eletromagnetismo</span> na
              administração de empresas
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Toda máquina que gira, todo ar-condicionado e toda lâmpada transformam energia
              elétrica em trabalho — e em custo. Entender essa física é entender uma linha
              inteira do orçamento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="electric" size="lg">
                <Link to="/simulador">
                  Abrir o simulador <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/formulas">Ver as fórmulas</Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-72 rounded-sm bg-ink p-4 shadow-ledger">
            <FieldArt />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-muted-foreground">Onde o eletromagnetismo aparece</p>
          <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
            Ele está na fábrica, no escritório e na fatura
          </h2>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border bg-border sm:grid-cols-2">
          {applications.map((a) => (
            <article key={a.title} className="bg-card p-7">
              <div className="flex items-center justify-between">
                <a.icon className="size-6 text-primary" />
                <span className="eyebrow text-muted-foreground">{a.law}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{a.title}</h3>
              <p className="mt-2 text-muted-foreground">{a.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow text-electric">Por que o gestor precisa saber</p>
            <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">Da Física à tomada de decisão</h2>
            <div className="mt-8 inline-block rounded-sm border border-electric/40 px-6 py-5 text-3xl text-electric">
              <EnergyFormula />
            </div>
          </div>
          <ol className="grid gap-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5 border-b border-ink-foreground/15 pb-6 last:border-0">
                <span className="tabular text-sm text-electric">{s.n}</span>
                <div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-1 text-ink-foreground/75">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-sm border bg-card p-8 shadow-ledger md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Teste as decisões de uma empresa fictícia</h2>
            <p className="mt-1 text-muted-foreground">
              Veja quanto ela consumia antes e quanto passa a consumir depois de cada escolha.
            </p>
          </div>
          <Button asChild variant="ink" size="lg">
            <Link to="/simulador">
              Simular consumo <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
