export type CalculatorInput = {
  batteryType: "ezys" | "poline";
  moduleCount: number;
  moduleLength: number;
  moduleWidth: number;
  moduleThickness: number;
  constructionLength: number;
  rowsCount: number;
  reserve: number;
  clampGap: number;
};


type SummaryState = {
  batteryType: BatteryType;
  moduleCount: number;
  moduleLength: number;
  moduleWidth: number;
  moduleThickness: number;
  constructionLength: number;
  rowsCount: number;
  reserve: number;
  gap: number;
};
