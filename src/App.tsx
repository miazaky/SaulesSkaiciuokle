import './App.css'
import { BrowserRouter, Routes, Route, } from 'react-router-dom'
import CreateQuestion from './pages/skaiciuokle/CreateQuestion.tsx'
import SolarGroundCalculator from './pages/SolarGroundCalculator/SolarGroundCalculator.tsx'
import SolarGroundSummary from './pages/SolarGroundSummary/SolarGroundSummary.tsx'
import SolarTypeSelect from './pages/SolarTypeSelect/SolarTypeSelect.tsx'
import SolarRoofCalculator from './pages/SolarRoofCalculator/SolarRoofCalculator.tsx'
import SolarRoofSummary from './pages/SolarRoofSummary/SolarRoofSummary.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<SolarTypeSelect />} />
          <Route path="/createQuestion" element={<CreateQuestion />} />
          <Route path="/ground" element={<SolarGroundCalculator />} />
          <Route path="/roof" element={<SolarRoofCalculator />} />
          <Route path="/summary" element={<SolarGroundSummary />} />
          <Route path="/summaryRoof" element={<SolarRoofSummary />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App