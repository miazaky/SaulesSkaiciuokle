import { useState } from "react";
import "./Checkout.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buyerFields, initialBuyer, seller } from "../../config/checkoutConfig";

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [buyer, setBuyer] = useState(initialBuyer);

  const updateBuyer = (field: string, value: string) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="checkout">
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
          <h3>Pirkėjas</h3>
          {buyerFields.map(({ key, placeholder, highlight }) => (
            <div key={key} className="input-group">
              <label className="input-label">{placeholder}</label>
              <input
                className={`invoice-input ${highlight ? 'highlight' : ''}`}
                placeholder={placeholder}
                value={buyer[key as keyof typeof buyer]}
                onChange={(e) => updateBuyer(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => navigate(-1)}>
        {t("actions.back")}
      </button>
    </div>
  );
}