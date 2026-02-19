import { useLocation, useNavigate } from "react-router-dom";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { CalculatorInput } from "../../calculations/types";
import "../SolarSummary.css";
import { calculateFurnitureMaterials } from "../../calculations/calculateFurnitureMaterials";
import { useTranslation } from "react-i18next";

export default function SolarGroundSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: CalculatorInput };
  const { t } = useTranslation();

  if (!state) {
    return <p>No data provided</p>;
  }

  const systemMaterials = calculateSystemMaterials(state);
  const hardwareMaterials = calculateFurnitureMaterials(state);

  return (
    <div className="solar-summary">
      <h2 className="solar-summary__title">SISTEMOS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS</h2>

      <table
        border={1}
        cellPadding={8}
        className="solar-summary__table"
      >
        <thead>
          <tr>
            <th>Kodas</th>
            <th>Pavadinimas</th>
            <th>Kiekis, vnt.</th>
            <th>Ilgis, mm</th>
          </tr>
        </thead>
        <tbody>
          {systemMaterials.map((item, index) => (
            <tr key={index}>
              <td>{item.code}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{item.length ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="solar-summary__title">
        FURNITŪROS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS
      </h2>

      <table         
        border={1}
        cellPadding={8}
        className="solar-summary__table">
        <thead>
          <tr>
            <th>Pavadinimas</th>
            <th>Kiekis</th>
          </tr>
        </thead>
        <tbody>
          {hardwareMaterials.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="solar-summary__actions_back"
        onClick={() =>
          navigate("/ground", {
            state,
          })
        }
      >
        {t("actions.back")}
      </button>

      <button
        className="solar-summary__actions"
        onClick={() =>
          navigate("/checkout", {
            state,
          })
        }
      >
        {t("actions.next")}
      </button>
    </div>
  );
}
