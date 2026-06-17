import { useEffect, useState } from "react";
import { ImageCard } from "../../components/ui/ImageCard";
import { InputField } from "../../components/ui/InputField";
import { useTranslation } from "react-i18next";
import { FormGrid } from "../../components/layout/FormGrid";
import { useNavigate, useLocation } from "react-router-dom";
import { useReadonlyMode } from "../../hooks/useReadonlyMode";
import "../SolarCalculator.css";

const GAP_MM = 20;
const MAX_LENGTH = 32000;

type BatteryType = "ezys" | "poline" | null;
type ProfileLength = 4200 | 5200;

const isFocusable = (element: Element | null): element is HTMLElement => {
  if (!element) return false;
  const anyEl = element as any;
  if (anyEl.disabled) return false;
  if ((element as HTMLElement).tabIndex === -1) return false;
  if (element instanceof HTMLInputElement && element.type === "hidden") return false;
  return typeof (element as HTMLElement).focus === "function";
};

const handleEnterAsTab = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const form = e.currentTarget.form;
  if (!form) return;
  const elements = Array.from(form.elements);
  const index = elements.indexOf(e.currentTarget);
  for (let i = index + 1; i < elements.length; i++) {
    const next = elements[i] as Element;
    if (isFocusable(next)) { (next as HTMLElement).focus(); break; }
  }
};

function calculateConstructionLength({ moduleWidth, rowsCount, reserve, gap }: {
  moduleWidth: number; rowsCount: number; reserve: number; gap: number;
}) {
  return Math.ceil((moduleWidth * rowsCount + reserve * 2 + (rowsCount - 1) * gap) / 100) * 100;
}

