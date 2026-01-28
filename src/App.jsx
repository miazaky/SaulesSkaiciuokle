import './App.css'
import { BrowserRouter, Routes, Route, } from 'react-router-dom'
import CreateQuestion from './pages/skaiciuokle/CreateQuestion.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/createQuestion" element={<CreateQuestion />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App