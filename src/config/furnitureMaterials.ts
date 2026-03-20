export type FurnitureMaterialDef = {
  name: string;
  qty: string; // formula id (furnitureRegistry)
  note?: string;
};

// Furnitūros medžiagos — individual bolts/washers/nuts that make up the kits.
// SKU codes from Excel data are noted in comments.
export const solarGroundFurnitureMaterials: FurnitureMaterialDef[] = [
  // ── M8 hardware ────────────────────────────────────────────────────────────
  { name: "M8 varžtas cilindrine galvute 40 (M8-40)",     qty: "furn_m8_bolt"           }, // SKU M8-40
  { name: "M8 spyruoklinė poveržlė (M8-spp)",             qty: "furn_m8_spring_washer"  }, // SKU M8-spp

  // ── Clamp hardware ─────────────────────────────────────────────────────────
  { name: "Prispaudėjas galinis (Clamp G35)",              qty: "furn_end_clamp"         }, // SKU Clamp G35
  { name: "Prispaudėjas vidinis (Clamp V)",                qty: "furn_mid_clamp"         }, // SKU Clamp V

  // ── Aluminium plate + rhombic nut set ──────────────────────────────────────
  { name: "Aliuminio plokštelė 60×60 (PL60x60)",          qty: "furn_alu_plate"         }, // SKU PL60x60
  { name: "Rombinės veržlės fiksatorius (Rfix)",           qty: "furn_rhombic_lock"      }, // SKU Rfix
  { name: "Rombinė veržlė 18×37 (Romb 18x37)",            qty: "furn_rhombic_nut"       }, // SKU Romb 18x37

  // ── M10 hardware ───────────────────────────────────────────────────────────
  { name: "M10 varžtas cilindrine galvute 30 (M10-30)",   qty: "furn_m10_bolt"          }, // SKU M10-30
  { name: "M10 poveržlės (M10-pov)",                      qty: "furn_m10_washer"        }, // SKU M10-pov
  { name: "M10 veržlė su sijonėliu (M10-VS)",             qty: "furn_m10_flange_nut"    }, // SKU M10-VS

  // ── M12 hardware ───────────────────────────────────────────────────────────
  { name: "M12 varžtas 30 (M12-30)",                      qty: "furn_m12_bolt"          }, // SKU M12-30
  { name: "M12 poveržlė (M12-pov)",                       qty: "furn_m12_washer"        }, // SKU M12-pov
  { name: "M12 spyruoklinė poveržlė (M12-spp)",           qty: "furn_m12_spring_washer" }, // SKU M12-spp
  { name: "M12 veržlė (M12-Ve)",                          qty: "furn_m12_nut"           }, // SKU M12-Ve
];
