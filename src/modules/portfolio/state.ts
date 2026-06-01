import { createModuleStore } from "../../lib/moduleStore";
import { PORTFOLIO_DEFAULTS, type PortfolioState } from "./types";

export const portfolioStore = createModuleStore<PortfolioState>(
  "portfolio",
  PORTFOLIO_DEFAULTS,
);
