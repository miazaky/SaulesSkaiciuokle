import { useLocation, useNavigate } from "react-router-dom";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { CalculatorInput } from "../../calculations/types";
import "../SolarSummary.css";
import { useTranslation } from "react-i18next";
import { useProductPrices } from "../../hooks/useProductPrices";

function primarySku(code: string): string {
  return code.split("/")[0].trim();
}

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export default function SolarRoofSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: CalculatorInput };
  const { t } = useTranslation();
  const { pricesBySku, loading } = useProductPrices();

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
        calculateSystemMaterials({ ...state, rowsCount: 1, moduleCount: rowModules })
      )
    : [];

  const uniqueMaterials = isSlaitinis
    ? Array.from(new Map(rowMaterials.flat().map((m) => [m.name, m])).values())
    : [];

  const getPrice = (code: string): number | null =>
    pricesBySku[primarySku(code)] ?? null;

  // Total for flat-roof / non-slaitinis
  const systemTotal = !isSlaitinis
    ? systemMaterials.reduce((sum, m) => {
        const p = getPrice(m.code ?? "");
        return p != null ? sum + p * m.quantity : sum;
      }, 0)
    : 0;

  // Total for slaitinis (aggregate across all rows)
  const slaitinisTotal = isSlaitinis
    ? uniqueMaterials.reduce((sum, item) => {
        const p = getPrice(item.code ?? "");
        const qty = rowMaterials.reduce(
          (acc, row) => acc + (row.find((m) => m.name === item.name)?.quantity ?? 0),
          0
        );
        return p != null ? sum + p * qty : sum;
      }, 0)
    : 0;

  const grandTotal = isSlaitinis ? slaitinisTotal : systemTotal;

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
              <th>Kaina be PVM, €</th>
              <th>Suma be PVM, €</th>
            </tr>
          </thead>
          <tbody>
            {systemMaterials.map((item, index) => {
              const price = getPrice(item.code ?? "");
              const total = price != null ? price * item.quantity : null;
              return (
                <tr key={index}>
                  <td>{item.code}</td>
                  <td>{tr(item.name)}</td>
                  <td>{item.quantity}</td>
                  <td>{loading ? "…" : price != null ? fmt(price) : "–"}</td>
                  <td>{loading ? "…" : total != null ? fmt(total) : "–"}</td>
                </tr>
              );
            })}
            {systemTotal > 0 && (
              <tr className="summary-total-row">
                <td colSpan={3}></td>
                <td><strong>Viso:</strong></td>
                <td><strong>{fmt(systemTotal)}</strong></td>
              </tr>
            )}
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
              <th>Kaina be PVM, €</th>
              <th>Suma be PVM, €</th>
            </tr>
          </thead>
          <tbody>
            {uniqueMaterials.map((item, index) => {
              const totalQty = rowMaterials.reduce(
                (acc, row) => acc + (row.find((m) => m.name === item.name)?.quantity ?? 0),
                0
              );
              const price = getPrice(item.code ?? "");
              const total = price != null ? price * totalQty : null;
              return (
                <tr key={index}>
                  <td>{item.code}</td>
                  <td>{tr(item.name)}</td>
                  <td>{totalQty}</td>
                  {rowMaterials.map((row, ri) => (
                    <td key={ri}>{row.find((m) => m.name === item.name)?.quantity ?? 0}</td>
                  ))}
                  <td>{loading ? "…" : price != null ? fmt(price) : "–"}</td>
                  <td>{loading ? "…" : total != null ? fmt(total) : "–"}</td>
                </tr>
              );
            })}
            {slaitinisTotal > 0 && (
              <tr className="summary-total-row">
                <td colSpan={3 + effectiveRowModuleCounts.length}></td>
                <td><strong>Viso:</strong></td>
                <td><strong>{fmt(slaitinisTotal)}</strong></td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {grandTotal > 0 && (
        <div className="summary-grand-total">
          Bendra suma be PVM: <strong>{fmt(grandTotal)} €</strong>
        </div>
      )}

      <div className="solar-summary__actions-row">
        <button
          className="solar-summary__actions_back"
          onClick={() => navigate("/roof", { state })}
        >
          {t("actions.back")}
        </button>

        <button
          className="solar-summary__actions"
          disabled={loading}
          onClick={() =>
            navigate("/checkout", {
              state: { ...state, productPrices: pricesBySku },
            })
          }
        >
          {loading ? "⏳ Kraunama..." : t("actions.submit")}
        </button>
      </div>
    </div>
  );
}
