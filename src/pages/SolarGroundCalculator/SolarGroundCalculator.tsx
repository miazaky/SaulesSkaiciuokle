import { useState } from "react";
import { ImageCard } from "../../components/ui/ImageCard";
import { InputField } from "../../components/ui/InputField";
import { useTranslation } from "react-i18next";
import { FormGrid } from "../../components/layout/FormGrid";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./SolarGroundCalculator.css";

const MODULE_WIDTH = 1134;
const GAP_MM = 20;

type BatteryType = "ezys" | "poline" | null;

function calculateConstructionLength({moduleWidth, rowsCount, reserve, gap}: {
  moduleWidth: number;
  rowsCount: number;
  reserve: number;
  gap: number;
}) {
  return (
    Math.ceil(
      (moduleWidth * rowsCount +
        reserve * 2 +
        (rowsCount - 1) * gap) / 100
    ) * 100
  );
}

export default function SolarGroundCalculator() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const restoredState = location.state as
    | {
        batteryType: BatteryType;
        moduleCount: number;
        moduleLength: number;
        moduleThickness: number;
        constructionLength: number;
        rowsCount: number;
      }
    | undefined;

  
  const [batteryType, setBatteryType] = useState<BatteryType>(restoredState?.batteryType ?? null);

  const [moduleCount, setModuleCount] = useState<number>(restoredState?.moduleCount ?? 36);
  const [moduleLength, setModuleLength] = useState<number>(restoredState?.moduleLength ?? 2250);
  const [moduleThickness, setModuleThickness] = useState<number>(restoredState?.moduleThickness ?? 30);


  const rowsCount = moduleCount / 2;
  const reserve = moduleCount <= 24 ? 50 : 100;

  const constructionLength = calculateConstructionLength({
    moduleWidth: MODULE_WIDTH,
    rowsCount,
    reserve,
    gap: GAP_MM,
  });

  return (
    <div className="solar-calculator">
      <h2>{t("title.selectBattery")}</h2>

      <div className="solar-calculator__battery-list">
        <ImageCard
          title={t("batteryTypes.ezys")}
          image="/images/ezys.jpg"
          selected={batteryType === "ezys"}
          onClick={() => setBatteryType("ezys")}
        />
        <ImageCard
          title={t("batteryTypes.poline")}
          image="/images/poline.jpg"
          selected={batteryType === "poline"}
          onClick={() => setBatteryType("poline")}
        />
      </div>

      {batteryType && (
        <div className="solar-calculator__content">
          <h3>{t("sections.modules")}</h3>
          <FormGrid columns={2}>
            <InputField label={t("fields.moduleCount")}>
              <input
                type="number"
                min={8}
                max={54}
                step={2}
                value={moduleCount}
                onChange={(e) => setModuleCount(+e.target.value)}
              />
            </InputField>

            <InputField label={t("fields.moduleLength")}>
              <input
                type="number"
                min={1700}
                max={2400}
                value={moduleLength}
                onChange={(e) => setModuleLength(+e.target.value)}
              />
            </InputField>

            <InputField label={t("fields.moduleWidth")}>
              <input type="number" value={1134} disabled />
            </InputField>

            <InputField label={t("fields.moduleThickness")}>
              <input type="number" 
              min={1}
              value={moduleThickness} 
              onChange={(e) => setModuleThickness(+e.target.value)} />
            </InputField>
          </FormGrid>

          <h3 className="solar-calculator__section">{t("sections.construction")}</h3>
          <FormGrid columns={2}>
            <InputField label={t("fields.constructionLength")}>
              <input
                type="number"
                max={32000}
                value={constructionLength}
                disabled
              />
            </InputField>

            <InputField label={t("fields.rowsCount")}>
              <input
                type="number"
                value={rowsCount}
                disabled
              />
            </InputField>

            <InputField label={t("fields.reserve")}>
              <input type="number" value={reserve} disabled />
            </InputField>

            <InputField label={t("fields.gap")}>
              <input type="number" value={GAP_MM} disabled />
            </InputField>
          </FormGrid>

          <button
            className="solar-calculator__actions"
            onClick={() =>
              navigate("/", {
              })
            }
          >
            Grįžti atgal
          </button>
          
          <button
            className="solar-calculator__actions"
            onClick={() =>
              navigate("/summary", {
                state: {
                  batteryType,
                  moduleCount,
                  moduleLength,
                  moduleWidth: MODULE_WIDTH,
                  moduleThickness,
                  constructionLength,
                  rowsCount,
                  reserve,
                  gap: GAP_MM,
                },
              })
            }
          >
            {t("actions.next")}
          </button>
        </div>
      )}
    </div>
  );
}