export type MaterialDef = {
  code: string | { from: string };
  name: string;
  length: number | null | { from: string };
  note?: string;
  qty: string; // formula id (registry)
};

// ─── ŽEMĖS SISTEMA (Ežys + Polinė) ───────────────────────────────────────────
// Codes resolved dynamically via formulaRegistry:
//   k1Code  →  "K-1E" (ežys)  |  "K-1"  (polinė)
//   k2Code  →  "K-2E" (ežys)  |  "K-2"  (polinė)
//   k1Length → 1200 (ežys)    |  2700   (polinė)
//   k2Length → 2400 (ežys)    |  3900   (polinė)

export const solarGroundMaterials: MaterialDef[] = [
  { code: { from: "k1Code" }, name: "Priekinė koja",             length: { from: "k1Length" },            qty: "legCount" },
  { code: { from: "k2Code" }, name: "Galinė koja",               length: { from: "k2Length" },            qty: "legCount" },

  // Strypai — SKU STR1200 — qty=0 for polinė (registry handles it)
  { code: "STR1200",          name: "Strypai",                    length: 1200,                            qty: "strypaiQty" },

  // Ryšys
  { code: "R-1",              name: "Ryšys",                      length: 3550,                            qty: "rysys"        },
  { code: "R-2",              name: "Ryšys",                      length: 1930,                            qty: "rysysR2Qty"   },

  // Gegnė — code = GG-0 / GG-1 / GG-2 resolved dynamically
  { code: { from: "gegneCode" }, name: "Gegnė",                  length: { from: "gegneLength" },         qty: "legCount" },

  // Grebėstas — standard pieces (length = profileLength 4200 or 5200)
  { code: "Gb-1",             name: "Grebėstas",                  length: { from: "profileLength" },       qty: "grebestasQty"      },
  // Grebėstas — extra/remainder piece
  { code: "Gb-1*",            name: "Grebėstas",                  length: { from: "extraGrebestasLength" },qty: "extraGrebestasQty" },

  // Grebėstų jungtys — SKU Gbj, 200 mm
  { code: "Gbj",              name: "Grebėstų jungtys",           length: 200,                             qty: "grebestuJungtysQty" },

  // M10 bolt kits
  { code: "M10-30/M10-pov/M10-VS", name: "Varžto M10 kompl. (1sud.)", length: null,                      qty: "varztasM10_1" },
  { code: "M10-30/M10-pov/M10-VS", name: "Varžto M10 kompl. (2sud.)", length: null,                      qty: "varztasM10_2" },

  // M12 bolt kit
  { code: "M12-30/M12-pov/M12-spp/M12-Ve", name: "Varžto M12 kompl.", length: null,                      qty: "varztasM12" },

  // Clamps
  { code: { from: "clampGCode" }, name: "Galinių prispaudėjų kompl.", length: null,                       qty: "clampGQty" },
  { code: { from: "clampVCode" }, name: "Vidinių prispaudėjų kompl.", length: null,                          qty: "clampVQty" },
];
