import { useState } from "react";
import "./Checkout.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buyerFields, initialBuyer, seller } from "../../config/checkoutConfig";
import { CalculatorInput } from "../../calculations/types";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { calculateFurnitureMaterials } from "../../calculations/calculateFurnitureMaterials";
import { useProductPrices } from "../../hooks/useProductPrices";
import { generateCommercialProposalPdf } from "../../calculations/utils/generatePdf";

const WAREHOUSE_ID = "00000000-0000-0000-0000-000000000000"; // backend auto-resolves to first warehouse
const API_BASE = import.meta.env.VITE_API_BASE ?? "https://solar-inventory.azurewebsites.net/api";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };

  const [buyer, setBuyer] = useState(initialBuyer);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const updateBuyer = (field: keyof typeof initialBuyer, value: string) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    buyer.name.trim().length > 0 &&
    buyer.email.trim().length > 0 &&
    buyer.phone.trim().length > 0;

  const { pricesBySku: fetchedPrices, loading: pricesLoading } = useProductPrices();
  // Prefer prices already in router state (set by Summary page), fall back to freshly fetched
  const pricesBySku = (state?.productPrices && Object.keys(state.productPrices).length > 0)
    ? state.productPrices
    : fetchedPrices;

  const isGround =
    state?.batteryType === "ezys" || state?.batteryType === "poline";

  const systemMaterials = state ? calculateSystemMaterials(state) : [];
  const furnitureMaterials =
    state && isGround ? calculateFurnitureMaterials(state) : [];

  const handleSubmit = async () => {
    if (!isFormValid || !state) return;
    setSubmitState("loading");
    setErrorMsg("");

    try {
      const orderRes = await fetch(`${API_BASE}/orders/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: WAREHOUSE_ID,
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim(),
        }),
      });

      if (!orderRes.ok) {
        throw new Error(`Klaida kuriant užsakymą: ${orderRes.status}`);
      }

      const orderId: string = await orderRes.json();
      console.log("Guest order created:", orderId);

      await generateCommercialProposalPdf(buyer, { ...state, productPrices: pricesBySku }, systemMaterials, furnitureMaterials);
      setSubmitState("success");
    } catch (err) {
      console.error(err);
      try {
        await generateCommercialProposalPdf(buyer, { ...state, productPrices: pricesBySku }, systemMaterials, furnitureMaterials);
      } catch (_) {}
      setErrorMsg(
        err instanceof Error ? err.message : "Nežinoma klaida."
      );
      setSubmitState("error");
    }
  };

  return (
    <div className="checkout">
      <h2 className="checkout__title">Užsakymo pateikimas</h2>

      <div className="checkout-header">
        <div>
          <h3>Pardavėjas</h3>
          <p><b>{seller.name}</b></p>
          <p>Įm. kodas: {seller.companyCode}</p>
          <p>PVM kodas: {seller.vatCode}</p>
          <p>Adresas: {seller.address}</p>
          <p>Tel.: {seller.phone}</p>
          <p>El. paštas: {seller.email}</p>
          <p>A.s.: {seller.iban}</p>
          <p>Bankas: {seller.bank}</p>
        </div>

        <div>
          <h3>Pirkėjo informacija</h3>
          {buyerFields.map(({ key, placeholder, type, required }) => (
            <div key={key} className="input-group">
              <label className="input-label">
                {placeholder}
                {required && <span className="required-star"> *</span>}
              </label>
              <input
                className="invoice-input"
                type={type}
                placeholder={placeholder}
                value={buyer[key]}
                onChange={(e) => updateBuyer(key, e.target.value)}
                disabled={submitState === "loading" || submitState === "success"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* {state && (
        <div className="checkout-materials-preview">
          <h3 className="checkout-materials-preview__title">
            Užsakomų medžiagų sąrašas
          </h3>
          <table className="checkout-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Kodas</th>
                <th>Pavadinimas</th>
                <th>Kiekis, vnt.</th>
                {isGround && <th>Ilgis, mm</th>}
                <th>Kaina, €</th>
                <th>Suma, €</th>
              </tr>
            </thead>
            <tbody>
              {systemMaterials.map((m, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{m.code}</td>
                  <td style={{ textAlign: "left" }}>{m.name}</td>
                  <td>{m.quantity}</td>
                  {isGround && <td>{m.length ?? "–"}</td>}
                  {(() => {
                    const sku = (m.code ?? "").split("/")[0].trim();
                    const price = pricesBySku[sku] ?? null;
                    const total = price != null ? price * m.quantity : null;
                    return (<>
                      <td>{price != null ? price.toFixed(2).replace(".",",") : "–"}</td>
                      <td>{total != null ? total.toFixed(2).replace(".",",") : "–"}</td>
                    </>);
                  })()}
                </tr>
              ))}
            </tbody>
          </table>

          {isGround && furnitureMaterials.length > 0 && (
            <>
              <h3 className="checkout-materials-preview__title" style={{ marginTop: 24 }}>
                Furnitūros sąrašas
              </h3>
              <table className="checkout-table">
                <thead>
                  <tr>
                    <th>Nr.</th>
                    <th>Pavadinimas</th>
                    <th>Kiekis, vnt.</th>
                  </tr>
                </thead>
                <tbody>
                  {furnitureMaterials.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ textAlign: "left" }}>{m.name}</td>
                      <td>{m.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )} */}

      {submitState === "success" && (
        <div className="checkout-status checkout-status--success">
          ✅ Užsakymas sėkmingai pateiktas!
        </div>
      )}
      {/* {submitState === "error" && (
        <div className="checkout-status checkout-status--error">
          ⚠️ {errorMsg || "Klaida siunčiant užsakymą."} PDF vis tiek sugeneruotas.
        </div>
      )} */}

      <div className="checkout-actions">
        <button
          className="checkout-btn checkout-btn--back"
          onClick={() => navigate(-1)}
          disabled={submitState === "loading"}
        >
          {t("actions.back")}
        </button>

        <button
          className="checkout-btn checkout-btn--submit"
          disabled={!isFormValid || submitState === "loading" || submitState === "success" || (pricesLoading && Object.keys(pricesBySku).length === 0)}
          onClick={handleSubmit}
        >
          {submitState === "loading"
            ? "Siunčiama..."
            : submitState === "success"
            ? "✅ Išsiųsta"
            : pricesLoading && Object.keys(pricesBySku).length === 0
            ? "⏳ Kraunamos kainos..."
            : "Pateikti užsakymą"}
        </button>
      </div>

      {/* <p className="checkout-footer">
        * Pateikdami paraišką sutinkate, kad jūsų kontaktiniai duomenys bus
        naudojami komerciniam pasiūlymui parengti.
      </p> */}
    </div>
  );
}
