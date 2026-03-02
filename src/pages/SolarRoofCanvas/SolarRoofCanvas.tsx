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

const CELL_SIZE = 60;
//1 jeigu moduliai prie pat, 2 jeigu norim matyt laikiklius(reikia atkomentuot)
const STEP = 1;
const ROW_OFFSET = 1;

export default function SolarRoofCanvas() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };
  let grid_cols = state.rowsCount * 3;

  const [modules, setModules] = useState<Module[]>(() => {
    const initial: Module[] = [];
    //1 jeigu prie pat, 2 jeigu su laikikliais
    const spacing = 1;
    const modulesPerRow = Math.ceil(state.moduleCount / state.rowsCount);

    for (let i = 0; i < state.moduleCount; i++) {
      const col = Math.floor(i / state.rowsCount);
      const row = i % state.rowsCount;
      initial.push({ id: i, row: row * spacing, col: col * spacing });
    }

    return initial;
  });

  // Create a stable pairing once for RV
  const pairMapRef = useRef<Map<number, number> | null>(null);
  if (pairMapRef.current === null) {
    const map = new Map<number, number>();

    if (state.orientation === "RV") {
      const byCol = new Map<number, Module[]>();
      modules.forEach((m) => {
        const list = byCol.get(m.col) ?? [];
        list.push(m);
        byCol.set(m.col, list);
      });

      byCol.forEach((list) => {
        list.sort((a, b) => a.row - b.row);
        for (let i = 0; i < list.length - 1; i += 2) {
          const a = list[i];
          const b = list[i + 1];
          if (Math.abs(a.row - b.row) === STEP) {
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
  const gridRows = state.rowsCount + ROW_OFFSET;
  const maxCol = Math.max(0, ...modules.map((m) => m.col));
  const gridCols = Math.max(grid_cols, maxCol + ROW_OFFSET);

  const minCol = Math.min(...modules.map((m) => m.col));
  const firstColumnClampCol = minCol - 0.5;

  const isFirstColumnClamp = (clamp: { side: "left" | "right"; col: number }) =>
    clamp.side === "left" && clamp.col === firstColumnClampCol;

  const shouldHideRv10Holder = (
    clamp: { side: "left" | "right"; col: number },
    holder: "G" | "V" | "L" | "P" | "VA" | "VZ" | "Z" | "",
  ) => state.system === "RV10" && (holder === "VA" || holder === "VZ") && isFirstColumnClamp(clamp);

  // Calculate clamps based on module positions

  const getClamps = () => {
    const clamps: {
      row: number;
      col: number;
      topHolder: "G" | "V" | "L" | "P" | "VA" | "VZ"|"Z" | "";
      bottomHolder: "P" | "V" | "L" | "VA" | "VZ"|"Z" | "";
      clampType: "G" | "V";
      side: "left" | "right";
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
      direction: "top" | "bottom",
      adjacentCol?: number,
    ): "P" | "VA" | "VZ"|"Z" | "" => {
      const indexInBlock = rv10IndexInBlock.get(`${row},${col}`) ?? 0;
      if(state.system !== "RV10-Z"){

      const r = direction === "top" ? row - STEP : row + STEP;
      const hasCenter = has(r, col);
      const hasAdjacent =
        adjacentCol !== undefined ? has(r, adjacentCol) : false;

      const shouldBeP = !hasCenter && !hasAdjacent;

      if (shouldBeP) return "P";

      return direction === "top"
        ? (indexInBlock - 1) % 2 === 0
          ? "VA"
          : "VZ"
        : indexInBlock % 2 === 0
          ? "VA"
          : "VZ";
      }
      else
      {
        return direction === "top"
        ? (indexInBlock - 1) % 2 === 0
          ? "Z"
          : ""
        : indexInBlock % 2 === 0
          ? "Z"
          : "";
      }
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
        if (isFirstInRow) {
          const topHolder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(row, col, "top");
          const bottomHolder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(
            row,
            col,
            "bottom",
          );

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
          const topHolder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(row, col, "top");
          const bottomHolder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(
            row,
            col,
            "bottom",
          );

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
          const topHolder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(
            row,
            col,
            "top",
            col - STEP,
          );
          const bottomHolder: "P" | "VA" | "VZ" | "Z" | "" = getRv10Holder(
            row,
            col,
            "bottom",
            col - STEP,
          );

          clamps.push({
            row,
            col: col - 0.5,
            topHolder,
            bottomHolder,
            clampType: "V",
            side: "left",
          });
        }
      }
    });

    return clamps;
  };

  const handleMouseDown = (e: React.MouseEvent, moduleId: number) => {
    if (e.button === 1 && state.orientation === "RV") {
      e.preventDefault();
      handleContextMenu(e, moduleId);
      return;
    }

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

    const newCol = Math.max(
      0,
      Math.min(grid_cols - 1, Math.round(x / CELL_SIZE)),
    );
    const newRow = Math.max(
      0,
      Math.min(
        gridRows - 1,
        Math.round(y / CELL_SIZE) - ROW_OFFSET,
      ),
    );

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

    // Keep within bounds for paired move
    const outOfBounds = targets.some(
      (t) =>
        t.col < 0 ||
        t.row < 0 ||
        t.col > grid_cols - 1 ||
        t.row > gridRows - 1,
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

  const clampGCount = clamps.filter((c) => c.clampType === "G").length * 2;
  const clampVCount = clamps.filter((c) => c.clampType === "V").length * 2;

  let GholderCount = 0;
  let VholderCount = 0;
  let PholderCount = 0;
  let VAHolderCount = 0;
  let VZHolderCount = 0;

  clamps.forEach((clamp) => {
    if (clamp.topHolder === "G" || clamp.topHolder === "L" || clamp.topHolder === "Z") GholderCount++;
    if (clamp.topHolder === "P") GholderCount += 2;
    if (clamp.topHolder === "V") VholderCount++;
    if (clamp.bottomHolder === "P") PholderCount++;
    if (clamp.topHolder === "VA" && !shouldHideRv10Holder(clamp, "VA"))
      VAHolderCount++;
    if (clamp.topHolder === "VZ" && !shouldHideRv10Holder(clamp, "VZ"))
      VZHolderCount++;
  });

  const [unpairedModules, setUnpairedModules] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, moduleId: number) => {
    if (state.orientation !== "RV") return;

    e.preventDefault();
    
    let pairingBlocked = false;

    setUnpairedModules((prev) => {
      const newSet = new Set(prev);
      const pairId = pairMapRef.current?.get(moduleId);
      
      const isThisUnpaired = newSet.has(moduleId);
      const isPairUnpaired = pairId !== undefined && newSet.has(pairId);
      
      if (isThisUnpaired || isPairUnpaired) {
        const thisModule = modules.find((m) => m.id === moduleId);
        const pairedModule = pairId !== undefined ? modules.find((m) => m.id === pairId) : null;
        
        if (thisModule && pairedModule && 
            thisModule.col === pairedModule.col && 
            Math.abs(thisModule.row - pairedModule.row) === STEP) {
          newSet.delete(moduleId);
          if (pairId !== undefined) {
            newSet.delete(pairId);
          }
        } else {
          pairingBlocked = true;
        }
      } else {
        newSet.add(moduleId);
        if (pairId !== undefined) {
          newSet.add(pairId);
        }
      }
      return newSet;
    });

    if (pairingBlocked) {
      showToast(t("errors.verticalPairingRequired") || "Modules must be vertically adjacent to pair");
    }
  };

  const getPairingColor = (moduleId: number): string => {
    const pairId = pairMapRef.current?.get(moduleId);
    if (pairId === undefined) return "#ff6b6b";
  
    const minId = Math.min(moduleId, pairId);
    const colors = ["#ff6b6b", "#ff9f1c", "#2ecc71", "#3498db", "#e74c3c", "#9b59b6"];
    return colors[minId % colors.length];
  };

  const getPairedModule = (moduleId: number) => {
    if (state.orientation !== "RV") return null;
    if (unpairedModules.has(moduleId)) return null; // Skip if unpaired
  
    const pairId = pairMapRef.current?.get(moduleId);
    if (pairId === undefined) return null;
  
    if (unpairedModules.has(pairId)) return null; // Skip if paired module is unpaired

    return modules.find((m) => m.id === pairId) ?? null;
  };

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
            height: gridRows * CELL_SIZE,
            position: "relative",
            // border: "2px solid #333",
            backgroundColor: "#f5f5f5",
            cursor: draggingModule !== null ? "grabbing" : "default",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines */}
          {Array.from({ length: gridRows + 1 }).map((_, i) => (
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
            ? clamps.map((clamp, idx) => (
                <div
                  key={`clamp-${idx}`}
                  style={{
                    position: "absolute",
                    left: (clamp.col + 1) * CELL_SIZE - 25,
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
                    zIndex: 1,
                  }}
                >
                  {`Clamp ${clamp.clampType}`}
                </div>
              ))
            : clamps.map((clamp, idx) => (
                <div
                  key={`clamp-${idx}`}
                  style={{
                    position: "absolute",
                    left: (clamp.col + 1) * CELL_SIZE - 25,
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
                    zIndex: 1,
                  }}
                >
                  {`Clamp ${clamp.clampType}`} <br></br>
                  {clamp.topHolder}
                </div>
              ))}
          {/* Holder letters 
          {state.system !== "PT15-L"
            ? clamps.map((clamp, idx) => {
                const clampTop =
                  (clamp.row + ROW_OFFSET) * CELL_SIZE + CELL_SIZE / 2 - 10;
                const top = clampTop - CELL_SIZE;
                const bottom = clampTop + CELL_SIZE;

                return (
                  <div key={`holders-${idx}`}>
                    {!shouldHideRv10Holder(clamp, clamp.topHolder) && (
                      <div
                        style={{
                          position: "absolute",
                          left: (clamp.col + 1) * CELL_SIZE - 25,
                          top,
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

                    {!shouldHideRv10Holder(clamp, clamp.bottomHolder) && (
                      <div
                        style={{
                          position: "absolute",
                          left: (clamp.col + 1) * CELL_SIZE - 25,
                          top: bottom,
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
            const isUnpairedOrPairUnpaired = unpairedModules.has(module.id) || (isPaired !== undefined && unpairedModules.has(isPaired));
            const pairingColor = getPairingColor(module.id);

            return (
              <div
                key={module.id}
                className={`solar-canvas__module${draggingModule === module.id ? ' solar-canvas__module--dragging' : ''}${isUnpairedOrPairUnpaired ? ' solar-canvas__module--unpaired' : ''}`}
                style={{
                  position: "absolute",
                  //left: (module.col + 1),  top: (module.row + ROW_OFFSET), jei su laikikliais
                  left: module.col * CELL_SIZE + CELL_SIZE / 2 - 17,
                  top: module.row * CELL_SIZE + CELL_SIZE / 2 - 26,
                  width: 30,
                  height: 50,
                  backgroundColor: isUnpairedOrPairUnpaired ? pairingColor : "#4a90e2",
                  border: isUnpairedOrPairUnpaired ? `3px solid ${pairingColor}` : "2px solid #2e5c8a",
                  borderRadius: 4,
                  zIndex: draggingModule === module.id ? 10 : 2,
                  boxShadow: isUnpairedOrPairUnpaired ? `0 0 12px ${pairingColor}55` : "none",
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
      ) :  state.system === "RV10-Z" ? (
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
      ) :
    
      (
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
