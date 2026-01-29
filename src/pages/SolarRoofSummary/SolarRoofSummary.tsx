import { useLocation, useNavigate } from "react-router-dom";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { CalculatorInput } from "../../calculations/types";
import "./SolarRoofSummary.css";

export default function SolarRoofSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: CalculatorInput };

  if (!state) {
    return <p>No data provided</p>;
  }

  const systemMaterials = calculateSystemMaterials(state);

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
          </tr>
        </thead>
        <tbody>
          {systemMaterials.map((item, index) => (
            <tr key={index}>
              <td>{item.code}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="solar-summary__actions"
        onClick={() =>
          navigate("/roof", {
            state,
          })
        }
      >
        Grįžti atgal
      </button>
    </div>
  );
}
