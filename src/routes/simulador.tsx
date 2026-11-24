import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  Clock,
  Trophy,
  Lightbulb,
  PowerOff,
  RotateCcw,
  TrendingDown,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Frac, Var } from "@/components/site/Formula";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  CATEGORY_LABEL,
  DEFAULT_EQUIPMENT,
  DEFAULT_MAINTENANCE_COST,
  DEFAULT_TARIFF,
  NO_DECISIONS,
  PLANNING_PRODUCTION_HOURS_CUT,
  PRODUCTION_SLACK_PERCENT,
  SCORE_HORIZON_MONTHS,
  SCORE_LEVEL_LABEL,
  SCORE_WEIGHTS,
  fmtBRL,
  fmtInt,
  fmtNum,
  managementScore,
  simulate,
  type Decisions,
  type ScoreResult,
  type Equipment,
} from "@/lib/energy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador de consumo elétrico empresarial | Eletrogestão" },
      {
        name: "description",
        content:
          "Troque equipamentos, reduza horas, desligue máquinas ociosas e veja o consumo e o custo antes e depois.",
      },
      { property: "og:title", content: "Simulador de consumo elétrico empresarial" },
      {
        property: "og:description",
        content: "Compare o consumo em kWh e o custo em reais antes e depois de cada decisão de gestão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulator,
});

