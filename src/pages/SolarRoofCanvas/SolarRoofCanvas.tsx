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
let GRID_COLS = 15;
const STEP = 2;

export default function SolarRoofCanvas() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };
  
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

  const gridRows = state.rowsCount * 2;
  const maxCol = Math.max(0, ...modules.map((m) => m.col));
  const gridCols = Math.max(GRID_COLS, maxCol + 3);

  // Calculate clamps based on module positions
  const getClamps = () => {
    const clamps: {
      row: number;
      col: number;
      holder: "G" | "V" | "P";
      clampType: "G" | "V";
      side: "left" | "right";
    }[] = [];

    const occ = new Set(modules.map((m) => `${m.row},${m.col}`));
    const has = (r: number, c: number) => occ.has(`${r},${c}`);

    modules.forEach((module) => {
      const { row, col } = module;

      // neighbors by spacing
      const hasLeft = has(row, col - STEP);
      const hasRight = has(row, col + STEP);
      const hasTop = has(row - STEP, col);
      const hasBottom = has(row + STEP, col);

      // holder by column position
      let holder: "G" | "V" | "P" = "V";
      if (!hasTop) holder = "G";
      else if (!hasBottom) holder = "P";
      else holder = "V";

      const isFirstInRow = !hasLeft;
      const isLastInRow = !hasRight;

      // Left clamp
      if (isFirstInRow) {
        clamps.push({
          row,
          col: col - 0.5,
          holder,
          clampType: "G",
          side: "left",
        });
      }
      
      // Right clamp
      if (isLastInRow) {
        clamps.push({
          row,
          col: col + 0.5,
          holder,
          clampType: "G",
          side: "right",
        });
      }

      // Between clamps (Clamp V)
      if (hasLeft && hasRight) {
        clamps.push({
          row,
          col: col - 0.5,
          holder,
          clampType: "V",
          side: "left",
        });
        clamps.push({
          row,
          col: col + 0.5,
          holder,
          clampType: "V",
          side: "right",
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
    const moduleY = module.row * CELL_SIZE;
    
    setDragOffset({
      x: e.clientX - rect.left - moduleX,
      y: e.clientY - rect.top - moduleY
    });
    setDraggingModule(moduleId);
  };

   const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingModule === null || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    const newCol = Math.max(0, Math.min(GRID_COLS - 1, Math.round(x / CELL_SIZE)));
    const newRow = Math.max(0, Math.min(gridRows - 1, Math.round(y / CELL_SIZE)));
    
    // Check if position is occupied
    const isOccupied = modules.some(
      m => m.id !== draggingModule && m.row === newRow && m.col === newCol
    );
    
    if (!isOccupied) {
      setModules(prev =>
        prev.map(m =>
          m.id === draggingModule
            ? { ...m, row: newRow, col: newCol }
            : m
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingModule(null);
  };

  const clamps = getClamps();

  return (
    <div className="solar-canvas">
      <h2 className="solar-canvas__title">Solar Roof Canvas</h2>
      
      <div
        ref={canvasRef}
        className="solar-canvas__grid"
        style={{
          width: gridCols * CELL_SIZE,
          height: gridRows * CELL_SIZE,
          position: 'relative',
          border: '2px solid #333',
          backgroundColor: '#f5f5f5',
          cursor: draggingModule !== null ? 'grabbing' : 'default'
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
              position: 'absolute',
              top: i * CELL_SIZE,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: '#ddd'
            }}
          />
        ))}
        {Array.from({ length: gridCols + 1 }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: i * CELL_SIZE,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: '#ddd'
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
              top: clamp.row * CELL_SIZE + CELL_SIZE / 2 - 10,
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
          const holderRow = clamp.holder === "P" ? clamp.row + 1 : clamp.row - 1;
          const top = Math.max(0, holderRow * CELL_SIZE + CELL_SIZE / 2 - 10);

          // Show on every other column (odd columns)
          const showEveryOtherColumn = Math.round(clamp.col * 2) % 4 === 1;
          
          // Always show if it's the top row (holder === "G")
          if (showEveryOtherColumn && clamp.holder !== "G") return null;

          return (
            <div
              key={`holder-${idx}`}
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
              {clamp.holder}
            </div>
          );
        })}

        {/* Modules */}
        {modules.map(module => (
          <div
            key={module.id}
            style={{
              position: 'absolute',
              left: (module.col+1) * CELL_SIZE + 5,
              top: module.row * CELL_SIZE + 5,
              width: CELL_SIZE - 10,
              height: CELL_SIZE - 10,
              backgroundColor: '#4a90e2',
              border: '2px solid #2e5c8a',
              borderRadius: 4,
              zIndex: draggingModule === module.id ? 10 : 2,
              opacity: draggingModule === module.id ? 0.7 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, module.id)}
          />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <p>Modules: {state.moduleCount}</p>
        <p>Rows: {state.rowsCount}</p>
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