import { useLocation, useNavigate } from "react-router-dom";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { CalculatorInput } from "../../calculations/types";
import "../SolarSummary.css";
import { useTranslation } from "react-i18next";
import { useProductPrices } from "../../hooks/useProductPrices";
import { getGroundSystemPricing, getGroundSystemTotal, isGroundSystem } from "../../calculations/groundPricing";

// Extract the first SKU from a compound code like "M10-30/M10-pov/M10-VS"
function primarySku(code: string): string {
  return code.split("/")[0].trim();
}

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export default function SolarGroundSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: CalculatorInput };
  const { t } = useTranslation();
  const { pricesBySku, loading } = useProductPrices();

  if (!state) return <p>No data provided</p>;

  const systemMaterials = calculateSystemMaterials(state);
  const groundPricing = isGroundSystem(state) ? getGroundSystemPricing(state, pricesBySku) : null;
  const groundTotal = isGroundSystem(state) ? getGroundSystemTotal(state, pricesBySku) : 0;

  const getPrice = (code: string): number | null => {
    const sku = primarySku(code);
    return pricesBySku[sku] ?? null;
  };

  const systemTotal = isGroundSystem(state)
    ? groundTotal
    : systemMaterials.reduce((sum, m) => {
        const p = getPrice(m.code ?? "");
        return p != null ? sum + p * m.quantity : sum;
      }, 0);

  const grandTotal = systemTotal;


  return (
    <div className="solar-summary">
      <h2 className="solar-summary__title">SISTEMOS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS</h2>

      {isGroundSystem(state) && groundPricing ? (
        <table border={1} cellPadding={8} className="solar-summary__table">
          <thead>
            <tr>
              <th>Kodas</th>
              <th>Pavadinimas</th>
              <th>Kiekis, vnt.</th>
              <th>Modulio plotis, mm</th>
              <th>Kaina €/mod</th>
              <th>Suma €</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{groundPricing.code}</td>
              <td>{groundPricing.name}</td>
              <td>{state.moduleCount}</td>
              <td>{groundPricing.moduleWidth}</td>
              <td>{loading ? "…" : fmt(groundPricing.unitPrice)}</td>
              <td>{loading ? "…" : fmt(groundTotal)}</td>
            </tr>
            {systemTotal > 0 && (
              <tr className="summary-total-row">
                <td colSpan={4}></td>
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
              <th>Kodas</th>
              <th>Pavadinimas</th>
              <th>Kiekis, vnt.</th>
              <th>Ilgis, mm</th>
              <th>Kaina €</th>
              <th>Suma €</th>
            </tr>
          </thead>
          <tbody>
            {systemMaterials.map((item, index) => {
              const price = getPrice(item.code ?? "");
              const total = price != null ? price * item.quantity : null;
              return (
                <tr key={index}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.length ?? "–"}</td>
                  <td>{loading ? "…" : price != null ? fmt(price) : "–"}</td>
                  <td>{loading ? "…" : total != null ? fmt(total) : "–"}</td>
                </tr>
              );
            })}
            {systemTotal > 0 && (
              <tr className="summary-total-row">
                <td colSpan={4}></td>
                <td><strong>Viso:</strong></td>
                <td><strong>{fmt(systemTotal)}</strong></td>
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
          onClick={() => navigate("/ground", { state })}
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
