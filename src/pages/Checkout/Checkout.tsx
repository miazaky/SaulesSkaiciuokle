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
import { inventoryApi } from "../../api/inventoryApi";

const API_BASE = import.meta.env.VITE_API_BASE;

const ORDER_TYPE = {
  SpecialOffer:   1,
  NoSpecialOffer: 2,
} as const;

type SubmitState   = "idle" | "loading" | "success" | "error";
type UpgradeState  = "idle" | "loading" | "success" | "error";

function fmt(n: number) { return n.toFixed(2).replace(".", ","); }

// ── Validation ────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+370\d{8}|0\d{8})$/;

function validateEmail(v: string) {
  if (!v.trim()) return "El. paštas yra privalomas";
  if (!EMAIL_RE.test(v.trim())) return "Neteisingas el. pašto formatas";
  return "";
}
function validatePhone(v: string) {
  const c = v.replace(/\s/g, "");
  if (!c) return "Telefono numeris yra privalomas";
  if (!PHONE_RE.test(c)) return "Numeris turi būti +370XXXXXXXX arba 0XXXXXXXX";
  return "";
}
function validateName(v: string) {
  if (!v.trim()) return "Vardas yra privalomas";
  return "";
}

export default function Checkout() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { state } = useLocation() as { state: CalculatorInput };

  const [buyer, setBuyer]             = useState(initialBuyer);
  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg]       = useState("");

  // Stored after a successful NoSpecialOffer submit so we can upgrade it later
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [upgradeState, setUpgradeState]         = useState<UpgradeState>("idle");
  const [upgradeError, setUpgradeError]         = useState("");

  const updateBuyer = (field: keyof typeof initialBuyer, value: string) =>
    setBuyer((prev) => ({ ...prev, [field]: value }));

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const errors = {
    name:  validateName(buyer.name),
    email: validateEmail(buyer.email),
    phone: validatePhone(buyer.phone),
  };
  const isFormValid = !errors.name && !errors.email && !errors.phone;

  const { pricesBySku: fetchedPrices, loading: pricesLoading } = useProductPrices();
  const { productsBySku, loading: productsLoading }             = useProducts();
  const pricesBySku = (state?.productPrices && Object.keys(state.productPrices).length > 0)
    ? state.productPrices : fetchedPrices;

  const isGround           = state?.batteryType === "ezys" || state?.batteryType === "poline";
  const systemMaterials    = state ? calculateSystemMaterials(state) : [];
  const furnitureMaterials = state && isGround ? calculateFurnitureMaterials(state) : [];

  const getPrice    = (code: string) => pricesBySku[(code ?? "").split("/")[0].trim()] ?? 0;
  const systemTotal = systemMaterials.reduce((s, m) => s + getPrice(m.code ?? "") * m.quantity, 0);
  const furnTotal   = furnitureMaterials.reduce((s, m) => s + (pricesBySku[m.sku ?? ""] ?? 0) * m.quantity, 0);
  const grandTotal  = systemTotal + furnTotal;

  // ── Submit (always NoSpecialOffer on first submit) ────────────────────────
  const handleSubmit = async () => {
    setTouched({ name: true, email: true, phone: true });
    if (!isFormValid || !state) return;

    setSubmitState("loading");
    setErrorMsg("");

    try {
      const orderRes = await fetch(`${API_BASE}/orders/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      buyer.name.trim(),
          email:     buyer.email.trim(),
          phone:     buyer.phone.replace(/\s/g, "").trim(),
          orderType: ORDER_TYPE.NoSpecialOffer,
        }),
      });
      if (!orderRes.ok) throw new Error(`Klaida kuriant užsakymą: ${orderRes.status}`);
      const orderId: string = await orderRes.json();
      setCompletedOrderId(orderId);

      // Add items — warn on SKU mismatches but never silently drop items
      const allMaterials = [
        ...systemMaterials.map((m) => ({ sku: (m.code ?? "").split("/")[0].trim(), quantity: m.quantity })),
        ...furnitureMaterials.map((m) => ({ sku: m.sku ?? "", quantity: m.quantity })),
      ];

      const matchedMaterials = allMaterials.filter((m) => {
        if (!m.sku || m.quantity <= 0) return false;
        const found = !!productsBySku[m.sku];
        if (!found) console.warn(`[Checkout] SKU not found in productsBySku: "${m.sku}"`);
        return found;
      });

      if (matchedMaterials.length === 0) {
        console.warn("[Checkout] No items matched — productsBySku keys:", Object.keys(productsBySku).slice(0, 10));
        console.warn("[Checkout] Material SKUs:", allMaterials.map((m) => m.sku));
      }

      await Promise.allSettled(
        matchedMaterials.map((m) =>
          fetch(`${API_BASE}/orders/${orderId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: productsBySku[m.sku].id, quantity: m.quantity }),
          })
        )
      );

      setSubmitState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Nežinoma klaida.");
      setSubmitState("error");
    }
  };

  // ── Upgrade to SpecialOffer after price is shown ──────────────────────────
  const handleRequestProposal = async () => {
    if (!completedOrderId || !state) return;
    setUpgradeState("loading");
    setUpgradeError("");

    try {
      // 1. Update order type to SpecialOffer via PATCH
      const patchRes = await fetch(`${API_BASE}/orders/${completedOrderId}/type`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderType: ORDER_TYPE.SpecialOffer }),
      });
      if (!patchRes.ok) throw new Error(`Klaida atnaujinant užsakymą: ${patchRes.status}`);

      // 2. Generate PDF (triggers browser download) and upload to blob storage
      const [pdfBase64] = await generateCommercialProposalPdf(
        buyer,
        { ...state, productPrices: pricesBySku },
        systemMaterials,
        furnitureMaterials,
      );
      inventoryApi.savePdf(completedOrderId, pdfBase64, buyer.name)

      setUpgradeState("success");
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Nežinoma klaida.");
      setUpgradeState("error");
    }
  };

  const isSubmitDisabled =
    submitState === "loading" ||
    submitState === "success" ||
    productsLoading ||
    Object.keys(productsBySku).length === 0 ||
    (pricesLoading && Object.keys(pricesBySku).length === 0);

  const isLocked = submitState === "loading" || submitState === "success";
  const priceVisible = submitState === "success";

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
                  placeholder={key === "phone" ? "+370XXXXXXXX arba 0XXXXXXXX" : placeholder}
                  value={buyer[key]}
                  onChange={(e) => updateBuyer(key, e.target.value)}
                  onBlur={() => markTouched(key)}
                  disabled={isLocked}
                />
                {err && <span className="input-error-msg">{err}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Price shown after submit ─────────────────────────────────────── */}
      {priceVisible && (
        <div className="checkout-price-result">
          <div className="checkout-price-result__label">Bendra sistemos kaina</div>
          <div className="checkout-price-result__value">{fmt(grandTotal)} €</div>
          {isGround && furnTotal > 0 && (
            <div className="checkout-price-result__breakdown">
              <span>Sistema: {fmt(systemTotal)} €</span>
              <span>Furnitūra: {fmt(furnTotal)} €</span>
            </div>
          )}

          {/* ── Proposal upgrade section ─────────────────────────────── */}
          {upgradeState !== "success" && (
            <div className="checkout-proposal-upgrade">
              {/* <p className="checkout-proposal-upgrade__text">
                Norite gauti individualų komercinį pasiūlymą su išsamia informacija?
              </p> */}
              {upgradeState === "error" && (
                <p className="checkout-proposal-upgrade__error">⚠️ {upgradeError}</p>
              )}
              <button
                className="checkout-btn checkout-btn--proposal"
                onClick={handleRequestProposal}
                disabled={upgradeState === "loading"}
              >
                {upgradeState === "loading" ? "Siunčiama…" : "Noriu gauti pasiūlymą"}
              </button>
            </div>
          )}

          {upgradeState === "success" && (
            <div className="checkout-proposal-upgrade__success">
              ✅ Pasiūlymas išsiųstas! Susisieksime su jumis.
            </div>
          )}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {submitState === "error" && (
        <div className="checkout-status checkout-status--error">
          ⚠️ {errorMsg || "Klaida siunčiant užsakymą."}
        </div>
      )}

      {/* ── Buttons ─────────────────────────────────────────────────────── */}
      <div className="checkout-actions">
        <button
          className="checkout-btn checkout-btn--submit"
          onClick={() => navigate(-1)}
          // disabled={submitState === "loading" || submitState === "success"}
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
            : "Skaičiuoti kainą"}
        </button>
      </div>
    </div>
  );
}
