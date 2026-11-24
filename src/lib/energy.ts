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
