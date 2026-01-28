import './App.css'
import { BrowserRouter, Routes, Route, } from 'react-router-dom'
import CreateQuestion from './pages/skaiciuokle/CreateQuestion.tsx'
import SolarGroundCalculator from './pages/SolarGroundCalculator/SolarGroundCalculator.tsx'
import SolarGroundSummary from './pages/SolarGroundSummary/SolarGroundSummary.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/createQuestion" element={<CreateQuestion />} />
          <Route path="/solars" element={<SolarGroundCalculator />} />
          <Route path="/summary" element={<SolarGroundSummary />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App