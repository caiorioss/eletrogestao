/** Física aplicada à gestão: E = (P × t) / 1000 e Custo = kWh × tarifa. */

export type Category = "producao" | "climatizacao" | "iluminacao" | "escritorio";

export interface Equipment {
  id: string;
  name: string;
  category: Category;
  /** Potência nominal do modelo atual, em watts. */
  power: number;
  /** Potência do modelo eficiente equivalente, em watts. */
  efficientPower: number;
  efficientModel: string;
  /** Custo de troca por unidade, em reais. */
  replacementCost: number;
  quantity: number;
  /** Horas ligadas por dia (inclui as horas ociosas). */
  hoursPerDay: number;
  /** Horas por dia em que a máquina fica ligada sem produzir. */
  idleHoursPerDay: number;
  daysPerMonth: number;
  /** Perda por falta de manutenção: 0,1 = consome 10% a mais que o nominal. */
  wear: number;
}

export interface Decisions {
  efficientEquipment: boolean;
  /** Redução do tempo de funcionamento, em % (0 a 50). */
  reduceTimePercent: number;
  turnOffIdle: boolean;
  /** Planejamento: lotes consolidados reduzem as horas das máquinas de produção. */
  betterPlanning: boolean;
  maintenance: boolean;
}

export const PLANNING_PRODUCTION_HOURS_CUT = 0.1;

export const NO_DECISIONS: Decisions = {
  efficientEquipment: false,
  reduceTimePercent: 0,
  turnOffIdle: false,
  betterPlanning: false,
  maintenance: false,
};

/** E = (P × t) / 1000 → kWh */
export function energyKWh(powerW: number, hours: number): number {
  return (powerW * hours) / 1000;
}

/** Custo = Consumo (kWh) × Tarifa */
export function cost(kWh: number, tariff: number): number {
  return kWh * tariff;
}

export interface EquipmentState {
  /** Potência efetiva por unidade, em W (já com perdas). */
  power: number;
  /** Horas por mês de uma unidade. */
  hoursPerMonth: number;
  /** Consumo mensal total (todas as unidades), em kWh. */
  kWh: number;
}

export function equipmentState(eq: Equipment, d: Decisions): EquipmentState {
  const basePower = d.efficientEquipment ? eq.efficientPower : eq.power;
  const power = basePower * (1 + (d.maintenance ? 0 : eq.wear));

  const timeFactor = 1 - Math.min(Math.max(d.reduceTimePercent, 0), 50) / 100;
  const planningFactor =
    d.betterPlanning && eq.category === "producao" ? 1 - PLANNING_PRODUCTION_HOURS_CUT : 1;

  const idle = Math.min(eq.idleHoursPerDay, eq.hoursPerDay);
  const active = eq.hoursPerDay - idle;
  const activeAfter = active * timeFactor * planningFactor;
  const idleAfter = d.turnOffIdle ? 0 : idle * timeFactor;

  const hoursPerMonth = (activeAfter + idleAfter) * eq.daysPerMonth;
  const kWh = energyKWh(power, hoursPerMonth) * eq.quantity;
  return { power, hoursPerMonth, kWh };
}

export interface SimulationResult {
  rows: { eq: Equipment; before: EquipmentState; after: EquipmentState }[];
  kWhBefore: number;
  kWhAfter: number;
  costBefore: number;
  costAfter: number;
  /** Economia bruta mensal na conta de energia, em reais. */
  monthlySavings: number;
  /** Investimento único na troca de equipamentos. */
  investment: number;
  /** Custo mensal do plano de manutenção. */
  maintenanceMonthlyCost: number;
  /** Economia mensal descontando a manutenção. */
  netMonthlySavings: number;
  /** Meses para recuperar o investimento (null quando não se aplica). */
  paybackMonths: number | null;
}

export function simulate(
  equipment: Equipment[],
  decisions: Decisions,
  tariff: number,
  maintenanceMonthlyCost: number,
): SimulationResult {
  const rows = equipment.map((eq) => ({
    eq,
    before: equipmentState(eq, NO_DECISIONS),
    after: equipmentState(eq, decisions),
  }));
  const kWhBefore = rows.reduce((s, r) => s + r.before.kWh, 0);
  const kWhAfter = rows.reduce((s, r) => s + r.after.kWh, 0);
  const costBefore = cost(kWhBefore, tariff);
  const costAfter = cost(kWhAfter, tariff);
  const monthlySavings = costBefore - costAfter;
  const investment = decisions.efficientEquipment
    ? equipment.reduce((s, e) => s + e.replacementCost * e.quantity, 0)
    : 0;
  const maint = decisions.maintenance ? maintenanceMonthlyCost : 0;
  const netMonthlySavings = monthlySavings - maint;
  const paybackMonths =
    investment > 0 && netMonthlySavings > 0 ? investment / netMonthlySavings : null;

  return {
    rows,
    kWhBefore,
    kWhAfter,
    costBefore,
    costAfter,
    monthlySavings,
    investment,
    maintenanceMonthlyCost: maint,
    netMonthlySavings,
    paybackMonths,
  };
}

