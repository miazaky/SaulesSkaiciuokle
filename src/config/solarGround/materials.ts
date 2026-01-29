export type MaterialDef = {
  code: string | { from: string };
  name: string;
  length: number | null | { from: string };
  note?: string;
  qty: string; // formula id (registry)
};

export const solarGroundMaterials: MaterialDef[] = [
  { code: { from: "k1Code" }, name: "Priekinė koja", length: { from: "k1Length" }, qty: "legCount" },
  { code: { from: "k2Code" }, name: "Galinė koja", length: { from: "k2Length" }, qty: "legCount" },
  { code: "", name: "Strypai", length: 1200, qty: "strypaiQty" },

  { code: "R-1", name: "Ryšys", length: 3550, qty: "rysys" },
  { code: "R-2", name: "Ryšys", length: 1930, qty: "rysysR2Qty" },

  { code: { from: "gegneCode" }, name: "Gegnė", length: { from: "gegneLength" }, qty: "legCount" },

  { code: "Gb-1", name: "Grebėstas", length: 4200, qty: "grebestasQty" },
  { code: "Gb-1*", name: "Grebėstas", length: { from: "extraGrebestasLength" }, qty: "extraGrebestasQty" },

  { code: "Gbj", name: "Grebėstų jungtys", length: 200, qty: "grebestuJungtysQty" },

  { code: "", name: "Varžto M10 kompl. (1sud.)", length: null, qty: "varztasM10_1" },
  { code: "", name: "Varžto M10 kompl. (2sud.)", length: null, qty: "varztasM10_2" },
  { code: "", name: "Varžto M12 kompl.", length: null, qty: "varztasM12" },

  { code: "Clamp G", name: "Galinių prispaudėjų kompl.", length: null, qty: "clampGQty" },
  { code: "Clamp V", name: "Vidinių prispaudėjų kompl.", length: null, qty: "clampVQty" },
];
