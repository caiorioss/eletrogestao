import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center align-middle leading-none">
      <span className="px-1 pb-1">{num}</span>
      <span className="w-full border-t-2 border-current" />
      <span className="px-1 pt-1">{den}</span>
    </span>
  );
}

export function Var({ children }: { children: ReactNode }) {
  return <i className="font-serif">{children}</i>;
}

export function EnergyFormula({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-serif", className)}>
      <Var>E</Var> =
      <Frac
        num={
          <>
            <Var>P</Var> × <Var>t</Var>
          </>
        }
        den="1000"
      />
    </span>
  );
}

export function CostFormula({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2 font-serif", className)}>
      Custo = Consumo (kWh) × Tarifa
    </span>
  );
}
