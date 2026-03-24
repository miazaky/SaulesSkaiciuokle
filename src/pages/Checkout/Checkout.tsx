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

const ORDER_TYPE = {
  SpecialOffer:   1,
  NoSpecialOffer: 2,
} as const;

type SubmitState = "idle" | "loading" | "success" | "error";

function fmt(n: number) { return n.toFixed(2).replace(".", ","); }

// ── Validation helpers ────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts: +370XXXXXXXX (8 digits after +370) or 0XXXXXXXX (local, 8 digits after leading 0)
const PHONE_RE = /^(\+370\d{8}|0\d{8})$/;

function validateEmail(v: string) {
  if (!v.trim()) return "El. paštas yra privalomas";
  if (!EMAIL_RE.test(v.trim())) return "Neteisingas el. pašto formatas";
  return "";
}

function validatePhone(v: string) {
  const cleaned = v.replace(/\s/g, "");
  if (!cleaned) return "Telefono numeris yra privalomas";
  if (!PHONE_RE.test(cleaned)) return "Numeris turi būti +370XXXXXXXX arba 8XXXXXXXX";
  return "";
}

function validateName(v: string) {
  if (!v.trim()) return "Vardas yra privalomas";
  return "";
}

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };

  const [buyer, setBuyer]             = useState(initialBuyer);
  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg]       = useState("");
  const [showPrice, setShowPrice]     = useState(false);

  const [wantsProposal, setWantsProposal] = useState(true);

  const updateBuyer = (field: keyof typeof initialBuyer, value: string) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Per-field errors
  const errors = {
    name:  validateName(buyer.name),
    email: validateEmail(buyer.email),
    phone: validatePhone(buyer.phone),
  };

  const isFormValid = !errors.name && !errors.email && !errors.phone;

  const { pricesBySku: fetchedPrices, loading: pricesLoading } = useProductPrices();
  const { productsBySku, loading: productsLoading } = useProducts();
  const pricesBySku = (state?.productPrices && Object.keys(state.productPrices).length > 0)
    ? state.productPrices
    : fetchedPrices;

  const isGround = state?.batteryType === "ezys" || state?.batteryType === "poline";
  const systemMaterials    = state ? calculateSystemMaterials(state) : [];
  const furnitureMaterials = state && isGround ? calculateFurnitureMaterials(state) : [];

  const getPrice = (code: string) =>
    pricesBySku[(code ?? "").split("/")[0].trim()] ?? 0;

  const systemTotal = systemMaterials.reduce(
    (sum, m) => sum + getPrice(m.code ?? "") * m.quantity, 0
  );
  const furnTotal = furnitureMaterials.reduce(
    (sum, m) => sum + (pricesBySku[m.sku ?? ""] ?? 0) * m.quantity, 0
  );
  const grandTotal = systemTotal + furnTotal;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Mark all fields touched so errors show
    setTouched({ name: true, email: true, phone: true });
    if (!isFormValid || !state) return;

    setSubmitState("loading");
    setErrorMsg("");

    try {
      const orderType = wantsProposal
        ? ORDER_TYPE.SpecialOffer
        : ORDER_TYPE.NoSpecialOffer;

      const orderRes = await fetch(`${API_BASE}/orders/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:  buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.replace(/\s/g, "").trim(),
          orderType,
        }),
      });
      if (!orderRes.ok) throw new Error(`Klaida kuriant užsakymą: ${orderRes.status}`);
      const orderId: string = await orderRes.json();

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

      // Show price after successful submit (only for non-proposal orders)
      if (!wantsProposal) setShowPrice(true);
      setSubmitState("success");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Nežinoma klaida.");
      setSubmitState("error");
    }
  };

  const isSubmitDisabled =
    submitState === "loading" ||
    submitState === "success" ||
    productsLoading ||
    (pricesLoading && Object.keys(pricesBySku).length === 0);

  const isLocked = submitState === "loading" || submitState === "success";

  return (
    <div className="checkout">
      <h2 className="checkout__title">Užsakymo pateikimas</h2>

      {/* ── Seller / Buyer ───────────────────────────────────────────────── */}
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
          {buyerFields.map(({ key, placeholder, required }) => {
            const err = touched[key] ? errors[key] : "";
            return (
              <div key={key} className="input-group">
                <label className="input-label">
                  {placeholder}
                  {required && <span className="required-star"> *</span>}
                </label>
                <input
                  className={`invoice-input${err ? " invoice-input--error" : ""}`}
                  type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                  placeholder={
                    key === "phone" ? "+370XXXXXXXX arba 0XXXXXXXX" : placeholder
                  }
                  value={buyer[key]}
                  onChange={(e) => updateBuyer(key, e.target.value)}
                  onBlur={() => markTouched(key)}
                  disabled={isLocked}
                />
                {err && (
                  <span className="input-error-msg">{err}</span>
                )}
              </div>
            );
          })}

          {/* ── Proposal checkbox ─────────────────────────────────────── */}
          <label className="proposal-checkbox">
            <input
              type="checkbox"
              checked={wantsProposal}
              onChange={(e) => setWantsProposal(e.target.checked)}
              disabled={isLocked}
            />
            <span>
              <strong>Noriu gauti pasiūlymą</strong>
              <small>Susisieksime su jumis dėl pasiūlymo</small>
            </span>
          </label>
        </div>
      </div>

      {/* ── Price — shown only after successful submit (no proposal) ─────── */}
      {showPrice && submitState === "success" && !wantsProposal && (
        <div className="checkout-price-result">
          <div className="checkout-price-result__label">Bendra sistemos kaina</div>
          <div className="checkout-price-result__value">{fmt(grandTotal)} €</div>
          {isGround && furnTotal > 0 && (
            <div className="checkout-price-result__breakdown">
              <span>Sistema: {fmt(systemTotal)} €</span>
              <span>Furnitūra: {fmt(furnTotal)} €</span>
            </div>
          )}
        </div>
      )}

      {/* ── Status messages ──────────────────────────────────────────────── */}
      {submitState === "success" && wantsProposal && (
        <div className="checkout-status checkout-status--success">
          ✅ Užsakymas sėkmingai pateiktas!
        </div>
      )}
      {submitState === "error" && (
        <div className="checkout-status checkout-status--error">
          ⚠️ {errorMsg || "Klaida siunčiant užsakymą."}
        </div>
      )}

      {/* ── Buttons ─────────────────────────────────────────────────────── */}
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
            : pricesLoading || productsLoading
            ? "⏳ Kraunama..."
            : "Pateikti užsakymą"}
        </button>
      </div>
    </div>
  );
}
