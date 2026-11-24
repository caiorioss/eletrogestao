import { describe, expect, it } from "vitest";

import {
  DEFAULT_EQUIPMENT,
  DEFAULT_MAINTENANCE_COST,
  DEFAULT_TARIFF,
  NO_DECISIONS,
  cost,
  financialValue,
  managementScore,
  productionKept,
  scoreLevel,
  energyKWh,
  equipmentState,
  simulate,
  type Equipment,
} from "./energy";

const machine: Equipment = {
  id: "m",
  name: "Máquina",
  category: "producao",
  power: 1000,
  efficientPower: 800,
  efficientModel: "Eficiente",
  replacementCost: 500,
  quantity: 2,
  hoursPerDay: 10,
  idleHoursPerDay: 2,
  daysPerMonth: 20,
  wear: 0.1,
};

describe("fórmulas", () => {
  it("E = P × t / 1000: 1000 W por 5 h consome 5 kWh", () => {
    expect(energyKWh(1000, 5)).toBe(5);
  });

  it("Custo = kWh × tarifa: 100 kWh a R$ 0,92 custa R$ 92", () => {
    expect(cost(100, 0.92)).toBeCloseTo(92);
  });
});

describe("decisões", () => {
  it("antes: inclui perda por desgaste e horas ociosas", () => {
    // 1100 W × 200 h / 1000 × 2 unidades = 440 kWh
    expect(equipmentState(machine, NO_DECISIONS).kWh).toBeCloseTo(440);
  });

  it("desligar máquinas ociosas remove as horas ociosas", () => {
    const s = equipmentState(machine, { ...NO_DECISIONS, turnOffIdle: true });
    expect(s.hoursPerMonth).toBe(160);
  });

  it("modelo eficiente + manutenção usa a potência eficiente sem desgaste", () => {
    const s = equipmentState(machine, {
      ...NO_DECISIONS,
      efficientEquipment: true,
      maintenance: true,
    });
    expect(s.power).toBe(800);
  });

  it("reduzir 20% do tempo corta 20% das horas", () => {
    const s = equipmentState(machine, { ...NO_DECISIONS, reduceTimePercent: 20 });
    expect(s.hoursPerMonth).toBeCloseTo(160);
  });

  it("planejamento corta 10% das horas ativas apenas na produção", () => {
    const prod = equipmentState(machine, { ...NO_DECISIONS, betterPlanning: true });
    expect(prod.hoursPerMonth).toBeCloseTo((8 * 0.9 + 2) * 20);
    const office = equipmentState(
      { ...machine, category: "escritorio" },
      { ...NO_DECISIONS, betterPlanning: true },
    );
    expect(office.hoursPerMonth).toBe(200);
  });

  it("payback = investimento ÷ economia líquida mensal", () => {
    const r = simulate([machine], { ...NO_DECISIONS, efficientEquipment: true }, 1, 0);
    expect(r.investment).toBe(1000);
    // antes 440 kWh; depois 880 W × 200 h × 2 / 1000 = 352 kWh → economia R$ 88
    expect(r.monthlySavings).toBeCloseTo(88);
    expect(r.paybackMonths).toBeCloseTo(1000 / 88);
  });
});

describe("nota de êxito da gestão", () => {
  const all = {
    efficientEquipment: true,
    turnOffIdle: true,
    betterPlanning: true,
    maintenance: true,
  };

  it("sem nenhuma decisão a empresa fica em 'gestão em risco'", () => {
    const s = managementScore(DEFAULT_EQUIPMENT, DEFAULT_EQUIPMENT, NO_DECISIONS, DEFAULT_TARIFF, DEFAULT_MAINTENANCE_COST);
    expect(s.energy).toBe(0);
    expect(s.level).toBe("risco");
  });

  it("todas as decisões com 10% de corte de horas valem 100%", () => {
    const s = managementScore(
      DEFAULT_EQUIPMENT,
      DEFAULT_EQUIPMENT,
      { ...all, reduceTimePercent: 10 },
      DEFAULT_TARIFF,
      DEFAULT_MAINTENANCE_COST,
    );
    expect(s.percent).toBeCloseTo(100);
    expect(s.level).toBe("exemplar");
  });

  it("cortar 50% das horas zera os pontos de produção e derruba a nota", () => {
    const s = managementScore(
      DEFAULT_EQUIPMENT,
      DEFAULT_EQUIPMENT,
      { ...all, reduceTimePercent: 50 },
      DEFAULT_TARIFF,
      DEFAULT_MAINTENANCE_COST,
    );
    expect(s.production).toBe(0);
    expect(s.percent).toBeLessThan(100);
  });

  it("até 10% de corte a produção é preservada; 30% preserva metade", () => {
    expect(productionKept(10)).toBe(1);
    expect(productionKept(30)).toBeCloseTo(0.5);
  });

  it("valor financeiro = economia líquida × 60 meses − investimento", () => {
    const r = simulate([machine], { ...NO_DECISIONS, efficientEquipment: true }, 1, 0);
    expect(financialValue(r)).toBeCloseTo(88 * 60 - 1000);
  });

  it("trocar quantidade e horas por dia muda a nota", () => {
    const base = managementScore(DEFAULT_EQUIPMENT, DEFAULT_EQUIPMENT, NO_DECISIONS, DEFAULT_TARIFF, DEFAULT_MAINTENANCE_COST);
    const fewerLights = DEFAULT_EQUIPMENT.map((e) => (e.id === "luz" ? { ...e, quantity: 110 } : e));
    const s = managementScore(DEFAULT_EQUIPMENT, fewerLights, NO_DECISIONS, DEFAULT_TARIFF, DEFAULT_MAINTENANCE_COST);
    expect(s.energy).toBeGreaterThan(0);
    expect(s.percent).toBeGreaterThan(base.percent);
  });

  it("desligar todos os computadores economiza energia mas piora a nota", () => {
    const d = { ...all, reduceTimePercent: 10 };
    const best = managementScore(DEFAULT_EQUIPMENT, DEFAULT_EQUIPMENT, d, DEFAULT_TARIFF, DEFAULT_MAINTENANCE_COST);
    const noPcs = DEFAULT_EQUIPMENT.map((e) => (e.id === "pc" ? { ...e, quantity: 0 } : e));
    const s = managementScore(DEFAULT_EQUIPMENT, noPcs, d, DEFAULT_TARIFF, DEFAULT_MAINTENANCE_COST);
    expect(s.percent).toBeLessThan(best.percent);
  });

  it("aumentar a quantidade de máquinas acima da original aumenta o consumo e não soma operação", () => {
    const more = DEFAULT_EQUIPMENT.map((e) => (e.id === "ar" ? { ...e, quantity: 12 } : e));
    const s = managementScore(DEFAULT_EQUIPMENT, more, NO_DECISIONS, DEFAULT_TARIFF, DEFAULT_MAINTENANCE_COST);
    expect(s.energy).toBe(0);
    expect(s.production).toBe(30);
  });

  it("faixas: 90% exemplar, 70% boa, 40% regular, abaixo disso risco", () => {
    expect(scoreLevel(90)).toBe("exemplar");
    expect(scoreLevel(70)).toBe("boa");
    expect(scoreLevel(40)).toBe("regular");
    expect(scoreLevel(39.9)).toBe("risco");
  });
});
