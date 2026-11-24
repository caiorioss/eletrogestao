import { describe, expect, it } from "vitest";

import {
  NO_DECISIONS,
  cost,
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
