import { CalculatorInput } from "./types";

export type SystemMaterialDefinition = {
  code: string | ((input: CalculatorInput) => string);
  name: string;
  length: number | null;
  note?: string;
  calculateQuantity: (input: CalculatorInput) => number;
  calculateLength?: (input: CalculatorInput) => number | null;
};

// J5 / J6 – Priekinė / Galinė koja
function calculateLegCount(constructionLength: number): number {
      console.log("constructionLength(mm) =", constructionLength);

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
function calculateExtraGrebestasQuantity(
  constructionLength: number
): number {
  const j11 = calculateGrebestas(constructionLength);
  return j11 === 0 ? 0 : 4;
}

// J12 – papildomas grebėstas ilgis
function calculateExtraGrebestasLength(
  constructionLength: number
): number {
  const j11 = calculateGrebestas(constructionLength);

  const remainder =
    constructionLength - (j11 / 4) * 4200;

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
    calculateQuantity: (i) =>
      calculateLegCount(i.constructionLength), // J5
  },
  {
    code: "K-2E",
    name: "Galinė koja",
    length: 2400,
    calculateQuantity: (i) =>
      calculateLegCount(i.constructionLength), // J6 = J5
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
    calculateQuantity: (i) =>
      calculateRysys(i.moduleCount), // J8
  },
  {
    code: "R-2",
    name: "Ryšys",
    length: 1930,
    calculateQuantity: (i) =>
      calculateLegCount(i.constructionLength), // J9 = J5
  },
  {
    code: (i) => calculateGegneCode(i.moduleLength), // J10 code
    name: "Gegnė",
    length: null,
    calculateQuantity: (i) =>
      calculateLegCount(i.constructionLength), // J10 quantity = J5
    calculateLength: (i) =>
      calculateGegneLength(i.moduleLength), // J10 length
  },
  {
    code: "Gb-1",
    name: "Grebėstas",
    length: 4200,
    calculateQuantity: (i) =>
      calculateGrebestas(i.constructionLength), // J11
  },
  {
    code: "Gb-1*",
    name: "Grebėstas",
    length: null,
    calculateQuantity: (i) =>
      calculateExtraGrebestasQuantity(i.constructionLength),
    calculateLength: (i) =>
      calculateExtraGrebestasLength(i.constructionLength),
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
        calculateExtraGrebestasQuantity(i.constructionLength)
      );
      return j10 * 4 + j13 * 4; // J14
    },
  },
  {
    code: "",
    name: "Varžto M10 kompl. (2sud.)",
    length: null,
    calculateQuantity: (i) =>
      calculateRysys(i.moduleCount) * 2, // J15
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
    code: "RV10-1",
    name: "Priekinis/galinis laikiklis",
    length: null,
    calculateQuantity: (i) => (i.moduleCount + 1) * 2, // J30
  },
  {
    code: "RV10-2",
    name: "Vidurinis (jungiamasis) laikiklis aukštas",
    length: null,
    calculateQuantity: (i) => (i.moduleCount + 1) * (i.rowsCount/2), // J31
  },
  {
    code: "RV10-4",
    name: "Vidurinis (jungiamasis) laikiklis žemas",
    length: null,
    calculateQuantity: (i) => (i.moduleCount + 1) * ((i.rowsCount/2)-1), // J32
  },
  {
    code: "RV10-1(P)",
    name: "Pagalbinis priekinis laikiklis",
    length: null,
    calculateQuantity: (i) => (i.moduleLength < 2000 ? 0 : i.moduleCount*i.rowsCount), // J33
  },
  {
    code: "RV10-2(P)",
    name: "Pagalbinis vidurinis (jungiamasis) laikiklis aukštas",
    length: null,
    calculateQuantity: (i) => (i.moduleLength < 2000 ? 0 : i.moduleCount*i.rowsCount/2), // J34
  },
  {
    code: "",
    name: "Prispaudėjas galinis",
    length: null,
    calculateQuantity: (i) => (i.rowsCount * 2) * 2, // J35
  },
  {
    code: "",
    name: "Prispaudėjas vidinis",
    length: null,
    calculateQuantity: (i) => (i.moduleCount - 1) * (i.rowsCount * 2), // J36
  },
  {
    code: "",
    name: "M8x30 varžtas",
    length: null,
    calculateQuantity: (i) => ((i.rowsCount * 2) * 2)+((i.moduleCount - 1) * (i.rowsCount * 2)), // J37
  }
];