export const DEFAULT_TARIFF = 0.92;
export const DEFAULT_MAINTENANCE_COST = 650;

export const DEFAULT_EQUIPMENT: Equipment[] = [
  {
    id: "motor",
    name: "Motor de esteira",
    category: "producao",
    power: 7500,
    efficientPower: 6800,
    efficientModel: "Motor IE3 de alto rendimento",
    replacementCost: 4200,
    quantity: 4,
    hoursPerDay: 16,
    idleHoursPerDay: 3,
    daysPerMonth: 22,
    wear: 0.08,
  },
  {
    id: "compressor",
    name: "Compressor de ar",
    category: "producao",
    power: 11000,
    efficientPower: 9500,
    efficientModel: "Compressor com inversor de frequência",
    replacementCost: 9800,
    quantity: 1,
    hoursPerDay: 16,
    idleHoursPerDay: 4,
    daysPerMonth: 22,
    wear: 0.12,
  },
  {
    id: "forno",
    name: "Forno industrial",
    category: "producao",
    power: 15000,
    efficientPower: 13500,
    efficientModel: "Forno com isolamento e controle eletrônico",
    replacementCost: 18000,
    quantity: 1,
    hoursPerDay: 8,
    idleHoursPerDay: 1.5,
    daysPerMonth: 22,
    wear: 0.1,
  },
  {
    id: "ar",
    name: "Ar-condicionado split",
    category: "climatizacao",
    power: 1800,
    efficientPower: 1150,
    efficientModel: "Split inverter (selo A)",
    replacementCost: 3600,
    quantity: 6,
    hoursPerDay: 10,
    idleHoursPerDay: 2,
    daysPerMonth: 22,
    wear: 0.1,
  },
  {
    id: "luz",
    name: "Lâmpadas do galpão",
    category: "iluminacao",
    power: 40,
    efficientPower: 18,
    efficientModel: "Tubular LED",
    replacementCost: 25,
    quantity: 120,
    hoursPerDay: 14,
    idleHoursPerDay: 3,
    daysPerMonth: 26,
    wear: 0,
  },
  {
    id: "pc",
    name: "Computadores",
    category: "escritorio",
    power: 200,
    efficientPower: 90,
    efficientModel: "Mini PC de baixo consumo",
    replacementCost: 2800,
    quantity: 25,
    hoursPerDay: 10,
    idleHoursPerDay: 3,
    daysPerMonth: 22,
    wear: 0,
  },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  producao: "Produção",
  climatizacao: "Climatização",
  iluminacao: "Iluminação",
  escritorio: "Escritório",
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const num0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const fmtBRL = (v: number) => brl.format(v);
export const fmtNum = (v: number) => num.format(v);
export const fmtInt = (v: number) => num0.format(v);

/* ───────────── Nota de êxito da gestão ───────────── */

/** Pesos (somam 100) de cada critério da nota de gestão. */
export const SCORE_WEIGHTS = { energy: 40, finance: 30, production: 30 } as const;
/** Horizonte para avaliar o retorno financeiro, em meses (5 anos). */
export const SCORE_HORIZON_MONTHS = 60;
/** Perda de trabalho útil que a operação absorve sem prejuízo (folga operacional), em %. */
export const PRODUCTION_SLACK_PERCENT = 10;
const MAX_TIME_CUT = 50;
/** Perda de trabalho útil a partir da qual o setor para de cumprir sua função, em %. */
const MAX_SERVICE_LOSS = 50;

/** Fração dos pontos de operação mantida para uma perda de trabalho útil (em %). */
export function productionKept(lossPercent: number): number {
  const loss = Math.min(Math.max(lossPercent, 0), MAX_SERVICE_LOSS);
  if (loss <= PRODUCTION_SLACK_PERCENT) return 1;
  return 1 - (loss - PRODUCTION_SLACK_PERCENT) / (MAX_SERVICE_LOSS - PRODUCTION_SLACK_PERCENT);
}

/**
 * Trabalho útil mensal (unidades × horas ativas). Horas ociosas não contam, e o planejamento
 * entrega a mesma produção em menos horas, por isso não reduz o trabalho útil.
 */
export function usefulWork(eq: Equipment, d: Decisions): number {
  const timeFactor = 1 - Math.min(Math.max(d.reduceTimePercent, 0), MAX_TIME_CUT) / 100;
  const active = eq.hoursPerDay - Math.min(eq.idleHoursPerDay, eq.hoursPerDay);
  return eq.quantity * active * timeFactor * eq.daysPerMonth;
}

/**
 * Operação preservada (0 a 1): média, por equipamento, do trabalho útil mantido em relação à
 * empresa original. Cada equipamento pesa igual, pois cada setor precisa continuar funcionando.
 */
export function operationKept(baseline: Equipment[], equipment: Equipment[], d: Decisions): number {
  if (baseline.length === 0) return 1;
  const total = baseline.reduce((sum, base) => {
    const eq = equipment.find((e) => e.id === base.id);
    const before = usefulWork(base, NO_DECISIONS);
    if (before <= 0) return sum + 1;
    const ratio = eq ? Math.min(1, usefulWork(eq, d) / before) : 0;
    return sum + productionKept((1 - ratio) * 100);
  }, 0);
  return total / baseline.length;
}

/** Valor financeiro no horizonte: economia líquida acumulada − investimento. */
export function financialValue(r: SimulationResult): number {
  return r.netMonthlySavings * SCORE_HORIZON_MONTHS - r.investment;
}

/** Todas as combinações de decisões que o simulador permite (redução de 5 em 5%). */
export function allDecisionSets(): Decisions[] {
  const out: Decisions[] = [];
  for (let m = 0; m < 16; m++) {
    for (let cut = 0; cut <= MAX_TIME_CUT; cut += 5) {
      out.push({
        efficientEquipment: (m & 1) > 0,
        turnOffIdle: (m & 2) > 0,
        betterPlanning: (m & 4) > 0,
        maintenance: (m & 8) > 0,
        reduceTimePercent: cut,
      });
    }
  }
  return out;
}

export interface ScoreResult {
  /** Êxito da gestão, de 0 a 100 (100 = melhor combinação de decisões na empresa original). */
  percent: number;
  /** Pontos de cada critério (máx. = peso). */
  energy: number;
  finance: number;
  production: number;
  level: "risco" | "regular" | "boa" | "exemplar";
}

export const SCORE_LEVEL_LABEL: Record<ScoreResult["level"], string> = {
  risco: "Gestão em risco",
  regular: "Gestão regular",
  boa: "Boa gestão",
  exemplar: "Gestão exemplar",
};

export function scoreLevel(percent: number): ScoreResult["level"] {
  if (percent >= 90) return "exemplar";
  if (percent >= 70) return "boa";
  if (percent >= 40) return "regular";
  return "risco";
}

interface RawPoints {
  reduction: number;
  value: number;
  production: number;
}

/** Resultado das escolhas (planilha + decisões) comparado com a empresa original sem decisões. */
function rawPoints(
  baseline: Equipment[],
  equipment: Equipment[],
  decisions: Decisions,
  tariff: number,
  maintenanceMonthlyCost: number,
): RawPoints {
  const baseKWh = simulate(baseline, NO_DECISIONS, tariff, 0).kWhBefore;
  const r = simulate(equipment, decisions, tariff, maintenanceMonthlyCost);
  const reduction = baseKWh - r.kWhAfter;
  const netMonthly = cost(reduction, tariff) - r.maintenanceMonthlyCost;
  return {
    reduction,
    value: netMonthly * SCORE_HORIZON_MONTHS - r.investment,
    production: operationKept(baseline, equipment, decisions) * SCORE_WEIGHTS.production,
  };
}

const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));

