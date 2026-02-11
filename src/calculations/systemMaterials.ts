import { CalculatorInput } from "./types";

const MATERIAL_KEYS = {
  squareRail: "materials.squareRail",
  squareRailJoint: "materials.squareRailJoint",
  squareRailFinish: "materials.squareRailFinish",
  m10Screw: "materials.m10Screw",
  m10Nut: "materials.m10Nut",
  studs: "materials.studs",
  clampG: "materials.clampG",
  m8Screw20: "materials.m8Screw20",
  clampV: "materials.clampV",
  m8Screw: "materials.m8Screw",
  m8Nut: "materials.m8Nut",
  railEDPMMini: "materials.railEDPMMini",
  specScrew: "materials.specScrew",
  railEDPM40: "materials.railEDPM40",
  railEDPM80: "materials.railEDPM80",
};

const clampG = 4;

export type SystemMaterialDefinition = {
  code: string | ((input: CalculatorInput) => string);
  name: string;
  length: number | null;
  note?: string;
  systems?: CalculatorInput["system"][];
  orientation?: CalculatorInput["orientation"][];
  construction?: CalculatorInput["moduleConstruction"][];
  mountingMethods?: CalculatorInput["mountingMethod"][];
  materialRowCount?: CalculatorInput["materialRowCount"][];
  calculateQuantity: (input: CalculatorInput) => number;
  calculateLength?: (input: CalculatorInput) => number | null;
};

function isEqual(a: number): boolean {
  if (a % 2 == 0) {
    return true;
  } else {
    return false;
  }
}
// J5 / J6 – Priekinė / Galinė koja
function calculateLegCount(constructionLength: number): number {
  if (constructionLength <= 4300) return 2;
  if (constructionLength <= 7200) return 3;
  if (constructionLength <= 10100) return 4;
  if (constructionLength <= 13000) return 5;
  if (constructionLength <= 15900) return 6;
  if (constructionLength <= 18800) return 7;
  if (constructionLength <= 21700) return 8;
  if (constructionLength <= 24600) return 9;
  if (constructionLength <= 27500) return 10;
  if (constructionLength <= 30400) return 11;
  if (constructionLength <= 32000) return 12;

  throw new Error("Klaida: constructionLength viršija 32000");
}

function calculateSquareRailQuantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  if (orientation === "vertical") {
    return (
      Math.floor(
        (moduleWidth * moduleCount + 100 + (moduleCount - 1) * 20) / 3300,
      ) + 1
    );
  } else {
    return (
      Math.floor(
        (moduleLength * moduleCount + 100 + (moduleCount - 1) * 20) / 3300,
      ) + 1
    );
  }
}

function calculateSquareRailFinishQuantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  const squareRailQty = calculateSquareRailQuantity(
    moduleCount,
    moduleWidth,
    moduleLength,
    orientation,
  );

  return Math.max(0, (Math.floor(squareRailQty / 2) - 1) * 2);
}

function calculateStudsQuantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  if (orientation === "vertical") {
    return (
      2 *
        Math.floor(
          (moduleWidth * moduleCount + 100 + (moduleCount - 1) * 20 - 1) /
            1200 +
            1,
        ) +
      2
    );
  } else {
    return (
      2 *
        Math.floor(
          (moduleLength * moduleCount + 100 + (moduleCount - 1) * 20 - 1) /
            1200 +
            1,
        ) +
      2
    );
  }
}

function calculateM10ScrewQuantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  const squareRailFinishQty = calculateSquareRailFinishQuantity(
    moduleCount,
    moduleWidth,
    moduleLength,
    orientation,
  );
  const studsQty = calculateStudsQuantity(
    moduleCount,
    moduleWidth,
    moduleLength,
    orientation,
  );

  return squareRailFinishQty * 2 + studsQty;
}

function calculateClampVQuantity(moduleCount: number): number {
  return (moduleCount - 1) * 2;
}

function calculateM8NutQuantity(moduleCount: number): number {
  const clampVQty = calculateClampVQuantity(moduleCount);
  return clampVQty + 4;
}

