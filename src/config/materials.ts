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

  // Gb-1: standard profileLength pieces
  { code: "Gb-1",             name: "Grebėstas",                  length: { from: "profileLength" },       qty: "grebestasQty"      },

  // Gb-2: legacy 1303 row; current Excel templates keep 5200mm profiles under Gb-1
  { code: "Gb-2",             name: "Grebėstas",                  length: 5200,                            qty: "gb2Qty"            },

  // Gb-1*: remainder piece
  { code: "Gb-1*",            name: "Grebėstas",                  length: { from: "extraGrebestasLength" },qty: "extraGrebestasQty" },

  // Gb-2*: legacy 1303 remainder row; currently disabled by formulaRegistry
  { code: "Gb-2*",            name: "Grebėstas",                  length: { from: "gb2ExtraLength" },      qty: "gb2ExtraQty"       },

  // Grebėstų jungtys — SKU Gbj, 200 mm
  { code: "Gbj",              name: "Grebėstų jungtys",           length: 200,                             qty: "grebestuJungtysQty" },


];