export default function SolarGroundCalculator() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const { readonly, data: roData, loading: roLoading, error: roError } = useReadonlyMode<any>();

  const seed = roData ?? location.state as any;

  const [batteryType, setBatteryType] = useState<BatteryType>(seed?.batteryType ?? null);
  const [profileLength, setProfileLength] = useState<ProfileLength>(seed?.profileLength ?? 5200);
  const [moduleColor, setModuleColor] = useState<string>(seed?.moduleColor ?? "juoda");
  const [moduleWidth, setModuleWidth] = useState<number>(seed?.moduleWidth ?? 1134);
  const [moduleCount, setModuleCount] = useState<string>(seed?.moduleCount?.toString() ?? "36");
  const [moduleLength, setModuleLength] = useState<string>(seed?.moduleLength?.toString() ?? "2250");
  const [moduleThickness, setModuleThickness] = useState<number>(seed?.moduleThickness ?? 30);

  useEffect(() => {
    if (!roData) return;
    if (roData.batteryType) setBatteryType(roData.batteryType);
    if (roData.profileLength) setProfileLength(roData.profileLength);
    if (roData.moduleColor) setModuleColor(roData.moduleColor);
    if (roData.moduleWidth) setModuleWidth(roData.moduleWidth);
    if (roData.moduleCount != null) setModuleCount(String(roData.moduleCount));
    if (roData.moduleLength != null) setModuleLength(String(roData.moduleLength));
    if (roData.moduleThickness) setModuleThickness(roData.moduleThickness);
  }, [roData]);

  const moduleCountNumber = Number(moduleCount);
  const moduleLengthNumber = Number(moduleLength);
  const moduleCountMin = moduleWidth === 1303 ? 6 : 8;
  const moduleCountMax = moduleWidth === 1303 ? 48 : 54;
  const moduleLengthMin = moduleWidth === 1303 ? 2201 : 1700;
  const moduleLengthMax = 2400;
  const isModuleCountValid = moduleCount !== "" && moduleCountNumber >= moduleCountMin && moduleCountNumber <= moduleCountMax && moduleCountNumber % 2 === 0;
  const isModuleLengthValid = moduleLength !== "" && moduleLengthNumber >= moduleLengthMin && moduleLengthNumber <= moduleLengthMax;
  const rowsCount = isModuleCountValid ? moduleCountNumber / 2 : 0;
  const reserve = moduleCountNumber <= 24 ? 50 : 100;
  const constructionLength = isModuleCountValid
    ? calculateConstructionLength({ moduleWidth, rowsCount, reserve, gap: GAP_MM })
    : 0;
  const isConstructionValid = constructionLength <= MAX_LENGTH;
  const isFormValid = batteryType && isModuleCountValid && isModuleLengthValid && isConstructionValid;

  if (roLoading) return <div className="readonly-status">Kraunama...</div>;
  if (roError)   return <div className="readonly-status readonly-status--error">⚠️ {roError}</div>;

  return (
    <div className="solar-calculator">
      {readonly && (
        <div className="readonly-banner">
          👁 Peržiūros režimas — redaguoti negalima
        </div>
      )}
      <h2>{t("title.selectGroundBatteryType")}</h2>

      <div className="solar-calculator__battery-list">
        <ImageCard
          title={t("batteryTypes.ezys")}
          description={t("batteryTypes.ezysDescription")}
          image="/images/ezys.jpg"
          selected={batteryType === "ezys"}
          onClick={() => { if (!readonly) setBatteryType("ezys"); }}
        />
        <ImageCard
          title={t("batteryTypes.poline")}
          description={t("batteryTypes.polineDescription")}
          image="/images/poline.jpg"
          selected={batteryType === "poline"}
          onClick={() => { if (!readonly) setBatteryType("poline"); }}
        />
      </div>

      {batteryType && (
        <form className="solar-calculator__ground-form" onSubmit={(e) => e.preventDefault()}>
          <div className="solar-calculator__section_box">
            <h3>{t("sections.modules")}</h3>
            <FormGrid columns={2}>
              <InputField label={t("fields.moduleLength", { min: moduleLengthMin, max: moduleLengthMax })}>
                <input
                  className={!isModuleLengthValid ? "input-error" : ""}
                  type="number" value={moduleLength}
                  onChange={(e) => setModuleLength(e.target.value)}
                  onKeyDown={handleEnterAsTab}
                  disabled={readonly}
                />
                {!isModuleLengthValid && <div className="error-text">{t("errors.moduleLength", { min: moduleLengthMin, max: moduleLengthMax })}</div>}
              </InputField>

              <InputField label={t("fields.moduleWidth")}>
                <select value={moduleWidth} onChange={(e) => setModuleWidth(Number(e.target.value))} disabled={readonly}>
                  <option value={1134}>1134 mm</option>
                  <option value={1303}>1303 mm</option>
                </select>
              </InputField>

              <InputField label={t("fields.moduleThickness")}>
                <select value={moduleThickness} onChange={(e) => setModuleThickness(Number(e.target.value))} disabled={readonly}>
                  <option value={30}>30 mm</option>
                  <option value={35}>35 mm</option>
                </select>
              </InputField>

              <InputField label={t("fields.moduleColor")}>
                <select value={moduleColor} onChange={(e) => setModuleColor(e.target.value)} disabled={readonly}>
                  <option value="juoda">{t("color.black")}</option>
                  <option value="pilka">{t("color.grey")}</option>
                </select>
              </InputField>
            </FormGrid>
          </div>

          <div className="solar-calculator__section_box solar-calculator__system_data_box">
            <h3>{t("sections.systemData")}</h3>
            <span>{t("fields.descriptionText")}</span>
            <FormGrid columns={2}>
              <InputField label={t("fields.moduleCount", { min: moduleCountMin, max: moduleCountMax })}>
                <input
                  className={!isModuleCountValid ? "input-error" : ""}
                  type="number" value={moduleCount}
                  onKeyDown={handleEnterAsTab}
                  onChange={(e) => setModuleCount(e.target.value)}
                  disabled={readonly}
                  onBlur={() => {
                    if (readonly || moduleCount === "") return;
                    const n = Number(moduleCount);
                    if (!isNaN(n) && n % 2 !== 0) setModuleCount(String(n + 1));
                  }}
                />
                {!isModuleCountValid && <div className="error-text">{t("errors.moduleCount", { min: moduleCountMin, max: moduleCountMax })}</div>}
              </InputField>

              <InputField label={t("fields.profileLength")}>
                <select value={profileLength} onChange={(e) => setProfileLength(Number(e.target.value) as ProfileLength)} disabled={readonly}>
                  <option value={5200}>5200 mm</option>
                  <option value={4200}>4200 mm</option>
                </select>
              </InputField>

              <InputField label={t("fields.constructionLength")}>
                <input type="number" max={32000} value={constructionLength} disabled />
              </InputField>

              <InputField label={t("fields.rowsCount")}>
                <input type="number" value={rowsCount} disabled />
              </InputField>
            </FormGrid>
          </div>
        </form>
      )}

      {!readonly && (
        <>
          <button type="button" className="solar-calculator__actions_back" onClick={() => navigate("/", {})}>
            {t("actions.back")}
          </button>
          <button
            type="button"
            className="solar-calculator__actions"
            disabled={!isFormValid}
            onClick={() => navigate("/checkout", {
              state: { batteryType, moduleCount, moduleLength, moduleWidth, moduleThickness, moduleColor, constructionLength, rowsCount, reserve, gap: GAP_MM, profileLength },
            })}
          >
            {t("actions.calculate")}
          </button>
        </>
      )}
    </div>
  );
}