function calculateEPDMMiniQuantity(moduleCount: number): number {
  return (moduleCount + 1) * 2;
}

function calculateEDPM40Quantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  if (orientation === "vertical") {
    return (
      Math.floor(
        (moduleWidth * moduleCount + 100 + (moduleCount - 1) * 20) / 3150,
      ) + 1
    );
  } else {
    return (
      Math.floor(
        (moduleLength * moduleCount + 100 + (moduleCount - 1) * 20) / 3150,
      ) + 1
    );
  }
}

function calculateEDPM80Quantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  if (orientation === "vertical") {
    return (
      Math.floor(
        (moduleWidth * moduleCount + 100 + (moduleCount - 1) * 20) / 3000,
      ) + 1
    );
  } else {
    return (
      Math.floor(
        (moduleLength * moduleCount + 100 + (moduleCount - 1) * 20) / 3000,
      ) + 1
    );
  }
}

function calcaulteSpecScrewQuantity(
  moduleCount: number,
  moduleWidth: number,
  moduleLength: number,
  orientation: string,
): number {
  if (orientation === "vertical") {
    return (
      2 *
        Math.floor(
          (moduleWidth * moduleCount + 100 + (moduleCount - 1) * 20 - 1) / 800 +
            1,
        ) +
      2
    );
  } else {
    return (
      2 *
        Math.floor(
          (moduleLength * moduleCount + 100 + (moduleCount - 1) * 20 - 1) /
            800 +
            1,
        ) +
      2
    );
  }
}

function calculateFrontHolderQuantity(
  moduleCount: number,
  rowsCount: number,
  holderPCount?: number,
): number {
  return isEqual(moduleCount) ? moduleCount + 1 : (holderPCount ?? 0);
}

function calculateBackHolderQuantity(
  moduleCount: number,
  rowsCount: number,
  holderGCount?: number,
): number {
  return isEqual(moduleCount) ? moduleCount + 1 : (holderGCount ?? 0);
}
function calculateMiddleHolderQuantity(
  moduleCount: number,
  rowsCount: number,
  holderVCount?: number,
): number {
  return isEqual(moduleCount)
    ? (moduleCount + 1) * (rowsCount - 1)
    : (holderVCount ?? 0);
}

function calculateHelperFrontHolderQuantity(
  moduleCount: number,
  rowsCount: number,
  moduleLength: number,
): number {
  return isEqual(moduleCount)
    ? moduleLength < 2000
      ? 0
      : moduleCount * rowsCount
    : moduleLength < 2000
      ? 0
      : moduleCount;
}

function calculateWindboardQuantity(
  moduleCount: number,
  rowsCount: number,
): number {
  return isEqual(moduleCount) ? moduleCount * rowsCount : moduleCount;
}

function calculateScrewsForWindboardsQuantity(
  moduleCount: number,
  rowsCount: number,
): number {
  return isEqual(moduleCount)
    ? (moduleCount + 1) * 2 * (rowsCount - 1)
    : moduleCount * 3;
}

function calculateClampBackQuantity(
  moduleCount: number,
  rowsCount: number,
  clampGCount?: number,
): number {
  return isEqual(moduleCount) ? rowsCount * 2 * 2 : (clampGCount ?? 0);
}

function calculateClampInnerQuantity(
  moduleCount: number,
  rowsCount: number,
  clampVCount?: number,
): number {
  return isEqual(moduleCount)
    ? (moduleCount - 1) * (rowsCount * 2)
    : (clampVCount ?? 0);
}

function calculateM8x30ScrewQuantity(
  moduleCount: number,
  rowsCount: number,
  clampGCount?: number,
  clampVCount?: number,
): number {
  return isEqual(moduleCount)
    ? rowsCount * 2 * 2 + (moduleCount - 1) * (rowsCount * 2)
    : (clampGCount ?? 0) + (clampVCount ?? 0);
}