function Simulator() {
  const [equipment, setEquipment] = useState<Equipment[]>(DEFAULT_EQUIPMENT);
  const [decisions, setDecisions] = useState<Decisions>(NO_DECISIONS);
  const [tariff, setTariff] = useState(DEFAULT_TARIFF);
  const [maintCost, setMaintCost] = useState(DEFAULT_MAINTENANCE_COST);
  const [focusId, setFocusId] = useState(DEFAULT_EQUIPMENT[0]?.id ?? "");

  const r = useMemo(
    () => simulate(equipment, decisions, tariff, maintCost),
    [equipment, decisions, tariff, maintCost],
  );

  const score = useMemo(
    () => managementScore(DEFAULT_EQUIPMENT, equipment, decisions, tariff, maintCost),
    [equipment, decisions, tariff, maintCost],
  );

  const set = <K extends keyof Decisions>(k: K, v: Decisions[K]) =>
    setDecisions((d) => ({ ...d, [k]: v }));

  const updateEq = (id: string, patch: Partial<Equipment>) =>
    setEquipment((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const reset = () => {
    setEquipment(DEFAULT_EQUIPMENT);
    setDecisions(NO_DECISIONS);
    setTariff(DEFAULT_TARIFF);
    setMaintCost(DEFAULT_MAINTENANCE_COST);
  };

  const reduction = r.kWhBefore > 0 ? (1 - r.kWhAfter / r.kWhBefore) * 100 : 0;
  const anyDecision =
    decisions.efficientEquipment ||
    decisions.reduceTimePercent > 0 ||
    decisions.turnOffIdle ||
    decisions.betterPlanning ||
    decisions.maintenance;

  const chartData = r.rows.map((row) => ({
    name: row.eq.name.split(" ")[0],
    Antes: Math.round(row.before.kWh),
    Depois: Math.round(row.after.kWh),
  }));

  const focus = r.rows.find((row) => row.eq.id === focusId) ?? r.rows[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-muted-foreground">Relatório gerencial · Indústria Modelo Ltda.</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Simulador de consumo elétrico</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Escolha as decisões da diretoria e compare o consumo mensal antes e depois.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw /> Restaurar cenário
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Painel de decisões */}
        <aside className="flex flex-col gap-3">
          <p className="eyebrow text-muted-foreground">Decisões da gestão</p>

          <Decision
            icon={Lightbulb}
            title="Trocar por modelos eficientes"
            text="Menor potência (P) para o mesmo trabalho: LED, inverter, motores IE3."
            checked={decisions.efficientEquipment}
            onChange={(v) => set("efficientEquipment", v)}
          />
          <Decision
            icon={Clock}
            title="Reduzir o tempo de funcionamento"
            text="Diminui o tempo (t) de todos os equipamentos."
            checked={decisions.reduceTimePercent > 0}
            onChange={(v) => set("reduceTimePercent", v ? 15 : 0)}
          >
            {decisions.reduceTimePercent > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Redução</span>
                  <span className="tabular font-semibold">{decisions.reduceTimePercent}%</span>
                </div>
                <Slider
                  min={5}
                  max={50}
                  step={5}
                  value={[decisions.reduceTimePercent]}
                  onValueChange={([v]) => set("reduceTimePercent", v ?? 5)}
                  aria-label="Percentual de redução do tempo"
                />
              </div>
            )}
          </Decision>
          <Decision
            icon={PowerOff}
            title="Desligar máquinas ociosas"
            text="Zera as horas em que a máquina fica ligada sem produzir."
            checked={decisions.turnOffIdle}
            onChange={(v) => set("turnOffIdle", v)}
          />
          <Decision
            icon={CalendarClock}
            title="Melhorar o planejamento da produção"
            text={`Lotes agrupados e menos retrabalho: −${PLANNING_PRODUCTION_HOURS_CUT * 100}% das horas ativas na produção.`}
            checked={decisions.betterPlanning}
            onChange={(v) => set("betterPlanning", v)}
          />
          <Decision
            icon={Wrench}
            title="Investir em manutenção"
            text="Elimina perdas por desgaste: atrito, rolamentos, filtros sujos e gás baixo."
            checked={decisions.maintenance}
            onChange={(v) => set("maintenance", v)}
          >
            {decisions.maintenance && (
              <label className="mt-4 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Contrato mensal (R$)</span>
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={maintCost}
                  onChange={(e) => setMaintCost(Math.max(0, Number(e.target.value) || 0))}
                  className="tabular h-8 w-28 text-right"
                />
              </label>
            )}
          </Decision>

          <label className="mt-2 flex items-center justify-between gap-3 rounded-sm border bg-card p-4">
            <span>
              <span className="block text-sm font-semibold">Tarifa de energia</span>
              <span className="text-xs text-muted-foreground">R$ por kWh</span>
            </span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={tariff}
              onChange={(e) => setTariff(Math.max(0, Number(e.target.value) || 0))}
              className="tabular h-9 w-28 text-right"
            />
          </label>
        </aside>

        {/* Resultados */}
        <section className="flex min-w-0 flex-col gap-6">
          <ScoreBar score={score} />

          <div className="grid gap-px overflow-hidden rounded-sm border bg-border sm:grid-cols-2">
            <Kpi label="Antes" tone="muted">
              <p className="tabular text-3xl font-semibold">{fmtInt(r.kWhBefore)} kWh</p>
              <p className="tabular mt-1 text-muted-foreground">{fmtBRL(r.costBefore)} / mês</p>
            </Kpi>
            <Kpi label="Depois" tone="ink">
              <p className="tabular text-3xl font-semibold text-electric">{fmtInt(r.kWhAfter)} kWh</p>
              <p className="tabular mt-1 text-ink-foreground/80">{fmtBRL(r.costAfter)} / mês</p>
            </Kpi>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Redução do consumo"
              value={`${fmtNum(reduction)}%`}
              hint={`${fmtInt(r.kWhBefore - r.kWhAfter)} kWh a menos`}
              highlight={reduction > 0}
            />
            <Stat
              label="Economia líquida"
              value={fmtBRL(r.netMonthlySavings)}
              hint={`${fmtBRL(r.netMonthlySavings * 12)} por ano`}
              highlight={r.netMonthlySavings > 0}
            />
            <Stat
              label="Retorno do investimento"
              value={
                r.paybackMonths !== null
                  ? `${fmtNum(r.paybackMonths)} meses`
                  : r.investment > 0
                    ? "Sem retorno"
                    : "—"
              }
              hint={r.investment > 0 ? `Troca: ${fmtBRL(r.investment)}` : "Sem troca de equipamentos"}
            />
          </div>

          {r.maintenanceMonthlyCost > 0 && (
            <p className="text-xs text-muted-foreground">
              Economia na conta {fmtBRL(r.monthlySavings)} − manutenção{" "}
              {fmtBRL(r.maintenanceMonthlyCost)} = {fmtBRL(r.netMonthlySavings)} por mês.
            </p>
          )}

          <div className="rounded-sm border bg-card p-5 shadow-ledger">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Consumo mensal por equipamento (kWh)</h2>
              <TrendingDown className="size-5 text-saving" />
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    interval={0}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => `${fmtInt(v)} kWh`}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Antes" fill="var(--chart-4)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Depois" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Planilha */}
      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">Planilha de equipamentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite quantidade e horas por dia. Clique em uma linha para ver a memória de cálculo.
        </p>
        <div className="mt-4 overflow-x-auto rounded-sm border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary text-left">
              <tr className="eyebrow text-muted-foreground">
                <th className="px-4 py-3 font-medium">Equipamento</th>
                <th className="px-3 py-3 font-medium">Qtd.</th>
                <th className="px-3 py-3 font-medium">h/dia</th>
                <th className="px-3 py-3 text-right font-medium">P (W)</th>
                <th className="px-3 py-3 text-right font-medium">t (h/mês)</th>
                <th className="px-3 py-3 text-right font-medium">E antes</th>
                <th className="px-3 py-3 text-right font-medium">E depois</th>
                <th className="px-4 py-3 text-right font-medium">Custo depois</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {r.rows.map((row) => (
                <tr
                  key={row.eq.id}
                  onClick={() => setFocusId(row.eq.id)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent/50",
                    focus?.eq.id === row.eq.id && "bg-accent",
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.eq.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABEL[row.eq.category]} · ociosa {fmtNum(row.eq.idleHoursPerDay)} h/dia
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.eq.quantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        updateEq(row.eq.id, { quantity: Math.max(0, Math.round(Number(e.target.value) || 0)) })
                      }
                      className="tabular h-8 w-20"
                      aria-label={`Quantidade de ${row.eq.name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={row.eq.hoursPerDay}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        updateEq(row.eq.id, {
                          hoursPerDay: Math.min(24, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      className="tabular h-8 w-20"
                      aria-label={`Horas por dia de ${row.eq.name}`}
                    />
                  </td>
                  <td className="tabular px-3 py-3 text-right">
                    {fmtInt(row.before.power)}
                    {row.after.power !== row.before.power && (
                      <span className="block text-xs text-saving">→ {fmtInt(row.after.power)}</span>
                    )}
                  </td>
                  <td className="tabular px-3 py-3 text-right">
                    {fmtNum(row.before.hoursPerMonth)}
                    {row.after.hoursPerMonth !== row.before.hoursPerMonth && (
                      <span className="block text-xs text-saving">→ {fmtNum(row.after.hoursPerMonth)}</span>
                    )}
                  </td>
                  <td className="tabular px-3 py-3 text-right text-muted-foreground">{fmtInt(row.before.kWh)}</td>
                  <td className="tabular px-3 py-3 text-right font-semibold">{fmtInt(row.after.kWh)}</td>
                  <td className="tabular px-4 py-3 text-right">{fmtBRL(row.after.kWh * tariff)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 bg-secondary font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan={5}>
                  Total mensal
                </td>
                <td className="tabular px-3 py-3 text-right">{fmtInt(r.kWhBefore)}</td>
                <td className="tabular px-3 py-3 text-right">{fmtInt(r.kWhAfter)}</td>
                <td className="tabular px-4 py-3 text-right">{fmtBRL(r.costAfter)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Memória de cálculo */}
      {focus && (
        <section className="mt-10 rounded-sm bg-ink p-6 text-ink-foreground md:p-8">
          <p className="eyebrow text-electric">Memória de cálculo · {focus.eq.name}</p>
          <p className="mt-2 text-sm text-ink-foreground/70">
            Por unidade: P já inclui {decisions.maintenance ? "0%" : `${fmtInt(focus.eq.wear * 100)}%`} de perda
            por desgaste
            {decisions.efficientEquipment ? ` · modelo: ${focus.eq.efficientModel}` : ""}. Quantidade:{" "}
            {focus.eq.quantity}.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {(
              [
                ["Antes", focus.before],
                ["Depois", focus.after],
              ] as const
            ).map(([label, st]) => (
              <div key={label} className="rounded-sm border border-ink-foreground/15 p-5">
                <p className="eyebrow text-ink-foreground/60">{label}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-lg">
                  <Var>E</Var> =
                  <Frac num={`${fmtInt(st.power)} × ${fmtNum(st.hoursPerMonth)}`} den="1000" />× {focus.eq.quantity} =
                  <span className="tabular font-semibold text-electric">{fmtNum(st.kWh)} kWh</span>
                </div>
                <p className="tabular mt-4 text-sm">
                  Custo = {fmtNum(st.kWh)} × {fmtBRL(tariff)} ={" "}
                  <span className="font-semibold text-electric">{fmtBRL(st.kWh * tariff)}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Conclusão */}
      <section className="mt-10 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <h2 className="text-2xl font-extrabold">O que a Física mostrou à gestão</h2>
        <div className="space-y-3 text-muted-foreground">
          {anyDecision ? (
            <p>
              Com as decisões escolhidas, a empresa passa de{" "}
              <strong className="text-foreground">{fmtInt(r.kWhBefore)} kWh</strong> para{" "}
              <strong className="text-foreground">{fmtInt(r.kWhAfter)} kWh</strong> por mês — uma
              economia líquida de <strong className="text-saving">{fmtBRL(r.netMonthlySavings)}</strong>{" "}
              mensais, ou {fmtBRL(r.netMonthlySavings * 12)} por ano.
            </p>
          ) : (
            <p>Ative uma ou mais decisões ao lado para comparar os cenários.</p>
          )}
          <p>
            Toda decisão age sobre uma variável da fórmula: trocar equipamentos e fazer manutenção
            reduzem a potência <Var>P</Var>; reduzir horas, desligar ociosos e planejar a produção
            reduzem o tempo <Var>t</Var>. Menos <Var>P</Var> × <Var>t</Var> significa menos kWh — e
            menos custo.
          </p>
        </div>
      </section>
    </div>
  );
}

function Decision({
  icon: Icon,
  title,
  text,
  checked,
  onChange,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border bg-card p-4 transition-shadow",
        checked && "border-electric shadow-electric",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", checked ? "text-foreground" : "text-muted-foreground")} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
      </div>
      {children}
    </div>
  );
}

function Kpi({ label, tone, children }: { label: string; tone: "muted" | "ink"; children: ReactNode }) {
  return (
    <div className={cn("p-6", tone === "ink" ? "bg-ink text-ink-foreground" : "bg-card")}>
      <p className={cn("eyebrow", tone === "ink" ? "text-ink-foreground/60" : "text-muted-foreground")}>
        {label} · consumo mensal
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint: string; highlight?: boolean }) {
  return (
    <div className="rounded-sm border bg-card p-4">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-2 text-xl font-semibold", highlight && "text-saving")}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const LEVEL_STYLE: Record<ScoreResult["level"], { bar: string; text: string }> = {
  risco: { bar: "bg-destructive", text: "text-destructive" },
  regular: { bar: "bg-electric", text: "text-foreground" },
  boa: { bar: "bg-saving", text: "text-saving" },
  exemplar: { bar: "bg-saving", text: "text-saving" },
};

function ScoreBar({ score }: { score: ScoreResult }) {
  const style = LEVEL_STYLE[score.level];
  const pct = Math.round(score.percent * 10) / 10;
  const parts = [
    { label: "Energia economizada", value: score.energy, max: SCORE_WEIGHTS.energy },
    { label: `Retorno em ${SCORE_HORIZON_MONTHS / 12} anos`, value: score.finance, max: SCORE_WEIGHTS.finance },
    { label: "Operação preservada", value: score.production, max: SCORE_WEIGHTS.production },
  ];

  return (
    <div className="rounded-sm border bg-card p-5 shadow-ledger">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Trophy className={cn("size-6", style.text)} />
          <div>
            <p className="eyebrow text-muted-foreground">Êxito da administração</p>
            <p className={cn("text-lg font-bold", style.text)}>{SCORE_LEVEL_LABEL[score.level]}</p>
          </div>
        </div>
        <p className={cn("tabular text-4xl font-semibold", style.text)} aria-live="polite">
          {fmtNum(pct)}%
        </p>
      </div>

      <div
        className="relative mt-4 h-4 overflow-hidden rounded-sm bg-secondary"
        role="progressbar"
        aria-label="Porcentagem de êxito na administração"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={cn("h-full transition-[width] duration-500", style.bar)} style={{ width: `${pct}%` }} />
        {[40, 70, 90].map((mark) => (
          <span
            key={mark}
            className="absolute inset-y-0 w-px bg-foreground/25"
            style={{ left: `${mark}%` }}
            aria-hidden
          />
        ))}
      </div>
      <div className="tabular relative mt-1 h-4 text-[0.65rem] text-muted-foreground" aria-hidden>
        {[
          [0, "Risco"],
          [40, "Regular"],
          [70, "Boa"],
          [90, "Exemplar"],
        ].map(([at, label]) => (
          <span key={label} className="absolute" style={{ left: `${at}%` }}>
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {parts.map((p) => (
          <div key={p.label}>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{p.label}</span>
              <span className="tabular font-semibold">
                {fmtNum(p.value)}/{p.max}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-secondary">
              <div
                className="h-full bg-primary transition-[width] duration-500"
                style={{ width: `${(p.value / p.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        A nota compara suas escolhas (decisões, quantidades e horas por dia) com a empresa original; 100%
        é a melhor combinação de decisões. Cortar mais de {PRODUCTION_SLACK_PERCENT}% do trabalho útil de um
        equipamento economiza energia, mas prejudica a operação. Desafie os colegas: quem chega mais perto de
        100%?
      </p>
    </div>
  );
}
