import { useState } from "react";
import { ImageCard } from "../../components/ui/ImageCard";
import { InputField } from "../../components/ui/InputField";
import { useTranslation } from "react-i18next";
import { FormGrid } from "../../components/layout/FormGrid";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "../SolarCalculator.css";

const MODULE_WIDTH = 1134;
const GAP_MM = 20;
const MAX_LENGTH = 32000;

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

  const [moduleCount, setModuleCount] = useState<string>(restoredState?.moduleCount.toString() ?? "36");
  const [moduleLength, setModuleLength] = useState<string>(restoredState?.moduleLength.toString() ?? "2250");
  const [moduleThickness, setModuleThickness] = useState<string>(restoredState?.moduleThickness.toString() ?? "30");


  const moduleCountNumber = Number(moduleCount);
  const moduleLengthNumber = Number(moduleLength);
  const moduleThicknessNumber = Number(moduleThickness);

  const isModuleCountValid =
    moduleCount !== "" &&
    moduleCountNumber >= 8 &&
    moduleCountNumber <= 54 &&
    moduleCountNumber % 2 === 0;

  const isModuleLengthValid =
    moduleLength !== "" &&
    moduleLengthNumber >= 1700 &&
    moduleLengthNumber <= 2400;

  const isModuleThicknessValid =
    moduleThickness !== "" &&
    moduleThicknessNumber > 0;

  const rowsCount = isModuleCountValid ? moduleCountNumber / 2 : 0;
  const reserve = moduleCountNumber <= 24 ? 50 : 100;

  const constructionLength = isModuleCountValid
    ? calculateConstructionLength({
        moduleWidth: MODULE_WIDTH,
        rowsCount,
        reserve,
        gap: GAP_MM,
      })
    : 0;

  const isConstructionValid = constructionLength <= MAX_LENGTH;

  const isFormValid =
    batteryType &&
    isModuleCountValid &&
    isModuleLengthValid &&
    isModuleThicknessValid &&
    isConstructionValid;

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
                className={!isModuleCountValid ? "input-error" : ""}
                type="number"
                value={moduleCount}
                onChange={(e) => setModuleCount(e.target.value)}
              />
              {!isModuleCountValid && (
                <div className="error-text">
                  {t("errors.moduleCount")}
                </div>
              )}
            </InputField>

            <InputField label={t("fields.moduleLength")}>
              <input
                className={!isModuleLengthValid ? "input-error" : ""}
                type="number"
                value={moduleLength}
                onChange={(e) => setModuleLength(e.target.value)}
              />
              {!isModuleLengthValid && (
                <div className="error-text">
                  {t("errors.moduleLength")}
                </div>
              )}
            </InputField>

            <InputField label={t("fields.moduleWidth")}>
              <input type="number" value={1134} disabled />
            </InputField>

            <InputField label={t("fields.moduleThickness")}>
              <input
                className={!isModuleThicknessValid ? "input-error" : ""}
                type="number" 
                value={moduleThickness} 
                onChange={(e) => setModuleThickness(e.target.value)} />
                {!isModuleThicknessValid && (
                  <div className="error-text">
                    {t("errors.moduleThickness")}
              </div>
              )}
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
            className="solar-calculator__actions_back"
            onClick={() =>
              navigate("/", {
              })
            }
          >
            {t("actions.back")}
          </button>
          
          <button
            className="solar-calculator__actions"
            disabled={!isFormValid}
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
            {t("actions.calculate")}
          </button>
        </div>
      )}
    </div>
  );
}