function calculateSingleMountingHolder(
  moduleCount: number,
  rowsCount: number,
  construction: string,
): number {
  if (isEqual(moduleCount) && construction === "ilgoji") {
    return moduleCount * rowsCount * 2;
  } else if(isEqual(moduleCount) && construction === "trumpoji") {
    return (moduleCount + 1) * rowsCount;
  } 
    else if (!isEqual(moduleCount) && construction === "ilgoji") {
    return moduleCount * 2;
  } else {
    return (rowsCount + 1) * moduleCount;
  }
}

function calculatePT15WindboardQuantity(
  moduleCount: number,
  rowsCount: number,
  construction: string,
): number {
  if( isEqual(moduleCount) && construction === "ilgoji") {
   return moduleCount * rowsCount;
  }
  else if(isEqual(moduleCount) && construction === "trumpoji") {
    return moduleCount * rowsCount;
  }
  else if( !isEqual(moduleCount) && construction === "ilgoji") {
    return moduleCount;
  }
  else{
    return moduleCount * rowsCount;
  }
}

function calculatePT15WindboardScrewsQuantity(
    moduleCount: number,
    rowsCount: number,
    construction: string,
): number {
    if( isEqual(moduleCount) && construction === "ilgoji") {
        return moduleCount * rowsCount * 4;
    }
    else if(isEqual(moduleCount) && construction === "trumpoji") {
        return (moduleCount + 1) * 2 * (rowsCount - 1);
    }
    else if( !isEqual(moduleCount) && construction === "ilgoji") {
        return calculatePT15WindboardQuantity(moduleCount, rowsCount, construction) * 4;
    }
    else{
        return calculatePT15WindboardQuantity(moduleCount, rowsCount, construction) * 3;
    }
}

function calculatePT15BackClampQuantity(
    moduleCount: number,
    rowsCount: number,
    construction: string,
    clampGCount?: number,
): number {
    if( isEqual(moduleCount) && construction === "ilgoji") {
        return moduleCount * 2 * (rowsCount * 2);
    }
    else if(isEqual(moduleCount) && construction === "trumpoji") {
       return rowsCount * 2 * 2;
    }
    else if( !isEqual(moduleCount) && construction === "ilgoji") {
        return moduleCount*4;
    }
    else
    {
        return clampGCount ?? 0;
    }
}

function calculatePT15InnerClampQuantity(
    moduleCount: number,
    rowsCount: number,
    construction: string,
    clampVCount?: number,
): number {
    if( isEqual(moduleCount) && construction === "trumpoji") {
        return  (moduleCount - 1) * (rowsCount * 2);
    }
    if(!isEqual(moduleCount) && construction === "trumpoji") {
        return clampVCount ?? 0;
    }
    return 0;
}

function calculatePT15M8x30ScrewQuantity(
    moduleCount: number,
    rowsCount: number,
    construction: string,
    clampGCount?: number,
    clampVCount?: number,
): number {
    if(construction === "ilgoji") {
        return calculatePT15BackClampQuantity(moduleCount, rowsCount, construction, clampGCount);
    }
    else{
        return calculatePT15BackClampQuantity(moduleCount, rowsCount, construction, clampGCount) + calculatePT15InnerClampQuantity(moduleCount, rowsCount, construction, clampVCount);
    }
}

// J8 – Ryšys R-1
function calculateRysys(moduleCount: number): number {
  if (moduleCount <= 32) return 2;
  if (moduleCount <= 36) return 3;
  if (moduleCount <= 54) return 4;

  throw new Error("Klaida: netinkamas modulių kiekis");
}
// J10 – Gegnės kodas
function calculateGegneCode(moduleLength: number): string {
  if (moduleLength <= 1850) return "GG-0";
  if (moduleLength <= 2200) return "GG-1";
  if (moduleLength <= 2400) return "GG-2";

  throw new Error("Klaida: netinkamas modulio ilgis");
}

// J10 – Gegnės ilgis pagal kodą
function calculateGegneLength(moduleLength: number): number | null {
  const code = calculateGegneCode(moduleLength);

  if (code === "GG-0") return 3025;
  if (code === "GG-1") return 3600;
  if (code === "GG-2") return 3750;

  return null; // P16 (empty)
}

