import { useState } from "react";
import "./Checkout.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buyerFields, initialBuyer, seller } from "../../config/checkoutConfig";
import { CalculatorInput } from "../../calculations/types";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { calculateFurnitureMaterials } from "../../calculations/calculateFurnitureMaterials";
import { useProductPrices } from "../../hooks/useProductPrices";
import { useProducts } from "../../hooks/useProducts";
import { generateCommercialProposalPdf } from "../../calculations/utils/generatePdf";

const API_BASE = import.meta.env.VITE_API_BASE;

// Matches backend OrderType enum
const ORDER_TYPE = {
  SpecialOffer:   1,
  NoSpecialOffer: 2,
} as const;

type SubmitState = "idle" | "loading" | "success" | "error";

function fmt(n: number) { return n.toFixed(2).replace(".", ","); }

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };

  const [buyer, setBuyer]           = useState(initialBuyer);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg]     = useState("");

  // Checkbox: does the user want a special proposal (PDF with prices)?
  const [wantsProposal, setWantsProposal] = useState(true);

  const updateBuyer = (field: keyof typeof initialBuyer, value: string) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    buyer.name.trim().length > 0 &&
    buyer.email.trim().length > 0 &&
    buyer.phone.trim().length > 0;

  const { pricesBySku: fetchedPrices, loading: pricesLoading } = useProductPrices();
  const { productsBySku, loading: productsLoading } = useProducts();
  const pricesBySku = (state?.productPrices && Object.keys(state.productPrices).length > 0)
    ? state.productPrices
    : fetchedPrices;

  const isGround = state?.batteryType === "ezys" || state?.batteryType === "poline";
  const systemMaterials    = state ? calculateSystemMaterials(state) : [];
  const furnitureMaterials = state && isGround ? calculateFurnitureMaterials(state) : [];

  // ── Price helpers ────────────────────────────────────────────────────────────
  const getPrice = (code: string) =>
    pricesBySku[(code ?? "").split("/")[0].trim()] ?? 0;

  const systemTotal = systemMaterials.reduce(
    (sum, m) => sum + getPrice(m.code ?? "") * m.quantity, 0
  );
  const furnTotal = furnitureMaterials.reduce(
    (sum, m) => sum + (pricesBySku[m.sku ?? ""] ?? 0) * m.quantity, 0
  );
  const grandTotal = systemTotal + furnTotal;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isFormValid || !state) return;
    setSubmitState("loading");
    setErrorMsg("");

    try {
      // 1. Create guest order — orderType depends on checkbox
      //    wantsProposal = true  → SpecialOffer   (PDF will be generated & saved)
      //    wantsProposal = false → NoSpecialOffer  (just price summary shown, no PDF)
      const orderType = wantsProposal
        ? ORDER_TYPE.SpecialOffer
        : ORDER_TYPE.NoSpecialOffer;

      const orderRes = await fetch(`${API_BASE}/orders/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      buyer.name.trim(),
          email:     buyer.email.trim(),
          phone:     buyer.phone.trim(),
          orderType,
        }),
      });
      if (!orderRes.ok) throw new Error(`Klaida kuriant užsakymą: ${orderRes.status}`);
      const orderId: string = await orderRes.json();

      // 2. Add order items
      const allMaterials = [
        ...systemMaterials.map((m) => ({
          sku: (m.code ?? "").split("/")[0].trim(),
          quantity: m.quantity,
        })),
        ...furnitureMaterials.map((m) => ({
          sku: m.sku ?? "",
          quantity: m.quantity,
        })),
      ];

      await Promise.allSettled(
        allMaterials
          .filter((m) => m.sku && m.quantity > 0 && productsBySku[m.sku])
          .map((m) =>
            fetch(`${API_BASE}/orders/${orderId}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: productsBySku[m.sku].id,
                quantity: m.quantity,
              }),
            }).then((r) => {
              if (!r.ok) console.warn(`Could not add item ${m.sku}: ${r.status}`);
            })
          )
      );

      // 3. If user wants special proposal → generate PDF, open in new window, save to DB
      if (wantsProposal) {
        const pdfPages = await generateCommercialProposalPdf(
          buyer,
          { ...state, productPrices: pricesBySku },
          systemMaterials,
          furnitureMaterials,
        );

        await Promise.allSettled(
          pdfPages.map((pageBase64, idx) =>
            fetch(`${API_BASE}/orders/${orderId}/pdf`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pageIndex: idx, data: pageBase64 }),
            }).then((r) => {
              if (!r.ok) console.warn(`PDF page ${idx} not saved: ${r.status}`);
            })
          )
        );
      }

      setSubmitState("success");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Nežinoma klaida.");
      setSubmitState("error");
    }
  };

  const isSubmitDisabled =
    !isFormValid ||
    submitState === "loading" ||
    submitState === "success" ||
    productsLoading ||
    (pricesLoading && Object.keys(pricesBySku).length === 0);

  return (
    <div className="checkout">
      <h2 className="checkout__title">Užsakymo pateikimas</h2>

      {/* ── Seller / Buyer ─────────────────────────────────────────────────── */}
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

          {/* ── Proposal checkbox ──────────────────────────────────────────── */}
          <label className="proposal-checkbox">
            <input
              type="checkbox"
              checked={wantsProposal}
              onChange={(e) => setWantsProposal(e.target.checked)}
              disabled={submitState === "loading" || submitState === "success"}
            />
            <span>
              <strong>Noriu specialaus pasiūlymo</strong>
              <small>Susisieksime su jumis dėl specialaus pasiūlymo</small>
            </span>
          </label>
        </div>
      </div>

      {/* ── Price summary — shown only when proposal NOT requested ─────────── */}
      {state && !wantsProposal && (
        <div className="checkout-materials-preview">
          <h3 className="checkout-materials-preview__title">
            Sistemos medžiagų sąrašas
          </h3>
          <table className="checkout-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Kodas</th>
                <th>Pavadinimas</th>
                <th>Kiekis</th>
                {isGround && <th>Ilgis, mm</th>}
                <th>Kaina €</th>
                <th>Suma €</th>
              </tr>
            </thead>
            <tbody>
              {systemMaterials.map((m, i) => {
                const price = getPrice(m.code ?? "");
                const total = price * m.quantity;
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{m.code}</td>
                    <td style={{ textAlign: "left" }}>{t(m.name, { defaultValue: m.name })}</td>
                    <td>{m.quantity}</td>
                    {isGround && <td>{m.length ?? "–"}</td>}
                    <td>{fmt(price)}</td>
                    <td>{fmt(total)}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td colSpan={isGround ? 5 : 4}></td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>Viso:</td>
                <td style={{ fontWeight: 700 }}>{fmt(systemTotal)} €</td>
              </tr>
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
                    <th>Kodas</th>
                    <th>Pavadinimas</th>
                    <th>Kiekis</th>
                    <th>Kaina €</th>
                    <th>Suma €</th>
                  </tr>
                </thead>
                <tbody>
                  {furnitureMaterials.map((m, i) => {
                    const price = pricesBySku[m.sku ?? ""] ?? 0;
                    const total = price * m.quantity;
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{m.sku}</td>
                        <td style={{ textAlign: "left" }}>{t(m.name, { defaultValue: m.name })}</td>
                        <td>{m.quantity}</td>
                        <td>{fmt(price)}</td>
                        <td>{fmt(total)}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td colSpan={4}></td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>Viso:</td>
                    <td style={{ fontWeight: 700 }}>{fmt(furnTotal)} €</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          <div className="checkout-grand-total">
            Bendra suma: <strong>{fmt(grandTotal)} €</strong>
          </div>
        </div>
      )}

      {/* ── Status messages ─────────────────────────────────────────────────── */}
      {submitState === "success" && (
        <div className="checkout-status checkout-status--success">
          ✅ Užsakymas sėkmingai pateiktas!
          {wantsProposal && " Susisieksime su jumis dėl specialaus pasiūlymo."}
        </div>
      )}
      {submitState === "error" && (
        <div className="checkout-status checkout-status--error">
          ⚠️ {errorMsg || "Klaida siunčiant užsakymą."}
        </div>
      )}

      {/* ── Buttons ─────────────────────────────────────────────────────────── */}
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
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          {submitState === "loading"
            ? "Siunčiama..."
            : submitState === "success"
            ? "✅ Išsiųsta"
            : (pricesLoading || productsLoading)
            ? "⏳ Kraunama..."
            : wantsProposal
            ? "Pateikti užsakymą"
            : "Pateikti užsakymą"}
        </button>
      </div>
    </div>
  );
}
