export type CalculatorInput = {
  batteryType: "ezys" | "poline" | "ploksciasStogas";
  moduleCount: number;
  moduleLength: number;
  moduleWidth: number;
  moduleThickness: number;
  constructionLength: number;
  rowsCount: number;
  reserve: number;
  clampGap: number;
  orientation: "PT" | "RV";
  system: "PT5" | "PT10" | "PT15" | "PT20" | "PT15-L" | "RV10" | "RV10-Z";
  moduleColor: string;
  moduleConstruction: string;
  gapBetweenRows: number;
};
