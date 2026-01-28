import { useLocation, useNavigate } from "react-router-dom";
import { calculateSystemMaterials } from "../../calculations/calculateSystemMaterials";
import { CalculatorInput } from "../../calculations/types";
import "./SolarGroundSummary.css";

export default function SolarGroundSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: CalculatorInput };

  if (!state) {
    return <p>No data provided</p>;
  }

  const systemMaterials = calculateSystemMaterials(state);

  // const hardwareMaterials = [
  //   { name: "Varžtas M8", unit: "vnt.", quantity: state.moduleCount * 6 },
  //   { name: "Veržlė M8", unit: "vnt.", quantity: state.moduleCount * 6 },
  //   { name: "Prispaudėjas", unit: "vnt.", quantity: state.moduleCount * 2 },
  // ];

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
            <th>Pastabos</th>
          </tr>
        </thead>
        <tbody>
          {systemMaterials.map((item, index) => (
            <tr key={index}>
              <td>{item.code}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{item.length ?? "-"}</td>
              <td>{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* <h2 style={{ marginTop: 48 }}>
        FURNITŪROS MEDŽIAGŲ KIEKIŲ ŽINIARAŠTIS
      </h2>

      <table border={1} cellPadding={8} style={{ width: "100%", marginTop: 16 }}>
        <thead>
          <tr>
            <th>Pavadinimas</th>
            <th>Mato vnt.</th>
            <th>Kiekis</th>
          </tr>
        </thead>
        <tbody>
          {hardwareMaterials.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.unit}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table> */}

      <button
        className="solar-summary__actions"
        onClick={() =>
          navigate("/solars", {
            state,
          })
        }
      >
        Grįžti atgal
      </button>
    </div>
  );
}