// J11 – Grebėstas
function calculateGrebestas(constructionLength: number): number {
  const ratio = constructionLength / 4200;

  if (ratio < 1) return 0;
  if (ratio < 2) return 4;
  if (ratio < 3) return 8;
  if (ratio < 4) return 12;
  if (ratio < 5) return 16;
  if (ratio < 6) return 20;
  if (ratio < 7) return 24;
  if (ratio < 8) return 28;

  throw new Error("Klaida: per didelis konstrukcijos ilgis");
}

// J12 – papildomas grebėstas
function calculateExtraGrebestasQuantity(constructionLength: number): number {
  const j11 = calculateGrebestas(constructionLength);
  return j11 === 0 ? 0 : 4;
}

// J12 – papildomas grebėstas ilgis
function calculateExtraGrebestasLength(constructionLength: number): number {
  const j11 = calculateGrebestas(constructionLength);

  const remainder = constructionLength - (j11 / 4) * 4200;

  if (remainder === 0) return 0;
  if (remainder < 300) return 300;

  return remainder;
}

// J13 – Grebėstų jungtys
function calculateGrebestuJungtys(j11: number, j12: number): number {
  const total = j11 + j12;

  if (total <= 4) return 0;
  if (total <= 8) return 4;
  if (total <= 12) return 8;
  if (total <= 16) return 12;
  if (total <= 20) return 16;
  if (total <= 24) return 20;
  if (total <= 28) return 24;
  if (total <= 32) return 28;

  throw new Error("Klaida: per daug grebėstų");
}

/* ----------------- MATERIAL DEFINITIONS ----------------- */

export const groundSystemMaterials: SystemMaterialDefinition[] = [
  {
    code: "K-1E",
    name: "Priekinė koja",
    length: 1200,
    calculateQuantity: (i) => calculateLegCount(i.constructionLength), // J5
  },
  {
    code: "K-2E",
    name: "Galinė koja",
    length: 2400,
    calculateQuantity: (i) => calculateLegCount(i.constructionLength), // J6 = J5
  },
  {
    code: "",
    name: "Strypai",
    length: 1200,
    calculateQuantity: (i) => {
      const j5 = calculateLegCount(i.constructionLength);
      const j6 = j5;
      return (j5 + j6) * 4; // J7
    },
  },
  {
    code: "R-1",
    name: "Ryšys",
    length: 3550,
    calculateQuantity: (i) => calculateRysys(i.moduleCount), // J8
  },
  {
    code: "R-2",
    name: "Ryšys",
    length: 1930,
    calculateQuantity: (i) => calculateLegCount(i.constructionLength), // J9 = J5
  },
  {
    code: (i) => calculateGegneCode(i.moduleLength), // J10 code
    name: "Gegnė",
    length: null,
    calculateQuantity: (i) => calculateLegCount(i.constructionLength), // J10 quantity = J5
    calculateLength: (i) => calculateGegneLength(i.moduleLength), // J10 length
  },
  {
    code: "Gb-1",
    name: "Grebėstas",
    length: 4200,
    calculateQuantity: (i) => calculateGrebestas(i.constructionLength), // J11
  },
  {
    code: "Gb-1*",
    name: "Grebėstas",
    length: null,
    calculateQuantity: (i) =>
      calculateExtraGrebestasQuantity(i.constructionLength),
    calculateLength: (i) => calculateExtraGrebestasLength(i.constructionLength),
  },
  {
    code: "Gbj",
    name: "Grebėstų jungtys",
    length: 200,
    calculateQuantity: (i) => {
      const j11 = calculateGrebestas(i.constructionLength);
      const j12 = calculateExtraGrebestasQuantity(i.constructionLength);
      return calculateGrebestuJungtys(j11, j12); // J13
    },
  },
  {
    code: "",
    name: "Varžto M10 kompl. (1sud.)",
    length: null,
    calculateQuantity: (i) => {
      const j10 = calculateLegCount(i.constructionLength);
      const j13 = calculateGrebestuJungtys(
        calculateGrebestas(i.constructionLength),
        calculateExtraGrebestasQuantity(i.constructionLength),
      );
      return j10 * 4 + j13 * 4; // J14
    },
  },
  {
    code: "",
    name: "Varžto M10 kompl. (2sud.)",
    length: null,
    calculateQuantity: (i) => calculateRysys(i.moduleCount) * 2, // J15
  },
  {
    code: "",
    name: "Varžto M12 kompl.",
    length: null,
    calculateQuantity: (i) => {
      const j5 = calculateLegCount(i.constructionLength);
      const j9 = j5;
      return j5 * 2 + j9 * 2; // J16
    },
  },
  {
    code: "Clamp G",
    name: "Galinių prispaudėjų kompl.",
    length: null,
    calculateQuantity: () => 8, // J17
  },
  {
    code: "Clamp V",
    name: "Vidinių prispaudėjų kompl.",
    length: null,
    calculateQuantity: (i) => (i.moduleCount - 2) * 2,
  },
];

