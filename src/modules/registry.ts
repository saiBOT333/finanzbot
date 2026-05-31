import type { ComponentType } from "react";
import { pensionModule, PensionWizard, pensionStore } from "./pension";
import { portfolioModule, PortfolioWizard, portfolioStore } from "./portfolio";
import type { ModuleStore } from "../lib/moduleStore";

export type ModuleEntry = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  Component: ComponentType;
  /** Persistent module-local store, used for export/import. */
  store: ModuleStore<object>;
};

export const modules: ModuleEntry[] = [
  {
    ...pensionModule,
    Component: PensionWizard,
    store: pensionStore as unknown as ModuleStore<object>,
  },
  {
    ...portfolioModule,
    Component: PortfolioWizard,
    store: portfolioStore as unknown as ModuleStore<object>,
  },
];

export function findModule(id: string): ModuleEntry | undefined {
  return modules.find((m) => m.id === id);
}
