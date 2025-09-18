import { createContext } from "react";
import type { ChartContextType } from "./chartTypes";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);