export const roofSystemMaterials: SystemMaterialDefinition[] = [
  // RV10 / RV10-Z
  {
    systems: ["RV10"],
    code: "RV10-1",
    name: "Priekinis/galinis laikiklis",
    length: null,
    calculateQuantity: (i) => (i.moduleCount + 1) * 2,
  },
  {
    systems: ["RV10"],
    code: "RV10-2",
    name: "Vidurinis (jungiamasis) laikiklis aukštas",
    length: null,
    calculateQuantity: (i) => (i.moduleCount + 1) * (i.rowsCount / 2),
  },
  {
    systems: ["RV10"],
    code: "RV10-4",
    name: "Vidurinis (jungiamasis) laikiklis žemas",
    length: null,
    calculateQuantity: (i) => (i.moduleCount + 1) * (i.rowsCount / 2 - 1),
  },
  {
    systems: ["RV10"],
    code: "RV10-1(P)",
    name: "Pagalbinis priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      i.moduleLength < 2000 ? 0 : i.moduleCount * i.rowsCount,
  },
  {
    systems: ["RV10"],
    code: "RV10-2(P)",
    name: "Pagalbinis vidurinis (jungiamasis) laikiklis aukštas",
    length: null,
    calculateQuantity: (i) =>
      i.moduleLength < 2000 ? 0 : (i.moduleCount * i.rowsCount) / 2,
  },
  {
    systems: ["RV10", "RV10-Z"],
    code: "",
    name: "Prispaudėjas galinis",
    length: null,
    calculateQuantity: (i) => i.rowsCount * 2 * 2,
  },
  {
    systems: ["RV10", "RV10-Z"],
    code: "",
    name: "Prispaudėjas vidinis",
    length: null,
    calculateQuantity: (i) => (i.moduleCount - 1) * (i.rowsCount * 2),
  },
  {
    systems: ["RV10", "RV10-Z"],
    code: "",
    name: "M8x30 varžtas",
    length: null,
    calculateQuantity: (i) =>
      i.rowsCount * 2 * 2 + (i.moduleCount - 1) * (i.rowsCount * 2),
  },
  {
    systems: ["RV10-Z"],
    code: "RV10-Z",
    name: "Dvigubo greito montavimo laikiklis",
    length: null,
    calculateQuantity: (i) => ((i.moduleCount + 1) * i.rowsCount) / 2,
  },

  // PT5
  // PT10
  {
    systems: ["PT10"],
    code: "PT10-1",
    name: "Priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateFrontHolderQuantity(i.moduleCount, i.rowsCount, i.holderPCount),
  },
  {
    systems: ["PT10"],
    code: "PT10-4",
    name: "Galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateBackHolderQuantity(i.moduleCount, i.rowsCount, i.holderGCount),
  },
  {
    systems: ["PT10"],
    code: "PT10-2",
    name: "Vidurinis (jungiamasis) laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateMiddleHolderQuantity(i.moduleCount, i.rowsCount, i.holderVCount),
  },
  {
    systems: ["PT10"],
    code: "PT10-1(P)",
    name: "Pagalbinis priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateHelperFrontHolderQuantity(
        i.moduleCount,
        i.rowsCount,
        i.moduleLength,
      ),
  },
  {
    systems: ["PT10"],
    code: "PT10-4(P)",
    name: "Pagalbinis galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateHelperFrontHolderQuantity(
        i.moduleCount,
        i.rowsCount,
        i.moduleLength,
      ),
  },

  // PT15
  {
    systems: ["PT15"],
    code: "PT15-1",
    name: "Priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateFrontHolderQuantity(i.moduleCount, i.rowsCount, i.holderPCount),
  },
  {
    systems: ["PT15"],
    code: "PT15-3",
    name: "Galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateBackHolderQuantity(i.moduleCount, i.rowsCount, i.holderGCount),
  },
  {
    systems: ["PT15"],
    code: "PT15-4",
    name: "Vidurinis (jungiamasis) laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateMiddleHolderQuantity(i.moduleCount, i.rowsCount, i.holderVCount),
  },
  {
    systems: ["PT15"],
    code: "PT15-1(P)",
    name: "Pagalbinis priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateHelperFrontHolderQuantity(
        i.moduleCount,
        i.rowsCount,
        i.moduleLength,
      ),
  },
  {
    systems: ["PT15"],
    code: "PT15-3(P)",
    name: "Pagalbinis galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateHelperFrontHolderQuantity(
        i.moduleCount,
        i.rowsCount,
        i.moduleLength,
      ),
  },

  // PT20
  {
    systems: ["PT20"],
    code: "PT20-1",
    name: "Priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateFrontHolderQuantity(i.moduleCount, i.rowsCount, i.holderPCount),
  },
  {
    systems: ["PT20"],
    code: "PT20-3",
    name: "Galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateBackHolderQuantity(i.moduleCount, i.rowsCount, i.holderGCount),
  },
  {
    systems: ["PT20"],
    code: "PT20-2",
    name: "Vidurinis (jungiamasis) laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateMiddleHolderQuantity(i.moduleCount, i.rowsCount, i.holderVCount),
  },

  {
    systems: ["PT15-L"],
    construction: ["ilgoji"],
    code: "PT15-L",
    name: "Viengubo montavimo laikiklis",
    length: null,
    calculateQuantity: (i) => calculateSingleMountingHolder(i.moduleCount, i.rowsCount, i.moduleConstruction),
  },
  {
    systems: ["PT15-L"],
    construction: ["ilgoji"],
    code: "",
    name: "Vejalentė",
    length: null,
    calculateQuantity: (i) => calculatePT15WindboardQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction),
  },
  {
    systems: ["PT15-L"],
    construction: ["ilgoji"],
    code: "",
    name: "Savisriegiai varžtai vejalentėm",
    length: null,
    calculateQuantity: (i) => calculatePT15WindboardScrewsQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction),
  },
  {
    systems: ["PT15-L"],
    construction: ["ilgoji"],
    code: "",
    name: "Prispaudėjas galinis",
    length: null,
    calculateQuantity: (i) => calculatePT15BackClampQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction, i.clampGCount),
  },
  {
    systems: ["PT15-L"],
    construction: ["ilgoji"],
    code: "",
    name: "M8x30 varžtas",
    length: null,
    calculateQuantity: (i) => calculatePT15BackClampQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction, i.clampGCount),
  },

  {
    systems: ["PT15-L"],
    construction: ["trumpoji"],
    code: "PT15-L",
    name: "Viengubo montavimo laikiklis",
    length: null,
    calculateQuantity: (i) => calculateSingleMountingHolder(i.moduleCount, i.rowsCount, i.moduleConstruction),
  },
  {
    systems: ["PT15-L"],
    construction: ["trumpoji"],
    code: "",
    name: "Vejalentė",
    length: null,
    calculateQuantity: (i) => calculatePT15WindboardQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction),
  },
  {
    systems: ["PT15-L"],
    construction: ["trumpoji"],
    code: "",
    name: "Savisriegiai varžtai vejalentėm",
    length: null,
    calculateQuantity: (i) => calculatePT15WindboardScrewsQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction),
  },
  {
    systems: ["PT15-L"],
    construction: ["trumpoji"],
    code: "",
    name: "Prispaudėjas galinis",
    length: null,
    calculateQuantity: (i) => calculatePT15BackClampQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction, i.clampGCount),
  },
  {
    systems: ["PT15-L"],
    construction: ["trumpoji"],
    code: "",
    name: "Prispaudėjas vidinis",
    length: null,
    calculateQuantity: (i) => calculatePT15InnerClampQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction, i.clampVCount),
  },
  {
    systems: ["PT15-L"],
    construction: ["trumpoji"],
    code: "",
    name: "M8x30 varžtas",
    length: null,
    calculateQuantity: (i) =>
     calculatePT15M8x30ScrewQuantity(i.moduleCount, i.rowsCount, i.moduleConstruction, i.clampGCount, i.clampVCount),
  },
  {
    systems: ["PT5"],
    code: "PT5-1",
    name: "Priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateFrontHolderQuantity(i.moduleCount, i.rowsCount, i.holderPCount),
  },
  {
    systems: ["PT5"],
    code: "PT5-3",
    name: "Galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateBackHolderQuantity(i.moduleCount, i.rowsCount, i.holderGCount),
  },
  {
    systems: ["PT5"],
    code: "PT5-2",
    name: "Vidurinis (jungiamasis) laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateMiddleHolderQuantity(i.moduleCount, i.rowsCount, i.holderVCount),
  },
  {
    systems: ["PT5", "PT20"],
    code: "Užsakyti individualiai",
    name: "Pagalbinis priekinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateHelperFrontHolderQuantity(
        i.moduleCount,
        i.rowsCount,
        i.moduleLength,
      ),
  },
  {
    systems: ["PT5", "PT20"],
    code: "Užsakyti individualiai",
    name: "Pagalbinis galinis laikiklis",
    length: null,
    calculateQuantity: (i) =>
      calculateHelperFrontHolderQuantity(
        i.moduleCount,
        i.rowsCount,
        i.moduleLength,
      ),
  },
  {
    systems: ["PT5", "PT10", "PT15", "PT20"],
    code: "",
    name: "Vejalentė",
    length: null,
    calculateQuantity: (i) =>
      calculateWindboardQuantity(i.moduleCount, i.rowsCount),
  },
  {
    systems: ["PT5", "PT10", "PT15", "PT20"],
    code: "",
    name: "Savisriegiai varžtai vejalentėm",
    length: null,
    calculateQuantity: (i) =>
      calculateScrewsForWindboardsQuantity(i.moduleCount, i.rowsCount),
  },
  {
    systems: ["PT5", "PT10", "PT15", "PT20"],
    code: "",
    name: "Prispaudėjas galinis",
    length: null,
    calculateQuantity: (i) =>
      calculateClampBackQuantity(i.moduleCount, i.rowsCount, i.clampGCount),
  },
  {
    systems: ["PT5", "PT10", "PT15", "PT20"],
    code: "",
    name: "Prispaudėjas vidinis",
    length: null,
    calculateQuantity: (i) =>
      calculateClampInnerQuantity(i.moduleCount, i.rowsCount, i.clampVCount),
  },
  {
    systems: ["PT5", "PT10", "PT15", "PT20"],
    code: "",
    name: "M8x30 varžtas",
    length: null,
    calculateQuantity: (i) =>
      calculateM8x30ScrewQuantity(
        i.moduleCount,
        i.rowsCount,
        i.clampGCount,
        i.clampVCount,
      ),
  },

  /* ----------------- Slaitinis stogas MATERIALS ----------------- */
  {
    mountingMethods: ["studs", "clamps", "hooks"],
    code: "",
    name: MATERIAL_KEYS.squareRail,
    length: null,
    calculateQuantity: (i) =>
      calculateSquareRailQuantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["studs", "clamps", "hooks"],
    code: "",
    name: MATERIAL_KEYS.squareRailJoint,
    length: null,
    calculateQuantity: (i) =>
      calculateSquareRailFinishQuantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["studs", "clamps", "hooks"],
    code: "",
    name: MATERIAL_KEYS.squareRailFinish,
    length: null,
    calculateQuantity: () => 4,
  },
  {
    mountingMethods: ["studs", "clamps", "hooks"],
    code: "",
    name: MATERIAL_KEYS.m10Screw,
    length: null,
    calculateQuantity: (i) =>
      calculateM10ScrewQuantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["studs", "clamps", "hooks"],
    code: "",
    name: MATERIAL_KEYS.m10Nut,
    length: null,
    calculateQuantity: (i) =>
      calculateM10ScrewQuantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["studs", "clamps", "hooks"],
    code: "",
    name: MATERIAL_KEYS.studs,
    length: null,
    calculateQuantity: (i) =>
      calculateStudsQuantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["screwsR"],
    code: "",
    name: MATERIAL_KEYS.railEDPMMini,
    length: null,
    calculateQuantity: (i) => calculateEPDMMiniQuantity(i.moduleCount),
  },
  {
    mountingMethods: ["screwsR"],
    code: "",
    name: MATERIAL_KEYS.specScrew,
    length: null,
    calculateQuantity: (i) => calculateEPDMMiniQuantity(i.moduleCount) * 4,
  },
  {
    mountingMethods: ["screwsEPDM40"],
    code: "",
    name: MATERIAL_KEYS.railEDPM40,
    length: null,
    calculateQuantity: (i) =>
      calculateEDPM40Quantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["screwsEPDM80"],
    code: "",
    name: MATERIAL_KEYS.railEDPM80,
    length: null,
    calculateQuantity: (i) =>
      calculateEDPM80Quantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: ["screwsEPDM40", "screwsEPDM80"],
    code: "",
    name: MATERIAL_KEYS.specScrew,
    length: null,
    calculateQuantity: (i) =>
      calcaulteSpecScrewQuantity(
        i.moduleCount,
        i.moduleWidth,
        i.moduleLength,
        i.orientation,
      ),
  },
  {
    mountingMethods: [
      "studs",
      "clamps",
      "hooks",
      "screwsR",
      "screwsEPDM40",
      "screwsEPDM80",
    ],
    code: "",
    name: MATERIAL_KEYS.clampG,
    length: null,
    calculateQuantity: () => clampG,
  },
  {
    mountingMethods: [
      "studs",
      "clamps",
      "hooks",
      "screwsR",
      "screwsEPDM40",
      "screwsEPDM80",
    ],
    code: "",
    name: MATERIAL_KEYS.m8Screw20,
    length: null,
    calculateQuantity: () => clampG,
  },
  {
    mountingMethods: [
      "studs",
      "clamps",
      "hooks",
      "screwsR",
      "screwsEPDM40",
      "screwsEPDM80",
    ],
    code: "",
    name: MATERIAL_KEYS.clampV,
    length: null,
    calculateQuantity: (i) => calculateClampVQuantity(i.moduleCount),
  },
  {
    mountingMethods: [
      "studs",
      "clamps",
      "hooks",
      "screwsR",
      "screwsEPDM40",
      "screwsEPDM80",
    ],
    code: "",
    name: MATERIAL_KEYS.m8Screw,
    length: null,
    calculateQuantity: (i) => calculateClampVQuantity(i.moduleCount),
  },
  {
    mountingMethods: [
      "studs",
      "clamps",
      "hooks",
      "screwsR",
      "screwsEPDM40",
      "screwsEPDM80",
    ],
    code: "",
    name: MATERIAL_KEYS.m8Nut,
    length: null,
    calculateQuantity: (i) => calculateM8NutQuantity(i.moduleCount),
  },
];
