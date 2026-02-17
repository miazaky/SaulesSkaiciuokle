export type CalculatorInput = {
  batteryType: "ezys" | "poline" | "ploksciasStogas" | "slaitinisStogas";
  moduleCount: number;
  moduleLength: number;
  moduleWidth: number;
  moduleThickness: number;
  constructionLength: number;
  rowsCount: number;
  reserve: number;
  clampGap: number;
  orientation: "PT" | "RV" | "vertical" | "horizontal";
  system: "PT5" | "PT10" | "PT15" | "PT20" | "PT15-L" | "RV10" | "RV10-Z";
  moduleColor: string;
  moduleConstruction: string;
  gapBetweenRows: number;
  roofMaterial: "cement" | "valcuota" | "cerpiu" | "bitumine" | "skarda";
  mountingMethod:
    | "studs"
    | "clamps"
    | "hooks"
    | "screwsR"
    | "screwsEPDM40"
    | "screwsEPDM80";
  materialRowCount: number;
  rowModuleCounts?: number[];
  clampGCount?: number;
  clampVCount?: number;
  holderGCount?: number;
  holderVCount?: number;
  holderPCount?: number;
  holderVACount?: number;
  holderVZCount?: number;
};
