import { useEffect, useRef, useState } from "react";
import { ImageCard } from "../../components/ui/ImageCard";
import { InputField } from "../../components/ui/InputField";
import { useTranslation } from "react-i18next";
import { FormGrid } from "../../components/layout/FormGrid";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./SolarRoofCalculator.css";

const MODULE_WIDTH = 1134;

type BatteryType = "ploksciasStogas" | "slaitinisStogas" | null;
type Orientation = "PT" | "RV" | null;
type SystemKey =
  | "PT5"
  | "PT10"
  | "PT15"
  | "PT20"
  | "PT15-L"
  | "RV10"
  | "RV10-Z"
  | null;
type RoofMaterial =
  | "cement"
  | "valcuota"
  | "cerpiu"
  | "bitumine"
  | "skarda"
  | null;

export default function SolarRoofCalculator() {
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
        orientation: Orientation;
        system: SystemKey;
        moduleColor: string;
        moduleConstruction: string;
        gapBetweenRows: number;
        roofMaterial: RoofMaterial;
        mountingMethod: string;
        rowModuleCounts?: number[];
      }
    | undefined;

  const [batteryType, setBatteryType] = useState<BatteryType>(
    restoredState?.batteryType ?? null,
  );

  const [orientation, setOrientation] = useState<Orientation>(
    restoredState?.orientation ?? null,
  );

  const [system, setSystem] = useState<SystemKey>(
    restoredState?.system ?? null,
  );

  const prevOrientationRef = useRef<Orientation>(
    restoredState?.orientation ?? null,
  );

  const [roofMaterial, setRoofMaterial] = useState<RoofMaterial>(
    restoredState?.roofMaterial ?? null,
  );

  const [moduleLength, setModuleLength] = useState<number>(
    restoredState?.moduleLength ?? 1762,
  );

  const [moduleCount, setModuleCount] = useState<number>(
    restoredState?.moduleCount ?? 0,
  );

  const [moduleThickness, setModuleThickness] = useState<number>(
    restoredState?.moduleThickness ?? 30,
  );

  const [moduleColor, setModuleColor] = useState<string>(
    restoredState?.moduleColor ?? "",
  );

  const [mountingMethod, setMountingMethod] = useState<string>(
    restoredState?.mountingMethod ?? "",
  );

  const [moduleConstruction, setModuleConstruction] = useState<string>(
    restoredState?.moduleConstruction ?? "",
  );

  const [gapBetweenRows, setGapBetweenRows] = useState<number | null>(
    restoredState?.gapBetweenRows ?? null,
  );

  const [rowsCount, setRowsCount] = useState<number>(
    restoredState?.rowsCount ?? 2,
  );

  const [rowModuleCounts, setRowModuleCounts] = useState<number[]>(
    restoredState?.rowModuleCounts?.length
      ? restoredState.rowModuleCounts
      : restoredState?.moduleCount
        ? [restoredState.moduleCount]
        : [0],
  );

  const isRv =
    batteryType === "ploksciasStogas" && orientation === "RV";

  const rowsCountError =
    isRv && rowsCount % 2 !== 0
      ? "Eilučių skaičius turi būti lyginis."
      : "";
      

  const systemOptions = t("system", { returnObjects: true }) as Record<
    string,
    string
  >;
  const systemEntriesAll = Object.entries(systemOptions).filter(
    ([key]) => key !== "systemTitle" && key !== "select",
  );

  const roofMaterialEntries = Object.entries(
    t("roofSurface", { returnObjects: true }) as Record<string, string>,
  );

  const roofMountingMethodsEntries = Object.entries(
    t("mountingMethods", { returnObjects: true }) as Record<string, string>,
  );

  const roofMountingMethodDisabled =
    !roofMaterial ||
    roofMaterial === "cement" ||
    roofMaterial === "valcuota" ||
    roofMaterial === "cerpiu";

  //Mounting method rules
  const allowedMountingMethods: string[] = (() => {
    if (!roofMaterial) return [];

    if (roofMaterial === "cement") return ["studs"];
    if (roofMaterial === "valcuota") return ["clamps"];
    if (roofMaterial === "cerpiu") return ["hooks"];
    if (roofMaterial === "bitumine") return ["screwsR", "studs"];
    if (roofMaterial === "skarda")
      return ["screwsR", "screwsEPDM40", "screwsEPDM80"];
    return [];
  })();

  const filteredRoofMountingMethodsEntries = roofMaterial
    ? roofMountingMethodsEntries.filter(([key]) =>
        allowedMountingMethods.includes(key),
      )
    : roofMountingMethodsEntries;

  useEffect(() => {
    if (batteryType === "slaitinisStogas") {
      setOrientation(null);
      setSystem(null);
    } else if (batteryType === "ploksciasStogas") {
      setRoofMaterial(null);
      setMountingMethod("");
    }
  }, [batteryType]);

  useEffect(() => {
    if (prevOrientationRef.current !== orientation) {
      if (prevOrientationRef.current !== null) {
        setSystem(null);
      }
      prevOrientationRef.current = orientation;
    }
  }, [orientation]);

  // Auto-set / keep mountingMethod valid when roof material changes
  useEffect(() => {
    if (!roofMaterial) {
      if (mountingMethod !== "") setMountingMethod("");
      return;
    }

    // Forced mappings
    if (roofMaterial === "cement") {
      if (mountingMethod !== "studs") setMountingMethod("studs");
      return;
    }
    if (roofMaterial === "valcuota") {
      if (mountingMethod !== "clamps") setMountingMethod("clamps");
      return;
    }
    if (roofMaterial === "cerpiu") {
      if (mountingMethod !== "hooks") setMountingMethod("hooks");
      return;
    }

    if (
      mountingMethod !== "" &&
      !allowedMountingMethods.includes(mountingMethod)
    ) {
      setMountingMethod("");
    }
  }, [roofMaterial, mountingMethod, allowedMountingMethods.join(",")]);

  const systemEntriesPT = systemEntriesAll.filter(([key]) =>
    key.startsWith("PT"),
  );
  const systemEntriesRV = systemEntriesAll.filter(([key]) =>
    key.startsWith("RV"),
  );

  const isOver2m = moduleLength > 2000;

  const needsIndividualForLongModules =
    isOver2m && (system === "PT5" || system === "PT20");

  // Module construction rules (PT + RV)
  useEffect(() => {
    if (!system) return;

    // RV rules
    if (system === "RV10") {
      // <= 2m => trumpoji, > 2m => abi
      const next = isOver2m ? "abi" : "trumpoji";
      if (moduleConstruction !== next) setModuleConstruction(next);
      return;
    }

    if (system === "RV10-Z") {
      // always trumpoji
      if (moduleConstruction !== "trumpoji") setModuleConstruction("trumpoji");
      return;
    }

    // PT15-L rules
    if (system === "PT15-L") {
      if (isOver2m) {
        if (moduleConstruction !== "ilgoji") setModuleConstruction("ilgoji");
      } else {
        const allowed =
          moduleConstruction === "trumpoji" || moduleConstruction === "ilgoji";
        if (!allowed && moduleConstruction !== "") setModuleConstruction("");
      }
      return;
    }

    // PT5/PT10/PT15/PT20 rules
    if (!isOver2m) {
      if (moduleConstruction !== "trumpoji") setModuleConstruction("trumpoji");
      return;
    }

    // > 2m
    if (system === "PT5" || system === "PT20") {
      if (moduleConstruction !== "") setModuleConstruction("");
      return;
    }

    if (moduleConstruction !== "abi") setModuleConstruction("abi");
  }, [system, isOver2m, moduleConstruction]);

  useEffect(() => {
    if (batteryType !== "slaitinisStogas") return;

    setRowModuleCounts((prev) => {
      const nextLen = Math.max(1, rowsCount || 1);
      const next = prev.slice(0, nextLen);

      while (next.length < nextLen) next.push(next[next.length - 1] ?? 0);

      return next;
    });
  }, [batteryType, rowsCount]);

  // Dropdown options/lock state (PT + RV)
  const constructionSelectDisabled =
    !system || system.startsWith("RV") || !(system === "PT15-L" && !isOver2m); // only PT15-L <=2m is selectable

  const allowedConstructionOptions: string[] = (() => {
    if (!system) return ["trumpoji", "ilgoji", "abi"];

    // RV options
    if (system === "RV10") {
      return isOver2m ? ["abi"] : ["trumpoji"];
    }
    if (system === "RV10-Z") {
      return ["trumpoji"];
    }

    // PT options
    if (system === "PT15-L") {
      if (isOver2m) return ["ilgoji"];
      return ["trumpoji", "ilgoji"];
    }

    // PT5/PT10/PT15/PT20
    if (!isOver2m) return ["trumpoji"];
    if (system === "PT5" || system === "PT20") return [];
    return ["abi"];
  })();

  const constructionOptions: Array<{ value: string; label: string }> = [
    { value: "trumpoji", label: t("sides.short") },
    { value: "ilgoji", label: t("sides.long") },
    { value: "abi", label: t("sides.both") },
  ].filter((opt) => allowedConstructionOptions.includes(opt.value));

  useEffect(() => {
    if (!system) {
      if (moduleConstruction !== "") setModuleConstruction("");
      return;
    }

    // Forced mappings
    if (system === "RV10") {
      const forced = isOver2m ? "abi" : "trumpoji";
      if (moduleConstruction !== forced) setModuleConstruction(forced);
      return;
    }
    if (system === "RV10-Z") {
      if (moduleConstruction !== "trumpoji") setModuleConstruction("trumpoji");
      return;
    }
    if (system === "PT15-L" && isOver2m) {
      if (moduleConstruction !== "ilgoji") setModuleConstruction("ilgoji");
      return;
    }
    if (
      (system === "PT5" ||
        system === "PT10" ||
        system === "PT15" ||
        system === "PT20") &&
      !isOver2m
    ) {
      if (moduleConstruction !== "trumpoji") setModuleConstruction("trumpoji");
      return;
    }
    if ((system === "PT10" || system === "PT15") && isOver2m) {
      if (moduleConstruction !== "abi") setModuleConstruction("abi");
      return;
    }

    if (
      moduleConstruction !== "" &&
      !allowedConstructionOptions.includes(moduleConstruction)
    ) {
      setModuleConstruction("");
    }
  }, [
    system,
    isOver2m,
    moduleConstruction,
    allowedConstructionOptions.join(","),
  ]);

  // gapBetweenRows rules (PT + RV)
  const gapConfig:
    | { kind: "none" }
    | { kind: "fixed"; value: number }
    | { kind: "select"; options: number[]; defaultValue: number }
    | { kind: "free"; defaultValue: number; min: number } = (() => {
    if (!system) return { kind: "none" };

    // RV
    if (system === "RV10")
      return { kind: "select", options: [100, 275], defaultValue: 100 };
    if (system === "RV10-Z") return { kind: "free", defaultValue: 100, min: 0 };

    // PT
    if (system === "PT5") return { kind: "fixed", value: 275 };
    if (system === "PT10")
      return { kind: "select", options: [275, 405], defaultValue: 275 };
    if (system === "PT15")
      return { kind: "select", options: [475, 550, 710], defaultValue: 550 };
    if (system === "PT20") return { kind: "fixed", value: 750 };

    // PT15-L not fixed: default/min 550
    return { kind: "free", defaultValue: 550, min: 550 };
  })();

  // keep gapBetweenRows in sync with selected system
  useEffect(() => {
    if (gapConfig.kind === "none") {
      if (gapBetweenRows !== null) setGapBetweenRows(null);
      return;
    }

    if (gapConfig.kind === "fixed") {
      if (gapBetweenRows !== gapConfig.value)
        setGapBetweenRows(gapConfig.value);
      return;
    }

    if (gapConfig.kind === "select") {
      if (
        gapBetweenRows === null ||
        !gapConfig.options.includes(gapBetweenRows)
      ) {
        setGapBetweenRows(gapConfig.defaultValue);
      }
      return;
    }

    // free
    if (gapBetweenRows === null) {
      setGapBetweenRows(gapConfig.defaultValue);
      return;
    }
    if (gapBetweenRows < gapConfig.min) {
      setGapBetweenRows(gapConfig.min);
    }
  }, [
    system,
    gapConfig.kind,
    gapBetweenRows,
    gapConfig.kind === "fixed" ? gapConfig.value : null,
    gapConfig.kind === "select" ? gapConfig.options.join(",") : null,
    gapConfig.kind === "select" ? gapConfig.defaultValue : null,
    gapConfig.kind === "free" ? gapConfig.min : null,
    gapConfig.kind === "free" ? gapConfig.defaultValue : null,
  ]);

  // block/rows count rule for RV
  useEffect(() => {
    if (!system) return;

    if (system === "RV10-Z") {
      if (!Number.isFinite(rowsCount) || rowsCount < 2) setRowsCount(2);
      return;
    }

    // PT15-L also uses rowsCount
    if (system === "PT15-L") {
      if (!Number.isFinite(rowsCount) || rowsCount < 2) setRowsCount(2);
      return;
    }

    if (!Number.isFinite(rowsCount) || rowsCount < 2) setRowsCount(2);
  }, [system]);

  const showActions = Boolean(batteryType && orientation && system || roofMaterial);

  return (
    <div className="solar-calculator">
      <h2>{t("title.selectBattery")}</h2>

      <div className="solar-calculator__battery-list">
        <ImageCard
          title={t("batteryTypes.ploksciasStogas")}
          image="/images/flat.jpg"
          selected={batteryType === "ploksciasStogas"}
          onClick={() => setBatteryType("ploksciasStogas")}
        />
        <ImageCard
          title={t("batteryTypes.slaitinisStogas")}
          image="/images/roof.jpg"
          selected={batteryType === "slaitinisStogas"}
          onClick={() => setBatteryType("slaitinisStogas")}
        />
      </div>

      {batteryType === "ploksciasStogas" && (
        <div className="solar-calculator__orientation_select">
          <h3>{t("sections.moduleOrientation")}</h3>
          {/* Orientation Radio Buttons */}
          <label>
            <input
              type="radio"
              name="orientation"
              value="PT"
              checked={orientation === "PT"}
              onChange={() => setOrientation("PT")}
            />{" "}
            {t("orientation.PT")}
          </label>

          <label>
            <input
              type="radio"
              name="orientation"
              value="RV"
              checked={orientation === "RV"}
              onChange={() => setOrientation("RV")}
            />{" "}
            {t("orientation.RV")}
          </label>
        </div>
      )}

      {orientation === "PT" && batteryType === "ploksciasStogas" && (
        <div className="solar-calculator__content">
          <h3>{t("sections.modules")}</h3>
          {/* Module Input Fields */}
          <FormGrid columns={2}>
            {/* Block/Row count */}
            {system === "PT15-L" ? (
              <InputField label={t("fields.rowsCount")}>
                <input
                  type="number"
                  min={2}
                  value={rowsCount}
                  onChange={(e) =>
                    setRowsCount(Math.max(2, Number(e.target.value)))
                  }
                />
              </InputField>
            ) : (
              <InputField label={t("fields.rowsCount")}>
                <input
                  type="number"
                  min={2}
                  value={rowsCount}
                  onChange={(e) =>
                    setRowsCount(Math.max(2, Number(e.target.value)))
                  }
                />
              </InputField>
            )}

            <InputField label={t("fields.moduleCountRoof")}>
              <input
                type="number"
                min={0}
                max={200}
                onChange={(e) => setModuleCount(Number(e.target.value))}
                value={moduleCount}
              />
            </InputField>

            <InputField label={t("system.systemTitle")}>
              <select
                value={system ?? ""}
                onChange={(e) =>
                  setSystem((e.target.value || null) as SystemKey)
                }
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>

                {systemEntriesPT.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </InputField>

            {/* Module Length Input */}
            <InputField label={t("fields.moduleLengthRoof")}>
              <input
                type="number"
                min={1762}
                max={9999}
                onChange={(e) => setModuleLength(Number(e.target.value))}
                value={moduleLength}
              />
            </InputField>

            {/* Module Thickness Input */}
            <InputField label={t("fields.moduleThickness")}>
              <select
                value={moduleThickness ?? ""}
                onChange={(e) => setModuleThickness(Number(e.target.value))}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="30">30 mm</option>
                <option value="35">35 mm</option>
              </select>
            </InputField>

            {/* Module Color Selection */}

            <InputField label={t("fields.moduleColor")}>
              <select
                value={moduleColor ?? ""}
                onChange={(e) => setModuleColor(e.target.value)}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="juoda">{t("color.black")}</option>
                <option value="pilka">{t("color.grey")}</option>
              </select>
            </InputField>

            {/* Module Construction Selection */}
            <InputField label={t("fields.moduleConstruction")}>
              <div>
                <select
                  value={moduleConstruction ?? ""}
                  disabled={
                    constructionSelectDisabled || needsIndividualForLongModules
                  }
                  onChange={(e) => setModuleConstruction(e.target.value)}
                >
                  <option value="" disabled>
                    {t("select.placeholder")}
                  </option>

                  {constructionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {needsIndividualForLongModules && (
                  <div>
                    <em>{t("fields.moduleConstructionNote")}</em>
                  </div>
                )}
              </div>
            </InputField>

            {/* Module Row Gap Input */}
            <InputField label={t("fields.gapBetweenRows")}>
              {gapConfig.kind === "none" ? (
                <input
                  type="number"
                  value=""
                  disabled
                  placeholder={t("select.placeholder")}
                />
              ) : gapConfig.kind === "free" ? (
                <input
                  type="number"
                  min={gapConfig.min}
                  value={gapBetweenRows ?? ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setGapBetweenRows(Number.isFinite(v) ? v : null);
                  }}
                />
              ) : (
                <select
                  value={gapBetweenRows ?? ""}
                  disabled={gapConfig.kind === "fixed"}
                  onChange={(e) => setGapBetweenRows(Number(e.target.value))}
                >
                  {gapConfig.kind !== "fixed" && (
                    <option value="" disabled>
                      {t("select.placeholder")}
                    </option>
                  )}
                  {(gapConfig.kind === "fixed"
                    ? [gapConfig.value]
                    : gapConfig.options
                  ).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </InputField>
          </FormGrid>
        </div>
      )}

      {orientation === "RV" && batteryType === "ploksciasStogas" && (
        <div className="solar-calculator__content">
          <h3>{t("sections.modules")}</h3>
          <FormGrid columns={2}>
            {/* RV blocks/rows*/}
            <InputField label={t("fields.rowsCount")}>
              <input
                type="number"
                min={2}
                value={rowsCount}
                onChange={(e) =>
                  setRowsCount(Math.max(2, Number(e.target.value)))
                }
              />
              {rowsCountError && (
                <div style={{ color: "#b00020", marginTop: 6 }}>
                  {rowsCountError}
                </div>
              )}
            </InputField>

            <InputField label={t("fields.moduleCountRoof")}>
              <input
                type="number"
                min={0}
                max={200}
                onChange={(e) => setModuleCount(Number(e.target.value))}
                value={moduleCount}
              />
            </InputField>

            <InputField label={t("system.systemTitle")}>
              <select
                value={system ?? ""}
                onChange={(e) =>
                  setSystem((e.target.value || null) as SystemKey)
                }
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>

                {systemEntriesRV.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </InputField>

            {/* RV module length*/}
            <InputField label={t("fields.moduleLengthRoof")}>
              <input
                type="number"
                min={1762}
                max={9999}
                onChange={(e) => setModuleLength(Number(e.target.value))}
                value={moduleLength}
              />
            </InputField>

            <InputField label={t("fields.moduleThickness")}>
              <select
                value={moduleThickness ?? ""}
                onChange={(e) => setModuleThickness(Number(e.target.value))}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="30">30 mm</option>
                <option value="35">35 mm</option>
              </select>
            </InputField>

            <InputField label={t("fields.moduleColor")}>
              <select
                value={moduleColor ?? ""}
                onChange={(e) => setModuleColor(e.target.value)}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="juoda">{t("color.black")}</option>
                <option value="pilka">{t("color.grey")}</option>
              </select>
            </InputField>

            {/* RV model construction */}
            <InputField label={t("fields.moduleConstruction")}>
              <select value={moduleConstruction ?? ""} disabled={true}>
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                {constructionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </InputField>

            {/* RV gaps*/}
            <InputField label={t("fields.gapBetweenRows")}>
              {gapConfig.kind === "none" ? (
                <input
                  type="number"
                  value=""
                  disabled
                  placeholder={t("select.placeholder")}
                />
              ) : gapConfig.kind === "free" ? (
                <input
                  type="number"
                  min={gapConfig.min}
                  value={gapBetweenRows ?? ""}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setGapBetweenRows(Number.isFinite(v) ? v : null);
                  }}
                />
              ) : (
                <select
                  value={gapBetweenRows ?? ""}
                  disabled={gapConfig.kind === "fixed"}
                  onChange={(e) => setGapBetweenRows(Number(e.target.value))}
                >
                  {gapConfig.kind !== "fixed" && (
                    <option value="">{t("select.placeholder")}</option>
                  )}
                  {(gapConfig.kind === "fixed"
                    ? [gapConfig.value]
                    : gapConfig.options
                  ).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </InputField>
          </FormGrid>
        </div>
      )}

      {batteryType === "slaitinisStogas" && (
        <div className="solar-calculator__content">
          <FormGrid columns={2}>
            <InputField label={t("fields.roofMaterial")}>
              <select
                value={roofMaterial ?? ""}
                onChange={(e) =>
                  setRoofMaterial((e.target.value || null) as RoofMaterial)
                }
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>

                {roofMaterialEntries.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </InputField>
            <InputField label={t("fields.mountingMethod")}>
              <select
                value={mountingMethod ?? ""}
                onChange={(e) => setMountingMethod(e.target.value)}
                disabled={roofMountingMethodDisabled}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>

                {filteredRoofMountingMethodsEntries.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </InputField>

            <InputField label={t("sections.moduleOrientation")}>
              <select
                value={orientation ?? ""}
                onChange={(e) => setOrientation(e.target.value as Orientation)}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="vertical">{t("orientation.vertical")}</option>
                <option value="horizontal">
                  {t("orientation.horizontal")}
                </option>
              </select>
            </InputField>

            <InputField label={t("fields.moduleLength")}>
              <input
                type="number"
                min={1762}
                max={2400}
                onChange={(e) => setModuleLength(Number(e.target.value))}
                value={moduleLength}
              />
            </InputField>

            <InputField label={t("fields.moduleThickness")}>
              <select
                value={moduleThickness ?? ""}
                onChange={(e) => setModuleThickness(30)}
                disabled={true}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="30">30 mm</option>
              </select>
            </InputField>

            <InputField label={t("fields.moduleColor")}>
              <select
                value={moduleColor ?? ""}
                onChange={(e) => setModuleColor(e.target.value)}
              >
                <option value="" disabled>
                  {t("select.placeholder")}
                </option>
                <option value="juoda">{t("color.black")}</option>
                <option value="pilka">{t("color.grey")}</option>
              </select>
            </InputField>

            <InputField label={t("fields.rowsCount")}>
              <input
                type="number"
                min={1}
                value={rowsCount}
                onChange={(e) => setRowsCount(Number(e.target.value))}
              />
            </InputField>

            <InputField label={t("fields.moduleCountRoof")}>
              <div style={{ display: "grid", gap: 8 }}>
                {rowModuleCounts.map((v, idx) => (
                  <label key={idx} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "center" }}>
                    <span>{idx + 1} eilė</span>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={v}
                      onChange={(e) => {
                        const n = Math.max(0, Number(e.target.value));
                        setRowModuleCounts((prev) => {
                          const copy = [...prev];
                          copy[idx] = n;
                          return copy;
                        });
                        
                        if (idx === 0) setModuleCount(n);
                      }}
                    />
                  </label>
                ))}
              </div>
            </InputField>
          </FormGrid>
        </div>
      )}

      {showActions &&  (
        <div className="solar-calculator__actions-row">
          <button
            className="solar-calculator__actions"
            onClick={() => navigate("/", {})}
          >
            Grįžti atgal
          </button>

          {moduleCount % 2 !== 0 && batteryType === "ploksciasStogas" && (
            <button
              className="solar-calculator__actions"
              disabled={Boolean(rowsCountError)}
              onClick={() =>
                navigate("/canvasRoof", {
                  state: {
                    batteryType,
                    moduleCount,
                    moduleLength,
                    moduleWidth: MODULE_WIDTH,
                    moduleThickness,
                    rowsCount,
                    orientation,
                    system,
                    moduleColor,
                    moduleConstruction,
                    gapBetweenRows,
                    roofMaterial,
                    mountingMethod,
                    rowModuleCounts,
                  },
                })
              }
            >
              {t("actions.next")}
            </button>
          )}
          {(moduleCount % 2 === 0 || batteryType === "slaitinisStogas") && (
            <button
              className="solar-calculator__actions"
              disabled={Boolean(rowsCountError)}
              onClick={() =>
                navigate("/summaryRoof", {
                  state: {
                    batteryType,
                    moduleCount,
                    moduleLength,
                    moduleWidth: MODULE_WIDTH,
                    moduleThickness,
                    rowsCount,
                    orientation,
                    system,
                    moduleColor,
                    moduleConstruction,
                    gapBetweenRows,
                    roofMaterial,
                    mountingMethod,
                    rowModuleCounts:
                      batteryType === "slaitinisStogas"
                        ? rowModuleCounts
                        : undefined,
                  },
                })
              }
            >
              {t("actions.next")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
