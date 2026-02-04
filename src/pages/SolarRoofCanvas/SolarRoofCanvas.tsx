import { useState, useRef } from "react";
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
const STEP = 2;
const ROW_OFFSET = 1;

export default function SolarRoofCanvas() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };
  let grid_cols = state.rowsCount * 3;

  const [modules, setModules] = useState<Module[]>(() => {
    const initial: Module[] = [];
    const spacing = 2;
    const modulesPerRow = Math.ceil(state.moduleCount / state.rowsCount);

    for (let i = 0; i < state.moduleCount; i++) {
      const row = Math.floor(i / modulesPerRow);
      const col = i % modulesPerRow;
      initial.push({ id: i, row: row * spacing, col: col * spacing });
    }

    return initial;
  });

  const [draggingModule, setDraggingModule] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const gridRows = state.rowsCount * 2 + ROW_OFFSET;
  const maxCol = Math.max(0, ...modules.map((m) => m.col));
  const gridCols = Math.max(grid_cols, maxCol + 3);

  // Calculate clamps based on module positions

  const getClamps = () => {
    const clamps: {
      row: number;
      col: number;
      topHolder: "G" | "V";
      bottomHolder: "P" | "V";
      clampType: "G" | "V";
      side: "left" | "right";
    }[] = [];

    const occ = new Set(modules.map((m) => `${m.row},${m.col}`));
    const has = (r: number, c: number) => occ.has(`${r},${c}`);

    modules.forEach((module) => {
      const { row, col } = module;

      const hasLeft = has(row, col - STEP);
      const hasRight = has(row, col + STEP);
      const hasTop = has(row - STEP, col);
      const hasBottom = has(row + STEP, col);

      const isFirstInRow = !hasLeft;
      const isLastInRow = !hasRight;

      // Left clamp (edge)
      if (isFirstInRow) {
        const topHolder: "G" | "V" = hasTop ? "V" : "G";
        const bottomHolder: "P" | "V" = hasBottom ? "V" : "P";

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
        const topHolder: "G" | "V" = hasTop ? "V" : "G";
        const bottomHolder: "P" | "V" = hasBottom ? "V" : "P";

        clamps.push({
          row,
          col: col + 1.5,
          topHolder,
          bottomHolder,
          clampType: "G",
          side: "right",
        });
      }

      // Between clamps (Clamp V)
      if (hasLeft) {
        const leftHasTop = has(row - STEP, col - STEP);
        const leftHasBottom = has(row + STEP, col - STEP);

        const topHolder: "G" | "V" = hasTop || leftHasTop ? "V" : "G";
        const bottomHolder: "P" | "V" = hasBottom || leftHasBottom ? "V" : "P";

        clamps.push({
          row,
          col: col - 0.5,
          topHolder,
          bottomHolder,
          clampType: "V",
          side: "left",
        });
      }
    });

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

    const newCol = Math.max(
      0,
      Math.min(grid_cols - 1, Math.round(x / CELL_SIZE)),
    );
    const newRow = Math.max(
      0,
      Math.min(
        gridRows - 1 - ROW_OFFSET,
        Math.round(y / CELL_SIZE) - ROW_OFFSET,
      ),
    );

    // Check if position is occupied
    const isOccupied = modules.some(
      (m) => m.id !== draggingModule && m.row === newRow && m.col === newCol,
    );

    //Keep one tile space between modules,
    const isAdjacent = modules.some(
      (m) =>
        m.id !== draggingModule &&
        Math.abs(m.row - newRow) < STEP &&
        Math.abs(m.col - newCol) < STEP,
    );

    if (isAdjacent) return;

    //Only move between even column and rows
    const isEvenCol = newCol % STEP === 0;
    const isEvenRow = newRow % STEP === 0;

    if (!isEvenCol || !isEvenRow) return;

    if (!isOccupied) {
      setModules((prev) =>
        prev.map((m) =>
          m.id === draggingModule ? { ...m, row: newRow, col: newCol } : m,
        ),
      );
    }
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

  clamps.forEach((clamp) => {
    if (clamp.topHolder === "G") GholderCount++;
    if (clamp.topHolder === "V") VholderCount++;
    if (clamp.bottomHolder === "P") PholderCount++;
  });

  return (
    <div className="solar-canvas">
      <h2 className="solar-canvas__title">MEDŽIAGŲ KIEKIŲ SKAIČIAVIMO SCHEMA PT05/PT10/PT15/PT20</h2>

      <div
        ref={canvasRef}
        className="solar-canvas__grid"
        style={{
          width: gridCols * CELL_SIZE,
          height: gridRows * CELL_SIZE,
          position: "relative",
          border: "2px solid #333",
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

        {/* Clamps (left/right only) */}
        {clamps.map((clamp, idx) => (
          <div
            key={`clamp-${idx}`}
            style={{
              position: "absolute",
              left: (clamp.col + 1) * CELL_SIZE - 25,
              top: (clamp.row + ROW_OFFSET) * CELL_SIZE + CELL_SIZE / 2 - 10,
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
        ))}

        {/* Holder letters */}
        {clamps.map((clamp, idx) => {
          const clampTop =
            (clamp.row + ROW_OFFSET) * CELL_SIZE + CELL_SIZE / 2 - 10;
          const top = clampTop - CELL_SIZE;
          const bottom = clampTop + CELL_SIZE;

          return (
            <div key={`holders-${idx}`}>
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
            </div>
          );
        })}

        {/* Modules */}
        {modules.map((module) => (
          <div
            key={module.id}
            style={{
              position: "absolute",
              left: (module.col + 1) * CELL_SIZE + 5,
              top: (module.row + ROW_OFFSET) * CELL_SIZE + 5,
              width: CELL_SIZE - 10,
              height: CELL_SIZE - 10,
              backgroundColor: "#4a90e2",
              border: "2px solid #2e5c8a",
              borderRadius: 4,
              zIndex: draggingModule === module.id ? 10 : 2,
              opacity: draggingModule === module.id ? 0.7 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, module.id)}
          />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <p>Galinis Laikiklis (G): {GholderCount}</p>
        <p>Priekinis Laikiklis (P): {PholderCount}</p>
        <p>Vidurinis Laikiklis (V): {VholderCount}</p>
        <p>Galiniai Prispaudejai (Clamp G): {clampGCount}</p>
        <p>Viduriniai Prispaudejai (Clamp V): {clampVCount}</p>
      </div>

      <button
        className="solar-calculator__actions"
        onClick={() =>
          navigate("/summaryRoof", {
            state,
          })
        }
      >
        {t("actions.next")}
      </button>
    </div>
  );
}
