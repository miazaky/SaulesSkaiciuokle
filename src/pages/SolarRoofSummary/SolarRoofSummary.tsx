import { useLocation, useNavigate } from "react-router-dom";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { CalculatorInput } from "../../calculations/types";
import "./SolarRoofSummary.css";
import { useTranslation } from "react-i18next";

export default function SolarRoofSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: CalculatorInput };
  const { t } = useTranslation();

  if (!state) return <p>No data provided</p>;

  const tr = (keyOrText: string) => t(keyOrText, { defaultValue: keyOrText });
  const isSlaitinis = state.batteryType === "slaitinisStogas";

  const systemMaterials = calculateSystemMaterials(state);

  const rowsCount = Math.max(1, state.rowsCount || 1);

  const effectiveRowModuleCounts =
    isSlaitinis && state.rowModuleCounts?.length
      ? state.rowModuleCounts.slice(0, rowsCount)
      : Array.from({ length: rowsCount }, () => state.moduleCount);

  const rowMaterials = isSlaitinis
    ? effectiveRowModuleCounts.map((rowModules) =>
        calculateSystemMaterials({
          ...state,
          rowsCount: 1,
          moduleCount: rowModules,
        }),
      )
    : [];

  const uniqueMaterials = isSlaitinis
    ? Array.from(
        new Map(rowMaterials.flat().map((m) => [m.name, m])).values(),
      )
    : [];

  return (
    <div className="solar-summary">
      <h2 className="solar-summary__title">SISTEMOS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS</h2>

      {!isSlaitinis ? (
        <table border={1} cellPadding={8} className="solar-summary__table">
          <thead>
            <tr>
              <th>Kodas</th>
              <th>Pavadinimas</th>
              <th>Kiekis, vnt.</th>
            </tr>
          </thead>
          <tbody>
            {systemMaterials.map((item, index) => (
              <tr key={index}>
                <td>{item.code}</td>
                <td>{tr(item.name)}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table border={1} cellPadding={8} className="solar-summary__table">
          <thead>
            <tr>
              <th>Montavimo būdas: {t(`mountingMethods.${state.mountingMethod}`)}</th>
              <th>Pavadinimas</th>
              <th>Bendri kiekiai</th>
              {effectiveRowModuleCounts.map((_, i) => (
                <th key={i}>{i + 1} eilės kiekiai</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueMaterials.map((item, index) => (
              <tr key={index}>
                <td>{item.code}</td>
                <td>{tr(item.name)}</td>
                <td>
                  {rowMaterials.reduce(
                    (acc, row) => acc + (row.find((m) => m.name === item.name)?.quantity ?? 0),
                    0,
                  )}
                </td>
                {rowMaterials.map((row, ri) => (
                  <td key={ri}>{row.find((m) => m.name === item.name)?.quantity ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="solar-summary__actions" onClick={() => navigate("/roof", { state })}>
        {t("actions.back")}
      </button>

      <button className="solar-summary__actions" onClick={() => navigate("/checkout", { state })}>
        {t("actions.next")}
      </button>
    </div>
  );
}

