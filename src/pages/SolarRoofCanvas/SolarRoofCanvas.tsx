import { useState, useRef, useEffect } from "react";
import "./SolarRoofCanvas.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalculatorInput } from "../../calculations/types";

type Module = {
  id: number;
  row: number;
  col: number;
};

const CELL_SIZE = 70;
//1 jeigu moduliai prie pat, 2 jeigu norim matyt laikiklius(reikia atkomentuot)
const STEP = 1;
const ROW_OFFSET = 0;

export default function SolarRoofCanvas() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };
  let grid_cols = 14;

  const [modules, setModules] = useState<Module[]>(() => {
    const initial: Module[] = [];
    const spacing = 1;

    if (state.orientation === "RV" && state.rowsCount > 0) {
      const rows = state.rowsCount;
      const total = state.moduleCount;
      const pairCount = Math.floor(total / 2);
      const basePairsPerRow = Math.floor(pairCount / rows);
      const extraPairs = pairCount % rows;

      const rowCounts = Array(rows).fill(basePairsPerRow * 2);
      for (let r = 0; r < extraPairs; r++) {
        rowCounts[r] += 2;
      }

      if (total % 2 === 1) {
        const oddRow = extraPairs < rows ? extraPairs : 0;
        rowCounts[oddRow] += 1;
      }

      let id = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < rowCounts[row]; col++) {
          initial.push({ id, row: row * spacing, col: col * spacing });
          id++;
        }
      }
    } else {
      for (let i = 0; i < state.moduleCount; i++) {
        const row = i % state.rowsCount;
        const col = Math.floor(i / state.rowsCount);
        initial.push({ id: i, row: row * spacing, col: col * spacing });
      }
    }

    return initial;
  });

  // Create pairing once for RV
  const pairMapRef = useRef<Map<number, number> | null>(null);
  if (pairMapRef.current === null) {
    const map = new Map<number, number>();

    if (state.orientation === "RV") {
      const byRow = new Map<number, Module[]>();
      modules.forEach((m) => {
        const list = byRow.get(m.row) ?? [];
        list.push(m);
        byRow.set(m.row, list);
      });

      byRow.forEach((list) => {
        list.sort((a, b) => a.col - b.col);
        for (let i = 0; i < list.length - 1; i += 2) {
          const a = list[i];
          const b = list[i + 1];
          if (Math.abs(a.col - b.col) === STEP) {
            map.set(a.id, b.id);
            map.set(b.id, a.id);
          }
        }
      });
    }

    pairMapRef.current = map;
  }

  const [draggingModule, setDraggingModule] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  //padidinam gridRows(*2) jei su laikikliais
  const maxCol = Math.max(0, ...modules.map((m) => m.col));
  const gridCols = Math.max(grid_cols, maxCol + ROW_OFFSET + 3);
  const maxRow = Math.max(0, ...modules.map((m) => m.row));
  const gridRowsMax = Math.max(
    state.rowsCount + ROW_OFFSET,
    maxRow + ROW_OFFSET + 3,
  );

  const minCol = Math.min(...modules.map((m) => m.col));
  const firstColumnClampCol = minCol - 0.5;

  const isFirstColumnClamp = (clamp: { side: "left" | "right"; col: number }) =>
    clamp.side === "left" && clamp.col === firstColumnClampCol;

  const shouldHideRv10Holder = (
    clamp: { side: "left" | "right"; col: number },
    holder: "G" | "V" | "L" | "P" | "VA" | "VZ" | "Z" | "",
  ) =>
    state.system === "RV10" &&
    (holder === "VA" || holder === "VZ") &&
    isFirstColumnClamp(clamp);

  // Calculate clamps based on module positions

  const getClamps = () => {
    const clamps: {
      row: number;
      col: number;
      topHolder: "G" | "V" | "L" | "P" | "VA" | "VZ" | "Z" | "";
      bottomHolder: "G" | "P" | "V" | "L" | "VA" | "VZ" | "Z" | "";
      clampType: "G" | "V";
      side: "left" | "right";
      isFirstOrLastInBlock?: boolean;
    }[] = [];

    const occ = new Set(modules.map((m) => `${m.row},${m.col}`));
    const has = (r: number, c: number) => occ.has(`${r},${c}`);

    const rv10IndexInBlock = new Map<string, number>();

    const rowsByCol = new Map<number, number[]>();
    modules.forEach((m) => {
      const list = rowsByCol.get(m.col) ?? [];
      list.push(m.row);
      rowsByCol.set(m.col, list);
    });

    rowsByCol.forEach((rows, col) => {
      rows.sort((a, b) => a - b);

      let indexInBlock = 0;
      for (let i = 0; i < rows.length; i++) {
        indexInBlock =
          i === 0 || rows[i] - rows[i - 1] !== STEP ? 0 : indexInBlock + 1;

        rv10IndexInBlock.set(`${rows[i]},${col}`, indexInBlock);
      }
    });

    const getRv10Holder = (
      row: number,
      col: number,
      direction: "left" | "right",
    ): "P" | "VA" | "VZ" | "Z" | "" => {
      if (state.system === "RV10-Z") {
        const indexInBlock = rv10IndexInBlock.get(`${row},${col}`) ?? 0;
        return direction === "left"
          ? (indexInBlock - 1) % 2 === 0
            ? "Z"
            : ""
          : indexInBlock % 2 === 0
            ? "Z"
            : "";
      }

      return "VA";
    };

    modules.forEach((module) => {
      const { row, col } = module;

      const hasLeft = has(row, col - STEP);
      const hasRight = has(row, col + STEP);
      const hasTop = has(row - STEP, col);
      const hasBottom = has(row + STEP, col);
      const isFirstInRow = !hasLeft;
      const isLastInRow = !hasRight;
      const hasTopLeftDiagonal = has(row - STEP, col - STEP);
      const hasBottomLeftDiagonal = has(row + STEP, col - STEP);
      const hasTopRightDiagonal = has(row - STEP, col + STEP);
      const hasBottomRightDiagonal = has(row + STEP, col + STEP);

      if (state.system !== "PT15-L" && state.orientation === "PT") {
        // Left clamp (edge)
        if (isFirstInRow) {
          const topHolder: "G" | "V" = hasTop
            ? "V"
            : hasTopLeftDiagonal
              ? "V"
              : "G";
          const bottomHolder: "P" | "V" = hasBottom
            ? "V"
            : hasBottomLeftDiagonal
              ? "V"
              : "P";

          clamps.push({
            row,
            col: col - 0.5,
            topHolder,
            bottomHolder,
            clampType: "G",
            side: "left",
          });
        }

        // Right clamp (edge)
        if (isLastInRow) {
          const topHolder: "G" | "V" = hasTop
            ? "V"
            : hasTopRightDiagonal
              ? "V"
              : "G";
          const bottomHolder: "P" | "V" = hasBottom
            ? "V"
            : hasBottomRightDiagonal
              ? "V"
              : "P";

          clamps.push({
            row,
            col: col + 1.5,
            topHolder,
            bottomHolder,
            clampType: "G",
            side: "right",
          });
        }

        if (hasLeft) {
          const leftHasTop = has(row - STEP, col - STEP);
          const leftHasBottom = has(row + STEP, col - STEP);
          const topHolder: "G" | "V" = hasTop || leftHasTop ? "V" : "G";
          const bottomHolder: "P" | "V" =
            hasBottom || leftHasBottom ? "V" : "P";

          clamps.push({
            row,
            col: col - 0.5,
            topHolder,
            bottomHolder,
            clampType: "V",
            side: "left",
          });
        }
      } else if (state.system === "PT15-L" && state.orientation === "PT") {
        // PT15-L
        if (isFirstInRow) {
          const topHolder = "L";
          const bottomHolder = "L";

          clamps.push({
            row,
            col: col - 0.5,
            topHolder,
            bottomHolder,
            clampType: "G",
            side: "left",
          });
        }
        if (isLastInRow) {
          const topHolder = "L";
          const bottomHolder = "L";

          clamps.push({
            row,
            col: col + 1.5,
            topHolder,
            bottomHolder,
            clampType: "G",
            side: "right",
          });
        }
        if (hasLeft) {
          const topHolder = "L";
          const bottomHolder = "L";

          clamps.push({
            row,
            col: col - 0.5,
            topHolder,
            bottomHolder,
            clampType: "V",
            side: "left",
          });
        }
      } else {
        // RV10, RV10-Z logic
        if (isFirstInRow) {
          const leftHolder: "P" | "VA" | "VZ" | "Z" | "" =
            state.system === "RV10" ? "P" : getRv10Holder(row, col, "left");

          clamps.push({
            row,
            col: col - 0.5,
            topHolder: leftHolder,
            bottomHolder: leftHolder,
            clampType: "V",
            side: "left",
          });
        }

        if (isLastInRow) {
          const rightHolder: "P" | "VA" | "VZ" | "Z" | "" =
            state.system === "RV10" ? "P" : getRv10Holder(row, col, "right");

          clamps.push({
            row,
            col: col + 1.5,
            topHolder: rightHolder,
            bottomHolder: rightHolder,
            clampType: "V",
            side: "right",
          });
        }

        if (hasLeft) {
          const holder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(
            row,
            col,
            "left",
          );

          clamps.push({
            row,
            col: col - 0.5,
            topHolder: holder,
            bottomHolder: holder,
            clampType: "G",
            side: "left",
          });
        }
      }
    });

    if (state.system === "RV10" && state.orientation === "RV") {
      const byRow = new Map<number, typeof clamps>();

      clamps
        .filter((c) => c.clampType === "G")
        .forEach((c) => {
          const list = byRow.get(c.row) ?? [];
          list.push(c);
          byRow.set(c.row, list);
        });

      byRow.forEach((rowClamps) => {
        rowClamps.sort((a, b) => a.col - b.col);
        rowClamps.forEach((clamp, idx) => {
          clamp.topHolder = "VA";
          clamp.bottomHolder = idx % 2 === 0 ? "VA" : "VZ";
          clamp.isFirstOrLastInBlock =
            idx === 0 || idx === rowClamps.length - 1;
        });
      });
    }

    return clamps;
  };

  const handleMouseDown = (e: React.MouseEvent, moduleId: number) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const moduleX = module.col * CELL_SIZE;
    const moduleY = (module.row + ROW_OFFSET) * CELL_SIZE;

    setDragOffset({
      x: e.clientX - rect.left - moduleX,
      y: e.clientY - rect.top - moduleY,
    });
    setDraggingModule(moduleId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingModule === null || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const newCol = Math.round(x / CELL_SIZE);
    const newRow = Math.max(0, Math.round(y / CELL_SIZE) - ROW_OFFSET);

    const dragged = modules.find((m) => m.id === draggingModule);
    if (!dragged) return;

    const paired = getPairedModule(draggingModule);
    const deltaRow = newRow - dragged.row;
    const deltaCol = newCol - dragged.col;

    const targets = paired
      ? [
          { id: dragged.id, row: newRow, col: newCol },
          {
            id: paired.id,
            row: paired.row + deltaRow,
            col: paired.col + deltaCol,
          },
        ]
      : [{ id: dragged.id, row: newRow, col: newCol }];

    // Check out of bounds
    const outOfBounds = targets.some(
      (t) =>
        t.col < 0 ||
        t.row < 0 ||
        t.col > gridCols - 2 ||
        t.row > gridRowsMax - 2,
    );
    if (outOfBounds) return;

    // Only move between even column and rows
    // const isEvenTarget = targets.every(
    //   (t) => t.col % STEP === 0 && t.row % STEP === 0,
    // );
    // if (!isEvenTarget) return;

    // Check if any target position is occupied by other modules
    const movingIds = new Set(targets.map((t) => t.id));
    const occupied = new Set(
      modules
        .filter((m) => !movingIds.has(m.id))
        .map((m) => `${m.row},${m.col}`),
    );

    const isOccupied = targets.some((t) => occupied.has(`${t.row},${t.col}`));
    if (isOccupied) return;

    // // Keep one tile space between modules
    // const isAdjacent = modules.some((m) =>
    //   targets.some(
    //     (t) =>
    //       m.id !== t.id &&
    //       Math.abs(m.row - t.row) < STEP &&
    //       Math.abs(m.col - t.col) < STEP,
    //   ),
    // );
    // if (isAdjacent) return;

    setModules((prev) =>
      prev.map((m) => {
        const t = targets.find((x) => x.id === m.id);
        return t ? { ...m, row: t.row, col: t.col } : m;
      }),
    );
  };

  const handleMouseUp = () => {
    setDraggingModule(null);
  };

  const clamps = getClamps();

  const hasModulesBelowRow = (row: number) => {
    return modules.some((m) => m.row > row);
  };

  const clampGCount =
    clamps.filter(
      (c) =>
        c.clampType === "G" &&
        !(
          (state.system === "RV10" || state.system === "RV10-Z") &&
          state.orientation === "RV" &&
          !hasModulesBelowRow(c.row)
        ),
    ).length * 2;
  const clampVCount = clamps.filter((c) => c.clampType === "V").length * 2;

  let GholderCount = 0;
  let VholderCount = 0;
  let PholderCount = 0;
  let VAHolderCount = 0;
  let VZHolderCount = 0;

  clamps.forEach((clamp) => {
    if (state.orientation === "RV") {
      // RV: topHolder
      if (
        clamp.topHolder === "G" ||
        clamp.topHolder === "L" ||
        clamp.topHolder === "Z"
      )
        GholderCount++;
      if (clamp.topHolder === "P") PholderCount++;

      if (clamp.topHolder === "V") VholderCount++;
      if (
        state.system === "RV10" &&
        clamp.clampType === "G" &&
        clamp.topHolder === "VA"
      ) {
        const isHidden = shouldHideRv10Holder(clamp, clamp.topHolder);
        const hasBelow = hasModulesBelowRow(clamp.row);
        const willCount = !isHidden && hasBelow;

        if (willCount) {
          VAHolderCount++;
        }
      }

      // RV: bottomHolder
      if (clamp.bottomHolder === "P" || clamp.bottomHolder === "Z")
        GholderCount++;
      if (clamp.bottomHolder === "P") PholderCount++;
      if (clamp.bottomHolder === "V") VholderCount++;
      if (
        state.system === "RV10" &&
        clamp.clampType === "G" &&
        clamp.bottomHolder === "VZ"
      ) {
        if (!shouldHideRv10Holder(clamp, clamp.bottomHolder)) {
          VZHolderCount++;
        }
      }
    } else {
      if (clamp.topHolder === "G" || clamp.topHolder === "Z") GholderCount++;
      if (clamp.topHolder === "P") PholderCount++;
      if (clamp.topHolder === "V") VholderCount++;
      if (clamp.bottomHolder === "P") PholderCount++;
      if (clamp.bottomHolder === "L") GholderCount++;
    }
  });

  if (state.system === "RV10-Z" && state.orientation === "RV") {
    const zBottomCount = clamps.filter((c) => c.bottomHolder === "Z").length;
    GholderCount = zBottomCount % 2 === 0 ? zBottomCount : zBottomCount + 1;
  }

  const [unpairedModules] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [globalUnpairAll, setGlobalUnpairAll] = useState(false);

  const [invalidPairModules, setInvalidPairModules] = useState<Set<number>>(
    new Set(),
  );
  const invalidPairTimeoutRef = useRef<number | null>(null);

  const buildPairMapFromModules = (items: Module[]) => {
    const map = new Map<number, number>();
    const byRow = new Map<number, Module[]>();

    items.forEach((m) => {
      const list = byRow.get(m.row) ?? [];
      list.push(m);
      byRow.set(m.row, list);
    });

    byRow.forEach((list) => {
      list.sort((a, b) => a.col - b.col);
      for (let i = 0; i < list.length - 1; i += 2) {
        const a = list[i];
        const b = list[i + 1];
        if (Math.abs(a.col - b.col) === STEP) {
          map.set(a.id, b.id);
          map.set(b.id, a.id);
        }
      }
    });

    return map;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(
      () => setToastMessage(null),
      2200,
    );
  };

  const getInvalidPairModuleIds = () => {
    const invalid = new Set<number>();
    const visited = new Set<number>();
    const pairMap = pairMapRef.current;
    if (!pairMap) return invalid;

    pairMap.forEach((pairId, id) => {
      if (visited.has(id) || visited.has(pairId)) return;
      visited.add(id);
      visited.add(pairId);

      if (unpairedModules.has(id) || unpairedModules.has(pairId)) return;

      const a = modules.find((m) => m.id === id);
      const b = modules.find((m) => m.id === pairId);
      if (!a || !b) return;

      const isHorizontalNeighbor =
        a.row === b.row && Math.abs(a.col - b.col) === STEP;
      if (!isHorizontalNeighbor) {
        invalid.add(id);
        invalid.add(pairId);
      }
    });

    return invalid;
  };

  const handleGlobalUnpairAllChange = (checked: boolean) => {
    if (checked) {
      setGlobalUnpairAll(true);
      return;
    }

    const newPairMap = buildPairMapFromModules(modules);
    const expectedPairedModules = Math.floor(modules.length / 2) * 2;
    const invalid =
      newPairMap.size < expectedPairedModules
        ? new Set(modules.filter((m) => !newPairMap.has(m.id)).map((m) => m.id))
        : new Set<number>();

    if (invalid.size > 0) {
      setGlobalUnpairAll(true);
      setInvalidPairModules(invalid);

      if (invalidPairTimeoutRef.current)
        window.clearTimeout(invalidPairTimeoutRef.current);
      invalidPairTimeoutRef.current = window.setTimeout(() => {
        setInvalidPairModules(new Set());
      }, 1200);

      showToast(t("errors.horizontalPairingRequired"));
      return;
    }

    pairMapRef.current = newPairMap;
    setInvalidPairModules(new Set());
    setGlobalUnpairAll(false);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      if (invalidPairTimeoutRef.current)
        window.clearTimeout(invalidPairTimeoutRef.current);
    };
  }, []);

  const getPairedModule = (moduleId: number) => {
    if (state.orientation !== "RV") return null;
    if (globalUnpairAll) return null;

    if (unpairedModules.has(moduleId)) return null;

    const pairId = pairMapRef.current?.get(moduleId);
    if (pairId === undefined) return null;

    if (unpairedModules.has(pairId)) return null;

    return modules.find((m) => m.id === pairId) ?? null;
  };

  const getIsolatedModules = (ignorePairs: boolean): Set<number> => {
    const isolated = new Set<number>();
    const moduleMap = new Map(modules.map((m) => [`${m.row},${m.col}`, m.id]));
    const visited = new Set<number>();

    const hasExternalNeighbor = (module: Module, excludeId?: number) => {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const neighborKey = `${module.row + dr},${module.col + dc}`;
          const neighborId = moduleMap.get(neighborKey);

          if (neighborId !== undefined && neighborId !== excludeId) {
            return true;
          }
        }
      }
      return false;
    };

    modules.forEach((module) => {
      if (visited.has(module.id)) return;

      const pairId = ignorePairs ? undefined : pairMapRef.current?.get(module.id);
      
      visited.add(module.id);
      if (pairId !== undefined) {
        visited.add(pairId);
      }

      if (ignorePairs || pairId === undefined) {
        if (!hasExternalNeighbor(module)) {
          isolated.add(module.id);
        }
      } else {
        const pairedModule = modules.find((m) => m.id === pairId);
        const module1HasNeighbor = hasExternalNeighbor(module, pairId);
        const module2HasNeighbor = pairedModule ? hasExternalNeighbor(pairedModule, module.id) : false;

        if (!module1HasNeighbor && !module2HasNeighbor) {
          isolated.add(module.id);
          isolated.add(pairId);
        }
      }
    });

    return isolated;
  };

  const isolatedModules = getIsolatedModules(globalUnpairAll);
  const hasIsolatedModules = isolatedModules.size > 0;

  return (
    <div className="solar-canvas">
      {toastMessage && (
        <div className="solar-canvas__toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      {state.system === "PT15-L" ? (
        <h2 className="solar-canvas__title">
          {t("title.materialCountPT15-L")}
        </h2>
      ) : state.system === "RV10" ? (
        <h2 className="solar-canvas__title">{t("title.materialCountRV10")}</h2>
      ) : (
        <h2 className="solar-canvas__title">{t("title.materialCount")}</h2>
      )}

      {/* checkbox for RV */}
      {state.orientation === "RV" && (
        <div className="solar-canvas__toolbar">
          <label>
            <input
              type="checkbox"
              checked={globalUnpairAll}
              onChange={(e) => handleGlobalUnpairAllChange(e.target.checked)}
            />
            {t("fields.unpairAllModules")}
          </label>

          <div
            className={`solar-canvas__warning-chip${
              hasIsolatedModules ? " solar-canvas__warning-chip--visible" : ""
            }`}
            aria-live="polite"
          >
            {t("errors.isolatedModules")}
          </div>
        </div>
      )}

      <div
        className="solar-canvas__grid-scroll"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100%",
        }}
      >
        <div
          ref={canvasRef}
          className="solar-canvas__grid"
          style={{
            width: gridCols * CELL_SIZE,
            height: gridRowsMax * CELL_SIZE,
            position: "relative",
            // border: "2px solid #333",
            backgroundColor: "#f5f5f5",
            cursor: draggingModule !== null ? "grabbing" : "default",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Compass */}
          <img
            src="/images/compass.png"
            style={{
              position: "absolute",
              top: -10,
              right: 8,
              width: 150,
              height: 150,
              zIndex: 5,
              pointerEvents: "none",
            }}
          />

          {/* Grid lines */}
          {Array.from({ length: gridRowsMax + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              style={{
                position: "absolute",
                top: i * CELL_SIZE,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: "#ddd",
              }}
            />
          ))}
          {Array.from({ length: gridCols + 1 }).map((_, i) => (
            <div
              key={`v-${i}`}
              style={{
                position: "absolute",
                left: i * CELL_SIZE,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: "#ddd",
              }}
            />
          ))}
          {/* Clamps (left/right only)
          {state.system !== "PT15-L"
            ? clamps.map((clamp, idx) => {
                let clampTop =
                  (clamp.row + ROW_OFFSET) * CELL_SIZE + CELL_SIZE / 2 - 10;

                if (state.orientation === "RV" && clamp.clampType === "G") {
                  const hasTopModule = modules.some(
                    (m) =>
                      m.row === clamp.row - STEP &&
                      Math.abs(m.col - clamp.col) < 1,
                  );
                  if (!hasTopModule) {
                    clampTop -= CELL_SIZE;
                  }
                }

                return (
                  <div
                    key={`clamp-${idx}`}
                    style={{
                      position: "absolute",
                      left: clamp.col * CELL_SIZE - 25,
                      top: clampTop,
                      width: 50,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: "#333",
                      backgroundColor: "#e8f0fe",
                      border: "1px solid #4a90e2",
                      borderRadius: 3,
                      pointerEvents: "none",
                      zIndex: 3,
                    }}
                  >
                    {`Clamp ${clamp.clampType}`}
                  </div>
                );
              })
            : clamps.map((clamp, idx) => (
                <div
                  key={`clamp-${idx}`}
                  style={{
                    position: "absolute",
                    left: clamp.col * CELL_SIZE - 25,
                    top:
                      (clamp.row + ROW_OFFSET) * CELL_SIZE + CELL_SIZE / 2 - 10,
                    width: 50,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "#333",
                    backgroundColor: "#e8f0fe",
                    border: "1px solid #4a90e2",
                    borderRadius: 3,
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                >
                  {`Clamp ${clamp.clampType}`} <br></br>
                  {clamp.topHolder}
                </div>
              ))} */}
          {/* Holder letters */}
          {/* {state.system !== "PT15-L"
            ? clamps.map((clamp, idx) => {
                let clampTop =
                  (clamp.row + ROW_OFFSET) * CELL_SIZE + CELL_SIZE / 2 - 10;

                if (state.orientation === "RV" && clamp.clampType === "G") {
                  const hasTopModule = modules.some(
                    (m) =>
                      m.row === clamp.row - STEP &&
                      Math.abs(m.col - clamp.col) < 1,
                  );
                  if (!hasTopModule) {
                    clampTop -= CELL_SIZE;
                  }
                }

                return (
                  <div key={`holders-${idx}`}>
                    {!shouldHideRv10Holder(clamp, clamp.topHolder) &&
                      !(
                        state.system === "RV10" &&
                        clamp.clampType === "G" &&
                        clamp.topHolder === "VA" &&
                        !hasModulesBelowRow(clamp.row)
                      ) && (
                      <div
                        style={{
                          position: "absolute",
                          left: clamp.col * CELL_SIZE - 25,
                          top: clampTop - CELL_SIZE,
                          width: 50,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "bold",
                          color: "#333",
                          backgroundColor: "#e8f0fe",
                          border: "1px solid #4a90e2",
                          borderRadius: 3,
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      >
                        {clamp.topHolder}
                      </div>
                    )}

                    {!shouldHideRv10Holder(clamp, clamp.bottomHolder) &&
                      !(
                        state.system === "RV10" &&
                        clamp.clampType === "G" &&
                        clamp.bottomHolder === "VA" &&
                        !hasModulesBelowRow(clamp.row)
                      ) && (
                      <div
                        style={{
                          position: "absolute",
                          left: clamp.col * CELL_SIZE - 25,
                          top: clampTop + CELL_SIZE,
                          width: 50,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "bold",
                          color: "#333",
                          backgroundColor: "#e8f0fe",
                          border: "1px solid #4a90e2",
                          borderRadius: 3,
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      >
                        {clamp.bottomHolder}
                      </div>
                    )}
                  </div>
                );
              })
            : null} */}

          {/* Modules */}
          {modules.map((module) => {
            const isPaired = pairMapRef.current?.get(module.id);
            const isUnpairedOrPairUnpaired =
              unpairedModules.has(module.id) ||
              (isPaired !== undefined && unpairedModules.has(isPaired));

            const horizontalOffset =
              state.orientation === "RV"
                ? module.col % 2 === 0
                  ? CELL_SIZE / 4
                  : -CELL_SIZE / 4.5
                : 0;

            const isInvalidPair = invalidPairModules.has(module.id);

            return (
              <div
                key={module.id}
                className={`solar-canvas__module${draggingModule === module.id ? " solar-canvas__module--dragging" : ""}${isUnpairedOrPairUnpaired ? " solar-canvas__module--unpaired" : ""}`}
                style={{
                  position: "absolute",
                  left:
                    module.col * CELL_SIZE +
                    CELL_SIZE / 2 -
                    15 +
                    horizontalOffset,
                  top: module.row * CELL_SIZE + CELL_SIZE / 2 - 26,
                  width: 30,
                  height: 56,
                  backgroundColor: "#4a90e2",
                  backgroundImage: "url('/images/solar.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "right",
                  border: isInvalidPair
                    ? "2px solid #d32f2f"
                    : "2px solid #2e5c8a",
                  borderRadius: 4,
                  zIndex: draggingModule === module.id ? 10 : 2,
                  boxShadow: isInvalidPair
                    ? "0 0 0 4px rgba(211,47,47,0.25)"
                    : "0px 2px 5px 2px rgba(0, 0, 0, 0.6)",
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  transform:
                    state.orientation === "PT" ? "rotate(90deg)" : "none",
                }}
                onMouseDown={(e) => handleMouseDown(e, module.id)}
              />
            );
          })}
        </div>
      </div>

      {state.system === "PT15-L" ? (
        <>
          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <p>
                {t("fields.backHolder")} (G): {GholderCount}
              </p>
              <p>
                {t("fields.frontClamps")} (Clamp G): {clampGCount}
              </p>
              <p>
                {t("fields.middleClamp")} (Clamp V): {clampVCount}
              </p>
            </div>
          </div>

          <button
            className="solar-summary__actions_back"
            onClick={() => navigate("/roof", { state })}
          >
            Grįžti atgal
          </button>
          <button
            className="solar-calculator__actions"
            onClick={() =>
              navigate("/summaryRoof", {
                state: {
                  ...state,
                  clampGCount,
                  clampVCount,
                  holderGCount: GholderCount,
                },
              })
            }
          >
            {t("actions.calculate")}
          </button>
        </>
      ) : state.system === "RV10" ? (
        <>
          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <p>
                {t("fields.backHolder")} (G): {GholderCount}
              </p>
              <p>
                {t("fields.frontClamps")} (Clamp G): {clampGCount}
              </p>
              <p>
                {t("fields.middleClamp")} (Clamp V): {clampVCount}
              </p>
              <p>
                {t("fields.middleRVHolderA")} : {VAHolderCount}
              </p>
              <p>
                {t("fields.middleRVHolderZ")}: {VZHolderCount}
              </p>
            </div>
          </div>

          <button
            className="solar-summary__actions_back"
            onClick={() => navigate("/roof", { state })}
          >
            Grįžti atgal
          </button>
          <button
            className="solar-calculator__actions"
            disabled={hasIsolatedModules}
            onClick={() =>
              navigate("/summaryRoof", {
                state: {
                  ...state,
                  clampGCount,
                  clampVCount,
                  holderGCount: GholderCount,
                  holderVACount: VAHolderCount,
                  holderVZCount: VZHolderCount,
                },
              })
            }
          >
            {t("actions.calculate")}
          </button>
        </>
      ) : state.system === "RV10-Z" ? (
        <>
          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <p>
                {t("fields.backHolder")} (Z): {GholderCount}
              </p>
              <p>
                {t("fields.frontClamps")} (Clamp G): {clampGCount}
              </p>
              <p>
                {t("fields.middleClamp")} (Clamp V): {clampVCount}
              </p>
            </div>
          </div>

          <button
            className="solar-summary__actions_back"
            onClick={() => navigate("/roof", { state })}
          >
            Grįžti atgal
          </button>
          <button
            className="solar-calculator__actions"
            disabled={hasIsolatedModules}
            onClick={() =>
              navigate("/summaryRoof", {
                state: {
                  ...state,
                  clampGCount,
                  clampVCount,
                  holderGCount: GholderCount,
                  holderVACount: VAHolderCount,
                  holderVZCount: VZHolderCount,
                },
              })
            }
          >
            {t("actions.calculate")}
          </button>
        </>
      ) : (
        <>
          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <p>
                {t("fields.backHolder")} (G): {GholderCount}
              </p>
              <p>
                {t("fields.frontHolder")} (P): {PholderCount}
              </p>
              <p>
                {t("fields.middleHolder")} (V): {VholderCount}
              </p>
              <p>
                {t("fields.frontClamps")} (Clamp G): {clampGCount}
              </p>
              <p>
                {t("fields.middleClamp")} (Clamp V): {clampVCount}
              </p>
            </div>
          </div>

          <button
            className="solar-summary__actions_back"
            onClick={() => navigate("/roof", { state })}
          >
            Grįžti atgal
          </button>
          <button
            className="solar-calculator__actions"
            onClick={() =>
              navigate("/summaryRoof", {
                state: {
                  ...state,
                  clampGCount,
                  clampVCount,
                  holderGCount: GholderCount,
                  holderVCount: VholderCount,
                  holderPCount: PholderCount,
                },
              })
            }
          >
            {t("actions.calculate")}
          </button>
        </>
      )}
    </div>
  );
}
