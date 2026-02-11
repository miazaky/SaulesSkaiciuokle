export type FurnitureMaterialDef = {
  name: string;
  qty: string; // formula id (registry)
  note?: string;
};

export const solarGroundFurnitureMaterials: FurnitureMaterialDef[] = [
  { name: "M8 varžtas", qty: "furn_m8_bolt" },
  { name: "M8 spyruoklinė poveržlė", qty: "furn_m8_spring_washer" },

  { name: "Prispaudėjas galinis", qty: "furn_end_clamp" },
  { name: "Prispaudėjas vidinis", qty: "furn_mid_clamp" },

  { name: "Aliuminio plokštelė", qty: "furn_alu_plate" },
  { name: "Rombinės veržlės fiksatorius", qty: "furn_rhombic_lock" },
  { name: "Rombinė veržlė", qty: "furn_rhombic_nut" },

  { name: "M10 varžtas", qty: "furn_m10_bolt" },
  { name: "M10 poveržlės", qty: "furn_m10_washer" },
  { name: "M10 veržlė su sijonėliu", qty: "furn_m10_flange_nut" },

  { name: "M12 varžtas", qty: "furn_m12_bolt" },
  { name: "M12 poveržlė", qty: "furn_m12_washer" },
  { name: "M12 spyruoklinė poveržlė", qty: "furn_m12_spring_washer" },
  { name: "M12 veržlė", qty: "furn_m12_nut" },
];