/**
 * Nota de êxito: 40 pts pela redução de kWh, 30 pelo valor financeiro em 5 anos e 30 pela
 * operação preservada, todos medidos contra a empresa original. Quantidade, horas por dia e
 * decisões contam. A referência (100%) é a melhor combinação de decisões na empresa original.
 */
export function managementScore(
  baseline: Equipment[],
  equipment: Equipment[],
  decisions: Decisions,
  tariff: number,
  maintenanceMonthlyCost: number,
): ScoreResult {
  const refs = allDecisionSets().map((d) => rawPoints(baseline, baseline, d, tariff, maintenanceMonthlyCost));
  const bestReduction = Math.max(0, ...refs.map((p) => p.reduction));
  const bestValue = Math.max(0, ...refs.map((p) => p.value));

  const points = (p: RawPoints) => {
    const energy =
      bestReduction > 0 ? clamp((p.reduction / bestReduction) * SCORE_WEIGHTS.energy, SCORE_WEIGHTS.energy) : 0;
    const finance =
      bestValue > 0 ? clamp((p.value / bestValue) * SCORE_WEIGHTS.finance, SCORE_WEIGHTS.finance) : 0;
    return { energy, finance, production: p.production, total: energy + finance + p.production };
  };

  const best = Math.max(...refs.map((p) => points(p).total));
  const mine = points(rawPoints(baseline, equipment, decisions, tariff, maintenanceMonthlyCost));
  const percent = best > 0 ? clamp((mine.total / best) * 100, 100) : 0;

  return {
    percent,
    energy: mine.energy,
    finance: mine.finance,
    production: mine.production,
    level: scoreLevel(percent),
  };
}
